import logging
import os
import shutil
import time
from contextlib import asynccontextmanager
from pathlib import Path
from uuid import uuid4
print("LOADED AI BACKEND API.PY")

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pypdf.errors import DependencyError

from app.chroma_db import load_chroma_db
from app.ingest import process_uploaded_pdf
from app.llm import get_llm
from app.analyzer import (
    ask_question,
    run_company_overview,
    run_growth_risk_analysis,
    run_financial_compliance_analysis,
    run_executive_summary,
)

# ============================================================
# Logging
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ============================================================
# Upload folder
# ============================================================

UPLOAD_FOLDER = Path("./data/uploads")
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# ============================================================
# Lifespan: LLM + Vector DB
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting application lifespan setup")

    llm = get_llm()
    app.state.llm = llm
    app.state.vector_db = load_chroma_db()
    app.state.active_report = None

    logger.info("LLM and Vector DB loaded once at startup")
    yield

    logger.info("Application shutdown")

# ============================================================
# FastAPI app + CORS
# ============================================================

app = FastAPI(lifespan=lifespan)


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    # later add your deployed frontend URL here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Request logging middleware
# ============================================================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"Request started | {request.method} {request.url.path}")

    try:
        response = await call_next(request)
        process_time = round(time.time() - start_time, 4)

        logger.info(
            f"Request completed | {request.method} {request.url.path} | "
            f"status={response.status_code} | duration={process_time}s"
        )

        response.headers["X-Process-Time"] = str(process_time)
        return response

    except Exception as e:
        process_time = round(time.time() - start_time, 4)
        logger.exception(
            f"Request failed | {request.method} {request.url.path} | "
            f"duration={process_time}s | error={str(e)}"
        )
        raise

# ============================================================
# Pydantic models
# ============================================================

class AskRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=3,
        max_length=500,
        example="What was the total headcount in FY 2025?",
    )


class AskResponse(BaseModel):
    status: str
    message: str
    question: str
    answer: str


class UploadStatusResponse(BaseModel):
    report_id: str | None = None
    original_filename: str | None = None
    saved_filename: str | None = None
    file_path: str | None = None
    pages_loaded: int | None = None
    chunks_created: int | None = None
    pipeline_status: str | None = None
    message: str | None = None

# ============================================================
# Optional status endpoint (for debugging / UI display)
# ============================================================

@app.get("/upload/status", response_model=UploadStatusResponse)
async def get_upload_status(request: Request):
    """
    Return the currently active report in app.state, if any.
    Useful to inspect active_report from the frontend.
    """
    active = request.app.state.active_report
    if not active:
        return UploadStatusResponse(message="No active report")

    return UploadStatusResponse(
        report_id=active.get("report_id"),
        original_filename=active.get("original_filename"),
        saved_filename=active.get("saved_filename"),
        file_path=active.get("file_path"),
        pages_loaded=active.get("pages_loaded"),
        chunks_created=active.get("chunks_created"),
        pipeline_status=active.get("pipeline_status"),
        message="Active report loaded",
    )

# ============================================================
# Upload endpoint (synchronous RAG pipeline)
# ============================================================

@app.post("/upload", response_model=UploadStatusResponse)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
):
    """
    Upload a single PDF, run full RAG ingestion synchronously, reload vector DB,
    and set app.state.active_report.
    """
    logger.info("Upload endpoint called")

    # Basic validation
    if not file.filename:
        logger.warning("Upload failed: no file selected")
        raise HTTPException(status_code=400, detail="No file selected")

    original_name = os.path.basename(file.filename)
    file_ext = Path(original_name).suffix.lower()

    logger.info(f"Received file: {original_name}")

    if file_ext != ".pdf":
        logger.warning(f"Upload failed: invalid extension for file {original_name}")
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    if file.content_type != "application/pdf":
        logger.warning(f"Upload failed: invalid content type {file.content_type}")
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid PDF content type",
        )

    # Generate IDs and paths
    report_id = f"report_{uuid4().hex[:12]}"
    unique_name = f"{Path(original_name).stem}_{uuid4().hex[:8]}.pdf"
    file_path = UPLOAD_FOLDER / unique_name

    try:
        # Save file to disk
        logger.info(f"Saving uploaded file to {file_path}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # FULL RAG PIPELINE — synchronous
        logger.info(f"Starting RAG ingestion pipeline | report_id={report_id}")
        pipeline_result = process_uploaded_pdf(
            file_path=str(file_path),
            original_filename=original_name,
            saved_filename=unique_name,
            report_id=report_id,
        )

        # Reload vector DB after ingestion
        logger.info("Reloading vector database after upload")
        request.app.state.vector_db = load_chroma_db()

        # Store active report in app state
        pages_loaded = pipeline_result.get("pages_loaded")
        chunks_created = pipeline_result.get("chunks_created")

        request.app.state.active_report = {
            "report_id": report_id,
            "original_filename": original_name,
            "saved_filename": unique_name,
            "file_path": str(file_path),
            "pages_loaded": pages_loaded,
            "chunks_created": chunks_created,
            "pipeline_status": "completed",
        }

        logger.info(
            f"Upload and ingestion completed | report_id={report_id} "
            f"| pages={pages_loaded} | chunks={chunks_created}"
        )

        return UploadStatusResponse(
            report_id=report_id,
            original_filename=original_name,
            saved_filename=unique_name,
            file_path=str(file_path),
            pages_loaded=pages_loaded,
            chunks_created=chunks_created,
            pipeline_status="completed",
            message="PDF uploaded, processed, and activated successfully",
        )

    except DependencyError:
        logger.exception(
            "Upload failed due to missing cryptography dependency for encrypted PDF"
        )
        raise HTTPException(
            status_code=400,
            detail=(
                "This PDF uses AES encryption/security and requires "
                "cryptography support in the backend."
            ),
        )

    except Exception as e:
        logger.exception(f"Upload failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}",
        )

# ============================================================
# Mode 1: /ask
# ============================================================

@app.post(
    "/ask",
    summary="Ask a question about the uploaded report",
    description=(
        "Enter your own question about the uploaded report.\n\n"
        "Example:\n"
        "- What are the major risks?\n"
        "- How did revenue perform in FY 2024-25?\n"
    ),
    response_model=AskResponse,
)
async def ask_question_endpoint(request: Request, payload: AskRequest):
    logger.info(f"Ask endpoint called | question={payload.question}")

    if request.app.state.active_report is None:
        logger.warning("Ask failed: no active report")
        raise HTTPException(status_code=400, detail="Please upload a report first.")

    try:
        response = ask_question(
            db=request.app.state.vector_db,
            llm=request.app.state.llm,
            question=payload.question,
        )

        logger.info("Ask endpoint completed successfully")
        return AskResponse(
            status="success",
            message="Question answered successfully",
            question=payload.question,
            answer=response.get("answer", ""),
        )

    except Exception as e:
        logger.exception(f"Ask endpoint failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Question answering failed: {str(e)}",
        )

# ============================================================
# Mode 2: analysis endpoints
# ============================================================

@app.post("/analyze/company-overview")
def company_overview_endpoint(request: Request):
    logger.info("Company overview analysis requested")

    if request.app.state.active_report is None:
        logger.warning("Company overview failed: no active report")
        raise HTTPException(status_code=400, detail="Please upload a report first.")

    try:
        result = run_company_overview(
            db=request.app.state.vector_db,
            llm=request.app.state.llm,
        )
        logger.info("Company overview completed successfully")
        return result
    except Exception as e:
        logger.exception(f"Company overview failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Company overview failed: {str(e)}",
        )

@app.post("/analyze/growth-risk")
def growth_risk_endpoint(request: Request):
    logger.info("Growth-risk analysis requested")

    if request.app.state.active_report is None:
        logger.warning("Growth-risk analysis failed: no active report")
        raise HTTPException(status_code=400, detail="Please upload a report first.")

    try:
        result = run_growth_risk_analysis(
            db=request.app.state.vector_db,
            llm=request.app.state.llm,
        )
        logger.info("Growth-risk analysis completed successfully")
        return result
    except Exception as e:
        logger.exception(f"Growth-risk analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Growth-risk analysis failed: {str(e)}",
        )

@app.post("/analyze/financial-compliance")
def financial_compliance_endpoint(request: Request):
    logger.info("Financial-compliance analysis requested")

    if request.app.state.active_report is None:
        logger.warning("Financial-compliance analysis failed: no active report")
        raise HTTPException(status_code=400, detail="Please upload a report first.")

    try:
        result = run_financial_compliance_analysis(
            db=request.app.state.vector_db,
            llm=request.app.state.llm,
        )
        logger.info("Financial-compliance analysis completed successfully")
        return result
    except Exception as e:
        logger.exception(f"Financial-compliance analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Financial-compliance analysis failed: {str(e)}",
        )

@app.post("/analyze/executive-summary")
def executive_summary_endpoint(request: Request):
    logger.info("Executive summary analysis requested")

    if request.app.state.active_report is None:
        logger.warning("Executive summary failed: no active report")
        raise HTTPException(status_code=400, detail="Please upload a report first.")

    try:
        result = run_executive_summary(
            db=request.app.state.vector_db,
            llm=request.app.state.llm,
        )
        logger.info("Executive summary completed successfully")
        return result
    except Exception as e:
        logger.exception(f"Executive summary failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Executive summary failed: {str(e)}",
        )

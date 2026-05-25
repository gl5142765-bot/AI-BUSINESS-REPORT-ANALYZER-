import uuid
from langchain_community.document_loaders import PyPDFLoader

from app.clean import clean_text
from app.splitter import split_documents
from app.metadata import add_metadata
from app.chroma_db import create_vectorstore


# AFTER
def process_uploaded_pdf(
    file_path: str,
    original_filename: str,
    saved_filename: str,
    report_id: str,  # new param
):

    loader = PyPDFLoader(file_path)
    pages = loader.load()

    cleaned_pages = []
    for page in pages:
        page.page_content = clean_text(page.page_content)
        cleaned_pages.append(page)

    report_id = str(uuid.uuid4())

    chunked_docs = split_documents(cleaned_pages)
    chunked_docs = add_metadata(
        chunked_docs=chunked_docs,
        report_id=report_id,
        report_name=original_filename,
        source=saved_filename
    )

    create_vectorstore(chunked_docs)

    return {
        "report_id": report_id,
        "pages_loaded": len(cleaned_pages),
        "chunks_created": len(chunked_docs),
        "original_filename": original_filename,
        "saved_filename": saved_filename
    }
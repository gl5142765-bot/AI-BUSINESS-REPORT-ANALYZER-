import re
import json

from app. prompts import (
    build_ask_prompt,
    build_company_overview_prompt,
    build_growth_risk_analysis_prompt,
    build_financial_compliance_prompt,
    build_executive_summary_prompt,
)

# =========================
# SHARED HELPERS
# =========================

def build_context_from_docs(docs, max_chars: int = 12000) -> str:
    """
    Build a deduplicated, length-capped context string from retrieved docs.
    """
    if not docs:
        return ""

    context_blocks = []
    seen = set()
    current_length = 0

    for i, doc in enumerate(docs, 1):
        text = getattr(doc, "page_content", "").strip()
        metadata = getattr(doc, "metadata", {}) or {}

        if not text:
            continue

        normalized_text = " ".join(text.split()).lower()
        if normalized_text in seen:
            continue
        seen.add(normalized_text)

        source_file = metadata.get("source_file", "unknown")
        page_number = metadata.get("page_number", "na")
        chunk_id = metadata.get("chunk_id", i)

        block = (
            f"[Chunk {i}]\n"
            f"Source: {source_file}\n"
            f"Page: {page_number}\n"
            f"Chunk ID: {chunk_id}\n"
            f"Content:\n{text}"
        )

        if current_length + len(block) > max_chars:
            break

        context_blocks.append(block)
        current_length += len(block) + 2

    return "\n\n---\n\n".join(context_blocks)


def generate_response(llm, prompt: str) -> str:
    """
    Call the LLM and normalize the response to a plain string.
    """
    response = llm.invoke(prompt)
    if hasattr(response, "content"):
        return response.content.strip()
    return str(response).strip()


def safe_parse_json(text: str, fallback: dict) -> dict:
    """
    Try to parse JSON; on failure, return the fallback structure.
    """
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return fallback


def merge_with_fallback(data: dict, fallback: dict) -> dict:
    """
    Merge model output dict with fallback dict, filling missing/empty fields.
    """
    if not isinstance(data, dict):
        return fallback

    merged = {}

    for key, fallback_value in fallback.items():
        if key not in data:
            merged[key] = fallback_value
        else:
            if isinstance(fallback_value, dict):
                merged[key] = merge_with_fallback(
                    data.get(key, {}),
                    fallback_value,
                )
            else:
                value = data.get(key)
                merged[key] = value if value not in [None, ""] else fallback_value

    return merged


# =========================
# MODE 1: ASK QUESTIONS
# =========================

def split_question_into_parts(question: str) -> list[str]:
    """
    Split a multi-part question into sub-questions.
    Handles separators like 'and', 'also', '?', commas, and semicolons.
    """
    question = question.strip()

    if not question:
        return []

    parts = re.split(
        r"\s+\band\b\s+|\s+\balso\b\s+|\s+\bas well as\b\s+|\s*\?\s*|[,;]+",
        question,
        flags=re.IGNORECASE,
    )

    cleaned_parts = []
    for part in parts:
        part = part.strip(" .:-\n\t")
        if part:
            cleaned_parts.append(part)

    return cleaned_parts if cleaned_parts else [question]


def extract_main_subject(question: str) -> str:
    """
    Try to extract the main subject phrase for follow‑up parts like 'its revenue'.
    """
    question = question.strip()

    patterns = [
        r"what was (.+?) in fy",
        r"what were (.+?) in fy",
        r"tell me (.+?) in fy",
        r"give me (.+?) in fy",
    ]

    for pattern in patterns:
        match = re.search(pattern, question, flags=re.IGNORECASE)
        if match:
            subject = match.group(1).strip()
            subject = re.sub(r"\bits\b", "", subject, flags=re.IGNORECASE).strip()
            if subject:
                return subject

    return ""


def rewrite_sub_question(sub_question: str, main_subject: str) -> str:
    """
    Rewrite short or 'its ...' follow‑up parts into clearer full questions.
    """
    sub_question = sub_question.strip()

    if not sub_question:
        return sub_question

    lower_q = sub_question.lower()

    if lower_q.startswith("what were its "):
        return f"What was the company's {sub_question[14:].strip()}"

    if lower_q.startswith("what was its "):
        return f"What was the company's {sub_question[13:].strip()}"

    if lower_q.startswith("its "):
        return f"company {sub_question}"

    if main_subject and ("its " in lower_q or len(sub_question.split()) <= 4):
        return f"{main_subject} {sub_question}"

    return sub_question


def ask_question(db, llm, question: str, k: int = 5) -> dict:
    """
    Mode 1: free‑form Q&A on the active report.

    Input:  question (string)
    Output: {"answer": "<detailed answer>"} — no source_chunks.
    """
    question = question.strip()

    if not question:
        return {
            "answer": "The answer is not available in the uploaded report."
        }

    # Split into sub‑questions and build retrieval queries
    sub_questions = split_question_into_parts(question)
    main_subject = extract_main_subject(question)

    retrieval_queries = [question]
    for sub_question in sub_questions:
        rewritten_question = rewrite_sub_question(sub_question, main_subject)
        if rewritten_question and rewritten_question not in retrieval_queries:
            retrieval_queries.append(rewritten_question)

    # Retrieve docs
    all_docs = []
    seen_content = set()

    for query in retrieval_queries:
        docs = db.similarity_search(query, k=k)

        for doc in docs:
            content = getattr(doc, "page_content", "").strip()
            if not content:
                continue

            normalized_content = " ".join(content.split()).lower()
            if normalized_content in seen_content:
                continue

            seen_content.add(normalized_content)
            all_docs.append(doc)

    if not all_docs:
        return {
            "answer": "The answer is not available in the uploaded report."
        }

    # Build context, call LLM, and clean formatting
    context = build_context_from_docs(all_docs)
    prompt = build_ask_prompt(context, question)
    answer = generate_response(llm, prompt)
    answer = answer.replace("\r", " ").replace("\n", " ").strip()
    answer = " ".join(answer.split())

    return {
        "answer": answer
    }


# =========================
# MODE 2: FOUR FEATURES
# =========================

def retrieve_company_overview_docs(db, k: int = 3):
    field_queries = {
        "business_description": [
           "company overview business summary operations industry",
           "about us company profile overview who we are",
           "bank at a glance corporate profile about the bank",
           "chairman message managing director message overview of operations",
        ],
        "business_segments": [
            "business segments divisions operating segments subsidiaries",
            "segment revenue business verticals divisions",
        ],
        "geography": [
            "geography regions countries markets international operations",
            "domestic international presence exports markets served",
        ],
        "products_and_services": [
            "products services solutions offerings brands",
            "product portfolio services offerings solutions",
        ],
        "ownership_and_leadership": [
    "promoter shareholding board of directors chairman managing director ceo cfo company secretary key managerial personnel",
        ],
        "financial_and_operating_metrics": [
            "financial highlights revenue profit margin assets cash flow operating metrics",
            "revenue net profit eps store count headcount customer metrics",
        ],
    }

    max_docs_by_field = {
        "business_description": 3,
        "business_segments": 2,
        "geography": 2,
        "products_and_services": 2,
        "ownership_and_leadership": 2,
        "financial_and_operating_metrics": 3,
    }

    ordered_fields = [
        "business_description",
        "business_segments",
        "geography",
        "products_and_services",
        "ownership_and_leadership",
        "financial_and_operating_metrics",
    ]

    all_docs = []
    global_seen = set()

    for field in ordered_fields:
        field_docs = []
        field_seen = set()
        max_docs = max_docs_by_field[field]

        for query in field_queries[field]:
            docs = db.similarity_search(query, k=k)

            for doc in docs:
                content = getattr(doc, "page_content", "").strip()
                if not content:
                    continue

                normalized = " ".join(content.split()).lower()
                if normalized in field_seen or normalized in global_seen:
                    continue

                field_seen.add(normalized)
                field_docs.append(doc)

                if len(field_docs) >= max_docs:
                    break

            if len(field_docs) >= max_docs:
                break

        for doc in field_docs:
            normalized = " ".join(getattr(doc, "page_content", "").split()).lower()
            global_seen.add(normalized)
            all_docs.append(doc)

    return all_docs


def run_company_overview(db, llm, k: int = 4) -> dict:
    fallback = {
        "title": "Company Overview",
        "business_description": "Not available in the retrieved context",
        "business_segments": "Not available in the retrieved context",
        "geography": "Not available in the retrieved context",
        "products_and_services": "Not available in the retrieved context",
        "ownership_and_leadership": "Not available in the retrieved context",
        "key_highlights": "Not available in the retrieved context",
        "financial_and_operating_metrics": "Not available in the retrieved context",
    }

    docs = retrieve_company_overview_docs(db, k=k)

    if not docs:
        return {"output": fallback}

    context = build_context_from_docs(docs)
    prompt = build_company_overview_prompt(context)
    answer_text = generate_response(llm, prompt)
    answer = safe_parse_json(answer_text, fallback)
    answer = merge_with_fallback(answer, fallback)

    return {"output": answer}


def run_growth_risk_analysis(db, llm, k: int = 4) -> dict:
    queries = [
        "revenue growth profitability margins earnings trend",
        "expansion strategy growth drivers demand market outlook",
        "business risks competition operational risks",
        "debt liquidity regulation macroeconomic risks governance concerns",
    ]

    fallback = {
        "title": "Growth & Risk Analysis",
        "growth_analysis": {
            "revenue_growth": "Not available in the retrieved context",
            "profitability_trend": "Not available in the retrieved context",
            "growth_drivers": "Not available in the retrieved context",
            "market_outlook": "Not available in the retrieved context",
        },
        "risk_analysis": {
            "business_risks": "Not available in the retrieved context",
            "credit_and_liquidity_risks": "Not available in the retrieved context",
            "macro_and_regulatory_risks": "Not available in the retrieved context",
            "governance_or_execution_concerns": "Not available in the retrieved context",
        },
        "final_insight": "Not available in the retrieved context",
    }

    all_docs = []
    seen = set()

    for query in queries:
        docs = db.similarity_search(query, k=k)
        for doc in docs:
            text = getattr(doc, "page_content", "").strip()
            if text and text not in seen:
                seen.add(text)
                all_docs.append(doc)

    if not all_docs:
        return {"output": fallback}

    context = build_context_from_docs(all_docs)
    prompt = build_growth_risk_analysis_prompt(context)
    answer_text = generate_response(llm, prompt)
    answer = safe_parse_json(answer_text, fallback)
    answer = merge_with_fallback(answer, fallback)

    return {"output": answer}


def run_financial_compliance_analysis(db, llm, k: int = 6) -> dict:
    field_queries = {
        "revenue_analysis": [
            "revenue from operations total income sales turnover FY 2025 FY 2024",
            "financial performance revenue profit expenses margins year on year",
            "management discussion analysis revenue growth decline profitability",
        ],
        "directors_report_analysis": [
            "directors report board report share capital dividend reserves borrowings loans deposits",
            "material changes capital structure funding borrowing dividend directors report",
            "share capital dividend reserves debt borrowings board report",
        ],
        "balance_sheet_analysis": [
            "balance sheet assets liabilities equity reserves debt borrowings",
            "current assets current liabilities working capital cash bank balances",
            "net worth reserves surplus debt liquidity financial position",
        ],
        "auditor_opinion": [
            "independent auditor report auditor opinion true and fair",
            "qualification emphasis of matter key audit matters",
            "internal financial controls annexure auditor report financial reporting controls",
        ],
        "corporate_governance": [
            "corporate governance report board composition committees meetings",
            "governance compliance regulations independent directors audit committee",
            "board meetings nomination remuneration stakeholder relationship committee",
        ],
        "disclosures": [
            "related party transactions contingent liabilities litigations statutory dues",
            "commitments contingencies provisions notes to accounts disclosures",
            "risk management legal cases statutory compliance disclosures",
        ],
    }

    fallback = {
        "title": "Financial & Compliance Analysis",
        "financial_performance": {
            "revenue_analysis": "Not available in the retrieved context.",
            "directors_report_analysis": "Not available in the retrieved context.",
            "balance_sheet_analysis": "Not available in the retrieved context.",
        },
        "compliance_and_governance": {
            "auditor_opinion": "Not available in the retrieved context.",
            "corporate_governance": "Not available in the retrieved context.",
            "disclosures": "Not available in the retrieved context.",
        },
        "financial_conclusion": {
            "overall_financial_health": "Not available in the retrieved context.",
            "warning_signs_and_reality_checks": "Not available in the retrieved context.",
        },
    }

    docs_by_field = {}
    global_seen = set()

    for field, queries in field_queries.items():
        field_docs = []
        field_seen = set()

        for query in queries:
            docs = db.similarity_search(query, k=k)

            for doc in docs:
                text = getattr(doc, "page_content", "").strip()
                if not text:
                    continue

                normalized = " ".join(text.split()).lower()
                if normalized in field_seen:
                    continue

                field_seen.add(normalized)
                field_docs.append(doc)

        docs_by_field[field] = field_docs

    ordered_fields = [
        "revenue_analysis",
        "directors_report_analysis",
        "balance_sheet_analysis",
        "auditor_opinion",
        "corporate_governance",
        "disclosures",
    ]

    context_sections = []

    for field in ordered_fields:
        docs = docs_by_field.get(field, [])
        filtered_docs = []

        for doc in docs:
            text = getattr(doc, "page_content", "").strip()
            normalized = " ".join(text.split()).lower()
            if normalized in global_seen:
                continue

            global_seen.add(normalized)
            filtered_docs.append(doc)

        section_context = build_context_from_docs(filtered_docs, max_chars=3500)

        context_sections.append(
            f"### {field}\n{section_context if section_context else 'No relevant context retrieved.'}"
        )

    combined_context = "\n\n".join(context_sections)

    if not combined_context.strip():
        return {"output": fallback}

    prompt = build_financial_compliance_prompt(combined_context)
    answer_text = generate_response(llm, prompt)
    answer = safe_parse_json(answer_text, fallback)
    answer = merge_with_fallback(answer, fallback)

    return {"output": answer}

def run_executive_summary(db, llm, k: int = 6) -> dict:
    queries = [
        "company overview business model operations products services segments geography markets",
        "growth strategy expansion performance highlights business momentum outlook",
        "revenue profitability margins cash flow debt balance sheet liquidity financial highlights",
        "governance compliance board auditor disclosures controls management discussion",
        "risks uncertainties challenges red flags constraints, dependencies",
        "overall summary company position strengths weaknesses future direction",
    ]

    fallback = {
        "title": "Executive Summary",
        "company_snapshot": "Not available in the retrieved context",
        "key_highlights": {
            "growth_highlights": "Not available in the retrieved context",
            "financial_highlights": "Not available in the retrieved context",
            "major_strengths": "Not available in the retrieved context",
        },
        "key_risks": {
            "top_risks": "Not available in the retrieved context",
        },
        "overall_assessment": {
            "business_strength": "Not available in the retrieved context",
        },
        "final_summary": "Not available in the retrieved context",
    }

    all_docs = []
    seen = set()

    for query in queries:
        docs = db.similarity_search(query, k=k)
        for doc in docs:
            text = getattr(doc, "page_content", "").strip()
            if text and text not in seen:
                seen.add(text)
                all_docs.append(doc)

    if not all_docs:
        return {"output": fallback}

    context = build_context_from_docs(all_docs)
    prompt = build_executive_summary_prompt(context)
    answer_text = generate_response(llm, prompt)
    answer = safe_parse_json(answer_text, fallback)
    answer = merge_with_fallback(answer, fallback)

    return {"output": answer}
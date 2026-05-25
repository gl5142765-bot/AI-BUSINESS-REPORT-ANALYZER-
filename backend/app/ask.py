import re

from app.prompts import build_ask_prompt
from app.analyzer import build_context_from_docs, generate_response


def split_question_into_parts(question: str) -> list[str]:
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
    question = question.strip()
    if not question:
        return {
            "output": "The answer is not available in the uploaded report."
        }

    sub_questions = split_question_into_parts(question)
    main_subject = extract_main_subject(question)

    retrieval_queries = [question]
    for sub_question in sub_questions:
        rewritten_question = rewrite_sub_question(sub_question, main_subject)
        if rewritten_question and rewritten_question not in retrieval_queries:
            retrieval_queries.append(rewritten_question)

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
            "output": "The answer is not available in the uploaded report."
        }

    context = build_context_from_docs(all_docs)
    prompt = build_ask_prompt(context, question)
    answer = generate_response(llm, prompt)

    return {
        "output": answer
    }
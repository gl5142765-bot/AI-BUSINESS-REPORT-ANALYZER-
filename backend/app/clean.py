# app/clean.py

import re
from langchain_core.documents import Document

def clean_text(text: str) -> str:
    if not text:
        return ""

    text = text.replace("\u00a0", " ")
    text = text.replace("\r", "\n")

    lines = text.split("\n")
    cleaned_lines = []

    for line in lines:
        line = line.strip()

        if not line:
            cleaned_lines.append("")
            continue

        if re.fullmatch(r"\d+", line):
            continue

        if re.fullmatch(r"[-_=•·\s]+", line):
            continue

        cleaned_lines.append(line)

    text = "\n".join(cleaned_lines)

    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)

    text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)

    return text.strip()


def clean_documents(documents):
    cleaned_docs = []

    for doc in documents:
        cleaned_content = clean_text(doc.page_content)

        if cleaned_content:
            cleaned_docs.append(
                Document(
                    page_content=cleaned_content,
                    metadata=doc.metadata
                )
            )

    return cleaned_docs
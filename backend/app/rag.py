import os
from langchain_community.document_loaders import PyPDFLoader

DATA_PATH = "data"

def load_documents():
    documents = []

    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Data folder not found: {DATA_PATH}")

    for file in os.listdir(DATA_PATH):
        if file.lower().endswith(".pdf"):
            file_path = os.path.join(DATA_PATH, file)

            print(f"\n📄 Loading: {file}")

            loader = PyPDFLoader(file_path)
            docs = loader.load()

            for page_num, doc in enumerate(docs, start=1):
                doc.metadata["source_file"] = file
                doc.metadata["page_number"] = page_num
                doc.metadata["doc_type"] = "annual_report"

            print(f"✅ Pages loaded: {len(docs)}")
            documents.extend(docs)

    print(f"\n🔥 Total pages loaded: {len(documents)}")
    return documents
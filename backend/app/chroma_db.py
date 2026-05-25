from langchain_chroma import Chroma
from chromadb import PersistentClient
from app.embedder import get_embedding_function

CHROMA_PATH = "chroma_db"
COLLECTION_NAME = "business_report_chunks"


def get_chroma_client():
    return PersistentClient(path=CHROMA_PATH)


from langchain_chroma import Chroma
from chromadb import PersistentClient
from app.embedder import get_embedding_function

CHROMA_PATH = "chroma_db"
COLLECTION_NAME = "business_report_chunks"


def get_chroma_client():
    return PersistentClient(path=CHROMA_PATH)


def reset_chroma_collection():
    client = get_chroma_client()

    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass


def load_chroma_db():
    embedding_function = get_embedding_function()
    vector_db = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embedding_function,
        persist_directory=CHROMA_PATH
    )
    return vector_db


def create_vectorstore(chunks):
    reset_chroma_collection()

    embedding_function = get_embedding_function()

    ids = []
    for i, chunk in enumerate(chunks):
        source_file = chunk.metadata.get("source_file", "unknown")
        page_number = chunk.metadata.get("page_number", "na")
        chunk_id = chunk.metadata.get("chunk_id", i + 1)

        unique_id = f"{source_file}_page_{page_number}_chunk_{chunk_id}"
        ids.append(unique_id)

        chunk.metadata["vector_id"] = unique_id

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_function,
        ids=ids,
        collection_name=COLLECTION_NAME,
        persist_directory=CHROMA_PATH
    )
    return vectorstore
import logging

from app.rag import load_documents
from app.clean import clean_documents
from app.splitter import split_documents
from app.metadata import add_metadata
from app.chroma_db import create_vectorstore
from app.retriever import query_chroma

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    try:
        logger.info("Starting document loading...")
        docs = load_documents()
        logger.info(f"Documents loaded: {len(docs)}")

        logger.info("Cleaning documents...")
        cleaned_docs = clean_documents(docs)
        logger.info(f"Cleaned documents: {len(cleaned_docs)}")

        logger.info("Splitting documents into chunks...")
        chunks = split_documents(cleaned_docs)
        logger.info(f"Total chunks created: {len(chunks)}")

        logger.info("Adding metadata to chunks...")
        final_chunks = add_metadata(chunks)
        logger.info(f"Metadata added to chunks: {len(final_chunks)}")

        if final_chunks:
            logger.info("Sample chunk preview:")
            logger.info(final_chunks[0].page_content[:700])

            logger.info("Sample chunk metadata:")
            logger.info(final_chunks[0].metadata)

            logger.info("Creating Chroma vector store...")
            vectorstore = create_vectorstore(final_chunks)
            logger.info("Vector store created successfully.")
            logger.info(f"Total chunks stored: {len(final_chunks)}")

            logger.info("Testing retrieval...")
            results = query_chroma(
                query_text="What was the revenue growth for Aether in 2025?",
                vector_db=vectorstore
            )

            for i, doc in enumerate(results, start=1):
                logger.info(f"--- Found Chunk {i} ---")
                logger.info(doc.page_content[:200])
                logger.info(f"Metadata: {doc.metadata}")
        else:
            logger.warning("No final chunks were created.")

    except Exception:
        logger.exception("Pipeline execution failed.")
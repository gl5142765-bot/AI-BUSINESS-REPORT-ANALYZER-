def add_metadata(chunked_docs, report_id: str, report_name: str, source: str):
    total_chunks = len(chunked_docs)

    for i, chunk in enumerate(chunked_docs):
        page_number = chunk.metadata.get("page", None)

        chunk.metadata = {
            "report_id": report_id,
            "report_name": report_name,
            "source": source,
            "page": page_number,
            "chunk_id": f"{report_id}_chunk_{i}",
            "chunk_index": i,
            "total_chunks": total_chunks
        }

    return chunked_docs
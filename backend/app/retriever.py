def query_chroma(query_text: str, vector_db, k: int = 3):
    query_text = query_text.strip()
    if not query_text:
        return []

    fetch_k = max(k * 2, 6)
    results = vector_db.similarity_search(query_text, k=fetch_k)

    unique_results = []
    seen_content = set()
    seen_source_pages = set()

    for doc in results:
        content_key = " ".join(doc.page_content.split())[:300].lower()
        source_page_key = (
            doc.metadata.get("source_file", "unknown"),
            doc.metadata.get("page_number", "na")
        )

        if content_key in seen_content:
            continue

        if source_page_key in seen_source_pages and len(results) > k:
            continue

        seen_content.add(content_key)
        seen_source_pages.add(source_page_key)
        unique_results.append(doc)

        if len(unique_results) == k:
            break

    if len(unique_results) < k:
        for doc in results:
            if doc in unique_results:
                continue
            unique_results.append(doc)
            if len(unique_results) == k:
                break

    return unique_results
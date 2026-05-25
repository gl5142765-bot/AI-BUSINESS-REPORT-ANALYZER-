from langchain_text_splitters import RecursiveCharacterTextSplitter


def split_documents(documents):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=250,
        separators=["\n\n", "\n", ". ", " ", ""],
        add_start_index=True,
        length_function=len
    )

    chunks = text_splitter.split_documents(documents)

    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_id"] = i + 1
        chunk.metadata["text_length"] = len(chunk.page_content)

    return chunks
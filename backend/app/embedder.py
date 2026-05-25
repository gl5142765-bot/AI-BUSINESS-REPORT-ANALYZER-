import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings

load_dotenv()

def get_embedding_function():
    return OpenAIEmbeddings(
        model="text-embedding-3-small",
        api_key=os.getenv("OPENAI_API_KEY")
    )

if __name__ == "__main__":
    embedding_function = get_embedding_function()
    vector = embedding_function.embed_query("This is a test query.")
    print(f"Embedding created successfully. Vector length: {len(vector)}")
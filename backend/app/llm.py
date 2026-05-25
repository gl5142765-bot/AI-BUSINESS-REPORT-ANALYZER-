import os
from openai import OpenAI


class OpenAILLM:
    def __init__(self, model: str = "gpt-4o-mini"):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = model

    def invoke(self, prompt: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a helpful business report assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        return response.choices[0].message.content.strip()


def get_llm(model: str = "gpt-4o-mini") -> OpenAILLM:
    return OpenAILLM(model=model)


def generate_answer(prompt: str, model: str = "gpt-4o-mini") -> str:
    llm = OpenAILLM(model=model)
    return llm.invoke(prompt)
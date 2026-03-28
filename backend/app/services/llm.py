"""
Singleton Ollama LLM via LangChain.
Connects to a locally-running Ollama instance serving the llama3 model.
"""
from functools import lru_cache

from langchain_openai import ChatOpenAI

from app.core.config import settings


@lru_cache(maxsize=1)
def get_llm() -> ChatOpenAI:
    """Return a cached OpenAI LLM instance."""
    return ChatOpenAI(
        model="gpt-4o-mini",
        openai_api_key=settings.openai_api_key,
        temperature=0.1,
    )

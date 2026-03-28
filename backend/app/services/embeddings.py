"""
Singleton HuggingFace embedding model.
Uses all-MiniLM-L6-v2 which produces 384-dim vectors — matching vector(384) in Supabase.
"""
from functools import lru_cache

from langchain_community.embeddings import HuggingFaceEmbeddings

from app.core.config import settings


@lru_cache(maxsize=1)
def get_embeddings() -> HuggingFaceEmbeddings:
    """Load the embedding model once and cache it for the application lifetime."""
    return HuggingFaceEmbeddings(
        model_name=settings.embedding_model,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

"""
LangChain SupabaseVectorStore wrapper.
Connects to the `documents` table and routes similarity search through the
`match_documents` RPC function defined in backend/sql/schema.sql.
"""
from functools import lru_cache

from langchain_community.vectorstores import SupabaseVectorStore

from app.services.embeddings import get_embeddings
from app.services.supabase_client import get_supabase


@lru_cache(maxsize=1)
def get_vector_store() -> SupabaseVectorStore:
    """Return a cached SupabaseVectorStore bound to the `documents` table."""
    return SupabaseVectorStore(
        client=get_supabase(),
        embedding=get_embeddings(),
        table_name="documents",
        query_name="match_documents",
    )

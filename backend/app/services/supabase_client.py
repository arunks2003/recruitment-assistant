"""
Singleton Supabase client.
Uses the service-role key so it bypasses Row Level Security for backend operations.
"""
from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Create and cache the Supabase client."""
    return create_client(settings.supabase_url, settings.supabase_service_key)

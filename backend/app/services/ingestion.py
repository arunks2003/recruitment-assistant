"""
PDF ingestion pipeline.

Flow:
  1. Insert a row into `candidates` (get UUID back)
  2. PyPDFLoader  → parse pages
  3. RecursiveCharacterTextSplitter → chunks
  4. Attach rich metadata (candidate_id, filename, upload_date, page, chunk_index)
  5. SupabaseVectorStore.add_documents() → embed + upsert into `documents` table
  6. Clean up the temp file
"""
import logging
from datetime import datetime, timezone
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from app.core.config import settings
from app.services.supabase_client import get_supabase
from app.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)


async def ingest_pdf(file_path: str, filename: str) -> str:
    """
    Full ingestion pipeline for a single PDF.

    Args:
        file_path: Absolute path to the saved temp PDF file.
        filename:  Original filename shown in the UI / stored as metadata.

    Returns:
        candidate_id: The UUID of the inserted `candidates` row.
    """
    supabase = get_supabase()

    # ── 1. Insert candidate row ───────────────────────────────────────────────
    upload_date = datetime.now(timezone.utc).isoformat()
    result = (
        supabase.table("candidates")
        .insert({"filename": filename, "upload_date": upload_date})
        .execute()
    )
    candidate_id: str = result.data[0]["id"]
    logger.info("Inserted candidate | id=%s | file=%s", candidate_id, filename)

    # ── 2. Parse PDF ──────────────────────────────────────────────────────────
    loader = PyPDFLoader(file_path)
    pages = loader.load()
    logger.info("Parsed %d page(s) from %s", len(pages), filename)

    # ── 3. Split into chunks ──────────────────────────────────────────────────
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", " ", ""],
    )
    raw_chunks = splitter.split_documents(pages)

    # ── 4. Enrich metadata ────────────────────────────────────────────────────
    enriched: list[Document] = [
        Document(
            page_content=chunk.page_content,
            metadata={
                "candidate_id": candidate_id,
                "filename": filename,
                "upload_date": upload_date,
                "page": chunk.metadata.get("page", 0),
                "chunk_index": i,
            },
        )
        for i, chunk in enumerate(raw_chunks)
    ]

    # ── 5. Embed + upsert ─────────────────────────────────────────────────────
    vector_store = get_vector_store()
    # Langchain's SupabaseVectorStore generates UUIDs by default if ids is None,
    # but our schema uses a 'bigserial' id. We must avoid passing IDs entirely.
    # A workaround for the langchain python client is calling the client directly 
    # instead of passing through add_documents which forces UUIDs.
    
    vectors = vector_store.embeddings.embed_documents([doc.page_content for doc in enriched])
    chunks = [
        {
            "content": doc.page_content,
            "embedding": embedding,
            "metadata": doc.metadata,
            "filename": doc.metadata.get("filename", ""),
            "candidate_id": doc.metadata.get("candidate_id", ""),
        }
        for doc, embedding in zip(enriched, vectors)
    ]
    
    supabase = get_supabase()
    # Upsert directly to documents to let Postgres handle the bigserial ID
    for i in range(0, len(chunks), settings.chunk_size):
        batch = chunks[i : i + settings.chunk_size]
        supabase.table("documents").insert(batch).execute()

    logger.info("Upserted %d chunk(s) for %s", len(enriched), filename)

    # ── 6. Clean up temp file ─────────────────────────────────────────────────
    Path(file_path).unlink(missing_ok=True)

    return candidate_id

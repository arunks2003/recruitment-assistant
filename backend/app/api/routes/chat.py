"""
POST /api/chat

Accepts a natural-language recruiter query.
1. Runs similarity search against Supabase `documents` (via match_documents RPC)
2. Feeds retrieved chunks + query into the LangChain LCEL RAG chain (Ollama llama3)
3. Extracts source metadata from retrieved docs to produce a deduplicated citation list
4. Returns { answer, citations } JSON
"""
import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.rag_chain import get_rag_chain

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request / Response models ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    query: str
    history: list[dict[str, Any]] = []


class Citation(BaseModel):
    filename: str
    candidate_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation]


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat_with_candidates(request: ChatRequest) -> ChatResponse:
    """
    Query the candidate pool using natural language.
    Returns an AI-synthesised answer with source citations.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        chain, retriever = get_rag_chain()

        # Retrieve relevant chunks first (needed for citations)
        retrieved_docs = retriever.invoke(request.query)

        # Build deduplicated citation list preserving retrieval order
        seen: set[str] = set()
        citations: list[Citation] = []
        for doc in retrieved_docs:
            filename: str = doc.metadata.get("filename", "Unknown")
            if filename not in seen:
                seen.add(filename)
                citations.append(
                    Citation(
                        filename=filename,
                        candidate_id=doc.metadata.get("candidate_id"),
                    )
                )

        # Generate the answer via the RAG chain
        answer: str = chain.invoke(request.query)

        logger.info(
            "Chat | query=%r | citations=%s",
            request.query[:80],
            [c.filename for c in citations],
        )

        return ChatResponse(answer=answer, citations=citations)

    except Exception as exc:
        logger.error("RAG chain error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"The AI pipeline encountered an error: {str(exc)}",
        ) from exc

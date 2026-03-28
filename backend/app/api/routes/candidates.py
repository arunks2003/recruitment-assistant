"""
GET /api/candidates

Fetches all previously indexed candidates from the database to populate
the frontend pool on initial page load.
"""
import logging
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()

class CandidateOut(BaseModel):
    id: str
    filename: str
    status: str
    uploadedAt: str

@router.get("/candidates", response_model=List[CandidateOut])
async def get_candidates():
    """
    Retrieve all candidates from Supabase.
    """
    try:
        supabase = get_supabase()
        # Fetch all candidates, newest first
        result = supabase.table("candidates").select("*").order("upload_date", desc=True).execute()
        
        candidates = []
        for row in result.data:
            candidates.append(
                CandidateOut(
                    id=row["id"],
                    filename=row["filename"],
                    # We assume anything successfully stored in the DB is ready to be queried
                    status="ready",
                    uploadedAt=row["upload_date"],
                )
            )
        return candidates

    except Exception as exc:
        logger.error("Failed to fetch candidates: %s", exc)
        raise HTTPException(status_code=500, detail="Could not retrieve candidates.")

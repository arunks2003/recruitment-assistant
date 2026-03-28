"""
POST /api/upload

Accepts one or more PDF files via multipart form-data.
Saves each to a temp path and fires an async background ingestion task.
Returns 202 Accepted immediately so the client is never blocked.
"""
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import settings
from app.services.ingestion import ingest_pdf

logger = logging.getLogger(__name__)
router = APIRouter()


class FileStatus(BaseModel):
    filename: str
    status: str


class UploadResponse(BaseModel):
    status: str
    message: str
    files: list[FileStatus]


@router.post("/upload", response_model=UploadResponse, status_code=202)
async def upload_resumes(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
) -> UploadResponse:
    """
    Upload one or more PDF resumes for async ingestion into Supabase.
    Returns 202 immediately; processing happens in the background.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    upload_dir = Path(settings.upload_dir)
    file_statuses: list[FileStatus] = []

    for file in files:
        # Validate file type
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=422,
                detail=f"'{file.filename}' is not a PDF. Only PDF files are accepted.",
            )

        # Save to a uniquely-named temp path to avoid collisions
        safe_name = f"{uuid.uuid4().hex}_{file.filename}"
        dest_path = upload_dir / safe_name

        content = await file.read()
        dest_path.write_bytes(content)
        logger.info("Saved upload: %s → %s", file.filename, dest_path)

        # Queue background ingestion — does NOT block the response
        background_tasks.add_task(ingest_pdf, str(dest_path), file.filename)
        file_statuses.append(FileStatus(filename=file.filename, status="processing"))

    return UploadResponse(
        status="processing",
        message=f"{len(file_statuses)} file(s) queued for ingestion.",
        files=file_statuses,
    )

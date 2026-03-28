import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import upload, chat, candidates

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure the uploads temp directory exists on startup
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    logger.info("✅ Recruitment Copilot API started — uploads dir ready.")
    yield
    logger.info("Recruitment Copilot API shutting down.")


app = FastAPI(
    title="Intelligent Recruitment Copilot API",
    description="RAG-powered HR assistant. Upload resumes, query in natural language.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(candidates.router, prefix="/api", tags=["Candidates"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

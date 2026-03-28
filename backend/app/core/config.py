from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase
    supabase_url: str
    supabase_service_key: str

    # OpenAI / LLM
    openai_api_key: str = ""

    # Embeddings
    embedding_model: str = "all-MiniLM-L6-v2"

    # Ingestion
    upload_dir: str = "uploads"
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # Retrieval
    retrieval_k: int = 5


settings = Settings()

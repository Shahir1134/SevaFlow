from functools import lru_cache
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH) if ENV_PATH.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Gemini AI configuration
    gemini_api_key: Optional[str] = None
    gemini_embedding_model: str = "text-embedding-004"
    gemini_generative_model: str = "gemini-2.0-flash"

    # Database configuration
    database_url: Optional[str] = None
    database_url_sync: Optional[str] = None

    # JWT Authentication configuration
    jwt_secret_key: str = "change-me-generate-with-secrets-token-hex-32"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 7

    # Application settings
    app_env: str = "development"
    app_name: str = "HealthConnect India"
    frontend_url: str = "http://localhost:5173"
    max_upload_size_bytes: int = 20971520
    allowed_doc_mime_types: str = "application/pdf,image/jpeg,image/png,image/tiff,text/plain,text/markdown"
    rate_limit_per_minute: int = 60

    # NHA PM-JAY configuration
    nha_pmjay_api_key: Optional[str] = None
    nha_pmjay_api_base_url: Optional[str] = None

    # Reminder and other integrations
    reminder_provider: str = "none"
    log_level: str = "INFO"

    @property
    def is_ai_configured(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_api_key.strip())

    @property
    def is_db_configured(self) -> bool:
        return bool(self.database_url and self.database_url.strip())


@lru_cache()
def get_settings() -> Settings:
    return Settings()

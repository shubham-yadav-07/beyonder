from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path
import secrets
import logging

logger = logging.getLogger("beyonder.config")

# Where to persist auto-generated secrets when not provided via .env.
# This prevents `secrets.token_urlsafe(32)` from generating a NEW key on
# every process restart, which would silently invalidate every issued
# JWT (access + refresh) and force-logout all users — a serious demo
# risk if uvicorn --reload restarts mid-presentation.
_SECRET_FILE = Path(__file__).resolve().parent.parent.parent / ".dev_secret_key"
_REFRESH_SECRET_FILE = Path(__file__).resolve().parent.parent.parent / ".dev_refresh_secret_key"


def _persisted_secret(path: Path) -> str:
    if path.exists():
        return path.read_text().strip()
    key = secrets.token_urlsafe(32)
    try:
        path.write_text(key)
        logger.warning(
            f"No SECRET_KEY set in .env — generated and persisted a dev key to {path}. "
            f"Set SECRET_KEY explicitly in .env before deploying to production."
        )
    except OSError:
        logger.warning("Could not persist generated secret key — it will change on restart.")
    return key


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Beyonder"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    MONGO_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "beyonder"

    # Security – NEVER use defaults in production
    SECRET_KEY: str = ""
    REFRESH_SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30       # short-lived
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Rate limiting (requests per minute per IP)
    RATE_LIMIT_PER_MINUTE: int = 60
    AUTH_RATE_LIMIT_PER_MINUTE: int = 10        # stricter for /auth

    # AI
    AI_MODEL_VERSION: str = "3.1.7"
    AI_QUARANTINE_THRESHOLD: int = 70           # auto-quarantine if score >= this

    # Blockchain
    BLOCKCHAIN_ENABLED: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"

    def model_post_init(self, __context) -> None:
        # Fall back to a persisted dev secret if not set via .env/environment.
        # Placeholder values from .env.example (never replaced) are also
        # treated as "not set" so they don't silently ship to production.
        placeholder_values = {
            "", "generate-a-real-secret-with-openssl-rand-hex-32",
            "another-real-secret-key-here",
        }
        if self.SECRET_KEY in placeholder_values:
            self.SECRET_KEY = _persisted_secret(_SECRET_FILE)
        if self.REFRESH_SECRET_KEY in placeholder_values:
            self.REFRESH_SECRET_KEY = _persisted_secret(_REFRESH_SECRET_FILE)


settings = Settings()

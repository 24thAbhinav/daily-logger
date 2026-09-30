from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://daily_logger:daily_logger@localhost:5432/daily_logger"
    frontend_url: str = "http://localhost:3000"

    # Clerk – used for JWT verification on every /api/* route
    # Get this from: Clerk Dashboard → API Keys → Advanced → JWKS URL
    clerk_jwks_url: str = ""
    clerk_issuer: str = ""
    clerk_authorized_parties: str = ""
    clerk_audience: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("database_url", mode="before")
    @classmethod
    def coerce_asyncpg_scheme(cls, v: str) -> str:
        """
        Render's managed Postgres injects a plain ``postgresql://`` URL.
        SQLAlchemy's asyncpg dialect requires ``postgresql+asyncpg://``.
        This validator silently fixes the scheme so either format works.
        """
        if isinstance(v, str) and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()

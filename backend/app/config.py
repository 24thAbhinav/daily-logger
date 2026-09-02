from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://daily_logger:daily_logger@localhost:5432/daily_logger"
    frontend_url: str = "http://localhost:3000"
    # Better Auth runs inside Next.js; the backend calls this URL to verify sessions.
    better_auth_url: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()

from functools import lru_cache

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Better Auth's own fallback secret, used when BETTER_AUTH_SECRET is not set in
# development. The backend must sign session tokens with the exact secret the
# frontend used, so we mirror it here to keep local dev working out of the box.
BETTER_AUTH_DEV_SECRET = "better-auth-secret-12345678901234567890"


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://daily_logger:daily_logger@localhost:5432/daily_logger"
    frontend_url: str = "http://localhost:3000"
    # Better Auth runs inside Next.js; the backend calls this URL to verify sessions.
    better_auth_url: str = "http://localhost:3000"
    # Must match the BETTER_AUTH_SECRET used by the Next.js app.
    better_auth_secret: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def resolve_better_auth_secret(self) -> "Settings":
        """
        The backend verifies sessions by re-signing the token with the shared
        Better Auth secret. If that secret is missing every request fails with
        401 even when the user is correctly logged in, so make the failure mode
        explicit instead of silent.
        """
        if not self.better_auth_secret:
            if self.better_auth_url.startswith("https://"):
                raise ValueError(
                    "BETTER_AUTH_SECRET is required when BETTER_AUTH_URL uses "
                    "https. Set it to the exact same value as the frontend's "
                    "BETTER_AUTH_SECRET."
                )
            # Match Better Auth's development fallback so local logins work
            # without extra configuration.
            self.better_auth_secret = BETTER_AUTH_DEV_SECRET
        return self

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

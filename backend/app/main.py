from contextlib import asynccontextmanager
from datetime import date
import logging
import time
from uuid import uuid4

import httpx
import jwt
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Security, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .database import engine, get_session
from .models import Base, Entry
from .schemas import EntryCreate, EntryRead, EntryUpdate

settings = get_settings()
logger = logging.getLogger("daily_logger")

# ---------------------------------------------------------------------------
# Clerk JWT verification
# ---------------------------------------------------------------------------

_bearer = HTTPBearer()

# Cache JWKS in memory; refreshed once per process startup.
_jwks_client: jwt.PyJWKClient | None = None


def _get_jwks_client() -> jwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        if not settings.clerk_jwks_url:
            raise RuntimeError("CLERK_JWKS_URL is not configured in .env")
        _jwks_client = jwt.PyJWKClient(settings.clerk_jwks_url, cache_keys=True)
    return _jwks_client


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> dict:
    """
    FastAPI dependency that validates a Clerk session JWT (RS256).
    Raises HTTP 401 on any verification failure.
    """
    token = credentials.credentials
    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},  # Clerk doesn't use audience by default
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    return payload


# ---------------------------------------------------------------------------
# Application lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("startup frontend_url=%s", settings.frontend_url)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    logger.info("startup database_ready=true")
    yield
    await engine.dispose()
    logger.info("shutdown complete=true")


app = FastAPI(title="Daily Logger API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = uuid4().hex[:10]
    started = time.perf_counter()
    logger.info(
        "request.start id=%s method=%s path=%s origin=%s",
        request_id,
        request.method,
        request.url.path,
        request.headers.get("origin", "-"),
    )
    try:
        response = await call_next(request)
    except Exception:
        logger.exception(
            "request.exception id=%s method=%s path=%s",
            request_id,
            request.method,
            request.url.path,
        )
        raise

    elapsed_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "request.end id=%s method=%s path=%s status=%s duration_ms=%.1f",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/entries", response_model=list[EntryRead])
async def list_entries(
    entry_date: date | None = Query(default=None),
    db: AsyncSession = Depends(get_session),
    _: dict = Depends(verify_token),
) -> list[Entry]:
    query = select(Entry).order_by(Entry.entry_date.desc(), Entry.created_at.desc())
    if entry_date:
        query = query.where(Entry.entry_date == entry_date)
    result = await db.execute(query)
    return list(result.scalars().all())


@app.post("/api/entries", response_model=EntryRead, status_code=status.HTTP_201_CREATED)
async def create_entry(
    payload: EntryCreate,
    db: AsyncSession = Depends(get_session),
    _: dict = Depends(verify_token),
) -> Entry:
    entry = Entry(**payload.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@app.patch("/api/entries/{entry_id}", response_model=EntryRead)
async def update_entry(
    entry_id: int,
    payload: EntryUpdate,
    db: AsyncSession = Depends(get_session),
    _: dict = Depends(verify_token),
) -> Entry:
    result = await db.execute(select(Entry).where(Entry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)

    await db.commit()
    await db.refresh(entry)
    return entry


@app.delete("/api/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_session),
    _: dict = Depends(verify_token),
) -> None:
    result = await db.execute(select(Entry).where(Entry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(entry)
    await db.commit()

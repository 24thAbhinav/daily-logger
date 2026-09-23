from contextlib import asynccontextmanager
from datetime import date
import base64
import hashlib
import hmac
import logging
import time
from urllib.parse import quote, urlparse
from uuid import uuid4

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import BETTER_AUTH_DEV_SECRET, get_settings
from .database import engine, get_session
from .models import Base, Entry, User
from .schemas import EntryCreate, EntryRead, EntryUpdate, UserRead

settings = get_settings()
logger = logging.getLogger("daily_logger")

# Shared httpx client (reused across requests)
_http_client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global _http_client
    if settings.better_auth_secret == BETTER_AUTH_DEV_SECRET:
        logger.warning(
            "startup auth_secret=better_auth_dev_default "
            "BETTER_AUTH_SECRET is not set; using Better Auth's development "
            "default. Set the same BETTER_AUTH_SECRET in the frontend and "
            "backend for production."
        )
    logger.info(
        "startup auth_config better_auth_url=%s frontend_url=%s secret_configured=%s",
        settings.better_auth_url,
        settings.frontend_url,
        bool(settings.better_auth_secret),
    )
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    logger.info("startup database_ready=true")
    _http_client = httpx.AsyncClient(timeout=5.0)
    logger.info("startup better_auth_http_client_ready=true")
    yield
    if _http_client:
        await _http_client.aclose()
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
        "request.start id=%s method=%s path=%s origin=%s authorization_present=%s",
        request_id,
        request.method,
        request.url.path,
        request.headers.get("origin", "-"),
        bool(request.headers.get("authorization")),
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


def _token_fingerprint(token: str) -> str:
    """Identify a token in logs without exposing the credential itself."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()[:12]


async def _resolve_better_auth_user(token: str) -> dict | None:
    """
    Verify a Better Auth session token by calling the Better Auth /get-session endpoint
    that lives inside Next.js.  Returns the raw user dict on success, None otherwise.
    """
    fingerprint = _token_fingerprint(token)
    if _http_client is None:
        logger.error(
            "auth.verify.failed reason=http_client_unavailable token=%s",
            fingerprint,
        )
        return None
    if not settings.better_auth_secret:
        logger.error(
            "auth.verify.failed reason=better_auth_secret_missing token=%s",
            fingerprint,
        )
        return None

    signature = base64.b64encode(
        hmac.new(
            settings.better_auth_secret.encode("utf-8"),
            token.encode("utf-8"),
            hashlib.sha256,
        ).digest()
    ).decode("ascii")
    signed_token = quote(
        f"{token}.{signature}",
        safe="-_.!~*'()",
    )
    cookie_name = (
        "__Secure-better-auth.session_token"
        if urlparse(settings.better_auth_url).scheme == "https"
        else "better-auth.session_token"
    )
    verify_url = f"{settings.better_auth_url.rstrip('/')}/api/auth/get-session"
    logger.info(
        "auth.verify.start token=%s token_length=%s url=%s cookie_name=%s",
        fingerprint,
        len(token),
        verify_url,
        cookie_name,
    )

    try:
        resp = await _http_client.get(
            verify_url,
            # Better Auth expects the HMAC-signed, URL-encoded cookie value.
            cookies={cookie_name: signed_token},
        )
        logger.info(
            "auth.verify.response token=%s status=%s content_type=%s body_bytes=%s",
            fingerprint,
            resp.status_code,
            resp.headers.get("content-type", "-"),
            len(resp.content),
        )
        if resp.status_code != 200:
            logger.warning(
                "auth.verify.rejected token=%s response_body=%s",
                fingerprint,
                resp.text[:500].replace("\n", " "),
            )
            return None

        data = resp.json()
        if not isinstance(data, dict):
            logger.warning(
                "auth.verify.rejected token=%s reason=unexpected_response_type type=%s",
                fingerprint,
                type(data).__name__,
            )
            return None

        user = data.get("user")
        if not isinstance(user, dict) or not user.get("id"):
            logger.warning(
                "auth.verify.rejected token=%s reason=session_user_missing response_keys=%s",
                fingerprint,
                sorted(data.keys()),
            )
            return None

        logger.info(
            "auth.verify.success token=%s user_id=%s",
            fingerprint,
            user["id"],
        )
        return user
    except httpx.HTTPError:
        logger.exception(
            "auth.verify.failed token=%s reason=http_error url=%s",
            fingerprint,
            verify_url,
        )
    except Exception:
        logger.exception(
            "auth.verify.failed token=%s reason=unexpected_error url=%s",
            fingerprint,
            verify_url,
        )
    return None


async def current_user(
    db: AsyncSession = Depends(get_session),
    authorization: str | None = Header(default=None),
) -> User:
    """
    Resolve the calling user from a Better Auth session token.

    The token is sent as `Authorization: Bearer <token>` and verified by
    calling the Better Auth /get-session endpoint that lives inside Next.js.
    Unauthenticated requests are rejected with 401.
    """
    # --- Better Auth verification ---
    token: str | None = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()

    if not authorization:
        logger.warning("auth.reject reason=authorization_header_missing")
    elif not authorization.lower().startswith("bearer "):
        logger.warning("auth.reject reason=authorization_scheme_invalid")
    elif not token:
        logger.warning("auth.reject reason=bearer_token_empty")
    else:
        fingerprint = _token_fingerprint(token)
        logger.info(
            "auth.session_lookup.start token=%s token_length=%s",
            fingerprint,
            len(token),
        )
        ba_user = await _resolve_better_auth_user(token)
        if ba_user:
            user_id: str = ba_user["id"]
            email: str = ba_user.get("email", "")
            name: str = ba_user.get("name", "User")
            image: str | None = ba_user.get("image")

            logger.info(
                "auth.database_lookup.start token=%s user_id=%s",
                fingerprint,
                user_id,
            )
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                logger.info(
                    "auth.database_lookup.found token=%s user_id=%s",
                    fingerprint,
                    user_id,
                )
                # Keep profile in sync with the OAuth provider.
                user.email = email
                user.name = name
                user.image = image
                await db.commit()
                return user

            logger.info(
                "auth.database_lookup.create token=%s user_id=%s",
                fingerprint,
                user_id,
            )
            user = User(id=user_id, email=email, name=name, image=image)
            db.add(user)
            await db.commit()
            await db.refresh(user)
            return user

        logger.warning(
            "auth.reject reason=better_auth_session_invalid token=%s",
            fingerprint,
        )

    logger.warning("auth.reject reason=not_authenticated")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/me", response_model=UserRead)
async def me(user: User = Depends(current_user)) -> User:
    return user


@app.get("/api/entries", response_model=list[EntryRead])
async def list_entries(
    entry_date: date | None = Query(default=None),
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_session),
) -> list[Entry]:
    query = (
        select(Entry)
        .where(Entry.user_id == user.id)
        .order_by(Entry.entry_date.desc(), Entry.created_at.desc())
    )
    if entry_date:
        query = query.where(Entry.entry_date == entry_date)
    result = await db.execute(query)
    return list(result.scalars().all())


@app.post("/api/entries", response_model=EntryRead, status_code=status.HTTP_201_CREATED)
async def create_entry(
    payload: EntryCreate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_session),
) -> Entry:
    entry = Entry(user_id=user.id, **payload.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@app.patch("/api/entries/{entry_id}", response_model=EntryRead)
async def update_entry(
    entry_id: int,
    payload: EntryUpdate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_session),
) -> Entry:
    result = await db.execute(
        select(Entry).where(Entry.id == entry_id, Entry.user_id == user.id)
    )
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
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_session),
) -> None:
    result = await db.execute(
        select(Entry).where(Entry.id == entry_id, Entry.user_id == user.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(entry)
    await db.commit()

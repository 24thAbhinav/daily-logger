from contextlib import asynccontextmanager
from datetime import date

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .database import engine, get_session
from .models import Base, Entry, User
from .schemas import EntryCreate, EntryRead, EntryUpdate, UserRead

settings = get_settings()

# Shared httpx client (reused across requests)
_http_client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global _http_client
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    _http_client = httpx.AsyncClient(timeout=5.0)
    yield
    if _http_client:
        await _http_client.aclose()
    await engine.dispose()


app = FastAPI(title="Daily Logger API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _resolve_better_auth_user(token: str) -> dict | None:
    """
    Verify a Better Auth session token by calling the Better Auth /get-session endpoint
    that lives inside Next.js.  Returns the raw user dict on success, None otherwise.
    """
    if _http_client is None:
        return None
    try:
        resp = await _http_client.get(
            f"{settings.better_auth_url}/api/auth/get-session",
            # Better Auth reads the session token from this cookie name.
            cookies={"better-auth.session_token": token},
        )
        if resp.status_code == 200:
            data = resp.json()
            return data.get("user")
    except Exception:
        pass
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

    if token:
        ba_user = await _resolve_better_auth_user(token)
        if ba_user:
            user_id: str = ba_user["id"]
            email: str = ba_user.get("email", "")
            name: str = ba_user.get("name", "User")
            image: str | None = ba_user.get("image")

            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                # Keep profile in sync with the OAuth provider.
                user.email = email
                user.name = name
                user.image = image
                await db.commit()
                return user

            user = User(id=user_id, email=email, name=name, image=image)
            db.add(user)
            await db.commit()
            await db.refresh(user)
            return user

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

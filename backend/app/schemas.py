from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class EntryCreate(BaseModel):
    entry_date: date
    title: str = Field(min_length=1, max_length=180)
    body: str = Field(min_length=1, max_length=10_000)
    tag: str = Field(default="Learning", min_length=1, max_length=40)


class EntryUpdate(BaseModel):
    """All fields optional — send only what changed."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=180)
    body: Optional[str] = Field(default=None, min_length=1, max_length=10_000)
    tag: Optional[str] = Field(default=None, min_length=1, max_length=40)


class EntryRead(EntryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class UserRead(BaseModel):
    id: str
    email: str
    name: str
    image: Optional[str] = None

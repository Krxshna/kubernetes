from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NoteCreate(BaseModel):
    body: str = ""


class NoteUpdate(BaseModel):
    body: Optional[str] = None


class NoteResponse(BaseModel):
    id: int
    body: Optional[str]
    updated: Optional[datetime]
    created: Optional[datetime]

    class Config:
        from_attributes = True

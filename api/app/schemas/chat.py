from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel

from app.schemas.message import MessageOut

class ChatCreate(BaseModel):
    title: str
    content: Optional[str] = None

class ChatUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class ChatOut(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    messages: List[MessageOut] = []
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
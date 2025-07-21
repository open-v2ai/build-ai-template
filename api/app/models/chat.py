from typing import Optional, List
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship

from app.models.message import Message

class Chat(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    title: str
    content: Optional[str] = None
    is_deleted: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow) 

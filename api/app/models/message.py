from typing import Optional
from datetime import datetime

from sqlmodel import SQLModel, Field, Column, String, CheckConstraint, JSON


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_id: int
    content: str
    model_conf: str = Field(default_factory=dict, sa_column=Column(JSON))
    role: str = Field(sa_column=Column(String, CheckConstraint("role IN ('user', 'assistant', 'system')")))
    is_deleted: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow) 

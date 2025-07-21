from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class MessageCreate(BaseModel):
    chat_id: int
    content: str
    model_conf: Optional[Dict[str, Any]] = None
    role: str

class MessageUpdate(BaseModel):
    content: Optional[str] = None
    model_conf: Optional[Dict[str, Any]] = None
    role: Optional[str] = None

class MessageOut(BaseModel):
    id: int
    chat_id: int
    content: str
    model_conf: Optional[Dict[str, Any]] = None
    role: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 
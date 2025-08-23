from typing import Optional
from datetime import datetime

from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = Field(default=None)
    email: str = Field(index=True, unique=True)
    is_admin: bool = Field(default=False)  # 管理员标志
    is_deleted: bool = Field(default=False)
    last_login_at: Optional[datetime] = Field(default=None)  # 最后登录时间
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

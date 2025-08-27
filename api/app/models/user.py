from typing import Optional
from datetime import datetime
from enum import Enum

from sqlmodel import SQLModel, Field


class UserType(str, Enum):
    """用户类型"""
    NORMAL = "normal"  # 普通用户
    PREMIUM = "premium"  # 高级用户
    ADMIN = "admin"  # 管理员
    SUPER_ADMIN = "super_admin"  # 超级管理员


class MembershipType(str, Enum):
    """会员类型"""
    FREE = "free"  # 免费会员
    MONTHLY = "monthly"  # 月度会员
    YEARLY = "yearly"  # 年度会员
    LIFETIME = "lifetime"  # 终身会员


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)  # 用户名：不可为空，不可重复
    email: str = Field(index=True, unique=True)
    password_hash: Optional[str] = Field(default=None)  # 密码哈希
    user_type: UserType = Field(default=UserType.NORMAL)  # 用户类型
    membership_type: MembershipType = Field(default=MembershipType.FREE)  # 会员类型
    is_deleted: bool = Field(default=False)
    last_login_at: Optional[datetime] = Field(default=None)  # 最后登录时间
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

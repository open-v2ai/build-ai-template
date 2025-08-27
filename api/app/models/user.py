from typing import Optional
from datetime import datetime
from enum import Enum

from sqlmodel import SQLModel, Field


class UserType(str, Enum):
    """User type"""
    NORMAL = "normal"  # Normal user
    PREMIUM = "premium"  # Premium user
    ADMIN = "admin"  # Admin
    SUPER_ADMIN = "super_admin"  # Super admin


class MembershipType(str, Enum):
    """Membership type"""
    FREE = "free"  # Free membership
    MONTHLY = "monthly"  # Monthly membership
    YEARLY = "yearly"  # Yearly membership
    LIFETIME = "lifetime"  # Lifetime membership


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)  # Username: required, unique
    email: str = Field(index=True, unique=True)
    password_hash: Optional[str] = Field(default=None)  # Password hash
    user_type: UserType = Field(default=UserType.NORMAL)  # User type
    membership_type: MembershipType = Field(default=MembershipType.FREE)  # Membership type
    is_deleted: bool = Field(default=False)
    last_login_at: Optional[datetime] = Field(default=None)  # Last login time
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

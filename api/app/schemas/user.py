from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserType, MembershipType

class EmailRequest(BaseModel):
    email: EmailStr
    lang: str

class VerifyCode(BaseModel):
    email: EmailStr
    code: str

class Token(BaseModel):
    access_token: str
    refresh_token: str


class RefreshToken(BaseModel):
    refresh_token: str


class UserProfile(BaseModel):
    id: int
    name: Optional[str]
    email: str
    user_type: UserType
    membership_type: MembershipType
    last_login_at: Optional[datetime]
    created_at: datetime
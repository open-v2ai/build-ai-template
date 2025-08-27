from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
from app.models.user import UserType, MembershipType
import re

class EmailRequest(BaseModel):
    email: EmailStr
    lang: str

class VerifyCode(BaseModel):
    email: EmailStr
    code: str

class UserRegister(BaseModel):
    email: EmailStr
    code: str
    username: str
    password: str
    lang: str
    
    @validator('username')
    def validate_username(cls, v):
        if not v or not v.strip():
            raise ValueError('用户名不能为空')
        v = v.strip()
        if len(v) < 2 or len(v) > 20:
            raise ValueError('用户名长度必须在2-20字符之间')
        if not re.match(r'^[a-zA-Z0-9_\u4e00-\u9fa5]+$', v):
            raise ValueError('用户名只能包含字母、数字、下划线和中文字符')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if not v:
            raise ValueError('密码不能为空')
        if len(v) < 6:
            raise ValueError('密码长度至少6位')
        return v

class PasswordReset(BaseModel):
    email: EmailStr
    code: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if not v:
            raise ValueError('密码不能为空')
        if len(v) < 6:
            raise ValueError('密码长度至少6位')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str


class RefreshToken(BaseModel):
    refresh_token: str


class UserProfile(BaseModel):
    id: int
    username: str
    email: str
    user_type: UserType
    membership_type: MembershipType
    last_login_at: Optional[datetime]
    created_at: datetime
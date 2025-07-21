from pydantic import BaseModel, EmailStr

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
from fastapi import APIRouter, HTTPException

from app.schemas.user import EmailRequest, VerifyCode, Token, RefreshToken
from app.services.user_service import verify_user_code, verify_admin_code, refresh_access_token
from app.services.email_service import send_verification_code
from app.dependencies.db import SessionDep, RedisDep

auth_router = APIRouter(prefix="/auth")

@auth_router.post("/send_code")
async def send_code(data: EmailRequest, redis: RedisDep) -> dict:
    """Send verification code to the specified email"""
    try:
        await send_verification_code(data.email, data.lang, redis)
        return {"message": "Verification code sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@auth_router.post("/verify", response_model=Token)
def verify(data: VerifyCode, session: SessionDep, redis: RedisDep) -> Token:
    """Verify email code and log in"""
    return verify_user_code(data.email, data.code, session, redis)

@auth_router.post("/admin/verify", response_model=Token)
def admin_verify(data: VerifyCode, session: SessionDep, redis: RedisDep) -> Token:
    """Verify email code and log in for admin users only"""
    return verify_admin_code(data.email, data.code, session, redis)

@auth_router.post("/refresh_token", response_model=Token)
async def refresh_token(data: RefreshToken, session: SessionDep) -> Token:
    """Refresh access token"""
    return refresh_access_token(data.refresh_token, session)
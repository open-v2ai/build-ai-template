from fastapi import APIRouter, HTTPException, Depends

from app.schemas.user import EmailRequest, VerifyCode, Token, RefreshToken, UserProfile
from app.services.user_service import verify_user_code, verify_admin_code, refresh_access_token
from app.services.email_service import send_verification_code
from app.dependencies.db import SessionDep, RedisDep
from app.dependencies.auth import get_current_user
from app.models.user import User

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

@auth_router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: User = Depends(get_current_user)) -> UserProfile:
    """Get current user profile"""
    return UserProfile(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        user_type=current_user.user_type,
        membership_type=current_user.membership_type,
        last_login_at=current_user.last_login_at,
        created_at=current_user.created_at
    )
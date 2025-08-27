from datetime import datetime
from sqlmodel import Session
from redis import Redis
from fastapi import HTTPException

from app.schemas.user import Token
from app.models.user import User, UserType
from app.crud.user import get_user_by_email, get_user_by_username, create_user, update_user_password
from app.core.security import create_access_token, create_refresh_token, decode_token, verify_password
from app.services.email_service import verify_code
from app.core.i18n import get_message, create_response_message


def verify_user_code(email: str, code: str, session: Session, redis: Redis, lang: str = "zh") -> Token:
    """验证邮箱验证码并登录已存在的用户"""
    if not verify_code(email, code, redis):
        error_msg = get_message("verification_code_invalid", lang)
        raise HTTPException(status_code=401, detail=error_msg)
    
    user = get_user_by_email(email, session)
    if not user:
        error_msg = get_message("user_not_found", lang)
        raise HTTPException(status_code=404, detail=error_msg)
    
    # Check if user is deleted
    if user.is_deleted:
        error_msg = get_message("forbidden", lang)
        raise HTTPException(status_code=403, detail=error_msg)
    
    # Update last login time
    user.last_login_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Use user ID as token subject
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return Token(access_token=token, refresh_token=refresh_token)


def verify_admin_code(email: str, code: str, session: Session, redis: Redis, lang: str = "zh") -> Token:
    """验证管理员登录代码，只允许管理员用户登录"""
    if not verify_code(email, code, redis):
        error_msg = get_message("verification_code_invalid", lang)
        raise HTTPException(status_code=401, detail=error_msg)
    
    user = get_user_by_email(email, session)
    if not user:
        error_msg = get_message("not_admin", lang)
        raise HTTPException(status_code=403, detail=error_msg)
    
    # Check if user is deleted
    if user.is_deleted:
        error_msg = get_message("forbidden", lang)
        raise HTTPException(status_code=403, detail=error_msg)
    
    # Check if user is admin
    if user.user_type not in [UserType.ADMIN, UserType.SUPER_ADMIN]:
        error_msg = get_message("admin_required", lang)
        raise HTTPException(status_code=403, detail=error_msg)
    
    # Update last login time
    user.last_login_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Use user ID as token subject
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return Token(access_token=token, refresh_token=refresh_token)

def register_user(email: str, username: str, password: str, code: str, session: Session, redis: Redis, lang: str = "zh") -> Token:
    """用户注册"""
    # Verify email verification code
    if not verify_code(email, code, redis):
        error_msg = get_message("verification_code_invalid", lang)
        raise HTTPException(status_code=401, detail=error_msg)
    
    # Check if email already exists
    existing_user = get_user_by_email(email, session)
    if existing_user:
        error_msg = get_message("user_exists", lang)
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Check if username already exists
    existing_username = get_user_by_username(username, session)
    if existing_username:
        error_msg = get_message("user_exists", lang)
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Create user
    user = create_user(email, session, username, password)
    
    # Update last login time
    user.last_login_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Generate token
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return Token(access_token=token, refresh_token=refresh_token)


def login_with_password(email: str, password: str, session: Session, lang: str = "zh") -> Token:
    """密码登录"""
    user = get_user_by_email(email, session)
    if not user:
        error_msg = get_message("password_invalid", lang)
        raise HTTPException(status_code=401, detail=error_msg)
    
    # Check if user is deleted
    if user.is_deleted:
        error_msg = get_message("forbidden", lang)
        raise HTTPException(status_code=403, detail=error_msg)
    
    # Check password
    if not user.password_hash or not verify_password(password, user.password_hash):
        error_msg = get_message("password_invalid", lang)
        raise HTTPException(status_code=401, detail=error_msg)
    
    # Update last login time
    user.last_login_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Generate token
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return Token(access_token=token, refresh_token=refresh_token)


def reset_password(email: str, code: str, new_password: str, session: Session, redis: Redis, lang: str = "zh") -> dict:
    """重置密码"""
    # Verify email verification code
    if not verify_code(email, code, redis):
        error_msg = get_message("verification_code_invalid", lang)
        raise HTTPException(status_code=401, detail=error_msg)
    
    # Check if user exists
    user = get_user_by_email(email, session)
    if not user:
        error_msg = get_message("user_not_found", lang)
        raise HTTPException(status_code=404, detail=error_msg)
    
    # Check if user is deleted
    if user.is_deleted:
        error_msg = get_message("forbidden", lang)
        raise HTTPException(status_code=403, detail=error_msg)
    
    # Update password
    update_user_password(user, new_password, session)
    
    return create_response_message("password_reset_success", lang)


def refresh_access_token(refresh_token: str, session: Session, lang: str = "zh") -> Token:
    payload = decode_token(refresh_token)
    user_id_str = payload.get("sub")
    if not user_id_str:
        error_msg = get_message("token_invalid", lang)
        raise HTTPException(status_code=401, detail=error_msg)
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        error_msg = get_message("token_invalid", lang)
        raise HTTPException(status_code=401, detail=error_msg)
    
    user = session.get(User, user_id)
    if not user:
        error_msg = get_message("user_not_found", lang)
        raise HTTPException(status_code=401, detail=error_msg)
    
    # Check if user is deleted
    if user.is_deleted:
        error_msg = get_message("forbidden", lang)
        raise HTTPException(status_code=401, detail=error_msg)
    
    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})
    return Token(access_token=access_token, refresh_token=new_refresh_token)


from datetime import datetime
from sqlmodel import Session
from redis import Redis
from fastapi import HTTPException

from app.schemas.user import Token
from app.models.user import User
from app.crud.user import get_user_by_email, create_user
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.services.email_service import verify_code


def verify_user_code(email: str, code: str, session: Session, redis: Redis) -> Token:
    if not verify_code(email, code, redis):
        raise HTTPException(status_code=401, detail="验证码无效或已过期")
    
    user = get_user_by_email(email, session)
    if not user:
        user = create_user(email, session)
    
    # 检查用户是否被删除
    if user.is_deleted:
        raise HTTPException(status_code=403, detail="该用户状态异常，请联系管理员")
    
    # 更新最后登录时间
    user.last_login_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # 使用用户ID作为token主体
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return Token(access_token=token, refresh_token=refresh_token)


def verify_admin_code(email: str, code: str, session: Session, redis: Redis) -> Token:
    """验证管理员登录代码，只允许管理员用户登录"""
    if not verify_code(email, code, redis):
        raise HTTPException(status_code=401, detail="验证码无效或已过期")
    
    user = get_user_by_email(email, session)
    if not user:
        # 如果用户不存在，检查是否是第一个用户
        from app.crud.user import is_first_user
        if is_first_user(session):
            user = create_user(email, session)
        else:
            raise HTTPException(status_code=403, detail="该邮箱不是管理员用户")
    
    # 检查用户是否被删除
    if user.is_deleted:
        raise HTTPException(status_code=403, detail="该用户状态异常，请联系管理员")
    
    # 检查用户是否是管理员
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="该邮箱不是管理员用户，无权限访问管理后台")
    
    # 更新最后登录时间
    user.last_login_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # 使用用户ID作为token主体
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return Token(access_token=token, refresh_token=refresh_token)

def refresh_access_token(refresh_token: str, session: Session) -> Token:
    payload = decode_token(refresh_token)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=401, detail="无效的刷新令牌")
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="无效的刷新令牌")
    
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    
    # 检查用户是否被删除
    if user.is_deleted:
        raise HTTPException(status_code=403, detail="该用户状态异常，请联系管理员")
    
    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})
    return Token(access_token=access_token, refresh_token=new_refresh_token)


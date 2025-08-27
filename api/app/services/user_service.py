from datetime import datetime
from sqlmodel import Session
from redis import Redis
from fastapi import HTTPException

from app.schemas.user import Token
from app.models.user import User, UserType
from app.crud.user import get_user_by_email, get_user_by_username, create_user, update_user_password
from app.core.security import create_access_token, create_refresh_token, decode_token, verify_password
from app.services.email_service import verify_code


def verify_user_code(email: str, code: str, session: Session, redis: Redis) -> Token:
    """验证邮箱验证码并登录已存在的用户"""
    if not verify_code(email, code, redis):
        raise HTTPException(status_code=401, detail="验证码无效或已过期")
    
    user = get_user_by_email(email, session)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在，请先注册")
    
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
        raise HTTPException(status_code=403, detail="该邮箱不是管理员用户")
    
    # 检查用户是否被删除
    if user.is_deleted:
        raise HTTPException(status_code=403, detail="该用户状态异常，请联系管理员")
    
    # 检查用户是否是管理员
    if user.user_type not in [UserType.ADMIN, UserType.SUPER_ADMIN]:
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

def register_user(email: str, username: str, password: str, code: str, session: Session, redis: Redis) -> Token:
    """用户注册"""
    # 验证邮箱验证码
    if not verify_code(email, code, redis):
        raise HTTPException(status_code=401, detail="验证码无效或已过期")
    
    # 检查邮箱是否已存在
    existing_user = get_user_by_email(email, session)
    if existing_user:
        raise HTTPException(status_code=400, detail="该邮箱已被注册")
    
    # 检查用户名是否已存在
    existing_username = get_user_by_username(username, session)
    if existing_username:
        raise HTTPException(status_code=400, detail="该用户名已被使用")
    
    # 创建用户
    user = create_user(email, session, username, password)
    
    # 更新最后登录时间
    user.last_login_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # 生成token
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return Token(access_token=token, refresh_token=refresh_token)


def login_with_password(email: str, password: str, session: Session) -> Token:
    """密码登录"""
    user = get_user_by_email(email, session)
    if not user:
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    
    # 检查用户是否被删除
    if user.is_deleted:
        raise HTTPException(status_code=403, detail="该用户状态异常，请联系管理员")
    
    # 检查密码
    if not user.password_hash or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    
    # 更新最后登录时间
    user.last_login_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # 生成token
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return Token(access_token=token, refresh_token=refresh_token)


def reset_password(email: str, code: str, new_password: str, session: Session, redis: Redis) -> dict:
    """重置密码"""
    # 验证邮箱验证码
    if not verify_code(email, code, redis):
        raise HTTPException(status_code=401, detail="验证码无效或已过期")
    
    # 检查用户是否存在
    user = get_user_by_email(email, session)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 检查用户是否被删除
    if user.is_deleted:
        raise HTTPException(status_code=403, detail="该用户状态异常，请联系管理员")
    
    # 更新密码
    update_user_password(user, new_password, session)
    
    return {"message": "密码重置成功"}


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


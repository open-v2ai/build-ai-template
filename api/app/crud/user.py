from typing import Optional
from datetime import datetime

from sqlmodel import Session, select, func

from app.models.user import User, UserType
from app.core.security import hash_password


def get_user_by_email(email: str, session: Session) -> Optional[User]:
    statement = select(User).where(User.email == email)
    result = session.exec(statement).first()
    return result


def get_user_by_username(username: str, session: Session) -> Optional[User]:
    """根据用户名获取用户"""
    statement = select(User).where(User.username == username)
    result = session.exec(statement).first()
    return result



def is_first_user(session: Session) -> bool:
    """检查是否为第一个用户"""
    count = session.exec(select(func.count(User.id))).first()
    return count == 0


def create_user(email: str, session: Session, username: str, password: Optional[str] = None) -> User:
    # Check if this is the first user, if so automatically set as super admin
    user_type = UserType.SUPER_ADMIN if is_first_user(session) else UserType.NORMAL
    
    user = User(
        email=email,
        username=username,
        password_hash=hash_password(password) if password else None,
        user_type=user_type  # First user automatically becomes super admin
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def create_admin_user(email: str, session: Session, username: str = "Default Admin") -> User:
    """创建管理员用户"""
    user = User(
        email=email,
        username=username,
        user_type=UserType.SUPER_ADMIN
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def update_user_password(user: User, new_password: str, session: Session) -> User:
    """更新用户密码"""
    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def create_default_admin_if_not_exists(email: str, session: Session) -> Optional[User]:
    """如果默认管理员用户不存在则创建"""
    existing_user = get_user_by_email(email, session)
    if existing_user:
        return None  # User already exists, no need to create
    
    return create_admin_user(email, session)

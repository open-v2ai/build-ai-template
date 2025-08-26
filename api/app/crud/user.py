from typing import Optional

from sqlmodel import Session, select, func

from app.models.user import User, UserType


def get_user_by_email(email: str, session: Session) -> Optional[User]:
    statement = select(User).where(User.email == email)
    result = session.exec(statement).first()
    return result


def is_first_user(session: Session) -> bool:
    """检查是否为第一个用户"""
    count = session.exec(select(func.count(User.id))).first()
    return count == 0


def create_user(email: str, session: Session) -> User:
    # 检查是否为第一个用户，如果是则自动设为超级管理员
    user_type = UserType.SUPER_ADMIN if is_first_user(session) else UserType.NORMAL
    
    user = User(
        email=email,
        user_type=user_type  # 第一个用户自动成为超级管理员
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

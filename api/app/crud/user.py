from typing import Optional

from sqlmodel import Session, select, func

from app.models.user import User


def get_user_by_email(email: str, session: Session) -> Optional[User]:
    statement = select(User).where(User.email == email)
    result = session.exec(statement).first()
    return result


def is_first_user(session: Session) -> bool:
    """检查是否为第一个用户"""
    count = session.exec(select(func.count(User.id))).first()
    return count == 0


def create_user(email: str, session: Session) -> User:
    # 检查是否为第一个用户，如果是则自动设为管理员
    is_admin = is_first_user(session)
    
    user = User(
        email=email,
        is_admin=is_admin  # 第一个用户自动成为管理员
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

from typing import Optional

from sqlmodel import Session, select

from app.models.user import User


def get_user_by_email(email: str, session: Session) -> Optional[User]:
    statement = select(User).where(User.email == email)
    result = session.exec(statement).first()
    return result

def create_user(email: str, session: Session) -> User:
    user = User(email=email)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

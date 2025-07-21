from sqlmodel import Session
from redis import Redis

from app.schemas.user import Token
from app.crud.user import get_user_by_email, create_user
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.services.email_service import verify_code


def verify_user_code(email: str, code: str, session: Session, redis: Redis) -> Token | None:
    if verify_code(email, code, redis):
        user = get_user_by_email(email, session)
        if not user:
            user = create_user(email, session)
        token = create_access_token({"sub": user.email})
        refresh_token = create_refresh_token({"sub": user.email})
        return Token(access_token=token, refresh_token=refresh_token)

    return None

def refresh_access_token(refresh_token: str, session: Session) -> Token | None:
    payload = decode_token(refresh_token)
    email = payload.get("sub")
    if not email:
        return None
    user = get_user_by_email(email, session)
    if not user:
        return None
    access_token = create_access_token({"sub": user.email})
    new_refresh_token = create_refresh_token({"sub": user.email})
    return Token(access_token=access_token, refresh_token=new_refresh_token)


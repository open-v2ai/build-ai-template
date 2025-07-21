from typing import Annotated

from fastapi import Depends, Request, HTTPException
from fastapi.security import HTTPBearer
from sqlmodel import Session
import redis

from app.core.security import decode_token
from app.crud.user import get_user_by_email
from app.models.user import User
from app.db.base import get_session

def get_redis(request: Request):
    return request.app.state.redis

RedisDep = Annotated[redis.Redis, Depends(get_redis)]

SessionDep = Annotated[Session, Depends(get_session)]

scheme = HTTPBearer()

def get_user(token: str = Depends(scheme), session: Session = Depends(get_session)):
    print(token)
    payload = decode_token(token.credentials)
    print(payload)
    if not payload or 'sub' not in payload:
        raise HTTPException(status_code=401, detail="Invalid access token")
    user = get_user_by_email(payload['sub'], session)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

UserDep = Annotated[User, Depends(get_user)]

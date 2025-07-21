from typing import Optional

from sqlmodel import Session, select

from app.models.chat import Chat
from app.schemas.chat import ChatCreate, ChatUpdate
from app.models.user import User

def create_chat(chat_in: ChatCreate, session: Session, user: User) -> Chat:
    chat = Chat(**chat_in.dict(), user_id=user.id)
    session.add(chat)
    session.commit()
    session.refresh(chat)
    return chat

def update_chat(chat_id: int, chat_in: ChatUpdate, session: Session, user: User) -> Optional[Chat]:
    chat = session.exec(select(Chat).where(Chat.id == chat_id, Chat.is_deleted == False, Chat.user_id == user.id)).first()
    if not chat:
        return None
    chat_data = chat_in.dict(exclude_unset=True)
    for key, value in chat_data.items():
        setattr(chat, key, value)
    session.add(chat)
    session.commit()
    session.refresh(chat)
    return chat

def soft_delete_chat(chat_id: int, session: Session, user: User) -> Optional[Chat]:
    chat = session.exec(select(Chat).where(Chat.id == chat_id, Chat.is_deleted == False, Chat.user_id == user.id)).first()
    if not chat:
        return None
    chat.is_deleted = True
    session.add(chat)
    session.commit()
    session.refresh(chat)
    return chat

def get_all_chats(session: Session, user: User) -> list[Chat]:
    chats = session.exec(
        select(Chat)
        .where(Chat.user_id == user.id, Chat.is_deleted == False)
        .order_by(Chat.updated_at.desc())
        .limit(100)
    ).all()
    return chats 

def get_chat(chat_id: int, session: Session, user: User) -> Optional[Chat]:
    chat = session.exec(select(Chat).where(Chat.id == chat_id, Chat.is_deleted == False, Chat.user_id == user.id)).first()
    if not chat:
        return None
    return chat
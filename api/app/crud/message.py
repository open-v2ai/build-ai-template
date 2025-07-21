from typing import Optional, List
from sqlmodel import Session, select
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageUpdate

def create_message(message_in: MessageCreate, session: Session) -> Message:
    message = Message(**message_in.dict())
    session.add(message)
    session.commit()
    session.refresh(message)
    return message

def update_message(message_id: int, message_in: MessageUpdate, session: Session) -> Optional[Message]:
    message = session.exec(select(Message).where(Message.id == message_id, Message.is_deleted == False)).first()
    if not message:
        return None
    message_data = message_in.dict(exclude_unset=True)
    for key, value in message_data.items():
        setattr(message, key, value)
    session.add(message)
    session.commit()
    session.refresh(message)
    return message

def soft_delete_message(message_id: int, session: Session) -> Optional[Message]:
    message = session.exec(select(Message).where(Message.id == message_id, Message.is_deleted == False)).first()
    if not message:
        return None
    message.is_deleted = True
    session.add(message)
    session.commit()
    session.refresh(message)
    return message

def get_all_messages(chat_id: int, session: Session) -> List[Message]:
    messages = session.exec(
        select(Message)
        .where(Message.chat_id == chat_id, Message.is_deleted == False)
        .order_by(Message.created_at.asc())
        .limit(200)
    ).all()
    return messages

def get_message(message_id: int, session: Session) -> Optional[Message]:
    message = session.exec(select(Message).where(Message.id == message_id, Message.is_deleted == False)).first()
    if not message:
        return None
    return message 
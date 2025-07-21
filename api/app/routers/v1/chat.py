from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatCreate, ChatUpdate, ChatOut
from app.crud.chat import create_chat, update_chat, soft_delete_chat, get_all_chats, get_chat
from app.dependencies.db import SessionDep, UserDep
from app.schemas.message import MessageOut, MessageCreate
from app.crud.message import get_all_messages, create_message
from app.utils.llm import create_llm_response, create_llm_response_stream
from app.utils.agent import run_agent

chat_router = APIRouter(prefix="/chat")

@chat_router.post("", response_model=ChatOut)
def create_chat_api(chat_in: ChatCreate, session: SessionDep, user: UserDep) -> ChatOut:
    chat = create_chat(chat_in, session, user)
    return chat

@chat_router.post("/message", response_model=list[MessageOut])
async def create_chat_message_api(message_in: MessageCreate, session: SessionDep, user: UserDep, stream: bool = False):
    messages = get_all_messages(message_in.chat_id, session)
    messages = [MessageOut.model_validate(m) for m in messages]

    # Create user message
    user_message = create_message(message_in, session)
    messages.append(user_message)

    if not stream:
        # Normal mode
        llm_response_content = create_llm_response(messages)
        # Create assistant message
        assistant_message = create_message(MessageCreate(chat_id=message_in.chat_id, content=llm_response_content, role="assistant"), session)
        return [user_message, assistant_message]
    else:
        async def stream_gen():
            content_acc = ""
            all_messages = "\n".join([f"{msg.role}: {msg.content}" for msg in messages])
            async for r in run_agent(all_messages):
                if r.startswith("<answer>"):
                    content_acc += r.replace("<answer>", "").replace("</answer>", "")
                print(r)
                yield r
            create_message(MessageCreate(chat_id=message_in.chat_id, content=content_acc, role="assistant"), session)
        return StreamingResponse(stream_gen(), media_type="text/plain")


@chat_router.put("/{chat_id}", response_model=ChatOut)
def update_chat_api(chat_id: int, chat_in: ChatUpdate, session: SessionDep, user: UserDep) -> ChatOut:
    chat = update_chat(chat_id, chat_in, session, user)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@chat_router.delete("/{chat_id}", response_model=ChatOut)
def delete_chat_api(chat_id: int, session: SessionDep, user: UserDep) -> ChatOut:
    chat = soft_delete_chat(chat_id, session, user)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@chat_router.get("", response_model=list[ChatOut])
def get_all_chats_api(session: SessionDep, user: UserDep) -> list[ChatOut]:
    chats = get_all_chats(session, user)
    return chats

@chat_router.get("/{chat_id}", response_model=ChatOut)
def get_chat_api(chat_id: int, session: SessionDep, user: UserDep) -> ChatOut:
    chat = get_chat(chat_id, session, user)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    messages = get_all_messages(chat_id, session)
    chat_out = ChatOut.model_validate(chat)
    chat_out.messages = [MessageOut.model_validate(m) for m in messages]
    return chat_out

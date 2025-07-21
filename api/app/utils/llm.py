from typing import AsyncIterator

from openai import OpenAI

from app.core.config import settings
from app.schemas.message import MessageOut

openai_client = OpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)

def create_llm_response(messages: list[MessageOut]) -> str:
    _messages = []
    for message in messages:
        _messages.append({"role": message.role, "content": message.content})
    response = openai_client.chat.completions.create(model=settings.OPENAI_MODEL, messages=_messages)
    return response.choices[0].message.content

async def create_llm_response_stream(messages: list[MessageOut]) -> AsyncIterator[str]:
    _messages = []
    for message in messages:
        _messages.append({"role": message.role, "content": message.content})
    stream = openai_client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=_messages,
        stream=True
    )
    for chunk in stream:
        content = chunk.choices[0].delta.content if chunk.choices[0].delta else None
        if content:
            yield content

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.routers.v1.auth import auth_router
from app.routers.v1.chat import chat_router
from app.core.config import settings
from app.db.base import create_db_and_tables
from app.utils.db import get_redis_client
from app.db.init_db import create_database_if_not_exists

create_database_if_not_exists()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("App starting up")
    create_db_and_tables()
    app.state.redis = get_redis_client()
    yield
    print("App shutting down")
    app.state.redis.close()

app = FastAPI(title=settings.API_NAME, version=settings.API_VERSION, lifespan=lifespan)

# healthcheck endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}

# add CORS support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(chat_router, prefix="/api/v1", tags=["chat"])

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=settings.API_RELOAD)
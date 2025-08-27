from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import uvicorn

from app.routers.v1.auth import auth_router
from app.routers.v1.chat import chat_router
from app.routers.v1.admin import admin_router
from app.routers.v1.system import system_router
from app.core.config import settings
from app.core.exceptions import validation_exception_handler, http_exception_handler
from app.db.base import create_db_and_tables
from app.utils.db import get_redis_client
from app.db.init_db import init_db

init_db()

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

# Register exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)

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
app.include_router(admin_router, prefix="/api/v1", tags=["admin"])
app.include_router(system_router, prefix="/api/v1", tags=["system"])

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app", 
        host=settings.API_HOST, 
        port=settings.API_PORT, 
        reload=settings.API_RELOAD,
        reload_dirs=["app"]
    )
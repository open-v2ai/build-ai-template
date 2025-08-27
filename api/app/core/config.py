import os

from dotenv import load_dotenv

load_dotenv()

class Settings:
    # api
    API_NAME: str = os.getenv("API_NAME", "API")
    API_VERSION: str = os.getenv("API_VERSION", "0.0.1")
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", 8000))
    API_RELOAD: bool = os.getenv("API_RELOAD", "False").lower() in ("true", "1", "yes")
    ENV: str = os.getenv("ENV", "dev")  # dev/test/prod
    DEBUG_AUTH_CODE: str = os.getenv("DEBUG_AUTH_CODE", "888888")
    
    # database
    POSTGRES_URL: str = os.getenv("POSTGRES_URL")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default-secret")

    # email service
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD")
    MAIL_FROM: str = os.getenv("MAIL_FROM")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER")

    # openai
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # default admin
    DEFAULT_ADMIN_EMAIL: str = os.getenv("DEFAULT_ADMIN_EMAIL")
    DEFAULT_ADMIN_PASSWORD: str = os.getenv("DEFAULT_ADMIN_PASSWORD")

settings = Settings()

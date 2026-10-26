import os
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv()



def _required_signing_key(name: str) -> str:
    """Refuse missing, short or example signing keys before the API starts."""
    value = (os.getenv(name) or "").strip()
    placeholders = ("replace_", "change_", "your_", "your-", "<")
    if len(value.encode("utf-8")) < 32 or value.lower().startswith(placeholders):
        raise RuntimeError(
            f"{name} must be configured with a unique random secret of at least 32 bytes"
        )
    return value


class Settings:
    ENV: str = os.getenv("ENV", "dev")  # dev/test/prod

    # 认证配置
    AUTH_SECRET_KEY: str = _required_signing_key("AUTH_SECRET_KEY")
    AUTH_ALGORITHM: str = os.getenv("AUTH_ALGORITHM", "HS256")
    AUTH_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("AUTH_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    AUTH_REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("AUTH_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    AUTH_IS_DEBUG: bool = os.getenv("AUTH_IS_DEBUG", "False").lower() in ("true", "1", "yes")
    AUTH_DEBUG_CODE: str = os.getenv("AUTH_DEBUG_CODE", "888888")

    # api
    API_NAME: str = os.getenv("API_NAME", "API")
    API_VERSION: str = os.getenv("API_VERSION", "0.1.0")
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", 8000))
    API_RELOAD: bool = os.getenv("API_RELOAD", "False").lower() in ("true", "1", "yes")

    # PostgreSQL 数据库配置
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "123456")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "bait")
    POSTGRES_ECHO: bool = os.getenv("POSTGRES_ECHO", "False").lower() in ("true", "1", "yes")
    POSTGRES_POOL_SIZE: int = int(os.getenv("POSTGRES_POOL_SIZE", "20"))
    POSTGRES_MAX_OVERFLOW: int = int(os.getenv("POSTGRES_MAX_OVERFLOW", "30"))
    POSTGRES_POOL_TIMEOUT: int = int(os.getenv("POSTGRES_POOL_TIMEOUT", "30"))
    POSTGRES_POOL_RECYCLE: int = int(os.getenv("POSTGRES_POOL_RECYCLE", "3600"))
    POSTGRES_POOL_PRE_PING: bool = os.getenv("POSTGRES_POOL_PRE_PING", "True").lower() in ("true", "1", "yes")
    
    @property
    def POSTGRES_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # 缓存 Redis 配置
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_USER: str = os.getenv("REDIS_USER", "default")
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "123456")
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    
    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_USER}:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # 邮件服务配置
    MAIL_SEND_METHOD: str = os.getenv("MAIL_SEND_METHOD", "SMTP")  # 发送邮件的方式，可选值为 SMTP 或 RESEND

    # SMTP 配置 (当 MAIL_SEND_METHOD = "SMTP" 时使用)
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD")
    MAIL_FROM: str = os.getenv("MAIL_FROM")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER")

    # Resend 配置 (当 MAIL_SEND_METHOD = "RESEND" 时使用)
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY")
    RESEND_MAIL_FROM: str = os.getenv("RESEND_MAIL_FROM")

    # openai
    AGENT_API_KEY: str = os.getenv("AGENT_API_KEY")
    AGENT_BASE_URL: str = os.getenv("AGENT_BASE_URL", "https://api.openai.com/v1/chat/completions")
    AGENT_MODEL_NAME: str = os.getenv("AGENT_MODEL_NAME", "gpt-4.1-mini")
    AGENT_MODEL_TEMPERATURE: float = float(os.getenv("AGENT_MODEL_TEMPERATURE", "0.7"))

    # stripe payment
    STRIPE_PUBLIC_KEY: str = os.getenv("STRIPE_PUBLIC_KEY")
    STRIPE_PRIVATE_KEY: str = os.getenv("STRIPE_PRIVATE_KEY")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET")

    # membership plans - 免费会员
    MEMBERSHIP_FREE_NAME: str = os.getenv("MEMBERSHIP_FREE_NAME", "免费会员")
    MEMBERSHIP_FREE_DAILY_MESSAGE_LIMIT: int = int(os.getenv("MEMBERSHIP_FREE_DAILY_MESSAGE_LIMIT", "100"))
    MEMBERSHIP_FREE_DAILY_TOKEN_LIMIT: int = int(os.getenv("MEMBERSHIP_FREE_DAILY_TOKEN_LIMIT", "1000000"))
    MEMBERSHIP_FREE_CONVERSATION_TURN_LIMIT: int = int(os.getenv("MEMBERSHIP_FREE_CONVERSATION_TURN_LIMIT", "10"))
    MEMBERSHIP_FREE_PRICE: float = float(os.getenv("MEMBERSHIP_FREE_PRICE", "0.0"))
    MEMBERSHIP_FREE_CURRENCY: str = os.getenv("MEMBERSHIP_FREE_CURRENCY", "USD")
    MEMBERSHIP_FREE_DURATION_DAYS: int = int(os.getenv("MEMBERSHIP_FREE_DURATION_DAYS", "36500"))
    MEMBERSHIP_FREE_DESCRIPTION: str = os.getenv("MEMBERSHIP_FREE_DESCRIPTION", "免费用户基础计划")

    # membership plans - 月度会员
    MEMBERSHIP_MONTHLY_NAME: str = os.getenv("MEMBERSHIP_MONTHLY_NAME", "月度会员")
    MEMBERSHIP_MONTHLY_DAILY_MESSAGE_LIMIT: int = int(os.getenv("MEMBERSHIP_MONTHLY_DAILY_MESSAGE_LIMIT", "800"))
    MEMBERSHIP_MONTHLY_DAILY_TOKEN_LIMIT: int = int(os.getenv("MEMBERSHIP_MONTHLY_DAILY_TOKEN_LIMIT", "8000000"))
    MEMBERSHIP_MONTHLY_CONVERSATION_TURN_LIMIT: int = int(os.getenv("MEMBERSHIP_MONTHLY_CONVERSATION_TURN_LIMIT", "30"))
    MEMBERSHIP_MONTHLY_PRICE: float = float(os.getenv("MEMBERSHIP_MONTHLY_PRICE", "9.9"))
    MEMBERSHIP_MONTHLY_CURRENCY: str = os.getenv("MEMBERSHIP_MONTHLY_CURRENCY", "USD")
    MEMBERSHIP_MONTHLY_DURATION_DAYS: int = int(os.getenv("MEMBERSHIP_MONTHLY_DURATION_DAYS", "30"))
    MEMBERSHIP_MONTHLY_DESCRIPTION: str = os.getenv("MEMBERSHIP_MONTHLY_DESCRIPTION", "月度付费会员计划")

    # membership plans - 年度会员
    MEMBERSHIP_YEARLY_NAME: str = os.getenv("MEMBERSHIP_YEARLY_NAME", "年度会员")
    MEMBERSHIP_YEARLY_DAILY_MESSAGE_LIMIT: int = int(os.getenv("MEMBERSHIP_YEARLY_DAILY_MESSAGE_LIMIT", "1000"))
    MEMBERSHIP_YEARLY_DAILY_TOKEN_LIMIT: int = int(os.getenv("MEMBERSHIP_YEARLY_DAILY_TOKEN_LIMIT", "10000000"))
    MEMBERSHIP_YEARLY_CONVERSATION_TURN_LIMIT: int = int(os.getenv("MEMBERSHIP_YEARLY_CONVERSATION_TURN_LIMIT", "50"))
    MEMBERSHIP_YEARLY_PRICE: float = float(os.getenv("MEMBERSHIP_YEARLY_PRICE", "99.9"))
    MEMBERSHIP_YEARLY_CURRENCY: str = os.getenv("MEMBERSHIP_YEARLY_CURRENCY", "USD")
    MEMBERSHIP_YEARLY_DURATION_DAYS: int = int(os.getenv("MEMBERSHIP_YEARLY_DURATION_DAYS", "365"))
    MEMBERSHIP_YEARLY_DESCRIPTION: str = os.getenv("MEMBERSHIP_YEARLY_DESCRIPTION", "年度付费会员计划")

    def log_all_settings(self, logger):
        """
        打印所有环境变量配置
        
        参数:
        - logger: 日志记录器对象
        
        功能:
        - 遍历并打印所有配置项
        - 对敏感信息进行脱敏处理
        - 对 URI 格式中的密码进行全遮罩处理
        """
        # 获取当前对象的所有属性
        for attr_name in dir(self):
            # 跳过私有属性、方法和特殊属性
            if not attr_name.startswith('_') and not attr_name == 'log_all_settings':
                attr_value = getattr(self, attr_name)
                # 跳过方法
                if not callable(attr_value):
                    if attr_value:
                        # 检查是否为 URI 格式并处理密码
                        try:
                            parsed = urlparse(str(attr_value))
                            if parsed.scheme and parsed.netloc and parsed.password:
                                # URI 格式且包含密码，统一用3个*遮罩
                                masked_value = str(attr_value).replace(f":{parsed.password}@", ":***@")
                                logger.info(f"[{self.ENV}] {attr_name}: {masked_value}")
                            elif any(sensitive in attr_name.upper() for sensitive in ['KEY', 'PASSWORD', 'SECRET']):
                                # 其他敏感信息保留头尾，中间用3个*脱敏
                                value_str = str(attr_value)
                                if len(value_str) > 6:
                                    masked_value = f"{value_str[:3]}***{value_str[-3:]}"
                                else:
                                    masked_value = "***"
                                logger.info(f"[{self.ENV}] {attr_name}: {masked_value}")
                            else:
                                logger.info(f"[{self.ENV}] {attr_name}: {attr_value}")
                        except Exception:
                            # 解析失败，按敏感信息处理
                            if any(sensitive in attr_name.upper() for sensitive in ['KEY', 'PASSWORD', 'SECRET']):
                                value_str = str(attr_value)
                                if len(value_str) > 6:
                                    masked_value = f"{value_str[:3]}***{value_str[-3:]}"
                                else:
                                    masked_value = "***"
                                logger.info(f"[{self.ENV}] {attr_name}: {masked_value}")
                            else:
                                logger.info(f"[{self.ENV}] {attr_name}: {attr_value}")
                    else:
                        # 未设置的配置
                        if any(sensitive in attr_name.upper() for sensitive in ['KEY', 'PASSWORD', 'SECRET']):
                            logger.info(f"[{self.ENV}] {attr_name}: [未设置]")
                        else:
                            logger.info(f"[{self.ENV}] {attr_name}: {attr_value}")

settings = Settings()

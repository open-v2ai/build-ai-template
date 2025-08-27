import random
import string
from pathlib import Path

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from jinja2 import Environment, FileSystemLoader
from redis import Redis

from app.core.config import settings

# initialize Jinja2 environment
TEMPLATES_DIR = Path(__file__).resolve().parent.parent / 'templates'
jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=True)

# initialize FastMail
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)
fastmail = FastMail(conf)

# Generate verification code
def generate_verification_code():
    """Generate a 6-digit numeric verification code, first digit cannot be 0"""
    first_digit = random.choice(string.digits[1:])
    other_digits = ''.join(random.choices(string.digits, k=5))
    return first_digit + other_digits


async def send_verification_code(email: str, lang: str, redis: Redis, purpose: str = "login") -> bool:
    """Send verification code to the specified email and store it in Redis, supports multiple language templates and purposes"""
    # Use default code in dev/test environment, don't send email
    if settings.ENV in ("dev", "test"):
        code = settings.DEBUG_AUTH_CODE
        # Store code with purpose prefix
        code_key = f"build-ai-template:code:{purpose}:{email}"
        redis.setex(code_key, 300, code)  # 5 minutes = 300 seconds
        return True
    
    # Send email in prod environment
    code = generate_verification_code()
    # Store code with purpose prefix
    code_key = f"build-ai-template:code:{purpose}:{email}"
    redis.setex(code_key, 300, code)  # 5 minutes = 300 seconds

    # Choose template based on purpose and language
    if purpose == "register":
        if lang == 'zh':
            template_name = 'email_code_register_mail_template_zh.html'
        else:
            template_name = 'email_code_register_mail_template_en.html'
        subject = "Build AI Template Registration Code" if lang == 'en' else "Build AI Template 的注册验证码"
    elif purpose == "reset":
        if lang == 'zh':
            template_name = 'email_code_reset_mail_template_zh.html'
        else:
            template_name = 'email_code_reset_mail_template_en.html'
        subject = "Build AI Template Password Reset Code" if lang == 'en' else "Build AI Template 的密码重置验证码"
    else:  # login
        if lang == 'zh':
            template_name = 'email_code_login_mail_template_zh.html'
        else:
            template_name = 'email_code_login_mail_template_en.html'
        subject = "Build AI Template Login Code" if lang == 'en' else "Build AI Template 的登录验证码"
    template = jinja_env.get_template(template_name)
    html_body = template.render(code=code)

    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=html_body,
        subtype="html"
    )
    await fastmail.send_message(message)
    return True

def verify_code(email: str, code: str, redis: Redis, purpose: str = "login") -> bool:
    """Verify email verification code (check from Redis) based on purpose"""
    code_key = f"build-ai-template:code:{purpose}:{email}"
    stored_code = redis.get(code_key)
    if stored_code and code == stored_code:
        redis.delete(code_key)
        return True
    return False

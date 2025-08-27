from urllib.parse import urlparse

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlmodel import Session

from app.core.config import settings
from app.db.base import engine
from app.crud.user import create_default_admin_if_not_exists


def create_database_if_not_exists():
    url = urlparse(settings.POSTGRES_URL)
    db_name = url.path[1:]  # Remove leading /
    db_user = url.username
    db_password = url.password
    db_host = url.hostname
    db_port = url.port or 5432

    # First connect to default database postgres
    conn = psycopg2.connect(
        dbname="postgres",
        user=db_user,
        password=db_password,
        host=db_host,
        port=db_port
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
    exists = cur.fetchone()
    if not exists:
        cur.execute(f'CREATE DATABASE "{db_name}"')
        print(f"Database {db_name} created")
    else:
        print(f"Database {db_name} already exists")

    cur.close()
    conn.close()


def init_default_admin():
    """初始化默认管理员用户"""
    try:
        with Session(engine) as session:
            admin_user = create_default_admin_if_not_exists(
                email=settings.DEFAULT_ADMIN_EMAIL, 
                session=session
            )
            if admin_user:
                print(f"Default admin user created: {admin_user.email} with username: {admin_user.username}")
            else:
                print(f"Default admin user already exists: {settings.DEFAULT_ADMIN_EMAIL}")
    except Exception as e:
        print(f"Error creating default admin user: {e}")


def init_db():
    """初始化数据库"""
    create_database_if_not_exists()
    init_default_admin()

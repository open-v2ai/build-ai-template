from urllib.parse import urlparse

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

from app.core.config import settings


def create_database_if_not_exists():
    url = urlparse(settings.POSTGRES_URL)
    db_name = url.path[1:]  # 去掉开头的 /
    db_user = url.username
    db_password = url.password
    db_host = url.hostname
    db_port = url.port or 5432

    # 先连到默认数据库 postgres
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

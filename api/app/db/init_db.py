import os
from urllib.parse import urlparse

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


def create_database_if_not_exists():
    url = urlparse(os.getenv("POSTGRES_URL"))
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


def init_db():
    """初始化数据库"""
    create_database_if_not_exists()

from sqlmodel import create_engine, Session, SQLModel

from app.core.config import settings

engine = create_engine(settings.POSTGRES_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
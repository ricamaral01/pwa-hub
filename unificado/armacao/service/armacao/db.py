import os
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker


def database_url() -> str:
    url = os.getenv("ARMACAO_DATABASE_URL", "")
    if not url:
        raise RuntimeError("ARMACAO_DATABASE_URL obrigatoria")
    return url


engine = create_engine(database_url(), pool_pre_ping=True, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def session():
    with SessionLocal() as db:
        yield db


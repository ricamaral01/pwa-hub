"""Banco dedicado; o schema nunca é criado na inicialização da API."""
from __future__ import annotations
import os
from functools import lru_cache
from fastapi import HTTPException
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import Session

@lru_cache
def database():
    url = os.getenv("SUPRIMENTOS_DATABASE_URL", "")
    expected = os.getenv("SUPRIMENTOS_EXPECTED_DATABASE", "suprimentos")
    if not url or url.rsplit("/", 1)[-1].split("?", 1)[0] != expected:
        raise RuntimeError("SUPRIMENTOS_DATABASE_URL deve apontar para o banco dedicado")
    engine = create_engine(url, pool_pre_ping=True, future=True)
    metadata = MetaData(schema="suprimentos")
    metadata.reflect(bind=engine, schema="suprimentos")
    return engine, metadata

def table(name: str):
    try:
        return database()[1].tables[f"suprimentos.{name}"]
    except (KeyError, RuntimeError):
        raise HTTPException(503, "Schema de Suprimentos indisponível") from None

def session():
    try:
        engine, _ = database()
    except RuntimeError:
        raise HTTPException(503, "Banco de Suprimentos não configurado") from None
    with Session(engine) as db:
        yield db

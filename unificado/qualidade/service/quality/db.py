"""Dedicated Quality database; no connection to another Unificado database."""
from __future__ import annotations

import os
from functools import lru_cache

from fastapi import HTTPException
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import Session


@lru_cache
def database():
    url = os.getenv("QUALIDADE_DATABASE_URL", "")
    expected_database = os.getenv("QUALIDADE_EXPECTED_DATABASE", "qualidade")
    if not url or url.rsplit("/", 1)[-1].split("?", 1)[0] != expected_database:
        raise RuntimeError("QUALIDADE_DATABASE_URL deve apontar para o banco dedicado da Qualidade")
    engine = create_engine(url, pool_pre_ping=True, future=True)
    metadata = MetaData(schema="qualidade")
    metadata.reflect(bind=engine, schema="qualidade")
    return engine, metadata


def table(name: str):
    try:
        return database()[1].tables[f"qualidade.{name}"]
    except (KeyError, RuntimeError):
        raise HTTPException(503, "Schema da Qualidade indisponível.") from None


def session():
    try:
        engine, _ = database()
    except RuntimeError:
        raise HTTPException(503, "Banco da Qualidade não configurado.") from None
    with Session(engine) as db:
        yield db

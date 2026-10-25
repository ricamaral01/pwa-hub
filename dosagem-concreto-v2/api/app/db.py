from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .config import get_config


@lru_cache
def get_engine():
    cfg = get_config()
    if cfg.database_schema and cfg.database_schema != "dosagem":
        raise ValueError("O esquema da Dosagem deve ser 'dosagem'.")
    options = {"connect_args": {"options": "-csearch_path=dosagem"}} if cfg.database_schema else {}
    return create_engine(cfg.database_url, pool_pre_ping=True, **options)


@lru_cache
def get_sessionmaker():
    return sessionmaker(get_engine(), expire_on_commit=False)

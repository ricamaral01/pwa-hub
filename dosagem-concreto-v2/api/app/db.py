from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .config import get_config


@lru_cache
def get_engine():
    return create_engine(get_config().database_url, pool_pre_ping=True)


@lru_cache
def get_sessionmaker():
    return sessionmaker(get_engine(), expire_on_commit=False)

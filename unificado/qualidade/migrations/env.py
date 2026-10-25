"""Alembic migrations for the dedicated Quality database."""
from __future__ import annotations

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool


config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)


def database_url() -> str:
    return os.environ.get("QUALIDADE_MIGRATION_DATABASE_URL") or config.get_main_option("sqlalchemy.url")


def run_migrations_online() -> None:
    engine = create_engine(database_url(), poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=None, transactional_ddl=True)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


def run_migrations_offline() -> None:
    context.configure(url=database_url(), target_metadata=None, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

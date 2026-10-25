"""Migrations only against the explicit dedicated Suprimentos database."""
import os
from logging.config import fileConfig
from alembic import context
from sqlalchemy import create_engine, pool

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

def database_url():
    value = os.getenv("SUPRIMENTOS_MIGRATION_DATABASE_URL", "")
    if not value:
        raise RuntimeError("SUPRIMENTOS_MIGRATION_DATABASE_URL obrigatório")
    return value

def run_migrations_online():
    engine = create_engine(database_url(), poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, transactional_ddl=True)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()

def run_migrations_offline():
    context.configure(url=database_url(), literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

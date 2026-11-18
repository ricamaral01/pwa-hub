"""Independent Alembic history in the PCP database, touching only armacao."""
import os
from logging.config import fileConfig
from alembic import context
from sqlalchemy import create_engine, pool

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)


def url():
    value = os.getenv("ARMACAO_MIGRATION_DATABASE_URL", "")
    if not value:
        raise RuntimeError("ARMACAO_MIGRATION_DATABASE_URL obrigatoria")
    return value


def run_online():
    engine = create_engine(url(), poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, transactional_ddl=True,
                          version_table="alembic_version_armacao", version_table_schema="public")
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


def run_offline():
    context.configure(url=url(), literal_binds=True,
                      version_table="alembic_version_armacao", version_table_schema="public")
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_offline()
else:
    run_online()


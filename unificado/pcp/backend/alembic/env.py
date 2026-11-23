from logging.config import fileConfig
import os

from alembic import context
from sqlalchemy import create_engine, pool

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)
database_url = os.environ.get('DATABASE_URL')
if not database_url:
    raise RuntimeError('DATABASE_URL must be provided explicitly for migrations')


def run_migrations_offline():
    context.configure(url=database_url, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    engine = create_engine(database_url, poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, transactional_ddl=True)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

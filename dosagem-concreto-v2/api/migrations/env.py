from alembic import context
from sqlalchemy import create_engine

from app.config import get_config
from app.modelos import Base

config = context.config
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(url=get_config().database_url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    cfg = get_config()
    if cfg.database_schema and cfg.database_schema != "dosagem":
        raise ValueError("O esquema da Dosagem deve ser 'dosagem'.")
    options = {"connect_args": {"options": "-csearch_path=dosagem"}} if cfg.database_schema else {}
    engine = create_engine(cfg.database_url, pool_pre_ping=True, **options)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata,
                          version_table_schema=cfg.database_schema or None)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

"""Independent Alembic stream for Mapa IAM data grants only."""
from __future__ import annotations
import os
from alembic import context
from sqlalchemy import create_engine

config=context.config
url=os.environ["ARMACAO_IAM_MIGRATION_DATABASE_URL"]


def run_migrations_online():
    engine=create_engine(url)
    with engine.connect() as connection:
        context.configure(connection=connection,version_table="alembic_version_armacao_iam",
                          version_table_schema="unificado_auth")
        with context.begin_transaction(): context.run_migrations()
    engine.dispose()


run_migrations_online()

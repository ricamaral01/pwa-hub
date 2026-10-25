"""Esquema isolado da Dosagem v2.

Revision ID: 20261017_01
"""
from alembic import op

from app.modelos import Base

revision = "20261017_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Freeze the initial schema: later models belong to additive migrations.
    initial = ("usuarios", "documentos", "idempotencia", "auditoria", "legado_ids")
    Base.metadata.create_all(bind=op.get_bind(), tables=[Base.metadata.tables[name] for name in initial])
    op.execute("CREATE SEQUENCE IF NOT EXISTS traco_codigo_seq START 1")


def downgrade() -> None:
    op.execute("DROP SEQUENCE IF EXISTS traco_codigo_seq")
    Base.metadata.drop_all(bind=op.get_bind())

"""Add pilot provenance to business records without modifying existing rows.

Revision ID: 20261018_04
Revises: 20261018_03
"""
from alembic import op

revision = "20261018_04"
down_revision = "20261018_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for table in ("documentos", "auditoria", "material_versoes", "traco_versoes", "avaliacoes_impacto"):
        op.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS piloto BOOLEAN NOT NULL DEFAULT false")


def downgrade() -> None:
    raise RuntimeError("Contract migration only in a separate, manually approved release")

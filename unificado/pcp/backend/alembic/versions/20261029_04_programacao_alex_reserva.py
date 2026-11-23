"""Store Mega stock reservations for daily programming.

Revision ID: 20261029_04
Revises: 20261029_03
"""
from alembic import op
import sqlalchemy as sa

revision = "20261029_04"
down_revision = "20261029_03"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "programacoes_alex",
        sa.Column("reserva", sa.Numeric(14, 3), nullable=False, server_default="0"),
        schema="public",
    )


def downgrade():
    op.drop_column("programacoes_alex", "reserva", schema="public")

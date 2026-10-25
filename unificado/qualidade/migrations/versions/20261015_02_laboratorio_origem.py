"""Add the Laboratory test origin for B4.

Revision ID: 20261015_02
Revises: 20261015_01
"""
from uuid import NAMESPACE_URL, uuid5

from alembic import op
from sqlalchemy import text

revision = "20261015_02"
down_revision = "20261015_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    company = uuid5(NAMESPACE_URL, "concretrack/qualidade/empresa/CONCRETRACK")
    origin = uuid5(NAMESPACE_URL, "concretrack/qualidade/origem/ENSAIO_LABORATORIO")
    op.get_bind().execute(text("""INSERT INTO qualidade.origem
        (id,empresa_id,codigo,nome,ativo,criado_por)
        VALUES (:id,:company,'ENSAIO_LABORATORIO','Ensaio de laboratório',true,'migration:B4')
        ON CONFLICT DO NOTHING"""), {"id": origin, "company": company})


def downgrade() -> None:
    # Production data is intentionally preserved.
    pass

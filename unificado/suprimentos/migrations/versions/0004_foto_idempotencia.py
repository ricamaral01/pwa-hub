"""Chave idempotente para fotos reenviadas pelo PWA.

Revision ID: sup_0004
Revises: sup_0003
"""
from alembic import op

revision = "sup_0004"
down_revision = "sup_0003"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE suprimentos.sup_solicitacao_foto ADD COLUMN client_uuid uuid")
    op.execute("""CREATE UNIQUE INDEX uq_sup_foto_client_uuid
      ON suprimentos.sup_solicitacao_foto(unidade_id,solicitacao_id,client_uuid)
      WHERE client_uuid IS NOT NULL""")


def downgrade():
    op.execute("DROP INDEX suprimentos.uq_sup_foto_client_uuid")
    op.execute("ALTER TABLE suprimentos.sup_solicitacao_foto DROP COLUMN client_uuid")

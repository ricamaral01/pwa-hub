"""Envio de pedido por e-mail permanece desligado até SMTP configurado.

Revision ID: sup_0006
Revises: sup_0005
"""
from alembic import op
from sqlalchemy import text
from suprimentos.ids import uuid7

revision = "sup_0006"
down_revision = "sup_0005"
branch_labels = None
depends_on = None

def upgrade():
    op.get_bind().execute(text("""INSERT INTO suprimentos.sup_flag
      (id,unidade_id,fase,habilitado,criado_por,atualizado_por)
      VALUES (:id,1,'S3A_EMAIL',false,'migration:sup_0006','migration:sup_0006')
      ON CONFLICT (unidade_id,fase) DO NOTHING"""), {"id": uuid7()})

def downgrade():
    op.execute("DELETE FROM suprimentos.sup_flag WHERE criado_por='migration:sup_0006'")

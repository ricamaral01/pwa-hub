"""A6b: idempotent day closure for offline synchronization.

Revision ID: a6b_20261029
Revises: a6_20261029
"""
from alembic import op

revision="a6b_20261029"
down_revision="a6_20261029"
branch_labels=None
depends_on=None


def upgrade():
    op.execute("""ALTER TABLE armacao.armacao_apontamento ADD COLUMN requisicao_id text;
      CREATE UNIQUE INDEX uq_armacao_fechamento_requisicao_modelo
      ON armacao.armacao_apontamento(unidade_id,requisicao_id,modelo_poste_id)
      WHERE requisicao_id IS NOT NULL""")


def downgrade():
    op.execute("DROP INDEX armacao.uq_armacao_fechamento_requisicao_modelo")
    op.execute("ALTER TABLE armacao.armacao_apontamento DROP COLUMN requisicao_id")

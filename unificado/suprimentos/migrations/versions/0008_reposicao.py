"""Usa a sugestão de ressuprimento criada na S1 e migra a tabela F2 temporária.

Revision ID: sup_0008
Revises: sup_0007
"""
from alembic import op
revision='sup_0008'
down_revision='sup_0007'
branch_labels=None
depends_on=None

def upgrade():
    op.execute("""DO $$ BEGIN
      IF to_regclass('suprimentos.sup_sugestao_reposicao') IS NOT NULL THEN
        INSERT INTO suprimentos.sup_sugestao_ressuprimento
          (id,unidade_id,origem,material_id,qtd,destino_ref,status,criado_em,criado_por,atualizado_em,atualizado_por)
        SELECT id,unidade_id,'almoxarifado',material_id,quantidade,motivo,status,
          criado_em,criado_por,atualizado_em,atualizado_por
        FROM suprimentos.sup_sugestao_reposicao ON CONFLICT(id) DO NOTHING;
        DROP TABLE suprimentos.sup_sugestao_reposicao;
      END IF;
    END $$""")
    op.execute("CREATE UNIQUE INDEX uq_sup_sugestao_aberta_almox ON suprimentos.sup_sugestao_ressuprimento(unidade_id,material_id) WHERE status='SUGERIDA' AND origem='almoxarifado'")
    op.execute("CREATE INDEX ix_sup_sugestao_fila ON suprimentos.sup_sugestao_ressuprimento(unidade_id,origem,status,criado_em DESC)")

def downgrade():
    op.execute('DROP INDEX suprimentos.ix_sup_sugestao_fila')
    op.execute('DROP INDEX suprimentos.uq_sup_sugestao_aberta_almox')

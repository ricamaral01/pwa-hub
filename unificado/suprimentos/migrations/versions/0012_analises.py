"""Índices das análises S5 e flag inicialmente desligada.

Revision ID: sup_0012
Revises: sup_0011
"""
from alembic import op

revision = "sup_0012"
down_revision = "sup_0011"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE INDEX ix_sup_analise_solicitacao ON suprimentos.sup_solicitacao(unidade_id,cc_id,criado_em) INCLUDE (entregue_em,status,urgencia)")
    op.execute("CREATE INDEX ix_sup_analise_pedido ON suprimentos.sup_pedido(unidade_id,criado_em,entrega_prevista) INCLUDE (status,fornecedor_unidade_id,enviado_em,valor_total)")
    op.execute("CREATE INDEX ix_sup_analise_movimento ON suprimentos.sup_movimento(unidade_id,efetivado_em,material_id) WHERE tipo='ENTREGA' AND quantidade<0")
    op.execute("CREATE INDEX ix_sup_analise_estorno ON suprimentos.sup_movimento(estorna_movimento_id) WHERE estorna_movimento_id IS NOT NULL")
    op.execute("CREATE INDEX ix_sup_analise_aprovacao ON suprimentos.sup_aprovacao(unidade_id,solicitacao_id,nivel,em)")
    op.execute("CREATE INDEX ix_sup_analise_preco ON suprimentos.sup_cotacao_preco(unidade_id,cotacao_item_id,criado_em) INCLUDE (custo_posto,escolhido)")
    op.execute("INSERT INTO suprimentos.sup_flag(id,unidade_id,fase,habilitado,criado_por,atualizado_por) SELECT gen_random_uuid(),id,'S5',false,'migration','migration' FROM suprimentos.sup_unidade ON CONFLICT(unidade_id,fase) DO NOTHING")


def downgrade():
    op.execute("DELETE FROM suprimentos.sup_flag WHERE fase='S5' AND criado_por='migration'")
    for name in ("ix_sup_analise_preco", "ix_sup_analise_aprovacao", "ix_sup_analise_estorno", "ix_sup_analise_movimento", "ix_sup_analise_pedido", "ix_sup_analise_solicitacao"):
        op.execute(f"DROP INDEX suprimentos.{name}")

"""Contrato S4 com o Laboratório, sem abrir a flag na homologação.

Revision ID: sup_0011
Revises: sup_0010
"""
from alembic import op

revision='sup_0011'
down_revision='sup_0010'
branch_labels=None
depends_on=None
AUDIT='criado_em timestamptz NOT NULL DEFAULT now(), criado_por text NOT NULL, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text NOT NULL'


def upgrade():
    op.execute('ALTER TABLE suprimentos.sup_sugestao_ressuprimento ADD COLUMN chave_origem text')
    op.execute("CREATE UNIQUE INDEX uq_sup_sugestao_usina_chave ON suprimentos.sup_sugestao_ressuprimento(unidade_id,chave_origem) WHERE origem='estoque_usina' AND chave_origem IS NOT NULL")
    op.execute(f"""CREATE TABLE suprimentos.sup_integracao_recebimento (
      id uuid PRIMARY KEY, unidade_id smallint NOT NULL REFERENCES suprimentos.sup_unidade(id),
      pedido_id uuid NOT NULL, pedido_item_id uuid NOT NULL,
      quantidade numeric(18,4) NOT NULL CHECK (quantidade>0),
      status text NOT NULL DEFAULT 'RECEBIDO' CHECK (status='RECEBIDO'),
      numero_nf text, documento_ref text, inspecao_status text CHECK (inspecao_status IN ('LIBERADO','CONDICIONAL','REPROVADO')),
      chave_idempotencia text NOT NULL, avaliacao_id uuid,
      recebido_em timestamptz NOT NULL DEFAULT now(),
      FOREIGN KEY(pedido_id,unidade_id) REFERENCES suprimentos.sup_pedido(id,unidade_id),
      FOREIGN KEY(pedido_item_id,unidade_id) REFERENCES suprimentos.sup_pedido_item(id,unidade_id),
      UNIQUE(unidade_id,chave_idempotencia), {AUDIT})""")
    op.execute('CREATE INDEX ix_sup_integracao_recebimento_pedido ON suprimentos.sup_integracao_recebimento(unidade_id,pedido_id,recebido_em DESC)')
    op.execute("INSERT INTO suprimentos.sup_flag(id,unidade_id,fase,habilitado,criado_por,atualizado_por) SELECT gen_random_uuid(),id,'S4',false,'migration','migration' FROM suprimentos.sup_unidade ON CONFLICT(unidade_id,fase) DO NOTHING")


def downgrade():
    op.execute("DELETE FROM suprimentos.sup_flag WHERE fase='S4' AND criado_por='migration'")
    op.execute('DROP TABLE suprimentos.sup_integracao_recebimento')
    op.execute('DROP INDEX suprimentos.uq_sup_sugestao_usina_chave')
    op.execute('ALTER TABLE suprimentos.sup_sugestao_ressuprimento DROP COLUMN chave_origem')

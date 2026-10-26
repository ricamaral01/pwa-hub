"""Frete proporcional, atendimento manual e estorno auditável de entregas F3.

Revision ID: sup_0010
Revises: sup_0009
"""
from alembic import op

revision='sup_0010'
down_revision='sup_0009'
branch_labels=None
depends_on=None


def upgrade():
    op.execute('ALTER TABLE suprimentos.sup_recebimento ADD COLUMN frete_total numeric(18,2) NOT NULL DEFAULT 0 CHECK (frete_total>=0)')
    op.execute('ALTER TABLE suprimentos.sup_recebimento ADD COLUMN atendimento_confirmado_em timestamptz')
    op.execute('ALTER TABLE suprimentos.sup_recebimento ADD COLUMN atendimento_confirmado_por text')
    op.execute('ALTER TABLE suprimentos.sup_pedido_entrega ADD COLUMN estornado_em timestamptz')
    op.execute('ALTER TABLE suprimentos.sup_pedido_entrega ADD COLUMN estornado_por text')


def downgrade():
    op.execute('ALTER TABLE suprimentos.sup_pedido_entrega DROP COLUMN estornado_por')
    op.execute('ALTER TABLE suprimentos.sup_pedido_entrega DROP COLUMN estornado_em')
    op.execute('ALTER TABLE suprimentos.sup_recebimento DROP COLUMN atendimento_confirmado_por')
    op.execute('ALTER TABLE suprimentos.sup_recebimento DROP COLUMN atendimento_confirmado_em')
    op.execute('ALTER TABLE suprimentos.sup_recebimento DROP COLUMN frete_total')

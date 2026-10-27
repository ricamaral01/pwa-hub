"""Add Ribeirão to the shared, unit-scoped production domain.

Revision ID: 20261027_04
Revises: 20261024_01
"""
from alembic import op

revision = "20261027_04"
down_revision = "20261024_01"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
      ALTER TABLE producao.unidade
      ADD COLUMN passo_homens numeric(4,2) NOT NULL DEFAULT 0.25
      CHECK (passo_homens > 0 AND passo_homens <= 1);
      INSERT INTO producao.unidade (id,codigo,nome,passo_homens)
      VALUES (3,'ribeirao','Ribeirão',0.01);
    """)


def downgrade():
    op.execute("""
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM producao.produto WHERE unidade_id=3)
          OR EXISTS (SELECT 1 FROM producao.meta_producao WHERE unidade_id=3)
          OR EXISTS (SELECT 1 FROM producao.apontamento_dia WHERE unidade_id=3)
          OR EXISTS (SELECT 1 FROM producao.auditoria WHERE unidade_id=3)
          OR EXISTS (SELECT 1 FROM producao.usuario_unidade WHERE unidade_id=3)
          OR EXISTS (SELECT 1 FROM public.atividades_mao_de_obra WHERE unidade_id=3)
          OR EXISTS (SELECT 1 FROM public.maodeobra WHERE unidade_id=3)
          OR EXISTS (SELECT 1 FROM public.maodeobra_dias WHERE unidade_id=3) THEN
          RAISE EXCEPTION 'Ribeirão has data; export before downgrade';
        END IF;
      END $$;
      DELETE FROM producao.unidade WHERE id=3 AND codigo='ribeirao';
      ALTER TABLE producao.unidade DROP COLUMN passo_homens;
    """)

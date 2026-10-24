"""Allow an isolated two-digit labor day key for each new production unit.

Revision ID: 20261023_03
Revises: 20261023_02
"""
from alembic import op

revision = "20261023_03"
down_revision = "20261023_02"
branch_labels = None
depends_on = None


def upgrade():
    # Campinas keeps 12/34. Pederneiras uses 02. The old two-value check
    # would reject every Pederneiras save even though quantity already accepts
    # numeric(5,2) and activities already have an order column in production.
    op.execute("ALTER TABLE public.maodeobra_dias DROP CONSTRAINT maodeobra_dias_grupo_setor_check")
    op.execute("""
      ALTER TABLE public.maodeobra_dias ADD CONSTRAINT maodeobra_dias_grupo_setor_check
      CHECK (grupo_setor ~ '^[0-9]{2}$')
    """)


def downgrade():
    op.execute("""
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM public.maodeobra_dias WHERE grupo_setor NOT IN ('12','34')) THEN
          RAISE EXCEPTION 'Other unit labor days exist; export before downgrade';
        END IF;
      END $$
    """)
    op.execute("ALTER TABLE public.maodeobra_dias DROP CONSTRAINT maodeobra_dias_grupo_setor_check")
    op.execute("""
      ALTER TABLE public.maodeobra_dias ADD CONSTRAINT maodeobra_dias_grupo_setor_check
      CHECK (grupo_setor IN ('12','34'))
    """)

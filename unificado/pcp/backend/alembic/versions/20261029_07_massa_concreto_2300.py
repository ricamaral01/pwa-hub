"""Set the estimated concrete mass to 2300 kg/m3, preserving explicit weights.

Revision ID: 20261029_07
Revises: 20261029_06
"""
from alembic import op

revision = "20261029_07"
down_revision = "20261029_06"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""UPDATE public.pcp_configuracao SET valor='2300'
      WHERE chave='pcp.semanal.kg_por_m3_fallback' AND valor='2500'""")


def downgrade():
    op.execute("""UPDATE public.pcp_configuracao SET valor='2500'
      WHERE chave='pcp.semanal.kg_por_m3_fallback' AND valor='2300'""")

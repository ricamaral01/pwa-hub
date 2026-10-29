"""Add 14X1000 and 15X1000 to DT15 in sector 4.

Product mass, volume, and codes are left blank until their DT specifications
are confirmed; circular sector 3 specifications must not be reused for DT.

Revision ID: 20261029_02
Revises: 20261029_01
"""
from alembic import op

revision = "20261029_02"
down_revision = "20261029_01"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
      INSERT INTO public.produtos (nome,codigo,peso,volume,setor_id)
      SELECT modelo,NULL,NULL,NULL,4
      FROM (VALUES ('14X1000 DT'),('15X1000 DT')) AS novos(modelo)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.produtos p
        WHERE p.setor_id=4 AND upper(p.nome)=upper(novos.modelo)
      );
      INSERT INTO public.mapeamento_forma_postes
        (codigo_forma,poste_circular,volume_m3,setor_id,ativo)
      SELECT 'DT15',modelo,NULL,4,true
      FROM (VALUES ('14X1000'),('15X1000')) AS novos(modelo)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.mapeamento_forma_postes m
        WHERE m.setor_id=4 AND m.codigo_forma='DT15' AND m.poste_circular=novos.modelo
      );
    """)


def downgrade():
    # Reverting production catalog additions could invalidate existing schedules.
    raise RuntimeError("Export DT15 schedules before removing these catalog rows")

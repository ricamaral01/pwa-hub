"""Move future DT15 scheduling from sector 4 to sector 3.

Revision ID: 20261105_01
Revises: 20261103_01
"""
from alembic import op

revision = "20261105_01"
down_revision = "20261103_01"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM public.programacoes_circular_s4 s4
          JOIN public.programacoes_circular_s3 s3
            ON s3.data=s4.data AND s3.codigo_forma=s4.codigo_forma
          WHERE s4.codigo_forma='DT15' AND s4.data>=CURRENT_DATE
            AND s3.modelo IS DISTINCT FROM s4.modelo
        ) THEN
          RAISE EXCEPTION 'DT15 has conflicting future schedules in sectors 3 and 4';
        END IF;
      END $$;
      INSERT INTO public.programacoes_circular_s3
        (data,codigo_forma,modelo,produto_id,codigo_produto,peso_kg,volume_m3_unitario,origem,criado_em,atualizado_em)
      SELECT data,codigo_forma,modelo,produto_id,codigo_produto,peso_kg,volume_m3_unitario,origem,criado_em,atualizado_em
      FROM public.programacoes_circular_s4
      WHERE codigo_forma='DT15' AND data>=CURRENT_DATE
      ON CONFLICT (data,codigo_forma) DO NOTHING;
      DELETE FROM public.programacoes_circular_s4 s4
      WHERE s4.codigo_forma='DT15' AND s4.data>=CURRENT_DATE
        AND EXISTS (SELECT 1 FROM public.programacoes_circular_s3 s3
                    WHERE s3.data=s4.data AND s3.codigo_forma=s4.codigo_forma
                      AND s3.modelo=s4.modelo);
      UPDATE public.mapeamento_forma_postes
      SET setor_id=3
      WHERE setor_id=4 AND codigo_forma='DT15' AND ativo;
      UPDATE public.programacoes
      SET setor_id=3
      WHERE setor_id=4 AND codigo_forma='DT15' AND data>=CURRENT_DATE;
    """)


def downgrade():
    op.execute("""
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM public.programacoes_circular_s3 s3
          JOIN public.programacoes_circular_s4 s4
            ON s4.data=s3.data AND s4.codigo_forma=s3.codigo_forma
          WHERE s3.codigo_forma='DT15' AND s3.data>=CURRENT_DATE
            AND s4.modelo IS DISTINCT FROM s3.modelo
        ) THEN
          RAISE EXCEPTION 'DT15 has conflicting future schedules in sectors 3 and 4';
        END IF;
      END $$;
      INSERT INTO public.programacoes_circular_s4
        (data,codigo_forma,modelo,produto_id,codigo_produto,peso_kg,volume_m3_unitario,origem,criado_em,atualizado_em)
      SELECT data,codigo_forma,modelo,produto_id,codigo_produto,peso_kg,volume_m3_unitario,origem,criado_em,atualizado_em
      FROM public.programacoes_circular_s3
      WHERE codigo_forma='DT15' AND data>=CURRENT_DATE
      ON CONFLICT (data,codigo_forma) DO NOTHING;
      DELETE FROM public.programacoes_circular_s3 s3
      WHERE s3.codigo_forma='DT15' AND s3.data>=CURRENT_DATE
        AND EXISTS (SELECT 1 FROM public.programacoes_circular_s4 s4
                    WHERE s4.data=s3.data AND s4.codigo_forma=s3.codigo_forma
                      AND s4.modelo=s3.modelo);
      UPDATE public.mapeamento_forma_postes
      SET setor_id=4
      WHERE setor_id=3 AND codigo_forma='DT15' AND ativo;
      UPDATE public.programacoes
      SET setor_id=4
      WHERE setor_id=3 AND codigo_forma='DT15' AND data>=CURRENT_DATE;
    """)

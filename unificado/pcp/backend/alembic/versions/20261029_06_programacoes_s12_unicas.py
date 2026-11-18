"""Consolidate repeated official S1/S2 rows and enforce one row per cell.

Approved rule: keep the row with the greatest id. The 55 removed rows are
copied into a table that downgrade uses to restore them exactly.

Revision ID: 20261029_06
Revises: 20261029_05
"""
from alembic import op

revision = "20261029_06"
down_revision = "20261029_05"
branch_labels = None
depends_on = None

BACKUP = "public.programacoes_consolidacao_backup_20261029"
INDEX = "uq_programacoes_s12_dia_setor_produto_sem_forma"


def upgrade():
    op.execute("LOCK TABLE public.programacoes IN SHARE ROW EXCLUSIVE MODE")
    op.execute("""
      DO $$
      DECLARE groups_count integer; excess_count integer;
      BEGIN
        WITH duplicates AS (
          SELECT COUNT(*) AS n FROM public.programacoes
          WHERE setor_id IN (1,2) AND codigo_forma IS NULL
          GROUP BY data,setor_id,produto_id HAVING COUNT(*)>1
        )
        SELECT COUNT(*),COALESCE(SUM(n-1),0)
          INTO groups_count,excess_count FROM duplicates;
        IF groups_count <> 54 OR excess_count <> 55 THEN
          RAISE EXCEPTION 'Duplicidades mudaram: % grupos, % linhas; revisar',
            groups_count,excess_count;
        END IF;
        IF EXISTS (
          WITH ranked AS (
            SELECT id,ROW_NUMBER() OVER (
              PARTITION BY data,setor_id,produto_id ORDER BY id DESC) AS rn
            FROM public.programacoes
            WHERE setor_id IN (1,2) AND codigo_forma IS NULL
          )
          SELECT 1 FROM public.apontamentos_mega a
          JOIN ranked r ON r.id=a.programacao_id WHERE r.rn>1
        ) THEN
          RAISE EXCEPTION 'Há apontamentos vinculados a linhas antigas; revisar';
        END IF;
      END $$
    """)
    op.execute(f"""
      CREATE TABLE {BACKUP} AS
      WITH ranked AS (
        SELECT p.id,ROW_NUMBER() OVER (
          PARTITION BY data,setor_id,produto_id ORDER BY id DESC) AS rn
        FROM public.programacoes p
        WHERE setor_id IN (1,2) AND codigo_forma IS NULL
      )
      SELECT p.* FROM public.programacoes p JOIN ranked r ON r.id=p.id
      WHERE r.rn>1
    """)
    op.execute(f"""
      DO $$ DECLARE removed integer;
      BEGIN
        DELETE FROM public.programacoes p
        USING {BACKUP} b WHERE p.id=b.id;
        GET DIAGNOSTICS removed = ROW_COUNT;
        IF removed <> 55 THEN
          RAISE EXCEPTION 'Remoção divergente: % linhas; rollback automático',removed;
        END IF;
      END $$
    """)
    op.execute(f"""
      CREATE UNIQUE INDEX {INDEX}
      ON public.programacoes(data,setor_id,produto_id)
      WHERE setor_id IN (1,2) AND codigo_forma IS NULL
    """)


def downgrade():
    op.execute("LOCK TABLE public.programacoes IN SHARE ROW EXCLUSIVE MODE")
    op.execute(f"DROP INDEX public.{INDEX}")
    op.execute(f"""
      DO $$ DECLARE restored integer;
      BEGIN
        IF (SELECT COUNT(*) FROM {BACKUP}) <> 55 THEN
          RAISE EXCEPTION 'Cópia de consolidação incompleta; não restaurar';
        END IF;
        IF EXISTS (
          SELECT 1 FROM {BACKUP} b
          JOIN public.programacoes p ON p.id=b.id
        ) THEN
          RAISE EXCEPTION 'IDs da cópia já existem; não restaurar';
        END IF;
        INSERT INTO public.programacoes
          (id,data,setor_id,forma_id,quantidade_programada,
           volume_m3_programado,produto_id,codigo_forma,
           programacao_semana_id,programacao_semana_versao)
        SELECT id,data,setor_id,forma_id,quantidade_programada,
               volume_m3_programado,produto_id,codigo_forma,
               programacao_semana_id,programacao_semana_versao
        FROM {BACKUP};
        GET DIAGNOSTICS restored = ROW_COUNT;
        IF restored <> 55 THEN
          RAISE EXCEPTION 'Restauração divergente: % linhas; rollback automático',restored;
        END IF;
      END $$
    """)
    op.execute(f"DROP TABLE {BACKUP}")

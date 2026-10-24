"""Bind production users to units and reuse existing labor activities.

Revision ID: 20261023_02
Revises: 20261023_01
"""
from alembic import op

revision = "20261023_02"
down_revision = "20261023_01"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
      CREATE TABLE producao.usuario_unidade (
        usuario_id integer NOT NULL REFERENCES public.usuarios(id),
        unidade_id smallint NOT NULL REFERENCES producao.unidade(id),
        papel varchar(20) NOT NULL CHECK (papel IN ('gestor','supervisor','leitor')),
        ativo boolean NOT NULL DEFAULT true,
        PRIMARY KEY (usuario_id, unidade_id)
      )
    """)
    op.execute("""
      CREATE UNIQUE INDEX uq_producao_gestor_unidade
      ON producao.usuario_unidade(unidade_id)
      WHERE papel='gestor' AND ativo
    """)
    op.execute("""
      ALTER TABLE public.maodeobra ADD COLUMN observacao text;
      CREATE INDEX ix_atividade_mo_unidade ON public.atividades_mao_de_obra(unidade_id);
      CREATE INDEX ix_maodeobra_dias_unidade_data ON public.maodeobra_dias(unidade_id,data);
      CREATE INDEX ix_maodeobra_unidade_data ON public.maodeobra(unidade_id,data)
    """)
    # Campinas remains implicit to legacy readers. New unit-aware writers must
    # filter both activity and day by unidade_id.


def downgrade():
    op.execute("""
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM producao.usuario_unidade) OR
           EXISTS (SELECT 1 FROM public.maodeobra WHERE observacao IS NOT NULL) THEN
          RAISE EXCEPTION 'Unit grants or labor notes exist; export before downgrade';
        END IF;
      END $$
    """)
    op.execute("DROP INDEX public.ix_maodeobra_unidade_data")
    op.execute("DROP INDEX public.ix_maodeobra_dias_unidade_data")
    op.execute("DROP INDEX public.ix_atividade_mo_unidade")
    op.execute("ALTER TABLE public.maodeobra DROP COLUMN observacao")
    op.execute("DROP TABLE producao.usuario_unidade")

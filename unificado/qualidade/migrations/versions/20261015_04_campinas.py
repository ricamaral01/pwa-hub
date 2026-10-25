"""Register Campinas for the three legacy RNCs, as approved on 15 October.

Revision ID: 20261015_04
Revises: 20261015_03
"""
from alembic import op

revision = "20261015_04"
down_revision = "20261015_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE qualidade.unidade DROP CONSTRAINT unidade_codigo_check;
        ALTER TABLE qualidade.unidade ADD CONSTRAINT unidade_codigo_check
        CHECK (codigo IN ('pederneiras', 'ribeirao', 'noroeste', 'campinas'));
    """)
    op.execute("""
        INSERT INTO qualidade.unidade(codigo, empresa_id, nome, criado_por)
        SELECT 'campinas', id, 'Campinas', 'migration:C1-Ricardo'
          FROM qualidade.empresa WHERE codigo = 'CONCRETRACK'
        ON CONFLICT (codigo) DO NOTHING
    """)
    op.execute("""
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM qualidade.unidade u
            JOIN qualidade.empresa e ON e.id = u.empresa_id
            WHERE u.codigo = 'campinas' AND u.nome = 'Campinas'
              AND e.codigo = 'CONCRETRACK' AND u.ativo
          ) THEN
            RAISE EXCEPTION 'Campinas unit was not registered for ConcreTrack';
          END IF;
        END $$;
    """)


def downgrade() -> None:
    # Keep the reference key and any NCs that may later use it.
    pass

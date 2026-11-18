"""Allow unit operators to enter production without supervisor authority.

Revision ID: 20261024_01
Revises: 20261023_03
"""
from alembic import op

revision = '20261024_01'
down_revision = '20261023_03'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE producao.usuario_unidade DROP CONSTRAINT usuario_unidade_papel_check")
    op.execute("""ALTER TABLE producao.usuario_unidade ADD CONSTRAINT usuario_unidade_papel_check
                CHECK (papel IN ('gestor','supervisor','operador','leitor'))""")


def downgrade():
    op.execute("""DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM producao.usuario_unidade WHERE papel='operador') THEN
            RAISE EXCEPTION 'Operator grants must be removed before downgrade';
        END IF;
    END $$""")
    op.execute("ALTER TABLE producao.usuario_unidade DROP CONSTRAINT usuario_unidade_papel_check")
    op.execute("""ALTER TABLE producao.usuario_unidade ADD CONSTRAINT usuario_unidade_papel_check
                CHECK (papel IN ('gestor','supervisor','leitor'))""")

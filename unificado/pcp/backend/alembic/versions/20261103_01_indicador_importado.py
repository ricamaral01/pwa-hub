"""Imported daily indicator totals and an optional own weight for unit products.

Revision ID: 20261103_01
Revises: 20261029_07
"""
from alembic import op

revision = "20261103_01"
down_revision = "20261029_07"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
      ALTER TABLE producao.produto ADD COLUMN peso_kg numeric(10,2)
        CONSTRAINT ck_produto_peso CHECK (peso_kg IS NULL OR peso_kg >= 0);
      CREATE TABLE producao.indicador_importado (
        unidade_id smallint NOT NULL REFERENCES producao.unidade(id),
        data date NOT NULL,
        postes integer NOT NULL CHECK (postes >= 0),
        homens numeric(8,2) NOT NULL CHECK (homens >= 0),
        peso_kg numeric(12,2) CHECK (peso_kg IS NULL OR peso_kg >= 0),
        fonte varchar(255) NOT NULL,
        sha256 char(64),
        importado_em timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (unidade_id, data)
      );
      GRANT SELECT,INSERT,UPDATE,DELETE ON producao.indicador_importado TO pcp_unificado_app;
    """)


def downgrade():
    op.execute("""
      DROP TABLE producao.indicador_importado;
      ALTER TABLE producao.produto DROP COLUMN peso_kg;
    """)

"""Add immutable trace snapshots and material impact records.

Revision ID: 20261018_02
Revises: 20261017_01
"""
from alembic import op

revision = "20261018_02"
down_revision = "20261017_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""CREATE TABLE IF NOT EXISTS material_versoes (
        id BIGSERIAL PRIMARY KEY, material_id VARCHAR(120) NOT NULL, versao INTEGER NOT NULL,
        propriedades JSONB NOT NULL, criado_em TIMESTAMPTZ NOT NULL DEFAULT now())""")
    op.execute("CREATE INDEX IF NOT EXISTS ix_material_versoes_material_id ON material_versoes (material_id)")
    op.execute("""CREATE TABLE IF NOT EXISTS traco_versoes (
        chave VARCHAR(240) PRIMARY KEY, traco_id VARCHAR(120) NOT NULL, versao INTEGER NOT NULL,
        unidade VARCHAR(100) NOT NULL, estado VARCHAR(32) NOT NULL, documento JSONB NOT NULL,
        snapshot JSONB NOT NULL, resultado JSONB NOT NULL, criado_em TIMESTAMPTZ NOT NULL DEFAULT now())""")
    op.execute("CREATE INDEX IF NOT EXISTS ix_traco_versoes_traco_id ON traco_versoes (traco_id)")
    op.execute("""CREATE TABLE IF NOT EXISTS avaliacoes_impacto (
        id BIGSERIAL PRIMARY KEY, traco_versao_chave VARCHAR(240) NOT NULL REFERENCES traco_versoes(chave),
        material_id VARCHAR(120) NOT NULL, classificacao VARCHAR(40) NOT NULL,
        estado VARCHAR(32) NOT NULL DEFAULT 'pendente', diferencas JSONB NOT NULL,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT now())""")
    op.execute("CREATE INDEX IF NOT EXISTS ix_avaliacoes_impacto_traco_versao_chave ON avaliacoes_impacto (traco_versao_chave)")
    op.execute("""CREATE OR REPLACE FUNCTION ctdosagem_versao_imutavel() RETURNS trigger
        LANGUAGE plpgsql AS $function$
        BEGIN
          IF OLD.estado = 'aprovado' THEN
            RAISE EXCEPTION 'versão aprovada imutável';
          END IF;
          RETURN NEW;
        END
        $function$""")
    op.execute("""CREATE TRIGGER ctdosagem_versao_imutavel_trg
        BEFORE UPDATE OR DELETE ON traco_versoes
        FOR EACH ROW EXECUTE FUNCTION ctdosagem_versao_imutavel()""")


def downgrade() -> None:
    raise RuntimeError("Contract migration only in a separate, manually approved release")

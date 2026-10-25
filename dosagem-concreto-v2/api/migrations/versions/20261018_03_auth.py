"""Add isolated, opaque login tickets and sessions.

Revision ID: 20261018_03
Revises: 20261018_02
"""
from alembic import op

revision = "20261018_03"
down_revision = "20261018_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""CREATE TABLE auth_flows (
        estado_hash VARCHAR(64) PRIMARY KEY, challenge VARCHAR(64) NOT NULL,
        expira_em TIMESTAMPTZ NOT NULL, consumido BOOLEAN NOT NULL DEFAULT false)""")
    op.execute("""CREATE TABLE auth_tickets (
        ticket_hash VARCHAR(64) PRIMARY KEY, estado_hash VARCHAR(64) NOT NULL,
        email VARCHAR(320) NOT NULL, expira_em TIMESTAMPTZ NOT NULL,
        consumido BOOLEAN NOT NULL DEFAULT false)""")
    op.execute("""CREATE TABLE auth_sessions (
        sessao_hash VARCHAR(64) PRIMARY KEY, email VARCHAR(320) NOT NULL REFERENCES usuarios(email),
        expira_em TIMESTAMPTZ NOT NULL, persistente BOOLEAN NOT NULL DEFAULT false)""")
    op.execute("CREATE INDEX ix_auth_sessions_email ON auth_sessions (email)")
    op.execute("""CREATE TABLE local_credenciais (
        email VARCHAR(320) PRIMARY KEY REFERENCES usuarios(email), senha_hash TEXT NOT NULL,
        falhas INTEGER NOT NULL DEFAULT 0, bloqueado_ate TIMESTAMPTZ,
        trocar_senha BOOLEAN NOT NULL DEFAULT true)""")


def downgrade() -> None:
    raise RuntimeError("Contract migration only in a separate, manually approved release")

#!/usr/bin/env bash
set -euo pipefail
set -a
. /etc/mapa-unificado/auth.env
set +a
auth_dsn="${MAPA_AUTH_DATABASE_URL/postgresql+psycopg:/postgresql:}"
psql "$auth_dsn" -At -c "SELECT id,ativo,primeiro_acesso,deleted_at IS NULL FROM public.usuarios WHERE id IN ('user-ricardo','marcelo','alex') ORDER BY id"

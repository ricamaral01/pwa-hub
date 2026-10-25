#!/usr/bin/env bash
set -euo pipefail

role=tv_prod_reader
if ! id "$role" >/dev/null 2>&1; then
  sudo useradd --system --no-create-home --shell /usr/sbin/nologin "$role"
fi
if ! sudo -u postgres psql -XAt -d postgres -c "SELECT 1 FROM pg_roles WHERE rolname='$role'" | grep -qx 1; then
  sudo -u postgres createuser --login --no-superuser --no-createdb --no-createrole "$role"
fi
sudo -u postgres psql -X -v ON_ERROR_STOP=1 -d mapa_unificado_teste <<SQL
GRANT CONNECT ON DATABASE mapa_unificado_teste TO $role;
GRANT USAGE ON SCHEMA public TO $role;
GRANT SELECT ON public.programacao_pcp,public.liberacao_formas,public.producao TO $role;
ALTER ROLE $role SET default_transaction_read_only = on;
SQL
sudo -u postgres psql -X -v ON_ERROR_STOP=1 -d pcp_unificado_teste <<SQL
GRANT CONNECT ON DATABASE pcp_unificado_teste TO $role;
GRANT USAGE ON SCHEMA public TO $role;
GRANT SELECT ON public.mapeamento_formas,public.mapeamento_forma_postes,
                public.produtos,public.programacoes,
                public.programacoes_circular_s3,public.programacoes_circular_s4 TO $role;
SQL
for db in mapa_unificado_teste pcp_unificado_teste; do
  sudo -u "$role" psql -XAt -d "$db" -c "SELECT current_user, current_setting('default_transaction_read_only')"
done

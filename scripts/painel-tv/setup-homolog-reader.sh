#!/usr/bin/env bash
set -euo pipefail

role=tv_homolog_reader
if ! id "$role" >/dev/null 2>&1; then
  sudo useradd --system --no-create-home --shell /usr/sbin/nologin "$role"
fi
if ! sudo -u postgres psql -XAt -d postgres -c "SELECT 1 FROM pg_roles WHERE rolname='$role'" | grep -qx 1; then
  sudo -u postgres createuser --login --no-superuser --no-createdb --no-createrole "$role"
fi
for db in mapa_unificado_homolog_20261016 pcp_unificado_homolog_20261016; do
  sudo -u postgres psql -X -v ON_ERROR_STOP=1 -d "$db" <<SQL
GRANT CONNECT ON DATABASE $db TO $role;
GRANT USAGE ON SCHEMA public TO $role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO $role;
ALTER ROLE $role SET default_transaction_read_only = on;
SQL
done
for db in mapa_unificado_homolog_20261016 pcp_unificado_homolog_20261016; do
  sudo -u "$role" psql -XAt -d "$db" -c "SELECT current_user, current_setting('default_transaction_read_only')"
done

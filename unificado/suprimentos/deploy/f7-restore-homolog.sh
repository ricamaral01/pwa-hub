#!/usr/bin/env bash
set -euo pipefail
base=/opt/concrefer-unificado/homolog-next
dump="$base/backups/suprimentos-f6-manual-reinstall-20261026T064000Z/suprimentos-before.dump"
test -s "$dump"
db="sup_f7_restore_$(date +%s)"
tmp="/tmp/${db}.dump"
cleanup() { runuser -u postgres -- dropdb --if-exists "$db" >/dev/null 2>&1 || :; rm -f "$tmp"; }
trap cleanup EXIT
runuser -u postgres -- createdb -T template0 "$db"
install -o postgres -g postgres -m 0600 "$dump" "$tmp"
runuser -u postgres -- pg_restore --no-owner --no-acl --dbname="$db" "$tmp"
runuser -u postgres -- psql -At -d "$db" -c "SELECT 'F7_RESTORE_OK', (SELECT version_num FROM alembic_version), (SELECT count(*) FROM suprimentos.sup_unidade), (SELECT count(*) FROM suprimentos.sup_solicitacao), (SELECT count(*) FROM suprimentos.sup_pedido), (SELECT count(*) FROM suprimentos.sup_flag);"

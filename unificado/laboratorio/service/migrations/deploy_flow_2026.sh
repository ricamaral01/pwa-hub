#!/usr/bin/env bash
set -euo pipefail

stage=/tmp/flow-release-20261026
target=/opt/concrefer-unificado/laboratorio/service/server
backup=/opt/concrefer-unificado/backups/flow-20261026-$(date -u +%H%M%S)

test -d "$stage"
test -f "$stage/flow_seed_2026.sql"
test -f "$stage/flow_colaborador_2026.psql"
mkdir -m 700 -p "$backup"
cp -a "$target/slump_api.py" "$target/static/slump/index.html" "$target/static/slump/slump.css" "$backup/"
cp -a "$stage/flow_seed_2026.sql" "$stage/flow_simulado.psql" "$stage/flow_colaborador_2026.psql" "$backup/"

# The new table is additive. Run SQL as the PostgreSQL superuser and hand its
# ownership to the same application role that owns slump_registro.
cat "$stage/flow_simulado.psql" | sudo -u postgres psql -v ON_ERROR_STOP=1 -q -d concretrack_postes
cat "$stage/flow_colaborador_2026.psql" | sudo -u postgres psql -v ON_ERROR_STOP=1 -q -d concretrack_postes
cat "$stage/flow_seed_2026.sql" | sudo -u postgres psql -v ON_ERROR_STOP=1 -qAt -d concretrack_postes

install -m 644 "$stage/slump_api.py" "$target/slump_api.py"
for name in index.html slump.css flow.html flow.css flow.js concrefer-logo.png; do
  install -m 644 "$stage/$name" "$target/static/slump/$name"
done

if ! systemctl restart laboratorio-unificado.service || ! systemctl is-active --quiet laboratorio-unificado.service; then
  install -m 644 "$backup/slump_api.py" "$target/slump_api.py"
  install -m 644 "$backup/index.html" "$target/static/slump/index.html"
  install -m 644 "$backup/slump.css" "$target/static/slump/slump.css"
  systemctl restart laboratorio-unificado.service
  echo "Service restart failed; original files restored. Simulated table remains isolated." >&2
  exit 1
fi
echo "backup=$backup"

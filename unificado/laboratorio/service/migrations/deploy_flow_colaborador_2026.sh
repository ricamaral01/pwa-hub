#!/usr/bin/env bash
set -euo pipefail

stage=/tmp/flow-colaborador-20261026
target=/opt/concrefer-unificado/laboratorio/service/server
backup=/opt/concrefer-unificado/backups/flow-colaborador-20261026-$(date -u +%H%M%S)

test -f "$stage/flow_colaborador_2026.psql"
mkdir -p -m 700 "$backup"
cp -a "$target/slump_api.py" "$target/static/slump/flow.html" "$target/static/slump/flow.js" "$backup/"
sudo -u postgres pg_dump -Fc -d concretrack_postes -t ensaio_postes.flow_simulado > "$backup/flow_simulado.dump"
pg_restore --list "$backup/flow_simulado.dump" > "$backup/flow_simulado.list"
cat "$stage/flow_colaborador_2026.psql" | sudo -u postgres psql -v ON_ERROR_STOP=1 -q -d concretrack_postes

install -m 644 "$stage/slump_api.py" "$target/slump_api.py"
install -m 644 "$stage/flow.html" "$target/static/slump/flow.html"
install -m 644 "$stage/flow.js" "$target/static/slump/flow.js"
if ! systemctl restart laboratorio-unificado.service || ! systemctl is-active --quiet laboratorio-unificado.service; then
  install -m 644 "$backup/slump_api.py" "$target/slump_api.py"
  install -m 644 "$backup/flow.html" "$target/static/slump/flow.html"
  install -m 644 "$backup/flow.js" "$target/static/slump/flow.js"
  systemctl restart laboratorio-unificado.service
  echo "Service restart failed; original files restored. Database backup: $backup/flow_simulado.dump" >&2
  exit 1
fi
echo "backup=$backup"

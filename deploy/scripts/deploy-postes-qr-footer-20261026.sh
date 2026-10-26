#!/usr/bin/env bash
set -Eeuo pipefail

payload="$(realpath -e -- "${1:?report source file}")"
root=/opt/concrefer-unificado/laboratorio/service/server
target="$root/postes_report_v2.py"
service=laboratorio-unificado.service
backup="/opt/concrefer-unificado/backups/postes-qr-footer-production-$(date -u +%Y%m%dT%H%M%SZ)"

python3 - "$payload" <<'PY'
from pathlib import Path
import sys
source = Path(sys.argv[1])
data = source.read_bytes()
compile(data, str(source), 'exec')
assert b'<footer>{qr}<div>' in data
assert b'</header>{qr}' not in data
PY

mkdir -m 0700 -p -- "$backup"
cp -a -- "$target" "$backup/postes_report_v2.py"

rollback() {
  status=$?
  if (( status != 0 )); then
    cp -a -- "$backup/postes_report_v2.py" "$target"
    systemctl restart "$service"
    echo "ROLLED_BACK=$backup" >&2
  fi
  exit "$status"
}
trap rollback EXIT

install -o "$(stat -c %U "$target")" -g "$(stat -c %G "$target")" \
  -m "$(stat -c %a "$target")" -- "$payload" "$target"
systemctl restart "$service"
systemctl is-active --quiet "$service"
ready=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS http://127.0.0.1:13064/ >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
test "$ready" = 1
cmp -s -- "$payload" "$target"
trap - EXIT
echo "DEPLOY_OK=production"
echo "BACKUP_PATH=$backup"

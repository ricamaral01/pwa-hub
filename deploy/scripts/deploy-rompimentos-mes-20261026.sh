#!/usr/bin/env bash
set -Eeuo pipefail

payload="$(realpath -e -- "${1:?HTML payload}")"
target=/opt/concrefer-unificado/laboratorio/service/server/static/cec/rompimentos-mes/index.html
backup="/opt/concrefer-unificado/backups/rompimentos-mes-production-$(date -u +%Y%m%dT%H%M%SZ)"

grep -Fq 'match[1].slice(-2)' "$payload"
grep -Fq '.weekday{display:none!important}' "$payload"
mkdir -m 0700 -p -- "$backup"
cp -a -- "$target" "$backup/index.html"

rollback() {
  status=$?
  if (( status != 0 )); then
    cp -a -- "$backup/index.html" "$target"
    echo "ROLLED_BACK=$backup" >&2
  fi
  exit "$status"
}
trap rollback EXIT

install -o "$(stat -c %U "$target")" -g "$(stat -c %G "$target")" \
  -m "$(stat -c %a "$target")" -- "$payload" "$target"
cmp -s -- "$payload" "$target"
curl -fsS http://127.0.0.1:13064/cec/rompimentos-mes/ -o "$backup/check.html"
cmp -s -- "$payload" "$backup/check.html"
trap - EXIT
echo "DEPLOY_OK=production"
echo "BACKUP_PATH=$backup"

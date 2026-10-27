#!/usr/bin/env bash
set -Eeuo pipefail

html="$(realpath -e -- "${1:?HTML payload}")"
asset="$(realpath -e -- "${2:?JavaScript payload}")"
name=novo-stage-35a3eb7e06d5.js
root=/opt/concrefer-unificado/laboratorio/service/server/static/novo/postes
target="$root/novo.html"
target_asset="$root/assets/$name"
backup="/opt/concrefer-unificado/backups/postes-stage-advance-production-$(date -u +%Y%m%dT%H%M%SZ)"

test "$(basename "$asset")" = "$name"
test ! -e "$target_asset"
grep -Fq "$name" "$html"
node --check "$asset"
mkdir -m 0700 -p -- "$backup"
cp -a -- "$target" "$backup/novo.html"

rollback() {
  status=$?
  if (( status != 0 )); then
    cp -a -- "$backup/novo.html" "$target"
    rm -f -- "$target_asset"
    echo "ROLLED_BACK=$backup" >&2
  fi
  exit "$status"
}
trap rollback EXIT

install -o "$(stat -c %U "$target")" -g "$(stat -c %G "$target")" \
  -m "$(stat -c %a "$target")" -- "$asset" "$target_asset"
install -o "$(stat -c %U "$target")" -g "$(stat -c %G "$target")" \
  -m "$(stat -c %a "$target")" -- "$html" "$target"
cmp -s -- "$html" "$target"
cmp -s -- "$asset" "$target_asset"
curl -fsS http://127.0.0.1:13064/novo/postes -o "$backup/check.html"
grep -Fq "$name" "$backup/check.html"
curl -fsS "http://127.0.0.1:13064/novo/postes/assets/$name" -o "$backup/check.js"
cmp -s -- "$asset" "$backup/check.js"
trap - EXIT
echo "DEPLOY_OK=production"
echo "BACKUP_PATH=$backup"

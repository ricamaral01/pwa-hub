#!/usr/bin/env bash
# Rehearse the production copy procedure on the isolated :18446 tree.
set -euo pipefail

homolog=/opt/concrefer-unificado/homolog-next
public_root=$homolog/public/unificado
release=/root/maodeobra-prod-release-20261017
stage=/root/maodeobra-homolog-rehearsal-20261017/public/unificado
backup=/root/backups/maodeobra-homolog-rehearsal-20261017
snapshot=/root/backups/maodeobra-homolog-permissions-before-20261017.json

test -s "$backup/pcp.dump"
test -s "$backup/files-before.tgz"
test -s "$snapshot"
test -d "$public_root/m/maodeobra"
test -d "$stage"
sha256sum "$backup/files-before.tgz" > "$backup/files-before.sha256"

restore_on_error() {
  echo 'Rehearsal failed; restoring the :18446 files' >&2
  if test -d "$public_root/m/maodeobra"; then
    mv "$public_root/m/maodeobra" "$backup/failed-pwa"
  fi
  tar -C "$homolog" -xzf "$backup/files-before.tgz"
  systemctl restart unificado-homolog-pcp.service
}
trap restore_on_error ERR

for relative in \
  app/api/routers/pcp.py \
  app/models/producao.py \
  app/schemas/producao.py; do
  cmp "$release/backend/$relative" "$homolog/pcp-api/$relative"
  cp -- "$release/backend/$relative" "$homolog/pcp-api/$relative"
done
"$homolog/pcp-api/.venv-py310/bin/python" -m py_compile \
  "$homolog/pcp-api/app/api/routers/pcp.py" \
  "$homolog/pcp-api/app/models/producao.py" \
  "$homolog/pcp-api/app/schemas/producao.py"
systemctl restart unificado-homolog-pcp.service

# Start with no dedicated PWA or newly added shared/mobile assets.
mv "$public_root/m/maodeobra" "$backup/removed-pwa"
install -d -m 0700 "$backup/removed-assets"
for relative in \
  pcp/static/js/maodeobra-core.js \
  pcp/static/js/maodeobra-mobile.js \
  pcp/static/css/maodeobra-mobile.css; do
  mv "$public_root/$relative" "$backup/removed-assets/$(basename "$relative")"
done

python3 /root/install_maodeobra_public.py "$stage" "$public_root"
mv "$backup/removed-pwa/prototipo" "$public_root/m/maodeobra/prototipo"
python3 /root/snapshot_maodeobra_public_permissions.py "$public_root" --compare "$snapshot"

for relative in index.html login.html m/maodeobra/index.html; do
  sudo -u www-data test -r "$public_root/$relative"
done
for path in /unificado/ /unificado/login.html /unificado/m/maodeobra/; do
  status=$(curl -sk --resolve concrefer.concretrack.com.br:18446:127.0.0.1 \
    -o /dev/null -w '%{http_code}' "https://concrefer.concretrack.com.br:18446$path")
  echo "$path $status"
  test "$status" = 200
done
nginx -t
python3 - "$stage" "$public_root" <<'PY'
import hashlib
import sys
from pathlib import Path
source, target = map(Path, sys.argv[1:])
for item in source.rglob('*'):
    if item.is_file():
        relative = item.relative_to(source)
        digest = lambda path: hashlib.sha256(path.read_bytes()).digest()
        assert digest(item) == digest(target / relative), relative
print('17/17 staged file hashes match :18446')
PY
trap - ERR
echo 'Homolog rehearsal copy and access checks passed'

#!/usr/bin/env bash
# Run only after the approved window starts and backup_maodeobra_mobile_prod.sh succeeds.
set -euo pipefail

backup_dir=${1:?Usage: deploy_maodeobra_mobile_prod.sh /root/backups/maodeobra-prod-TIMESTAMP}
case "$backup_dir" in
  /root/backups/maodeobra-prod-*) ;;
  *) echo 'Unexpected backup directory' >&2; exit 2 ;;
esac
script_dir=$(cd -- "$(dirname -- "$0")" && pwd)
release=/root/maodeobra-prod-release-20261017
api_root=/opt/concrefer-unificado/pcp-api
public_root=/opt/concrefer-unificado/public/unificado
vhost=/etc/nginx/sites-enabled/concrefer.concretrack.com.br

test -s "$backup_dir/db/pcp.dump"
test -s "$backup_dir/files-before.tgz"
test -s "$backup_dir/public-permissions-before.json"
test -s "$backup_dir/nginx-before.conf"
sha256sum -c "$backup_dir/db/pcp.sha256"
sha256sum -c "$backup_dir/files-before.sha256"
sha256sum -c "$backup_dir/nginx-before.sha256"
test "$(sha256sum "$vhost" | cut -d ' ' -f 1)" = \
  b13987d1ab395d856173ac12ffc496c7b88bf2d006912e24fcbf0eca3ef3247e
test "$(sha256sum "$public_root/pcp/static/js/app.js" | cut -d ' ' -f 1)" = \
  60063664c199eee73646aef0598076ed9eb761ada1670a2513a78da5789edb24
test "$(sha256sum "$public_root/shell/auth.js" | cut -d ' ' -f 1)" = \
  3c50c89dd2a05711dae8c580064ab8af13133ff7e91c64ef45e04eaa1f5f78d3
test "$(sha256sum "$public_root/pcp/maodeobra/index.html" | cut -d ' ' -f 1)" = \
  c9e5acd4812468fe4b6fbe4b5d5ffb42ad8cefc7ac1ea591a2e28b00fbb68922
test "$(sha256sum "$api_root/app/api/routers/pcp.py" | cut -d ' ' -f 1)" = \
  62eeec087b0b9bc41c4dd0f667761ea253c268fc92696e9ac15b448f7da10f44
test "$(sha256sum "$api_root/app/models/producao.py" | cut -d ' ' -f 1)" = \
  ca1dfa84dcd6c6ef49e3b79e49d154b3a3a478718c16db96756aa6e6dcd0e12b
test "$(sha256sum "$api_root/app/schemas/producao.py" | cut -d ' ' -f 1)" = \
  e6b8c1ddd05bab322837ed33254ba13a72830424f99d9939806acf5425b6e39b

on_error() {
  code=$?
  trap - ERR
  echo "Release step failed ($code); restoring previous production files" >&2
  bash "$script_dir/rollback_maodeobra_mobile_prod.sh" "$backup_dir"
  exit "$code"
}
trap on_error ERR

cat "$release/migrations/20261017_maodeobra_mobile_metadata.psql" | \
  sudo -u postgres psql -X -v ON_ERROR_STOP=1 -d pcp_unificado_teste
cat "$release/migrations/20261017_maodeobra_confirmacao.psql" | \
  sudo -u postgres psql -X -v ON_ERROR_STOP=1 -d pcp_unificado_teste

cp -- "$release/backend/app/api/routers/pcp.py" "$api_root/app/api/routers/pcp.py"
cp -- "$release/backend/app/models/producao.py" "$api_root/app/models/producao.py"
cp -- "$release/backend/app/schemas/producao.py" "$api_root/app/schemas/producao.py"
"$api_root/.venv-py310/bin/python" -m py_compile \
  "$api_root/app/api/routers/pcp.py" \
  "$api_root/app/models/producao.py" \
  "$api_root/app/schemas/producao.py"
systemctl restart pcp-unificado-test.service
api_ready=no
for attempt in $(seq 1 15); do
  if curl -sf --max-time 5 http://127.0.0.1:13054/openapi.json -o /dev/null; then
    api_ready=yes
    break
  fi
  sleep 1
done
test "$api_ready" = yes

nginx -t
python3 "$script_dir/install_maodeobra_public.py" \
  "$release/public/unificado" "$public_root"
cp -- "$release/nginx/concrefer.concretrack.com.br" "$vhost"
nginx -t
systemctl reload nginx
python3 "$script_dir/verify_maodeobra_public_access.py" \
  "$public_root" "$backup_dir/public-permissions-before.json" 443

test "$(sha256sum "$public_root/sw.js" | cut -d ' ' -f 1)" = \
  d4ed2d481a2be53f756496d67ec2f4329002aa3d018ddaac9cb56f0a02d84ab4
test "$(sha256sum "$public_root/manifest.webmanifest" | cut -d ' ' -f 1)" = \
  a12ecab8decab78c29fb0a011b2b715623bcecb0e2eec6bfc07ca69b99789324

trap - ERR
echo 'Release files installed and access checks passed; run functional smoke and 7/7 gate now'

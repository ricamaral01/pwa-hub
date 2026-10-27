#!/usr/bin/env bash
set -euo pipefail

bundle=${1:-/tmp/ribeirao-deploy-20261027.tar.gz}
stage=$(mktemp -d /tmp/ribeirao-deploy.XXXXXX)
trap 'rm -rf -- "$stage"' EXIT
tar -xzf "$bundle" -C "$stage"

base=/opt/concrefer-unificado
public=$base/public/unificado
nginx_snippet=/etc/nginx/snippets/unificado-screen-access.conf
target=$public/producao/ribeirao
test ! -e "$target"
test -f "$stage/migration/deploy_migration.sql"
test -f "$stage/seed/seed_produtos_ribeirao.csv"
test -f "$stage/nginx/unificado-screen-access.conf"

python3 -m py_compile "$stage/pcp-api/app/api/routers/producao_unidade.py" \
  "$stage/pcp-api/app/services/pederneiras_rules.py" "$stage/mapa-api/screen_access.py" \
  "$stage/mapa-api/app.py"
python3 -m json.tool "$stage/mapa-api/screen_catalog.json" >/dev/null
nginx -t

backup=$base/backups/ribeirao-$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$backup"
tar -czf "$backup/runtime-files.tar.gz" -C / \
  opt/concrefer-unificado/pcp-api/app/api/routers/producao_unidade.py \
  opt/concrefer-unificado/pcp-api/app/services/pederneiras_rules.py \
  opt/concrefer-unificado/mapa-api/screen_access.py \
  opt/concrefer-unificado/mapa-api/screen_catalog.json \
  opt/concrefer-unificado/mapa-api/app.py \
  opt/concrefer-unificado/public/unificado/index.html \
  opt/concrefer-unificado/public/unificado/shell/menu.config.js \
  opt/concrefer-unificado/public/unificado/shell/navigation.js \
  opt/concrefer-unificado/public/unificado/shell/router.js \
  opt/concrefer-unificado/public/unificado/shell/shell.js \
  opt/concrefer-unificado/public/unificado/shell/modelo-a/menu.js \
  opt/concrefer-unificado/public/unificado/shell/modelo-a-loader.js \
  etc/nginx/snippets/unificado-screen-access.conf
sudo -u postgres pg_dump -Fc pcp_unificado_teste > "$backup/pcp_unificado_teste.dump"
test -s "$backup/pcp_unificado_teste.dump"
echo "Backup: $backup"

sudo -u postgres psql -d pcp_unificado_teste < "$stage/migration/deploy_migration.sql"
pcp_pid=$(systemctl show -p MainPID --value pcp-unificado-test.service)
DATABASE_URL=$(tr '\0' '\n' < "/proc/$pcp_pid/environ" | sed -n 's/^DATABASE_URL=//p')
test -n "$DATABASE_URL"
export DATABASE_URL
$base/pcp-api/.venv-py310/bin/python "$stage/seed/seed_ribeirao.py" \
  --apply --seed "$stage/seed/seed_produtos_ribeirao.csv"
unset DATABASE_URL

install -m 0644 "$stage/pcp-api/app/api/routers/producao_unidade.py" \
  "$base/pcp-api/app/api/routers/producao_unidade.py"
install -m 0644 "$stage/pcp-api/app/services/pederneiras_rules.py" \
  "$base/pcp-api/app/services/pederneiras_rules.py"
install -m 0644 "$stage/mapa-api/screen_access.py" "$base/mapa-api/screen_access.py"
install -m 0644 "$stage/mapa-api/screen_catalog.json" "$base/mapa-api/screen_catalog.json"
install -m 0644 "$stage/mapa-api/app.py" "$base/mapa-api/app.py"
install -m 0644 "$stage/public/unificado/index.html" "$public/index.html"
for file in menu.config.js navigation.js router.js shell.js; do
  install -m 0644 "$stage/public/unificado/shell/$file" "$public/shell/$file"
done
install -m 0644 "$stage/public/unificado/shell/modelo-a/menu.js" "$public/shell/modelo-a/menu.js"
install -m 0644 "$stage/public/unificado/shell/modelo-a-loader.js" "$public/shell/modelo-a-loader.js"
cp -a "$stage/public/unificado/producao/ribeirao" "$target"
chown -R root:root "$target"
find "$target" -type d -exec chmod 0755 {} +
find "$target" -type f -exec chmod 0644 {} +

install -m 0644 "$stage/nginx/unificado-screen-access.conf" "$nginx_snippet"
if ! nginx -t; then
  tar -xzf "$backup/runtime-files.tar.gz" -C / etc/nginx/snippets/unificado-screen-access.conf
  exit 1
fi

systemctl restart pcp-unificado-test.service
systemctl restart mapa-unificado-auth.service
systemctl reload nginx
systemctl is-active --quiet pcp-unificado-test.service
systemctl is-active --quiet mapa-unificado-auth.service
systemctl is-active --quiet nginx.service
echo 'Ribeirão deployed; services active.'

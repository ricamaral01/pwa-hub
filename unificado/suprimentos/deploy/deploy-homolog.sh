#!/usr/bin/env bash
# Executar somente na VPS nova e somente sobre homolog-next/:18446.
set -euo pipefail
action="${1:?install ou rollback}"
backup="${2:?diretório de backup obrigatório}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"
map="$base/mapa-api"
service="$base/suprimentos"
package=/tmp/suprimentos-e7-package/unificado/suprimentos
overlay=/tmp/suprimentos-e7-overlay
vhost=/etc/nginx/sites-available/unificado-homolog.conf
snippet=/etc/nginx/snippets/suprimentos-unificado-homolog.conf
map_dropin=/etc/systemd/system/unificado-homolog-mapa.service.d/suprimentos.conf
envdir=/etc/concrefer-unificado/homolog

test -f "$backup/files-before.tgz"
test -f "$backup/permissions-before.dump"
test -d "$base/public/unificado"
test "$(readlink -f "$vhost")" = /etc/nginx/sites-available/unificado-homolog.conf

rollback() {
    systemctl disable --now suprimentos-fechamento.timer suprimentos-homolog.service >/dev/null 2>&1 || true
    tar -C / -xzf "$backup/files-before.tgz" \
      etc/nginx/sites-available/unificado-homolog.conf \
      opt/concrefer-unificado/homolog-next/mapa-api/app.py \
      opt/concrefer-unificado/homolog-next/mapa-api/screen_access.py \
      opt/concrefer-unificado/homolog-next/mapa-api/screen_catalog.json \
      opt/concrefer-unificado/homolog-next/public/unificado/index.html \
      opt/concrefer-unificado/homolog-next/public/unificado/VERSION \
      opt/concrefer-unificado/homolog-next/public/unificado/sw.js \
      opt/concrefer-unificado/homolog-next/public/unificado/shell/menu.config.js \
      opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js \
      opt/concrefer-unificado/homolog-next/public/unificado/shell/router.js \
      opt/concrefer-unificado/homolog-next/public/unificado/shell/shared-menu.css \
      opt/concrefer-unificado/homolog-next/public/unificado/shell/modelo-a/menu.js \
      opt/concrefer-unificado/homolog-next/public/unificado/mapa/operacao/users-unificado.js
    if test -e "$snippet"; then mv "$snippet" "$backup/snippet-rolled-back-$(date -u +%s)"; fi
    if test -e "$map_dropin"; then mv "$map_dropin" "$backup/map-dropin-rolled-back-$(date -u +%s)"; fi
    if test -d "$public/suprimentos"; then
        mv "$public/suprimentos" "$service/public-rolled-back-$(date -u +%s)"
    fi
    systemctl daemon-reload
    systemctl restart unificado-homolog-mapa.service
    nginx -t
    systemctl reload nginx
    echo "ROLLBACK_OK $backup"
}

if test "$action" = rollback; then
    rollback
    exit 0
fi
test "$action" = install
test -f "$overlay/app.py"
test -f "$package/service/requirements.txt"
trap 'echo "INSTALL_FAILED: iniciando retorno" >&2; rollback' ERR

if ! id -u concrefer-suprimentos >/dev/null 2>&1; then
    useradd --system --no-create-home --shell /usr/sbin/nologin concrefer-suprimentos
fi
install -d -o root -g root -m 0755 "$service" "$service/service" "$service/migrations"
install -d -o concrefer-suprimentos -g concrefer-suprimentos -m 0700 "$service/data" "$service/data/photos"
cp -a "$package/service/." "$service/service/"
cp -a "$package/migrations/." "$service/migrations/"
find "$service/service" "$service/migrations" -type d -exec chmod 0755 {} +
find "$service/service" "$service/migrations" -type f -exec chmod 0644 {} +
chown -R root:root "$service/service" "$service/migrations"
if ! test -x "$service/venv/bin/python"; then
    python3 -m venv "$service/venv"
fi
"$service/venv/bin/pip" -q install -r "$service/service/requirements.txt"

db_name=suprimentos_homolog_20261025
db_role=concrefer_suprimentos_homolog
if ! test -f "$envdir/suprimentos.env"; then
    db_password=$(openssl rand -hex 24)
    signing_key=$(openssl rand -hex 32)
    if ! runuser -u postgres -- psql -Atqc "SELECT 1 FROM pg_roles WHERE rolname='$db_role'" | grep -qx 1; then
        runuser -u postgres -- psql -v ON_ERROR_STOP=1 >/dev/null <<SQL
CREATE ROLE $db_role LOGIN PASSWORD '$db_password';
SQL
    else
        runuser -u postgres -- psql -v ON_ERROR_STOP=1 >/dev/null <<SQL
ALTER ROLE $db_role PASSWORD '$db_password';
SQL
    fi
    if ! runuser -u postgres -- psql -Atqc "SELECT 1 FROM pg_database WHERE datname='$db_name'" | grep -qx 1; then
        runuser -u postgres -- createdb -O "$db_role" "$db_name"
    fi
    umask 077
    cat > "$envdir/suprimentos.env" <<EOF
SUPRIMENTOS_DATABASE_URL=postgresql+psycopg://$db_role:$db_password@127.0.0.1:5432/$db_name
SUPRIMENTOS_EXPECTED_DATABASE=$db_name
SUPRIMENTOS_MIGRATION_DATABASE_URL=postgresql+psycopg://$db_role:$db_password@127.0.0.1:5432/$db_name
SUPRIMENTOS_ENVIRONMENT=homolog
SUPRIMENTOS_UPLOAD_DIR=$service/data/photos
SUPRIMENTOS_PUBLIC_DIR=$base/public
SUPRIMENTOS_GATEWAY_SIGNING_KEY=$signing_key
EOF
    cat > "$envdir/suprimentos-gateway.env" <<EOF
SUPRIMENTOS_GATEWAY_SIGNING_KEY=$signing_key
SUPRIMENTOS_INTERNAL_URL=http://127.0.0.1:13167
EOF
    chmod 0600 "$envdir/suprimentos.env" "$envdir/suprimentos-gateway.env"
fi

set -a
. "$envdir/suprimentos.env"
set +a
(cd "$service" && "$service/venv/bin/alembic" -c migrations/alembic.ini upgrade head)

install -d -o root -g root -m 0755 "$public/suprimentos"
for folder in frontend painel solicitacoes solicitacao nova fornecedores cadastros pwa; do
    install -d -o root -g root -m 0755 "$public/suprimentos/$folder"
    cp -a "$package/$folder/." "$public/suprimentos/$folder/"
done
find "$public/suprimentos" -type d -exec chmod 0755 {} +
find "$public/suprimentos" -type f -exec chmod 0644 {} +
chown -R root:root "$public/suprimentos"

install -m 0644 "$overlay/app.py" "$map/app.py"
install -m 0644 "$overlay/screen_access.py" "$map/screen_access.py"
install -m 0644 "$overlay/screen_catalog.json" "$map/screen_catalog.json"
install -m 0644 "$overlay/index.html" "$public/index.html"
install -m 0644 "$overlay/VERSION" "$public/VERSION"
install -m 0644 "$overlay/sw.js" "$public/sw.js"
install -m 0644 "$overlay/menu.config.js" "$public/shell/menu.config.js"
install -m 0644 "$overlay/shell.js" "$public/shell/shell.js"
install -m 0644 "$overlay/router.js" "$public/shell/router.js"
install -m 0644 "$overlay/shared-menu.css" "$public/shell/shared-menu.css"
install -m 0644 "$overlay/menu.js" "$public/shell/modelo-a/menu.js"
install -m 0644 "$overlay/users-unificado.js" "$public/mapa/operacao/users-unificado.js"

install -m 0644 "$package/deploy/suprimentos-homolog.nginx.conf" "$snippet"
install -d -m 0755 /etc/systemd/system/unificado-homolog-mapa.service.d
printf '[Service]\nEnvironmentFile=%s/suprimentos-gateway.env\n' "$envdir" > "$map_dropin"
chmod 0644 "$map_dropin"
install -m 0644 "$package/deploy/suprimentos-homolog.service" /etc/systemd/system/suprimentos-homolog.service
install -m 0644 "$package/deploy/suprimentos-fechamento.service" /etc/systemd/system/suprimentos-fechamento.service
install -m 0644 "$package/deploy/suprimentos-fechamento.timer" /etc/systemd/system/suprimentos-fechamento.timer

python3 - "$vhost" <<'PY'
from pathlib import Path
import sys
path=Path(sys.argv[1]); text=path.read_text()
include='    include /etc/nginx/snippets/suprimentos-unificado-homolog.conf;\n'
if include not in text:
    anchor='    include /etc/nginx/snippets/unificado-screen-access-homolog.conf;\n'
    if text.count(anchor)!=1: raise RuntimeError('Âncora de nginx mudou')
    path.write_text(text.replace(anchor,anchor+include,1))
PY

systemctl daemon-reload
systemctl enable --now suprimentos-homolog.service >/dev/null
systemctl restart unificado-homolog-mapa.service
systemctl enable --now suprimentos-fechamento.timer >/dev/null
ready=false
for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsS http://127.0.0.1:13167/api/suprimentos/health >/dev/null 2>&1; then
        ready=true
        break
    fi
    sleep 0.5
done
test "$ready" = true
nginx -t
systemctl reload nginx
trap - ERR
echo "INSTALL_OK $backup"

#!/usr/bin/env bash
set -euo pipefail

stage=${1:?Informe o diretório extraído do pacote T6a}
next=/opt/concrefer-unificado/homolog-next
lab=/opt/concrefer-unificado/homolog/laboratorio/service
backup=/opt/concrefer-unificado/homolog/backups/cronoanalise-$(date +%Y%m%d-%H%M%S)

test -f "$stage/before.sha256"
test -f "$stage/mapa-api/app.py"
test -f "$stage/public/unificado/shell/modelo-a/menu.js"
test -f "$stage/laboratorio/service/cronoanalise/migrations/001_schema.sql"
test ! -e "$lab/cronoanalise"
test ! -e "$lab/server/static/cronoanalise"
sha256sum -c "$stage/before.sha256"
systemctl is-active --quiet unificado-homolog-mapa.service
systemctl is-active --quiet laboratorio-homolog.service
nginx -t

mkdir -p "$backup"
chmod 700 "$backup"
tar -C "$next" -czf "$backup/homolog-next-before.tar.gz" \
  mapa-api/app.py mapa-api/screen_access.py mapa-api/screen_catalog.json \
  mapa-api/action_catalog.json public/unificado/mapa/operacao/users-unificado.js \
  public/unificado/shell/menu.config.js public/unificado/shell/router.js \
  public/unificado/shell/shell.js public/unificado/shell/modelo-a/menu.js public/unificado/sw.js
tar -C "$lab" -czf "$backup/laboratorio-before.tar.gz" server/app.py server/postes_api.py
sudo -u postgres pg_dump -Fc -n unificado_auth -d mapa_unificado_homolog_20261016 > "$backup/auth-before.dump"

sudo -u postgres psql -v ON_ERROR_STOP=1 -d concretrack_postes_homolog \
  -f "$stage/laboratorio/service/cronoanalise/migrations/001_schema.sql"
sudo -u postgres psql -v ON_ERROR_STOP=1 -d concretrack_postes_homolog \
  -f "$stage/laboratorio/service/cronoanalise/migrations/002_seeds.sql"
sudo -u postgres psql -v ON_ERROR_STOP=1 -d mapa_unificado_homolog_20261016 \
  -f "$stage/db/permissions.sql"

for file in app.py screen_access.py screen_catalog.json action_catalog.json; do
  install -o root -g root -m 644 "$stage/mapa-api/$file" "$next/mapa-api/$file"
done
install -o root -g root -m 644 "$stage/public/unificado/mapa/operacao/users-unificado.js" \
  "$next/public/unificado/mapa/operacao/users-unificado.js"
for file in menu.config.js router.js shell.js; do
  install -o root -g root -m 644 "$stage/public/unificado/shell/$file" \
    "$next/public/unificado/shell/$file"
done
install -o root -g root -m 644 "$stage/public/unificado/shell/modelo-a/menu.js" \
  "$next/public/unificado/shell/modelo-a/menu.js"
install -o root -g root -m 644 "$stage/public/unificado/sw.js" "$next/public/unificado/sw.js"

install -o root -g monitorconcreto -m 640 "$stage/laboratorio/service/server/app.py" "$lab/server/app.py"
install -o root -g monitorconcreto -m 640 "$stage/laboratorio/service/server/postes_api.py" "$lab/server/postes_api.py"
cp -R "$stage/laboratorio/service/cronoanalise" "$lab/cronoanalise"
cp -R "$stage/laboratorio/service/server/static/cronoanalise" "$lab/server/static/cronoanalise"
chown -R root:monitorconcreto "$lab/cronoanalise" "$lab/server/static/cronoanalise"
find "$lab/cronoanalise" "$lab/server/static/cronoanalise" -type d -exec chmod 750 {} +
find "$lab/cronoanalise" "$lab/server/static/cronoanalise" -type f -exec chmod 640 {} +

systemctl restart unificado-homolog-mapa.service laboratorio-homolog.service
systemctl is-active --quiet unificado-homolog-mapa.service
systemctl is-active --quiet laboratorio-homolog.service
nginx -t
ready=0
for attempt in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:13065/health >/dev/null &&
     curl --fail --silent http://127.0.0.1:13152/health >/dev/null; then
    ready=1
    break
  fi
  sleep 1
done
test "$ready" -eq 1
curl --fail --silent --show-error http://127.0.0.1:13065/health
curl --fail --silent --show-error -o /dev/null -w '\ncrono_page_http=%{http_code}\n' \
  http://127.0.0.1:13065/cronoanalise
printf 'backup=%s\n' "$backup"

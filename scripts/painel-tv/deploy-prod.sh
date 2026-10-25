#!/usr/bin/env bash
set -euo pipefail

base=/opt/concrefer-unificado
vhost=/etc/nginx/sites-available/concrefer.concretrack.com.br
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup="$base/backups/painel-tv-$stamp"
stage="$(mktemp -d /tmp/painel-tv-prod.XXXXXX)"
tar -xzf /tmp/painel-tv-prod-payload.tar.gz -C "$stage"
sudo nginx -t
sudo install -d -m 755 "$backup"
sudo tar -C / -czf "$backup/files-before.tar.gz" \
  "${base#/}/mapa-api/app.py" \
  "${base#/}/mapa-api/screen_access.py" \
  "${base#/}/mapa-api/screen_catalog.json" \
  "${base#/}/public/unificado/shell/menu.config.js" \
  "${base#/}/public/unificado/shell/shell.js" \
  "${base#/}/public/unificado/shell/modelo-a/menu.js" \
  "${vhost#/}"
sudo sha256sum "$base/mapa-api/app.py" "$base/mapa-api/screen_access.py" \
  "$base/mapa-api/screen_catalog.json" "$base/public/unificado/shell/menu.config.js" \
  "$base/public/unificado/shell/shell.js" "$base/public/unificado/shell/modelo-a/menu.js" \
  "$vhost" | sudo tee "$backup/before.sha256" >/dev/null
sudo install -d -m 700 -o postgres -g postgres "$backup/db"
sudo -u postgres pg_dump -Fc -f "$backup/db/mapa.dump" mapa_unificado_teste
sudo -u postgres pg_dump -Fc -f "$backup/db/pcp.dump" pcp_unificado_teste
sudo sha256sum "$backup/db/mapa.dump" "$backup/db/pcp.dump" | sudo tee "$backup/db.sha256" >/dev/null

rollback() {
  bash "$stage/rollback-prod.sh" "$backup"
}
trap rollback ERR
bash "$stage/setup-prod-reader.sh"
sudo install -d -m 755 "$base/painel-tv-api" "$base/public/unificado/tv/formas"
sudo install -m 644 "$stage/tv-api/app.py" "$base/painel-tv-api/app.py"
sudo install -m 644 "$stage/tv-api/formas_fisicas.json" "$base/painel-tv-api/formas_fisicas.json"
sudo install -m 644 "$stage/tv/index.html" "$base/public/unificado/tv/formas/index.html"
sudo install -m 644 "$stage/tv/tv.js" "$base/public/unificado/tv/formas/tv.js"
sudo install -m 644 "$stage/mapa/app.py" "$base/mapa-api/app.py"
sudo install -m 644 "$stage/mapa/screen_access.py" "$base/mapa-api/screen_access.py"
sudo install -m 644 "$stage/mapa/screen_catalog.json" "$base/mapa-api/screen_catalog.json"
sudo install -m 644 "$stage/shell/menu.config.js" "$base/public/unificado/shell/menu.config.js"
sudo install -m 644 "$stage/shell/shell.js" "$base/public/unificado/shell/shell.js"
sudo install -m 644 "$stage/shell/modelo-a-menu.js" "$base/public/unificado/shell/modelo-a/menu.js"
sudo install -m 644 "$stage/nginx-prod.conf" /etc/nginx/snippets/painel-tv-prod.conf
sudo install -m 644 "$stage/tv-prod.service" /etc/systemd/system/unificado-tv.service
sudo python3 - "$vhost" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
source = path.read_text()
anchor = '    include /etc/nginx/snippets/unificado-screen-access.conf;\n'
include = '    include /etc/nginx/snippets/painel-tv-prod.conf;\n'
if source.count(anchor) != 1 or include in source:
    raise SystemExit('Production Nginx include anchor drifted')
path.write_text(source.replace(anchor, anchor + include, 1))
PY
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl enable --now unificado-tv.service
sudo systemctl restart mapa-unificado-auth.service
sudo systemctl reload nginx
sudo systemctl is-active unificado-tv.service mapa-unificado-auth.service nginx
trap - ERR
printf 'backup=%s\n' "$backup"

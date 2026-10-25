#!/usr/bin/env bash
set -euo pipefail

base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"
mapa="$base/mapa-api"
vhost=/etc/nginx/sites-available/unificado-homolog.conf
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup="$base/backups/painel-tv-$stamp"
stage="$(mktemp -d /tmp/painel-tv-stage.XXXXXX)"
tar -xzf /tmp/painel-tv-homolog-payload.tar.gz -C "$stage"
sudo mkdir -p "$backup"
sudo tar -C / -czf "$backup/before.tar.gz" \
  "${mapa#/}/app.py" "${mapa#/}/screen_access.py" "${mapa#/}/screen_catalog.json" \
  "${public#/}/shell/menu.config.js" "${public#/}/shell/shell.js" \
  "${public#/}/shell/modelo-a/menu.js" "${vhost#/}"

sudo install -d -m 755 "$base/painel-tv-api" "$public/tv/formas"
sudo install -m 644 "$stage/unificado/painel-tv/api/app.py" "$base/painel-tv-api/app.py"
sudo install -m 644 "$stage/unificado/painel-tv/api/formas_fisicas.json" "$base/painel-tv-api/formas_fisicas.json"
sudo install -m 644 "$stage/unificado/tv/formas/index.html" "$public/tv/formas/index.html"
sudo install -m 644 "$stage/unificado/tv/formas/tv.js" "$public/tv/formas/tv.js"
sudo install -m 644 "$stage/.codex-tmp-painel-tv-server/app-candidate.py" "$mapa/app.py"
sudo install -m 644 "$stage/unificado/mapa/api/screen_access.py" "$mapa/screen_access.py"
sudo install -m 644 "$stage/unificado/mapa/api/screen_catalog.json" "$mapa/screen_catalog.json"
sudo install -m 644 "$stage/unificado/shell/menu.config.js" "$public/shell/menu.config.js"
sudo install -m 644 "$stage/unificado/shell/shell.js" "$public/shell/shell.js"
sudo install -m 644 "$stage/unificado/shell/modelo-a/menu.js" "$public/shell/modelo-a/menu.js"
sudo install -m 644 "$stage/unificado/painel-tv/nginx-homolog.conf" /etc/nginx/snippets/painel-tv-homolog.conf
sudo install -m 644 "$stage/unificado/painel-tv/tv-homolog.service" /etc/systemd/system/unificado-homolog-tv.service
sudo python3 - "$vhost" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
source = path.read_text()
include = '    include /etc/nginx/snippets/painel-tv-homolog.conf;\n'
if include not in source:
    anchor = '    include /etc/nginx/snippets/unificado-screen-access-homolog.conf;\n'
    if source.count(anchor) != 1:
        raise SystemExit('Nginx include anchor mismatch')
    path.write_text(source.replace(anchor, anchor + include, 1))
PY
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl enable --now unificado-homolog-tv.service
sudo systemctl restart unificado-homolog-mapa.service
sudo systemctl reload nginx
sudo systemctl is-active unificado-homolog-tv.service unificado-homolog-mapa.service nginx
printf 'backup=%s\n' "$backup"

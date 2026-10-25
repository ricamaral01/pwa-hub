#!/usr/bin/env bash
set -euo pipefail
backup="${1:?backup path required}"
case "$backup" in
  /opt/concrefer-unificado/backups/painel-tv-*) ;;
  *) echo 'Refusing unexpected backup path' >&2; exit 2 ;;
esac
test -f "$backup/files-before.tar.gz"
sudo systemctl disable --now unificado-tv.service >/dev/null 2>&1 || true
sudo tar -C / -xzf "$backup/files-before.tar.gz"
sudo rm -f /etc/nginx/snippets/painel-tv-prod.conf
sudo rm -f /etc/systemd/system/unificado-tv.service
sudo rm -f /opt/concrefer-unificado/public/unificado/tv/formas/index.html
sudo rm -f /opt/concrefer-unificado/public/unificado/tv/formas/tv.js
sudo rm -f /opt/concrefer-unificado/painel-tv-api/app.py
sudo rm -f /opt/concrefer-unificado/painel-tv-api/formas_fisicas.json
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl restart mapa-unificado-auth.service
sudo systemctl reload nginx
sudo systemctl is-active mapa-unificado-auth.service nginx
echo "rolled_back=$backup"

#!/usr/bin/env bash
set -euo pipefail

target=${1:?use prod or homolog}
case "$target" in
  prod)
    public=/opt/concrefer-unificado/public/unificado/pcp
    api=/opt/concrefer-unificado/pcp-api/app/api/routers/pcp.py
    service=pcp-unificado-test.service
    ;;
  homolog)
    public=/opt/concrefer-unificado/homolog-next/public/unificado/pcp
    api=/opt/concrefer-unificado/homolog-next/pcp-api/app/api/routers/pcp.py
    service=unificado-homolog-pcp.service
    ;;
  *) echo "unknown target: $target" >&2; exit 2 ;;
esac
backup=/opt/concrefer-unificado/backups/etiquetas-setores-20261019-$target
cmp "$api" "$backup/before/api/pcp.py"
cmp "$public/etiquetas/index.html" "$backup/before/public/etiquetas/index.html"
cmp "$public/static/js/etiquetas.js" "$backup/before/public/static/js/etiquetas.js"
sudo cp "$backup/stage/api/pcp.py" "$api"
sudo cp "$backup/stage/public/etiquetas/index.html" "$public/etiquetas/index.html"
sudo cp "$backup/stage/public/static/js/etiquetas.js" "$public/static/js/etiquetas.js"
cmp "$api" "$backup/stage/api/pcp.py"
cmp "$public/etiquetas/index.html" "$backup/stage/public/etiquetas/index.html"
cmp "$public/static/js/etiquetas.js" "$backup/stage/public/static/js/etiquetas.js"
sudo systemctl restart "$service"
systemctl is-active "$service"
sha256sum "$api" "$public/etiquetas/index.html" "$public/static/js/etiquetas.js"

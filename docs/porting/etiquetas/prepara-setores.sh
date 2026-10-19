#!/usr/bin/env bash
set -euo pipefail

target=${1:?use prod or homolog}
case "$target" in
  prod)
    public=/opt/concrefer-unificado/public/unificado/pcp
    api=/opt/concrefer-unificado/pcp-api/app/api/routers/pcp.py
    ;;
  homolog)
    public=/opt/concrefer-unificado/homolog-next/public/unificado/pcp
    api=/opt/concrefer-unificado/homolog-next/pcp-api/app/api/routers/pcp.py
    ;;
  *) echo "unknown target: $target" >&2; exit 2 ;;
esac
backup=/opt/concrefer-unificado/backups/etiquetas-setores-20261019-$target
if [ -e "$backup/before/api/pcp.py" ]; then
  echo "backup already exists: $backup" >&2
  exit 2
fi
sudo mkdir -p "$backup/before/api" "$backup/before/public/etiquetas" \
  "$backup/before/public/etiquetas-sc" "$backup/before/public/static/js" \
  "$backup/stage/api" "$backup/stage/public/etiquetas" \
  "$backup/stage/public/etiquetas-sc" "$backup/stage/public/static/js"
sudo cp "$api" "$backup/before/api/pcp.py"
sudo cp "$public/etiquetas/index.html" "$backup/before/public/etiquetas/index.html"
sudo cp "$public/etiquetas-sc/index.html" "$backup/before/public/etiquetas-sc/index.html"
sudo cp "$public/static/js/etiquetas.js" "$backup/before/public/static/js/etiquetas.js"
sudo cp -a "$backup/before/." "$backup/stage/"
sudo python3 /tmp/filtra-setores.py "$backup/stage"
sudo python3 -m py_compile "$backup/stage/api/pcp.py"
for file in api/pcp.py public/etiquetas/index.html public/static/js/etiquetas.js; do
  diff -u "$backup/before/$file" "$backup/stage/$file" || test "$?" -eq 1
done
sha256sum "$backup/before/api/pcp.py" "$backup/before/public/etiquetas/index.html" \
  "$backup/before/public/static/js/etiquetas.js"

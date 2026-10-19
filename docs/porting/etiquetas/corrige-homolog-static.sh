#!/usr/bin/env bash
set -euo pipefail

root=/opt/concrefer-unificado
live=$root/homolog-next/public/unificado/pcp
old=$root/homolog/public/unificado/pcp
backup=$root/backups/etiquetas-setores-20261019-homolog
prod_stage=$root/backups/etiquetas-setores-20261019-prod/stage/public

# The first homolog static publication reached an unused directory. The
# homolog-next static files match the production stage inputs byte for byte.
cmp "$live/etiquetas/index.html" "$root/backups/etiquetas-setores-20261019-prod/before/public/etiquetas/index.html"
cmp "$live/static/js/etiquetas.js" "$root/backups/etiquetas-setores-20261019-prod/before/public/static/js/etiquetas.js"
sudo mkdir -p "$backup/served-before/etiquetas" "$backup/served-before/etiquetas-sc" "$backup/served-before/static/js"
sudo cp "$live/etiquetas/index.html" "$backup/served-before/etiquetas/index.html"
sudo cp "$live/etiquetas-sc/index.html" "$backup/served-before/etiquetas-sc/index.html"
sudo cp "$live/static/js/etiquetas.js" "$backup/served-before/static/js/etiquetas.js"
sudo cp "$prod_stage/etiquetas/index.html" "$live/etiquetas/index.html"
sudo cp "$prod_stage/static/js/etiquetas.js" "$live/static/js/etiquetas.js"
cmp "$live/etiquetas/index.html" "$prod_stage/etiquetas/index.html"
cmp "$live/static/js/etiquetas.js" "$prod_stage/static/js/etiquetas.js"

# Restore the stale, unserved static files changed by the initial attempt.
sudo cp "$backup/before/public/etiquetas/index.html" "$old/etiquetas/index.html"
sudo cp "$backup/before/public/static/js/etiquetas.js" "$old/static/js/etiquetas.js"
cmp "$old/etiquetas/index.html" "$backup/before/public/etiquetas/index.html"
cmp "$old/static/js/etiquetas.js" "$backup/before/public/static/js/etiquetas.js"
sha256sum "$live/etiquetas/index.html" "$live/static/js/etiquetas.js"

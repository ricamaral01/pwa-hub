#!/usr/bin/env bash
set -euo pipefail

root=/opt/concrefer-unificado/public/unificado
backup=/opt/concrefer-unificado/backups/crono-cache-20261019
for file in index.html sw.js shell/modelo-a-loader.js; do
  cmp "$root/$file" "$backup/before/$file"
done
for file in index.html sw.js shell/modelo-a-loader.js; do
  sudo cp "$backup/stage/$file" "$root/$file"
  cmp "$root/$file" "$backup/stage/$file"
done
sha256sum "$root/index.html" "$root/sw.js" "$root/shell/modelo-a-loader.js"

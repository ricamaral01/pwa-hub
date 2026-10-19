#!/usr/bin/env bash
set -euo pipefail

root=/opt/concrefer-unificado/public/unificado
backup=/opt/concrefer-unificado/backups/crono-cache-20261019
sudo mkdir -p "$backup/before/shell" "$backup/stage/shell"
for file in index.html sw.js shell/modelo-a-loader.js; do
  sudo cp "$root/$file" "$backup/before/$file"
  sudo cp "$root/$file" "$backup/stage/$file"
done

sudo python3 /tmp/corrige-cache-shell.py "$backup/stage"
for file in index.html sw.js shell/modelo-a-loader.js; do
  diff -u "$backup/before/$file" "$backup/stage/$file" || test "$?" -eq 1
done

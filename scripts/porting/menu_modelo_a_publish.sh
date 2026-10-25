#!/usr/bin/env bash
set -euo pipefail

root=/opt/concrefer-unificado/public/unificado
release=/root/menu-modelo-a-20261016
backup="$release/prod-before.tgz"
candidate="$release/modelo-a-prod-files.tgz"

rollback() {
  test -f "$backup"
  tar -xzf "$backup" -C "$root"
  rm -f "$root/shell/modelo-a-host.css" "$root/shell/modelo-a-loader.js" \
    "$root/shell/modelo-a/menu.js" "$root/shell/modelo-a/menu.css"
  rmdir "$root/shell/modelo-a" 2>/dev/null || true
  nginx -t
  test "$(cat "$root/VERSION")" = 1.0.11
  echo 'Modelo A rollback: production shell 1.0.11 restored'
}

if [[ "${1:-}" == rollback ]]; then
  rollback
  exit 0
fi
[[ "${1:-}" == publish ]] || { echo 'usage: publish|rollback' >&2; exit 2; }
test "$(cat "$root/VERSION")" = 1.0.11
sha256sum "$backup" | grep -q '^0fdb4565ef656b890ccfd7ca2a2c078e9c5a49c6f39c998f3b0fcbe4fc59b5a3 '
sha256sum "$candidate" | grep -q '^0df4f84c777a31d932db618280758d4e0d2ffd0f8787cbfc1b6f7fe702f67517 '
nginx -t
mkdir -p "$release/candidate"
tar -xzf "$candidate" -C "$release/candidate"
trap 'rollback' ERR
mkdir -p "$root/shell/modelo-a"
cp "$release/candidate/shell/modelo-a/menu.js" "$root/shell/modelo-a/menu.js"
cp "$release/candidate/shell/modelo-a/menu.css" "$root/shell/modelo-a/menu.css"
cp "$release/candidate/shell/modelo-a-loader.js" "$root/shell/modelo-a-loader.js"
cp "$release/candidate/shell/modelo-a-host.css" "$root/shell/modelo-a-host.css"
cp "$release/candidate/shell/shell.js" "$root/shell/shell.js"
cp "$release/candidate/shell/router.js" "$root/shell/router.js"
cp "$release/candidate/sw.js" "$root/sw.js"
cp "$release/candidate/index.html" "$root/index.html"
cp "$release/candidate/VERSION" "$root/VERSION"
for file in index.html VERSION sw.js shell/shell.js shell/router.js \
  shell/modelo-a-loader.js shell/modelo-a-host.css shell/modelo-a/menu.js shell/modelo-a/menu.css; do
  cmp "$release/candidate/$file" "$root/$file"
done
test "$(curl -fsS --max-time 15 https://concrefer.concretrack.com.br/unificado/VERSION)" = 1.0.13
curl -fsS --max-time 15 -o /dev/null https://concrefer.concretrack.com.br/unificado/shell/modelo-a/menu.js
nginx -t
trap - ERR
echo 'Modelo A 1.0.13 published; all candidate files match'

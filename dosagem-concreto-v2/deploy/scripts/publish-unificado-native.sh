#!/usr/bin/env bash
set -euo pipefail

root=/opt/concrefer-unificado/public/unificado
stage=/root/dosagem-native-release-stage
archive=/root/dosagem-native-release.tar.gz
backup=/root/unificado-before-dosagem-native-$(date -u +%Y%m%dT%H%M%SZ).tar.gz

test -f "$archive"
test -f "$root/index.html"
mkdir -p "$stage"
tar -xzf "$archive" -C "$stage"
for file in index.html VERSION sw.js shell/menu.config.js shell/router.js shell/shell.js shell/shell.css shell/modelo-a-loader.js shell/modelo-a/menu.js; do
    test -s "$stage/$file"
done
tar -czf "$backup" -C "$root" index.html VERSION sw.js \
    shell/menu.config.js shell/router.js shell/shell.js shell/shell.css \
    shell/modelo-a-loader.js shell/modelo-a/menu.js

for file in shell/menu.config.js shell/router.js shell/shell.js shell/shell.css shell/modelo-a-loader.js shell/modelo-a/menu.js; do
    install -m 0644 "$stage/$file" "$root/$file"
done
install -m 0644 "$stage/sw.js" "$root/sw.js"
install -m 0644 "$stage/VERSION" "$root/VERSION"
install -m 0644 "$stage/index.html" "$root/index.html"
echo "Published Unificado $(cat "$stage/VERSION"); rollback archive: $backup"

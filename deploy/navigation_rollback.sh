#!/usr/bin/env bash
set -euo pipefail

backup="${1:?Pass the production navigation backup path}"
target=/opt/concrefer-unificado/public/unificado
case "$backup" in
  /opt/concrefer-unificado/backups/navigation-production-20*) ;;
  *) echo 'Invalid production backup path' >&2; exit 2 ;;
esac
test -f "$backup/before.tar.gz"
test -d "$target"

# The navigation files did not exist before the first full release. The
# manifest allows rollback after later releases without deleting prior files.
for file in shell/navigation.js shell/navigation.css; do
  if ! tar -tzf "$backup/before.tar.gz" | grep -Fxq "$file"; then
    rm -f "$target/$file"
  fi
done
tar -xzf "$backup/before.tar.gz" -C "$target"
nginx -t
systemctl reload nginx
expected="$(tr -d '\r\n' < "$target/VERSION")"
actual="$(curl -fsS https://concrefer.concretrack.com.br/unificado/VERSION | tr -d '\r\n')"
test "$expected" = "$actual"
echo "Navigation production restored from $backup; VERSION=$actual"

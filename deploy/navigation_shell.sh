#!/usr/bin/env bash
set -euo pipefail

environment="${1:?Use homolog or production}"
case "$environment" in
  homolog)
    target=/opt/concrefer-unificado/homolog-next/public/unificado
    base=https://concrefer.concretrack.com.br:18446
    pcp_status=401
    ;;
  production)
    target=/opt/concrefer-unificado/public/unificado
    base=https://concrefer.concretrack.com.br
    pcp_status=403
    ;;
  *) echo 'Unknown environment' >&2; exit 2 ;;
esac

package=/tmp/unificado-navigation-shell.tar.gz
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
tar -xzf "$package" -C "$stage"
files=(VERSION sw.js index.html shell/shell.js shell/modelo-a/menu.js
       shell/modelo-a/menu.css shell/modelo-a-loader.js shell/navigation.js shell/navigation.css
       shell/menu.config.js shell/router.js)
for file in "${files[@]}"; do test -f "$stage/$file"; done

# shell.js is the release source of truth. Refuse a package whose tracked
# VERSION or SW cache disagrees; then generate the deployed VERSION from it.
version="$(sed -n "s/^const APP_VERSION = '\([^']*\)';/\1/p" "$stage/shell/shell.js" | tr -d '\r')"
test -n "$version"
test "$(tr -d '\r\n' < "$stage/VERSION")" = "$version"
grep -Fq "concrefer-unificado-shell-v$version" "$stage/sw.js"
grep -Fq "shell/shell.js?v=$version" "$stage/index.html"
printf '%s\n' "$version" > "$stage/VERSION"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup="/opt/concrefer-unificado/backups/navigation-$environment-$stamp"
mkdir -p "$backup"
chmod 0700 "$backup"
existing=()
new=()
for file in "${files[@]}"; do
  if [[ -f "$target/$file" ]]; then existing+=("$file"); else new+=("$file"); fi
done
tar -czf "$backup/before.tar.gz" -C "$target" "${existing[@]}"
stat -c '%n %U:%G %a' "${existing[@]/#/$target/}" > "$backup/permissions-before.txt"
rollback() {
  echo "Navigation deployment failed; restoring $environment from $backup" >&2
  tar -xzf "$backup/before.tar.gz" -C "$target"
  for file in "${new[@]}"; do rm -f "$target/$file"; done
  nginx -t >/dev/null 2>&1 && systemctl reload nginx || true
}
trap rollback ERR

for file in "${files[@]}"; do
  install -o root -g root -m 0644 "$stage/$file" "$target/$file"
done
nginx -t
systemctl reload nginx

check() {
  local path="$1" expected="$2" actual
  actual="$(curl -sS -o /dev/null -w '%{http_code}' "$base$path")"
  test "$actual" = "$expected" || { echo "$path: $actual/$expected" >&2; return 1; }
}
check /unificado/ 200
check /unificado/login.html 200
check /unificado/pcp/api/dashboard "$pcp_status"
check /unificado/mapa/api/health 200
check /unificado/laboratorio/ 302
check /unificado/qualidade/api/health 401
check /unificado/ged/calibrations/verify/b3e3ac18-01fa-40d2-9629-9390b60e5dfc 200
test "$(curl -sS "$base/unificado/VERSION")" = "$version"
curl -fsS -o "$stage/published-shell.js" "$base/unificado/shell/shell.js"
curl -fsS -o "$stage/published-sw.js" "$base/unificado/sw.js"
grep -Fq "const APP_VERSION = '$version'" "$stage/published-shell.js"
grep -Fq "concrefer-unificado-shell-v$version" "$stage/published-sw.js"
for file in "${files[@]}"; do sudo -u www-data test -r "$target/$file"; done
test -z "$(find "${files[@]/#/$target/}" -perm /0002 -print -quit)"
stat -c '%n %U:%G %a' "${files[@]/#/$target/}" > "$backup/permissions-after.txt"
trap - ERR
echo "Navigation $environment deployed v$version; gate 7/7. Backup: $backup"

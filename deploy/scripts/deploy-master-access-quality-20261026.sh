#!/usr/bin/env bash
set -euo pipefail

environment="${1:?expected stage or prod}"
case "$environment" in
  stage)
    base=/opt/concrefer-unificado/homolog-next
    public="$base/public/unificado"
    api="$base/mapa-api"
    service=unificado-homolog-mapa.service
    port=18446
    ;;
  prod)
    base=/opt/concrefer-unificado
    public="$base/public/unificado"
    api="$base/mapa-api"
    service=mapa-unificado-auth.service
    port=443
    ;;
  *) echo "invalid environment" >&2; exit 2 ;;
esac

candidate="/tmp/accessfix-${environment}-candidate"
backup="$base/backups/master-access-quality-20261026-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup"
chmod 700 "$backup"

declare -A targets=(
  [screen_access.py]="$api/screen_access.py"
  [app.py]="$api/app.py"
  [shell.js]="$public/shell/shell.js"
  [menu.config.js]="$public/shell/menu.config.js"
  [menu.js]="$public/shell/modelo-a/menu.js"
  [router.js]="$public/shell/router.js"
  [users-unificado.js]="$public/mapa/operacao/users-unificado.js"
  [index.html]="$public/index.html"
  [sw.js]="$public/sw.js"
  [VERSION]="$public/VERSION"
)
files=(screen_access.py app.py shell.js menu.config.js menu.js router.js users-unificado.js index.html sw.js VERSION)

rollback() {
  echo "Rolling back $environment from $backup" >&2
  for name in "${files[@]}"; do
    if [[ -f "$backup/$name" ]]; then
      cp -p "$backup/$name" "${targets[$name]}"
    fi
  done
  systemctl restart "$service" || true
}
trap rollback ERR

for name in "${files[@]}"; do
  test -f "$candidate/$name"
  test -f "${targets[$name]}"
  cp -p "${targets[$name]}" "$backup/$name"
  stat -c '%U:%G %a %n' "${targets[$name]}" >> "$backup/permissions-before.txt"
done

python3 -m py_compile "$candidate/screen_access.py" "$candidate/app.py"
for name in shell.js menu.config.js menu.js router.js users-unificado.js sw.js; do
  node --check "$candidate/$name" >/dev/null
done
nginx -t

for name in "${files[@]}"; do
  install -o root -g root -m 0644 "$candidate/$name" "${targets[$name]}"
done
systemctl restart "$service"
systemctl is-active --quiet "$service"
nginx -t

url="https://concrefer.concretrack.com.br"
if [[ "$environment" == stage ]]; then url="https://concrefer.concretrack.com.br:18446"; fi
version="$(curl -fsSk --resolve "concrefer.concretrack.com.br:$port:127.0.0.1" "$url/unificado/VERSION")"
[[ "$version" == 1.0.97 ]]
for asset in index.html shell/menu.config.js shell/modelo-a/menu.js shell/router.js shell/shell.js sw.js; do
  curl -fsSk --resolve "concrefer.concretrack.com.br:$port:127.0.0.1" \
    -o /dev/null "$url/unificado/$asset"
done
echo "$environment deployed; backup=$backup; version=$version"
trap - ERR

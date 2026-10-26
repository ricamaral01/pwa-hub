#!/usr/bin/env bash
set -Eeuo pipefail

# The payload is a tarball rooted at the repository. Run on the new VPS only.
environment="${1:?stage or production}"
action="${2:?deploy or rollback}"
argument="${3:?payload or backup directory}"
case "$environment" in
  stage)
    base=/opt/concrefer-unificado/homolog-next
    service=unificado-homolog-mapa.service
    origin=https://concrefer.concretrack.com.br:18446 ;;
  production)
    base=/opt/concrefer-unificado
    service=mapa-unificado-auth.service
    origin=https://concrefer.concretrack.com.br ;;
  *) echo 'Unknown environment' >&2; exit 2 ;;
esac

files=(
  unificado/VERSION
  unificado/index.html
  unificado/sw.js
  unificado/shell/shell.css
  unificado/shell/shell.js
  unificado/shell/module-pages.js
  unificado/shell/router.js
  unificado/mapa/api/screen_catalog.json
  unificado/mapa/api/screen_access.py
)

destination() {
  local relative="$1"
  if [[ "$relative" == unificado/mapa/api/* ]]; then
    printf '%s/mapa-api/%s' "$base" "${relative##*/}"
  else
    printf '%s/public/%s' "$base" "$relative"
  fi
}

restore() {
  local backup="$1" index=0 relative target
  trap - ERR
  for relative in "${files[@]}"; do
    target="$(destination "$relative")"
    cp -a -- "$backup/$index" "$target"
    index=$((index + 1))
  done
  systemctl restart "$service"
  nginx -t
  echo "ROLLED_BACK=$backup"
}

if [[ "$action" == rollback ]]; then
  backup="$(realpath -e -- "$argument")"
  [[ "$backup" == /opt/concrefer-unificado/backups/unificado-links-* ]] || exit 2
  restore "$backup"
  exit
fi
[[ "$action" == deploy ]] || exit 2
payload="$(realpath -e -- "$argument")"
backup="/opt/concrefer-unificado/backups/unificado-links-${environment}-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -m 0700 -p "$backup"
index=0
for relative in "${files[@]}"; do
  target="$(destination "$relative")"
  [[ -f "$target" ]] || { echo "Missing destination: $target" >&2; exit 1; }
  cp -a -- "$target" "$backup/$index"
  stat -c '%n|%U:%G|%a' "$target" >> "$backup/permissions.txt"
  index=$((index + 1))
done
nginx -t
work="$(mktemp -d)"
trap 'rm -rf -- "$work"' EXIT
tar -xzf "$payload" -C "$work"
for relative in "${files[@]}"; do
  [[ -f "$work/$relative" ]] || { echo "Missing payload: $relative" >&2; exit 1; }
done
trap 'restore "$backup"' ERR
for relative in "${files[@]}"; do
  install -o www-data -g www-data -m 0644 -- "$work/$relative" "$(destination "$relative")"
done
systemctl restart "$service"
systemctl is-active --quiet "$service"
nginx -t
[[ "$(curl -fkLsS "$origin/unificado/VERSION")" == '1.0.102' ]]
[[ "$(curl -kLsS -o /dev/null -w '%{http_code}' "$origin/unificado/")" == '200' ]]
trap - ERR
echo "DEPLOY_OK=$environment"
echo "BACKUP_PATH=$backup"

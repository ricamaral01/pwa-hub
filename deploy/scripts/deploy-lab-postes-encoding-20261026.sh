#!/usr/bin/env bash
set -Eeuo pipefail

environment="${1:?stage or production}"
action="${2:?deploy or rollback}"
argument="${3:?payload or backup directory}"
asset=novo-40b0590a4035.js

case "$environment" in
  stage)
    shell_root=/opt/concrefer-unificado/homolog-next/public/unificado
    lab_root=/opt/concrefer-unificado/homolog/laboratorio/service/server/static/novo/postes
    lab_service=laboratorio-homolog.service
    shell_service=unificado-homolog-mapa.service
    lab_port=13065
    origin=https://concrefer.concretrack.com.br:18446 ;;
  production)
    shell_root=/opt/concrefer-unificado/public/unificado
    lab_root=/opt/concrefer-unificado/laboratorio/service/server/static/novo/postes
    lab_service=laboratorio-unificado.service
    shell_service=mapa-unificado-auth.service
    lab_port=13064
    origin=https://concrefer.concretrack.com.br ;;
  *) echo 'Unknown environment' >&2; exit 2 ;;
esac

files=(
  unificado/VERSION
  unificado/index.html
  unificado/sw.js
  unificado/shell/shell.js
  unificado/laboratorio/service/server/static/novo/postes/novo.html
  unificado/laboratorio/service/server/static/novo/postes/assets/novo-CN9ofp5M.css
  "unificado/laboratorio/service/server/static/novo/postes/assets/$asset"
)

destination() {
  local relative="$1"
  if [[ "$relative" == unificado/laboratorio/service/server/static/novo/postes/* ]]; then
    printf '%s/%s' "$lab_root" "${relative#unificado/laboratorio/service/server/static/novo/postes/}"
  else
    printf '%s/%s' "$shell_root" "${relative#unificado/}"
  fi
}

restore() {
  local backup="$1" relative target index=0
  trap - ERR
  for relative in "${files[@]}"; do
    target="$(destination "$relative")"
    if [[ -f "$backup/$index" ]]; then
      cp -a -- "$backup/$index" "$target"
    else
      rm -f -- "$target"
    fi
    index=$((index + 1))
  done
  nginx -t
  echo "ROLLED_BACK=$backup"
}

if [[ "$action" == rollback ]]; then
  backup="$(realpath -e -- "$argument")"
  [[ "$backup" == /opt/concrefer-unificado/backups/lab-postes-encoding-* ]] || exit 2
  restore "$backup"
  exit
fi
[[ "$action" == deploy ]] || exit 2
payload="$(realpath -e -- "$argument")"
backup="/opt/concrefer-unificado/backups/lab-postes-encoding-${environment}-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -m 0700 -p "$backup"
index=0
for relative in "${files[@]}"; do
  target="$(destination "$relative")"
  [[ -d "$(dirname "$target")" ]] || { echo "Missing target directory: $target" >&2; exit 1; }
  if [[ -f "$target" ]]; then
    cp -a -- "$target" "$backup/$index"
    stat -c '%n|%U:%G|%a' "$target" >> "$backup/permissions.txt"
  else
    printf '%s|absent\n' "$target" >> "$backup/permissions.txt"
  fi
  index=$((index + 1))
done

work="$(mktemp -d)"
trap 'rm -rf -- "$work"' EXIT
tar -xzf "$payload" -C "$work"
for relative in "${files[@]}"; do
  [[ -f "$work/$relative" ]] || { echo "Missing payload: $relative" >&2; exit 1; }
done
nginx -t
trap 'restore "$backup"' ERR
for relative in "${files[@]}"; do
  install -o www-data -g www-data -m 0644 -- "$work/$relative" "$(destination "$relative")"
done
nginx -t
systemctl is-active --quiet "$lab_service"
systemctl is-active --quiet "$shell_service"
[[ "$(curl -fkLsS "$origin/unificado/VERSION")" == '1.0.103' ]]
[[ "$(curl -kLsS -o /dev/null -w '%{http_code}' "$origin/unificado/")" == '200' ]]
curl -fsS -o "$work/check.html" "http://127.0.0.1:$lab_port/novo/postes"
grep -Fq "$asset" "$work/check.html"
curl -fsS -o "$work/check.js" "http://127.0.0.1:$lab_port/novo/postes/assets/$asset"
grep -Fq 'Número de série do poste' "$work/check.js"
[[ "$(stat -c '%U:%G|%a' "$(destination "unificado/laboratorio/service/server/static/novo/postes/assets/$asset")")" == 'www-data:www-data|644' ]]
trap - ERR
echo "DEPLOY_OK=$environment"
echo "BACKUP_PATH=$backup"

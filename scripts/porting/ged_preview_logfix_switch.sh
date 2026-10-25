#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
mode=${1:-}
work=/root/ged-preview-20261015
compose=/opt/ged_concrefer/docker-compose.yml
backup=$work/logfix-backup

health() {
  for _ in $(seq 1 45); do
    if curl -fsS -o /dev/null http://127.0.0.1:13071/health; then return 0; fi
    sleep 1
  done
  return 1
}

restore() {
  (cd "$backup" && sha256sum -c SHA256SUMS)
  cp "$backup/docker-compose.before.yml" "$compose"
  (cd /opt/ged_concrefer && docker compose config --quiet && docker compose up -d --no-deps backend >/dev/null)
  health
  echo 'Backend GED anterior restaurado.'
}

case "$mode" in
  publish)
    grep -q 'image: ged-concrefer-backend:preview-signed' "$compose"
    grep -q 'image: ged-concrefer-backend:preview-signed-v2' "$work/docker-compose.logfix.yml"
    (cd "$backup" && sha256sum -c SHA256SUMS)
    trap 'trap - ERR; restore' ERR
    cp "$work/docker-compose.logfix.yml" "$compose"
    (cd /opt/ged_concrefer && docker compose config --quiet && docker compose up -d --no-deps backend >/dev/null)
    health
    trap - ERR
    echo 'Backend GED com log sanitizado publicado.'
    ;;
  rollback) restore ;;
  *) echo 'Uso: ged_preview_logfix_switch.sh publish|rollback' >&2; exit 2 ;;
esac

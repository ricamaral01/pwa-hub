#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

mode=${1:-}
work=/root/ged-preview-20261015
compose=/opt/ged_concrefer/docker-compose.yml
nginx=/etc/nginx/snippets/ged-unificado.conf
backup=$work/backup

health() {
  for _ in $(seq 1 45); do
    if curl -fsS -o /dev/null http://127.0.0.1:13071/health &&
       curl -fsS -o /dev/null http://127.0.0.1:13070/unificado/ged/login; then
      return 0
    fi
    sleep 1
  done
  return 1
}

restore() {
  (cd "$backup" && sha256sum -c SHA256SUMS)
  cp "$backup/ged-unificado.before.conf" "$nginx"
  nginx -t
  systemctl reload nginx
  cp "$backup/docker-compose.before.yml" "$compose"
  (cd /opt/ged_concrefer && docker compose config --quiet && docker compose up -d --no-deps backend frontend >/dev/null)
  health
  /root/ged-a6-20261015-prepared/a6_ged_qr_smoke.sh >/dev/null
  echo 'GED frontend, backend e Nginx anteriores restaurados.'
}

case "$mode" in
  publish)
    test ! -e "$backup"
    test -s "$work/docker-compose.preview.yml"
    test -s "$work/ged-unificado.preview.conf"
    grep -q 'image: ged-concrefer-backend:c2-prepared' "$compose"
    grep -q 'image: ged-concrefer-frontend:c2-qr-merged' "$compose"
    grep -q 'image: ged-concrefer-backend:preview-signed' "$work/docker-compose.preview.yml"
    grep -q 'image: ged-concrefer-frontend:preview-signed' "$work/docker-compose.preview.yml"
    test "$(grep -c 'GED_RNC_READONLY: "1"' "$work/docker-compose.preview.yml")" = 2
    grep -q 'access_log off;' "$work/ged-unificado.preview.conf"
    docker image inspect ged-concrefer-backend:preview-signed >/dev/null
    docker image inspect ged-concrefer-frontend:preview-signed >/dev/null
    mkdir -m 0700 "$backup"
    cp -a "$compose" "$backup/docker-compose.before.yml"
    cp -a "$nginx" "$backup/ged-unificado.before.conf"
    (cd "$backup" && sha256sum docker-compose.before.yml ged-unificado.before.conf > SHA256SUMS && sha256sum -c SHA256SUMS)
    trap 'trap - ERR; restore' ERR
    cp "$work/docker-compose.preview.yml" "$compose"
    (cd /opt/ged_concrefer && docker compose config --quiet && docker compose up -d --no-deps backend frontend >/dev/null)
    health
    cp "$work/ged-unificado.preview.conf" "$nginx"
    nginx -t
    systemctl reload nginx
    /root/ged-a6-20261015-prepared/a6_ged_qr_smoke.sh >/dev/null
    trap - ERR
    echo 'GED com visualização Office assinada publicado; executar smoke público e gate.'
    ;;
  rollback)
    restore
    ;;
  *)
    echo 'Uso: ged_preview_switch.sh publish|rollback' >&2
    exit 2
    ;;
esac

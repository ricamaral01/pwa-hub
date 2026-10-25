#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

mode=${1:-}
work=/root/ged-layout-20261015
compose=/opt/ged_concrefer/docker-compose.yml
backup=$work/users-guard-backup-retry2

health() {
  for _ in $(seq 1 45); do
    if curl -fsS -o /dev/null http://127.0.0.1:13071/health &&
       curl -fsS -o /dev/null http://127.0.0.1:13070/unificado/ged/login; then return 0; fi
    sleep 1
  done
  return 1
}

restore() {
  (cd "$backup" && sha256sum -c SHA256SUMS)
  cp "$backup/docker-compose.before.yml" "$compose"
  (cd /opt/ged_concrefer && docker compose config --quiet && docker compose up -d --no-deps backend frontend >/dev/null)
  health
  /root/ged-a6-20261015-prepared/a6_ged_qr_smoke.sh >/dev/null
  echo 'Imagens GED anteriores restauradas.'
}

case "$mode" in
  publish)
    test ! -e "$backup"
    grep -q 'image: ged-concrefer-backend:preview-signed-v2' "$compose"
    grep -q 'image: ged-concrefer-frontend:layout-embed-v1' "$compose"
    grep -q 'image: ged-concrefer-backend:preview-signed-v3' "$work/docker-compose.users-guard.yml"
    grep -q 'image: ged-concrefer-frontend:layout-embed-v2' "$work/docker-compose.users-guard.yml"
    docker image inspect ged-concrefer-backend:preview-signed-v3 >/dev/null
    docker image inspect ged-concrefer-frontend:layout-embed-v2 >/dev/null
    mkdir -m 0700 "$backup"
    cp -a "$compose" "$backup/docker-compose.before.yml"
    (cd "$backup" && sha256sum docker-compose.before.yml > SHA256SUMS && sha256sum -c SHA256SUMS)
    trap 'trap - ERR; restore' ERR
    cp "$work/docker-compose.users-guard.yml" "$compose"
    (cd /opt/ged_concrefer && docker compose config --quiet && docker compose up -d --no-deps backend frontend >/dev/null)
    health
    /root/ged-a6-20261015-prepared/a6_ged_qr_smoke.sh >/dev/null
    trap - ERR
    echo 'Restrição de usuários GED publicada; executar gate e smoke.'
    ;;
  rollback) restore ;;
  *) echo 'Uso: ged_users_guard_switch.sh publish|rollback' >&2; exit 2 ;;
esac

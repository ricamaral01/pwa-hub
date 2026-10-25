#!/usr/bin/env bash
# Apply only after C1 succeeds and Ricardo approves the Phase 5 mapping.
set -Eeuo pipefail
umask 077

mode=${1:-}
root=/opt/ged_concrefer
compose=$root/docker-compose.yml
candidate=/root/ged-c2-20261015/docker-compose.readonly-qr.yml
backup=/root/ged-c2-20261015/compose-before-phase5

health() {
  for _ in $(seq 1 45); do
    if curl -fsS -o /dev/null http://127.0.0.1:13071/health && \
       curl -fsS -o /dev/null http://127.0.0.1:13070/unificado/ged/login; then
      return 0
    fi
    sleep 1
  done
  return 1
}

restore() {
  test -s "$backup/docker-compose.before.yml"
  cp -a "$backup/docker-compose.before.yml" "$compose"
  (cd "$root" && docker compose config --quiet && docker compose up -d --no-deps backend frontend >/dev/null)
  health
  /root/ged-a6-20261015-prepared/a6_ged_qr_smoke.sh >/dev/null
  echo 'Compose e imagens GED anteriores restaurados; health e QR aprovados.'
}

case "$mode" in
  publish)
    test ! -e "$backup"
    test -s "$candidate"
    grep -q 'image: ged-concrefer-backend:a5-pdf-isolated' "$compose"
    grep -q 'image: ged-concrefer-frontend:a6-qr-candidate' "$compose"
    grep -q 'image: ged-concrefer-backend:c2-prepared' "$candidate"
    grep -q 'image: ged-concrefer-frontend:c2-qr-merged' "$candidate"
    test "$(grep -c 'GED_RNC_READONLY: "1"' "$candidate")" = 2
    docker image inspect ged-concrefer-backend:c2-prepared >/dev/null
    docker image inspect ged-concrefer-frontend:c2-qr-merged >/dev/null
    mkdir -m 0700 "$backup"
    cp -a "$compose" "$backup/docker-compose.before.yml"
    sha256sum "$backup/docker-compose.before.yml" > "$backup/SHA256SUMS"
    trap 'trap - ERR; restore' ERR
    cp "$candidate" "$compose"
    (cd "$root" && docker compose config --quiet && docker compose up -d --no-deps backend frontend >/dev/null)
    health
    /root/ged-a6-20261015-prepared/a6_ged_qr_smoke.sh >/dev/null
    trap - ERR
    echo 'C2 publicado em modo somente leitura; testar 410, redirect e link da NC.'
    ;;
  rollback)
    (cd "$backup" && sha256sum -c SHA256SUMS)
    restore
    ;;
  *)
    echo 'Uso: c2_switch_readonly.sh publish|rollback' >&2
    exit 2
    ;;
esac

#!/usr/bin/env bash
# Execute only in the approved GED cut window. This changes only the GED frontend image.
set -Eeuo pipefail
umask 077

mode=${1:-}
root=/opt/ged_concrefer
compose=$root/docker-compose.yml
backup=/root/ged-a6-20261015-qr-frontend-backup
old_image=ged-concrefer-frontend:a5-pdf-warning-v3
new_image=ged-concrefer-frontend:a6-qr-candidate

health() {
  for _ in $(seq 1 45); do
    if curl -fsS -o /dev/null http://127.0.0.1:13070/unificado/ged/login; then
      return 0
    fi
    sleep 1
  done
  return 1
}

restore() {
  test -s "$backup/docker-compose.before.yml"
  cp -a "$backup/docker-compose.before.yml" "$compose"
  (cd "$root" && docker compose config --quiet && docker compose up -d --no-deps frontend >/dev/null)
  health
  echo 'Frontend GED anterior restaurado e login HTTP 200.'
}

case "$mode" in
  publish)
    test ! -e "$backup"
    test "$(grep -c "image: $old_image" "$compose")" = 1
    docker image inspect "$new_image" >/dev/null
    mkdir -m 0700 "$backup"
    cp -a "$compose" "$backup/docker-compose.before.yml"
    sha256sum "$backup/docker-compose.before.yml" > "$backup/SHA256SUMS"
    trap 'trap - ERR; restore' ERR
    sed "s|image: $old_image|image: $new_image|" "$backup/docker-compose.before.yml" > "$compose"
    (cd "$root" && docker compose config --quiet && docker compose up -d --no-deps frontend >/dev/null)
    health
    trap - ERR
    echo 'Frontend GED QR publicado; executar smoke dos certificados e gate 7/7.'
    ;;
  rollback)
    (cd "$backup" && sha256sum -c SHA256SUMS)
    restore
    ;;
  *)
    echo 'Uso: a6_ged_qr_frontend_switch.sh publish|rollback' >&2
    exit 2
    ;;
esac

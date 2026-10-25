#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

mode=${1:-}
work=/root/ged-layout-20261015
live=/opt/concrefer-unificado/public/unificado
compose=/opt/ged_concrefer/docker-compose.yml
candidate=$work/shell-candidate
backup=$work/backup-retry2
files=(shell/router.js shell/shell.js shell/menu.config.js shell/shell.css
       shell/shared-menu.css sw.js VERSION index.html)

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
  for item in "${files[@]}"; do install -D -m 0644 "$backup/$item" "$live/$item"; done
  cp "$backup/docker-compose.before.yml" "$compose"
  (cd /opt/ged_concrefer && docker compose config --quiet && docker compose up -d --no-deps frontend >/dev/null)
  health
  /root/ged-a6-20261015-prepared/a6_ged_qr_smoke.sh >/dev/null
  echo 'Layout GED anterior restaurado.'
}

case "$mode" in
  publish)
    test ! -e "$backup"
    (cd "$candidate" && sha256sum -c SHA256SUMS)
    for item in "${files[@]}"; do test -s "$live/$item"; test -s "$candidate/$item"; done
    grep -q 'image: ged-concrefer-frontend:preview-signed' "$compose"
    grep -q 'image: ged-concrefer-frontend:layout-embed-v1' "$work/docker-compose.layout.yml"
    grep -q 'image: ged-concrefer-backend:preview-signed-v2' "$work/docker-compose.layout.yml"
    docker image inspect ged-concrefer-frontend:layout-embed-v1 >/dev/null
    for js in shell/router.js shell/shell.js sw.js; do
      docker run --rm --network none --user 0 --entrypoint node -v "$candidate:/check:ro" \
        ged-concrefer-frontend:layout-embed-v1 --check "/check/$js"
    done
    mkdir -m 0700 "$backup"
    for item in "${files[@]}"; do install -D -m 0600 "$live/$item" "$backup/$item"; done
    cp -a "$compose" "$backup/docker-compose.before.yml"
    (cd "$backup" && sha256sum "${files[@]}" docker-compose.before.yml > SHA256SUMS && sha256sum -c SHA256SUMS)
    trap 'trap - ERR; restore' ERR
    cp "$work/docker-compose.layout.yml" "$compose"
    (cd /opt/ged_concrefer && docker compose config --quiet && docker compose up -d --no-deps frontend >/dev/null)
    health
    for item in "${files[@]}"; do install -D -m 0644 "$candidate/$item" "$live/$item"; done
    /root/ged-a6-20261015-prepared/a6_ged_qr_smoke.sh >/dev/null
    trap - ERR
    echo 'Layout GED publicado; executar smoke visual e gate 7/7.'
    ;;
  rollback) restore ;;
  *) echo 'Uso: ged_layout_switch.sh publish|rollback' >&2; exit 2 ;;
esac

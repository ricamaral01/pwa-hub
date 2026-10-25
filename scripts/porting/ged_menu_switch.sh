#!/usr/bin/env bash
# Fixed-scope shell candidate switch. Invoke only in the approved 20h window.
set -euo pipefail
umask 077

mode=${1:-}
live=/opt/concrefer-unificado/public/unificado
candidate=/root/ged-menu-20261015-candidate
backup=/root/ged-menu-20261015-backup
files=(shell/router.js shell/shell.js shell/menu.config.js
       shell/shell.css shell/shared-menu.css sw.js VERSION index.html)

restore() {
  test -f "$backup/.complete"
  for item in "${files[@]}"; do
    install -D -m 0644 "$backup/$item" "$live/$item"
  done
  echo 'Oito arquivos do shell restaurados.'
}

case "$mode" in
  publish)
    test ! -e "$backup/.complete"
    for item in "${files[@]}"; do
      test -f "$live/$item"
      test -f "$candidate/$(basename "$item")"
      iconv -f UTF-8 -t UTF-8 "$candidate/$(basename "$item")" >/dev/null
    done
    for js in shell.js router.js menu.config.js; do
      docker run --rm --network none --user 0 --entrypoint node \
        -v "$candidate:/check:ro" ged-concrefer-frontend:a6-qr-candidate \
        --check "/check/$js"
    done
    grep -q '/unificado/ged/' "$candidate/router.js"
    grep -q '#EAB308' "$candidate/shared-menu.css"
    grep -q '#8B5CF6' "$candidate/shared-menu.css"
    (cd "$candidate" && sha256sum -c SHA256SUMS)
    for item in "${files[@]}"; do
      install -D -m 0600 "$live/$item" "$backup/$item"
    done
    touch "$backup/.complete"
    trap restore ERR
    for item in "${files[@]}"; do
      install -D -m 0644 "$candidate/$(basename "$item")" "$live/$item"
    done
    trap - ERR
    echo 'Oito arquivos do shell publicados; iniciar smoke e gate pós-publicação.'
    ;;
  rollback)
    restore
    ;;
  *)
    echo 'Uso: ged_menu_switch.sh publish|rollback' >&2
    exit 2
    ;;
esac

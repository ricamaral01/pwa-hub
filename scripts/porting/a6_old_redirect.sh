#!/usr/bin/env bash
# Apply only at the approved GED-only A6 window on vps-rh.
set -Eeuo pipefail
umask 077

mode=${1:-}
site=/etc/nginx/sites-available/ged.concretrack.com.br
candidate=/root/ged-a6-20261015-redirect-candidate.conf
backup=/root/ged-a6-20261015-nginx
expected=70c693af5d1a9bce75547811906d33dc0a659bf70e4b1ac0117c6acca73c4510

rollback() {
  test -s "$backup/vhost.before"
  cp -a "$backup/vhost.before" "$site"
  nginx -t
  systemctl reload nginx
  echo 'Vhost GED antigo restaurado; conferir respostas do domínio.'
}

case "$mode" in
  publish)
    test ! -e "$backup"
    test -s "$candidate"
    test "$(sha256sum "$site" | cut -d' ' -f1)" = "$expected"
    install -d -m 0700 "$backup"
    cp -a "$site" "$backup/vhost.before"
    sha256sum "$backup/vhost.before" > "$backup/SHA256SUMS"
    trap 'trap - ERR; rollback' ERR
    install -m 0644 "$candidate" "$site.new"
    mv -f "$site.new" "$site"
    nginx -t
    systemctl reload nginx
    trap - ERR
    echo 'Redirect 302 GED ativo; conferir QR, documentos e sistemas legados.'
    ;;
  rollback) rollback ;;
  *) echo 'Uso: a6_old_redirect.sh publish|rollback' >&2; exit 2 ;;
esac

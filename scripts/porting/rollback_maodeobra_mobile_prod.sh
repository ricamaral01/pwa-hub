#!/usr/bin/env bash
# Restore the pre-release files. Additive database columns are intentionally retained.
set -euo pipefail

backup_dir=${1:?Usage: rollback_maodeobra_mobile_prod.sh /root/backups/maodeobra-prod-TIMESTAMP}
case "$backup_dir" in
  /root/backups/maodeobra-prod-*) ;;
  *) echo "Unexpected backup directory" >&2; exit 2 ;;
esac
test -s "$backup_dir/files-before.tgz"
test -s "$backup_dir/files-before.sha256"
test -s "$backup_dir/nginx-before.conf"
sha256sum -c "$backup_dir/files-before.sha256"
tar -tzf "$backup_dir/files-before.tgz" >/dev/null

public_root=/opt/concrefer-unificado/public/unificado
failed_dir="$backup_dir/failed-release"
install -d -m 0700 "$failed_dir"
for relative in \
  pcp/static/js/maodeobra-core.js \
  pcp/static/js/maodeobra-mobile.js \
  pcp/static/css/maodeobra-mobile.css; do
  current="$public_root/$relative"
  if test -f "$current"; then
    install -d -m 0700 "$failed_dir/$(dirname "$relative")"
    mv -- "$current" "$failed_dir/$relative"
  fi
done
if test -d "$public_root/m/maodeobra"; then
  mv -- "$public_root/m/maodeobra" "$failed_dir/m-maodeobra"
fi
if test -d "$public_root/m"; then
  rmdir --ignore-fail-on-non-empty "$public_root/m"
fi

tar -C / -xzf "$backup_dir/files-before.tgz"
script_dir=$(cd -- "$(dirname -- "$0")" && pwd)
public_snapshot="$backup_dir/public-permissions-before.json"
if test -s "$public_snapshot"; then
  python3 "$script_dir/restore_maodeobra_public_permissions.py" "$public_root" "$public_snapshot"
  python3 "$script_dir/snapshot_maodeobra_public_permissions.py" "$public_root" \
    --compare "$public_snapshot"
fi
cp -- "$backup_dir/nginx-before.conf" /etc/nginx/sites-enabled/concrefer.concretrack.com.br
nginx -t
systemctl reload nginx
systemctl restart pcp-unificado-test.service
systemctl is-active --quiet pcp-unificado-test.service
echo "Previous PCP files and Nginx restored; additive columns retained. Run smoke and 7/7 gate."

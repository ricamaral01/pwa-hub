#!/usr/bin/env bash
# Execute on the new VPS before migrating the production PCP database.
set -euo pipefail

backup_dir=${1:?Usage: backup_maodeobra_mobile_prod.sh /root/backups/maodeobra-prod-TIMESTAMP}
case "$backup_dir" in
  /root/backups/maodeobra-prod-*) ;;
  *) echo "Unexpected backup directory" >&2; exit 2 ;;
esac
test ! -e "$backup_dir"
umask 077
install -d -m 0700 "$backup_dir"
script_dir=$(cd -- "$(dirname -- "$0")" && pwd)
public_root=/opt/concrefer-unificado/public/unificado
python3 "$script_dir/snapshot_maodeobra_public_permissions.py" "$public_root" \
  --output "$backup_dir/public-permissions-before.json"
namei -l "$public_root/index.html" > "$backup_dir/namei-shell-before.txt"
namei -l "$public_root/login.html" >> "$backup_dir/namei-shell-before.txt"
sudo -u www-data test -r "$public_root/index.html"
sudo -u www-data test -r "$public_root/login.html"
install -d -m 0700 "$backup_dir/db"
sudo -u postgres pg_dump -Fc pcp_unificado_teste > "$backup_dir/db/pcp.dump"
pg_restore -l "$backup_dir/db/pcp.dump" >/dev/null
sha256sum "$backup_dir/db/pcp.dump" > "$backup_dir/db/pcp.sha256"

tar -C / -czf "$backup_dir/files-before.tgz" \
  opt/concrefer-unificado/pcp-api/app/api/routers/pcp.py \
  opt/concrefer-unificado/pcp-api/app/models/producao.py \
  opt/concrefer-unificado/pcp-api/app/schemas/producao.py \
  opt/concrefer-unificado/public/unificado/pcp/maodeobra/index.html \
  opt/concrefer-unificado/public/unificado/pcp/static/js/maodeobra-grupos.js \
  opt/concrefer-unificado/public/unificado/pcp/static/js/app.js \
  opt/concrefer-unificado/public/unificado/shell/auth.js
tar -tzf "$backup_dir/files-before.tgz" >/dev/null
sha256sum "$backup_dir/files-before.tgz" > "$backup_dir/files-before.sha256"
cp -- /etc/nginx/sites-enabled/concrefer.concretrack.com.br "$backup_dir/nginx-before.conf"
sha256sum "$backup_dir/nginx-before.conf" > "$backup_dir/nginx-before.sha256"
sudo -u postgres psql -X -At -d pcp_unificado_teste \
  -c 'SELECT count(*) FROM maodeobra' > "$backup_dir/maodeobra-count-before.txt"
sudo -u postgres psql -X -At -d pcp_unificado_teste \
  -c 'SELECT count(*) FROM maodeobra_dias' > "$backup_dir/maodeobra-dias-count-before.txt"
echo "Backup verified: $backup_dir"

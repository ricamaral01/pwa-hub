#!/usr/bin/env bash
set -euo pipefail

# Run on destination as root. Retains the isolated restored database and files.
db_source=qualidade
db_restore=qualidade_b5_restore_20261015
backup_dir=/root/qualidade-b5-restore-20261015
source_files=/var/lib/qualidade/anexos
restored_files="$backup_dir/anexos-restaurados"

if [ "$(id -u)" -ne 0 ]; then echo 'root required' >&2; exit 1; fi
if runuser -u postgres -- psql -Atqc 'SELECT 1 FROM pg_database WHERE datname = '\''qualidade_b5_restore_20261015'\''' | grep -qx 1; then
  echo 'restore database already exists; refusing to replace it' >&2
  exit 1
fi
install -d -m 700 "$backup_dir"
runuser -u postgres -- pg_dump -Fc "$db_source" > "$backup_dir/qualidade.dump"
chmod 600 "$backup_dir/qualidade.dump"
runuser -u postgres -- createdb "$db_restore"
runuser -u postgres -- pg_restore --no-owner --no-privileges -d "$db_restore" < "$backup_dir/qualidade.dump"
install -d -m 700 "$restored_files"
cp -a "$source_files"/. "$restored_files"/

count_source=$(runuser -u postgres -- psql -At -d "$db_source" -c \
  'SELECT (SELECT count(*) FROM qualidade.nc),(SELECT count(*) FROM qualidade.nc_evento),(SELECT count(*) FROM qualidade.nc_anexo),(SELECT count(*) FROM qualidade.notificacao_outbox)')
count_restore=$(runuser -u postgres -- psql -At -d "$db_restore" -c \
  'SELECT (SELECT count(*) FROM qualidade.nc),(SELECT count(*) FROM qualidade.nc_evento),(SELECT count(*) FROM qualidade.nc_anexo),(SELECT count(*) FROM qualidade.notificacao_outbox)')
test "$count_source" = "$count_restore"

source_manifest="$backup_dir/anexos-origem.sha256"
restored_manifest="$backup_dir/anexos-restaurados.sha256"
(cd "$source_files" && find . -type f -print0 | sort -z | xargs -0 -r sha256sum) > "$source_manifest"
(cd "$restored_files" && find . -type f -print0 | sort -z | xargs -0 -r sha256sum) > "$restored_manifest"
cmp "$source_manifest" "$restored_manifest"

printf 'backup_dir=%s\nrestore_db=%s\ncounts_nc_event_attachment_outbox=%s\nfile_count=%s\n' \
  "$backup_dir" "$db_restore" "$count_source" "$(wc -l < "$source_manifest")"
sha256sum "$backup_dir/qualidade.dump" | cut -d' ' -f1

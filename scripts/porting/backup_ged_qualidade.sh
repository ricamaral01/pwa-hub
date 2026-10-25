#!/usr/bin/env bash
set -euo pipefail
umask 077

# Run as root on the destination. Backups stay outside public and application trees.
BACKUP_ROOT=${BACKUP_ROOT:-/var/backups/concrefer-ged-qualidade}
GED_UPLOADS=${GED_UPLOADS:-/opt/ged_concrefer/backend/uploads}
QUALITY_FILES=${QUALITY_FILES:-/var/lib/qualidade/anexos}
KEEP_DAYS=${KEEP_DAYS:-35}
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
DAY_DIR="$BACKUP_ROOT/$STAMP"
mkdir -p "$DAY_DIR"
chmod 0700 "$BACKUP_ROOT" "$DAY_DIR"

docker exec ged_postgres pg_dump -U ged_user -Fc ged_concrefer > "$DAY_DIR/ged.dump"
runuser -u postgres -- pg_dump -Fc qualidade > "$DAY_DIR/qualidade.dump"
tar --numeric-owner -C "$GED_UPLOADS" -czf "$DAY_DIR/ged-uploads.tar.gz" .
tar --numeric-owner -C "$QUALITY_FILES" -czf "$DAY_DIR/qualidade-anexos.tar.gz" .
(cd "$DAY_DIR" && sha256sum ged.dump qualidade.dump ged-uploads.tar.gz qualidade-anexos.tar.gz > SHA256SUMS)
pg_restore -l "$DAY_DIR/qualidade.dump" >/dev/null
docker exec -i ged_postgres pg_restore -l < "$DAY_DIR/ged.dump" >/dev/null
tar -tzf "$DAY_DIR/ged-uploads.tar.gz" >/dev/null
tar -tzf "$DAY_DIR/qualidade-anexos.tar.gz" >/dev/null

if [[ ${1:-} == --restore-check ]]; then
  # Real restore into two isolated, disposable PostgreSQL 16 containers.
  for kind in ged qualidade; do
    name="concrefer-restore-$kind-$$"
    docker run -d --name "$name" --network none --tmpfs /var/lib/postgresql/data:rw,size=256m \
      -e POSTGRES_PASSWORD=temporary-restore-check postgres:16-alpine >/dev/null
    trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT
    for _ in $(seq 1 60); do
      if docker exec "$name" pg_isready -U postgres >/dev/null 2>&1; then break; fi
      sleep 1
    done
    docker exec "$name" createdb -U postgres restore_check
    docker exec -i "$name" pg_restore -U postgres -d restore_check --no-owner --no-acl --exit-on-error < "$DAY_DIR/$kind.dump"
    docker exec "$name" psql -U postgres -d restore_check -At -c \
      "select count(*) from information_schema.tables where table_schema in ('public','qualidade') and table_type='BASE TABLE'" \
      > "$DAY_DIR/$kind-restored-table-count.txt"
    docker rm -f "$name" >/dev/null
    trap - EXIT
  done
  mkdir -p "$DAY_DIR/ged-restore" "$DAY_DIR/qualidade-restore"
  tar -xzf "$DAY_DIR/ged-uploads.tar.gz" -C "$DAY_DIR/ged-restore"
  tar -xzf "$DAY_DIR/qualidade-anexos.tar.gz" -C "$DAY_DIR/qualidade-restore"
  (cd "$DAY_DIR/ged-restore" && find . -type f | sort) > "$DAY_DIR/ged-restored-files.txt"
  (cd "$DAY_DIR/qualidade-restore" && find . -type f | sort) > "$DAY_DIR/qualidade-restored-files.txt"
fi

find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +"$KEEP_DAYS" -exec rm -rf -- {} +
echo "$DAY_DIR"

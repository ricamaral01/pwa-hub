#!/usr/bin/env bash
# Execute on vps-rh only after the 19h GO and at T0 of the A6 window.
set -euo pipefail
umask 077

out=/root/ged-a6-20261015-final
uploads=/opt/ged_concrefer/backend/uploads
if [[ ${1:-} == verify-freeze ]]; then
  test -s "$out/counts.txt"
  test -s "$out/audit.count"
  current=$(docker exec ged_postgres psql -U ged_user -d ged_concrefer -X -At \
    -c 'SELECT (SELECT count(*) FROM users),(SELECT count(*) FROM documents),(SELECT count(*) FROM versions),(SELECT count(*) FROM rnc_reports);')
  current_audit=$(docker exec ged_postgres psql -U ged_user -d ged_concrefer -X -At \
    -c 'SELECT count(*) FROM audit_logs;')
  test "$current" = "$(cat "$out/counts.txt")"
  test "$current_audit" = "$(cat "$out/audit.count")"
  test "$(find "$uploads" -type f | wc -l)" = "$(cat "$out/files.count")"
  (cd /opt/ged_concrefer/backend && sha256sum -c "$out/uploads.sha256" >/dev/null)
  echo 'Contagens, auditoria e hashes dos arquivos GED origem inalterados desde o dump.'
  exit 0
fi
test "${1:-}" = ''
test ! -e "$out"
test -d "$uploads"
test "$(docker ps --filter name='^/ged_postgres$' --format '{{.Names}}')" = ged_postgres
mkdir -m 0700 "$out"

docker exec ged_postgres pg_dump -U ged_user -d ged_concrefer -Fc > "$out/ged_concrefer.dump"
test -s "$out/ged_concrefer.dump"
tar --numeric-owner -C /opt/ged_concrefer/backend -cf "$out/uploads.tar" uploads
test -s "$out/uploads.tar"
docker exec -i ged_postgres pg_restore -l < "$out/ged_concrefer.dump" > /dev/null

docker exec ged_postgres psql -U ged_user -d ged_concrefer -X -At \
  -c 'SELECT (SELECT count(*) FROM users),(SELECT count(*) FROM documents),(SELECT count(*) FROM versions),(SELECT count(*) FROM rnc_reports);' \
  > "$out/counts.txt"
IFS='|' read -r users documents versions rncs < "$out/counts.txt"
test "$users" = 4 && test "$rncs" = 3 || {
  echo 'Contagem GED mudou; parar antes da restauração.' >&2
  exit 1
}
test "$documents" -ge 1 && test "$versions" -ge 1
find "$uploads" -type f | wc -l > "$out/files.count"
(cd /opt/ged_concrefer/backend && find uploads -type f -print0 | sort -z | xargs -0 -r sha256sum) \
  > "$out/uploads.sha256"
docker exec ged_postgres psql -U ged_user -d ged_concrefer -X -At \
  -c 'SELECT count(*) FROM audit_logs;' > "$out/audit.count"
sha256sum "$out/ged_concrefer.dump" "$out/uploads.tar" "$out/counts.txt" \
  "$out/files.count" "$out/audit.count" "$out/uploads.sha256" > "$out/SHA256SUMS"
echo 'Dump final e uploads capturados na VPS antiga; conferir contagens e hashes privados.'

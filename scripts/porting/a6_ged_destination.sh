#!/usr/bin/env bash
# GED-only cutover on vps-staging. Run after 20h GO. Never touches Quality or C2.
set -Eeuo pipefail
umask 077

mode=${1:-}
root=/root/ged-a6-20261015-final
backup=/root/ged-a6-20261015-dest-backup
compose=/opt/ged_concrefer
backend=/opt/ged_concrefer/backend
uploads=$backend/uploads

check_source() {
  test -s "$root/ged_concrefer.dump"
  test -s "$root/uploads.tar"
  test -s "$root/counts.txt"
  test -s "$root/files.count"
  test -s "$root/audit.count"
  test -s "$root/uploads.sha256"
  test -s "$root/SHA256SUMS"
  test -s "$root/a3-rewrite-destination.sql"
  (cd "$root" && sha256sum -c SHA256SUMS)
  docker exec -i ged_postgres pg_restore -l < "$root/ged_concrefer.dump" >/dev/null
  tar -tf "$root/uploads.tar" >/dev/null
}

check_live() {
  docker exec ged_postgres psql -U ged_user -d ged_concrefer -X -At \
    -c 'SELECT (SELECT count(*) FROM users),(SELECT count(*) FROM documents),(SELECT count(*) FROM versions),(SELECT count(*) FROM rnc_reports);'
}

wait_health() {
  for _ in $(seq 1 45); do
    if curl -fsS -o /dev/null http://127.0.0.1:13071/health && \
       curl -fsS -o /dev/null http://127.0.0.1:13070/unificado/ged/login; then
      echo 'GED destino backend e frontend HTTP 200.'
      return 0
    fi
    sleep 1
  done
  return 1
}

backup_destination() {
  test ! -e "$backup"
  mkdir -m 0700 "$backup"
  docker exec ged_postgres pg_dump -U ged_user -d ged_concrefer -Fc > "$backup/ged-before.dump"
  tar --numeric-owner -C "$backend" -cf "$backup/uploads-before.tar" uploads
  cp -a "$compose/docker-compose.yml" "$backup/docker-compose.before.yml"
  (cd "$backup" && sha256sum ged-before.dump uploads-before.tar docker-compose.before.yml > SHA256SUMS)
  docker exec -i ged_postgres pg_restore -l < "$backup/ged-before.dump" >/dev/null
  tar -tf "$backup/uploads-before.tar" >/dev/null
  touch "$backup/.complete"
  echo 'Backup GED destino completo; contagens antes do corte:'
  check_live
}

restore_previous() {
  test -f "$backup/.complete"
  (cd "$backup" && sha256sum -c SHA256SUMS)
  (cd "$compose" && docker compose stop frontend backend)
  docker exec ged_postgres dropdb --if-exists --force -U ged_user ged_concrefer
  docker exec ged_postgres createdb -U ged_user ged_concrefer
  docker exec -i ged_postgres pg_restore -U ged_user -d ged_concrefer \
    --no-owner --no-acl --exit-on-error < "$backup/ged-before.dump" \
    > "$backup/rollback-pg-restore.log" 2>&1
  if test -d "$backup/uploads.before"; then
    test ! -e "$backup/uploads.failed"
    if test -e "$uploads"; then mv "$uploads" "$backup/uploads.failed"; fi
    mv "$backup/uploads.before" "$uploads"
  fi
  (cd "$compose" && docker compose start backend frontend)
  wait_health
  echo 'GED destino anterior restaurado; confirmar health e login.'
  check_live
}

apply_source() {
  test -f "$backup/.complete"
  test ! -e "$backup/uploads.before"
  check_source
  (cd "$backup" && sha256sum -c SHA256SUMS)
  on_error() {
    trap - ERR
    echo 'Falha no GED destino; iniciando retorno imediato.' >&2
    restore_previous
    exit 1
  }
  trap on_error ERR
  (cd "$compose" && docker compose stop frontend backend)
  docker exec ged_postgres dropdb --if-exists --force -U ged_user ged_concrefer
  docker exec ged_postgres createdb -U ged_user ged_concrefer
  docker exec -i ged_postgres pg_restore -U ged_user -d ged_concrefer \
    --no-owner --no-acl --exit-on-error < "$root/ged_concrefer.dump" \
    > "$backup/apply-pg-restore.log" 2>&1
  docker exec ged_postgres psql -U ged_user -d ged_concrefer -X -v ON_ERROR_STOP=1 \
    -c 'ALTER TABLE versions ADD COLUMN IF NOT EXISTS processing_warning TEXT;' \
    > "$backup/additive-ddl.log" 2>&1
  docker exec -i ged_postgres psql -U ged_user -d ged_concrefer -X -v ON_ERROR_STOP=1 \
    < "$root/a3-rewrite-destination.sql" > "$backup/a3-rewrite.log" 2>&1
  mv "$uploads" "$backup/uploads.before"
  tar --numeric-owner -C "$backend" -xf "$root/uploads.tar"
  (cd "$backend" && sha256sum -c "$root/uploads.sha256" > "$backup/uploads-verify.log")
  (cd "$compose" && docker compose start backend frontend)
  wait_health
  echo 'GED origem restaurado no destino; contagens após o corte:'
  actual=$(check_live)
  echo "$actual"
  test "$actual" = "$(cat "$root/counts.txt")"
  actual_audit=$(docker exec ged_postgres psql -U ged_user -d ged_concrefer -X -At \
    -c 'SELECT count(*) FROM audit_logs;')
  test "$actual_audit" = "$(cat "$root/audit.count")"
  test "$(find "$uploads" -type f | wc -l)" = "$(cat "$root/files.count")"
  a5=$(docker exec ged_postgres psql -U ged_user -d ged_concrefer -X -At -c \
    "SELECT (SELECT count(*) FROM users WHERE id IN ('aacce92c-d7ab-439e-a732-1f6358614f8f','93f94cd5-34e6-4250-b835-8662e3c0ae4a','693792d8-91b1-4f49-9c4f-2e89c5fba615')),(SELECT count(*) FROM documents WHERE code='E2E-A5-2026'),(SELECT count(*) FROM tasks WHERE id='b7ed9e58-156e-4440-8281-1e4fd406be81'),(SELECT count(*) FROM calibration_certificates WHERE id IN ('d24102dc-ad44-423d-b6e7-39599b837353','96719bf2-61c1-4d4b-bf7b-9b09b5973bbe','c5f1c9b2-984b-4aa7-9ae7-be4df3e08e76'));" )
  test "$a5" = '0|0|0|0'
  role=$(docker exec ged_postgres psql -U ged_user -d ged_concrefer -X -At -c \
    "SELECT role FROM users WHERE email='ricardo@concrefer.com.br';")
  test -n "$role"
  if test "$role" != ADMIN_MASTER; then
    docker exec ged_postgres psql -U ged_user -d ged_concrefer -X -v ON_ERROR_STOP=1 \
      -c "UPDATE users SET role='ADMIN_MASTER' WHERE email='ricardo@concrefer.com.br';" >/dev/null
  fi
  ricardo=$(docker exec ged_postgres psql -U ged_user -d ged_concrefer -X -At -c \
    "SELECT u.role,(SELECT count(*) FROM user_permissions p WHERE p.user_id=u.id AND p.effect='deny') FROM users u WHERE u.email='ricardo@concrefer.com.br';")
  test "$ricardo" = 'ADMIN_MASTER|0'
  trap - ERR
}

case "$mode" in
  check) check_source ;;
  backup) backup_destination ;;
  apply) apply_source ;;
  rollback) restore_previous ;;
  *) echo 'Uso: a6_ged_destination.sh check|backup|apply|rollback' >&2; exit 2 ;;
esac

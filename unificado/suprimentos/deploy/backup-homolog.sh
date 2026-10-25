#!/usr/bin/env bash
set -euo pipefail
base=/opt/concrefer-unificado/homolog-next
stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup="$base/backups/suprimentos-s1-$stamp"
mkdir -p "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  etc/nginx/sites-available/unificado-homolog.conf \
  etc/nginx/snippets \
  etc/systemd/system/unificado-homolog-mapa.service \
  opt/concrefer-unificado/homolog-next/public/unificado \
  opt/concrefer-unificado/homolog-next/mapa-api/app.py \
  opt/concrefer-unificado/homolog-next/mapa-api/screen_access.py \
  opt/concrefer-unificado/homolog-next/mapa-api/screen_catalog.json
find "$base/public/unificado" "$base/mapa-api/app.py" "$base/mapa-api/screen_access.py" \
  "$base/mapa-api/screen_catalog.json" /etc/nginx/sites-available/unificado-homolog.conf \
  /etc/nginx/snippets -printf '%m %u %g %p\n' > "$backup/permissions-before.txt"
sha256sum "$base/mapa-api/app.py" "$base/mapa-api/screen_access.py" \
  "$base/mapa-api/screen_catalog.json" "$base/public/unificado/shell/router.js" \
  > "$backup/hashes-before.txt"
set -a
# Contém DSN da homologação; nunca imprimimos o valor.
. /etc/concrefer-unificado/homolog/mapa-auth.env
set +a
dsn="${MAPA_AUTH_DATABASE_URL/postgresql+psycopg:/postgresql:}"
pg_dump "$dsn" --format=custom --data-only \
  --table=unificado_auth.user_screen_permissions \
  --table=unificado_auth.user_action_permissions \
  --file="$backup/permissions-before.dump"
chmod 0700 "$backup"
chmod 0600 "$backup"/*
printf '%s\n' "$backup"

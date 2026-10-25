#!/usr/bin/env bash
set -euo pipefail
umask 077
folder=/opt/concretrack-dosagem/backups
target="$folder/dosagem-$(date -u +%Y%m%dT%H%M%SZ).dump"
url="${DATABASE_URL/postgresql+psycopg:\/\//postgresql:\/\/}"
pg_dump -Fc --dbname="$url" --file="$target"
find "$folder" -maxdepth 1 -name 'dosagem-*.dump' -type f -mtime +14 -delete

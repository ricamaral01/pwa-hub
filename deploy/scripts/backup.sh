#!/usr/bin/env bash
set -euo pipefail
dest=/opt/concretrack-dosagem/backups
mkdir -p "$dest"
umask 077
tmp="$dest/dosagem-$(date +%Y%m%d-%H%M%S).dump.partial"
final="${tmp%.partial}"
trap 'rm -f "$tmp"' EXIT
"/opt/concretrack-dosagem/current/api/.venv/bin/python" - "$tmp" <<'PY'
import os, subprocess, sys
from urllib.parse import urlsplit, unquote
u = urlsplit(os.environ['DATABASE_URL'].replace('postgresql+psycopg://', 'postgresql://', 1))
env = os.environ.copy()
env['PGPASSWORD'] = unquote(u.password or '')
with open(sys.argv[1], 'wb') as output:
    subprocess.run(['pg_dump', '-Fc', '-h', u.hostname or '127.0.0.1', '-p', str(u.port or 5432),
                    '-U', unquote(u.username or 'dosagem_app'), '-d', u.path.lstrip('/')],
                   check=True, env=env, stdout=output)
PY
mv "$tmp" "$final"
trap - EXIT
find "$dest" -maxdepth 1 -type f -name 'dosagem-*.dump' -mmin +20160 -delete
printf 'Backup criado: %s\n' "$final"

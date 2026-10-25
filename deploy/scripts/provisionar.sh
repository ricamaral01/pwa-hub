#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) -eq 0 ]] || { echo 'Execute como root.' >&2; exit 1; }
ram_kb=$(awk '/MemAvailable:/ {print $2}' /proc/meminfo)
free_kb=$(df -Pk /opt | awk 'NR==2 {print $4}')
(( ram_kb >= 300*1024 && free_kb >= 2*1024*1024 )) || { echo 'Recursos insuficientes: exigidos 300 MB RAM disponível e 2 GB livres em /opt.' >&2; exit 1; }
root=/opt/concretrack-dosagem
source_dir=${1:?Uso: provisionar.sh <diretorio-com-api-e-deploy>}
[[ -f "$source_dir/api/.env.example" && -f "$source_dir/deploy/nginx/api-dosagem.conf" ]] || exit 1
[[ -x /opt/concretrack-dosagem/bin/python3.12 ]] || { echo 'Python 3.12 isolado ausente em /opt/concretrack-dosagem/bin.' >&2; exit 1; }
[[ -f "$root/shared/.env" ]] || { echo "Crie $root/shared/.env antes do provisionamento." >&2; exit 1; }
[[ $(stat -c %a "$root/shared/.env") == 600 ]] || { echo 'Use chmod 600 no .env.' >&2; exit 1; }
[[ -x $(command -v nginx) ]] || { echo 'nginx não instalado: integre ao servidor web existente antes de continuar.' >&2; exit 1; }
if ! command -v psql >/dev/null; then
  apt-get update
  apt-get install -y postgresql
fi
if ! id ctdosagem >/dev/null 2>&1; then useradd --system --home-dir "$root" --shell /usr/sbin/nologin ctdosagem; fi
mkdir -p "$root/releases" "$root/backups" /var/www/concretrack-dosagem-acme
chown -R ctdosagem:ctdosagem "$root/releases" "$root/backups" "$root/shared"
chmod 700 "$root/shared" "$root/backups"
chmod 600 "$root/shared/.env"

# Não imprime o segredo. O SQL é enviado por stdin ao psql local do postgres.
set -a
source "$root/shared/.env"
set +a
[[ ${DATABASE_URL:-} ]] || { echo 'DATABASE_URL ausente.' >&2; exit 1; }
python3 - <<'PY' | runuser -u postgres -- psql -X -v ON_ERROR_STOP=1 -q postgres
import os
from urllib.parse import urlsplit, unquote
u = urlsplit(os.environ['DATABASE_URL'].replace('postgresql+psycopg://', 'postgresql://', 1))
assert unquote(u.username or '') == 'dosagem_app' and u.path == '/concretrack_dosagem'
def q(s): return "'" + s.replace("'", "''") + "'"
pw = unquote(u.password or '')
assert pw
print("SELECT 'CREATE ROLE dosagem_app LOGIN NOSUPERUSER PASSWORD ' || quote_literal(" + q(pw) + ") WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='dosagem_app') \\gexec")
print("ALTER ROLE dosagem_app WITH LOGIN NOSUPERUSER PASSWORD " + q(pw) + ";")
print("SELECT 'CREATE DATABASE concretrack_dosagem OWNER dosagem_app' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname='concretrack_dosagem') \\gexec")
PY

if [[ ! -L "$root/current" ]] || [[ ! ${PORTA:-} =~ ^[0-9]+$ ]] || (( PORTA < 18300 || PORTA > 18399 )); then
  for candidate in $(seq 18300 18399); do
    if ! ss -ltn "sport = :$candidate" | grep -q LISTEN; then PORTA=$candidate; break; fi
  done
  sed -i "/^PORTA=/d" "$root/shared/.env"
  printf 'PORTA=%s\n' "$PORTA" >> "$root/shared/.env"
fi
[[ ${PORTA:-} ]] || { echo 'Nenhuma porta livre.' >&2; exit 1; }
cp "$source_dir/deploy/systemd/"* /etc/systemd/system/
sed "s/__PORTA__/$PORTA/g" "$source_dir/deploy/nginx/api-dosagem.conf" > /etc/nginx/sites-available/api-dosagem.concretrack.com.br.conf
ln -sfn /etc/nginx/sites-available/api-dosagem.concretrack.com.br.conf /etc/nginx/sites-enabled/api-dosagem.concretrack.com.br.conf
nginx -t
systemctl reload nginx
systemctl daemon-reload
systemctl enable --now concretrack-dosagem-backup.timer
echo "Provisionamento concluído na porta $PORTA."

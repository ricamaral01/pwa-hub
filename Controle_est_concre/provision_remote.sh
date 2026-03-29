#!/usr/bin/env bash
set -euo pipefail

DB_NAME="controle_est_concre_db"
DB_USER="controle_est_concre_user"
DB_PASS="1idb2TwYNtzHgkBrnAUafQRh"
APP_DIR="/root/Controle_est_concre"
APP_PORT="3086"
PUBLIC_PORT="8086"

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl gnupg nginx

if ! command -v node >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
  apt-get update
  apt-get install -y nodejs
fi

npm install -g pm2
mkdir -p "$APP_DIR"

sudo -u postgres psql <<SQL
DO
\$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
SQL

sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || sudo -u postgres createdb -O ${DB_USER} ${DB_NAME}

cat > "$APP_DIR/.env" <<ENV
PORT=${APP_PORT}
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=${DB_NAME}
PGUSER=${DB_USER}
PGPASSWORD=${DB_PASS}
ENV

cd "$APP_DIR"
npm install --omit=dev
export PGPASSWORD="$DB_PASS"
psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -f schema.sql
pm2 delete controle-est-concre-api >/dev/null 2>&1 || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root >/tmp/pm2_startup.txt 2>&1 || true

cp nginx.controle_est_concre.conf /etc/nginx/sites-available/controle_est_concre
ln -sfn /etc/nginx/sites-available/controle_est_concre /etc/nginx/sites-enabled/controle_est_concre
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

ufw allow ${PUBLIC_PORT}/tcp >/dev/null 2>&1 || true

printf "APP_DIR=%s\n" "$APP_DIR"
printf "DB_NAME=%s\n" "$DB_NAME"
printf "DB_USER=%s\n" "$DB_USER"
printf "APP_PORT=%s\n" "$APP_PORT"
printf "PUBLIC_PORT=%s\n" "$PUBLIC_PORT"
curl -sS "http://127.0.0.1:${APP_PORT}/health"
curl -sS "http://127.0.0.1:${PUBLIC_PORT}/health"

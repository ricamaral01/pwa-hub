#!/usr/bin/env bash
# Scoped deployment on the NEW VPS. Never deploy the mixed repository tree.
set -Eeuo pipefail
umask 077
action="${1:-}"
payload="${2:-}"
base=/opt/concrefer-unificado
public="$base/public/unificado"
service="$base/suprimentos"
map="$base/mapa-api"
vhost=/etc/nginx/sites-enabled/concrefer.concretrack.com.br
snippet=/etc/nginx/snippets/suprimentos-unificado-prod.conf
dropin=/etc/systemd/system/mapa-unificado-auth.service.d/suprimentos.conf
envdir=/etc/concrefer-unificado/prod
backup_root="$base/backups"
version=1.0.95
db_name=suprimentos_prod
db_role=concrefer_suprimentos_prod

shared=(
  opt/concrefer-unificado/mapa-api/app.py
  opt/concrefer-unificado/mapa-api/screen_catalog.json
  opt/concrefer-unificado/public/unificado/index.html
  opt/concrefer-unificado/public/unificado/VERSION
  opt/concrefer-unificado/public/unificado/sw.js
  opt/concrefer-unificado/public/unificado/shell/menu.config.js
  opt/concrefer-unificado/public/unificado/shell/router.js
  opt/concrefer-unificado/public/unificado/shell/shell.js
  opt/concrefer-unificado/public/unificado/shell/modelo-a/menu.js
  etc/nginx/sites-enabled/concrefer.concretrack.com.br
)

rollback() {
  local backup="$1"
  trap - ERR
  test -f "$backup/files-before.tgz" || { echo 'No backup for rollback' >&2; return 1; }
  systemctl disable --now suprimentos-prod-fechamento.timer suprimentos-prod-nf-worker.timer suprimentos-prod.service >/dev/null 2>&1 || true
  if test "$(runuser -u postgres -- psql -Atqc "SELECT count(*) FROM pg_database WHERE datname='$db_name'")" = 1; then
    runuser -u postgres -- psql -d "$db_name" -c "UPDATE suprimentos.sup_flag SET habilitado=false WHERE unidade_id=1" >/dev/null 2>&1 || true
    runuser -u postgres -- psql -d "$db_name" -c "DELETE FROM suprimentos.sup_usuario_papel WHERE criado_por='deploy:suprimentos:20261026'" >/dev/null 2>&1 || true
  fi
  tar -C / -xzf "$backup/files-before.tgz"
  rm -f "$snippet" "$dropin"
  if test -d "$public/suprimentos"; then
    mv "$public/suprimentos" "$service/public-rolled-back-$(date -u +%s)"
  fi
  systemctl daemon-reload
  systemctl restart mapa-unificado-auth.service
  nginx -t
  systemctl reload nginx
  test "$(cat "$public/VERSION")" = 1.0.58
  echo "ROLLBACK_OK $backup"
}

if test "$action" = rollback; then
  rollback "$payload"
  exit 0
fi
test "$action" = install
test -d "$payload/overlay"
test -f "$payload/module/service/requirements.txt"
test -f "$payload/suprimentos-production.nginx.conf"
test "$(cat "$public/VERSION")" = 1.0.58
test ! -e "$snippet" && test ! -e "$dropin" && test ! -d "$public/suprimentos"
if test -d "$service" || test -d "$envdir"; then
  # A previous attempt returned before publishing shared files.
  test -d "$service" && test -d "$envdir"
  grep -qx 'SUPRIMENTOS_EXPECTED_DATABASE=suprimentos_prod' "$envdir/suprimentos.env"
  test "$(runuser -u postgres -- psql -At -d "$db_name" -c 'SELECT version_num FROM alembic_version')" = sup_0012
  test "$(runuser -u postgres -- psql -At -d "$db_name" -c 'SELECT count(*) FROM suprimentos.sup_solicitacao')" = 0
fi
if ss -lnt | grep -q ':13267 '; then echo 'Port 13267 occupied' >&2; exit 1; fi
test "$(systemctl is-active mapa-unificado-auth.service)" = active
nginx -t >/dev/null

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup="$backup_root/suprimentos-prod-$stamp"
install -d -m 0700 -o root -g root "$backup"
tar -C / -czf "$backup/files-before.tgz" "${shared[@]}"
tar -tzf "$backup/files-before.tgz" >/dev/null
stat -c '%a %U:%G %n' "${shared[@]/#//}" > "$backup/permissions-before.txt"
sha256sum "${shared[@]/#//}" > "$backup/hashes-before.txt"
set -a
. /etc/mapa-unificado/auth.env
set +a
auth_dsn="${MAPA_AUTH_DATABASE_URL/postgresql+psycopg:/postgresql:}"
pg_dump "$auth_dsn" -Fc --data-only \
  --table=unificado_auth.user_screen_permissions \
  --table=unificado_auth.user_action_permissions \
  -f "$backup/permissions-before.dump"
pg_restore -l "$backup/permissions-before.dump" >/dev/null
chmod 0600 "$backup"/*
echo "BACKUP_OK $backup"
trap 'echo "INSTALL_FAILED line=$LINENO: rollback" >&2; rollback "$backup"' ERR

if ! id -u concrefer-suprimentos >/dev/null 2>&1; then
  useradd --system --no-create-home --shell /usr/sbin/nologin concrefer-suprimentos
fi
systemctl disable --now suprimentos-prod.service >/dev/null 2>&1 || true
install -d -m 0755 -o root -g root "$service" "$service/service" "$service/migrations"
install -d -m 0700 -o concrefer-suprimentos -g concrefer-suprimentos "$service/data" "$service/data/photos"
cp -a "$payload/module/service/." "$service/service/"
cp -a "$payload/module/migrations/." "$service/migrations/"
find "$service/service" "$service/migrations" -type d -exec chmod 0755 {} +
find "$service/service" "$service/migrations" -type f -exec chmod 0644 {} +
chown -R root:root "$service/service" "$service/migrations"
if ! test -x "$service/venv/bin/python"; then python3 -m venv "$service/venv"; fi
"$service/venv/bin/pip" -q install -r "$service/service/requirements.txt"
chmod -R a+rX "$service/venv"

if ! test -f "$envdir/suprimentos.env"; then
  db_password="$(openssl rand -hex 24)"
  signing_key="$(openssl rand -hex 32)"
  test "$(runuser -u postgres -- psql -Atqc "SELECT count(*) FROM pg_roles WHERE rolname='$db_role'")" = 0
  test "$(runuser -u postgres -- psql -Atqc "SELECT count(*) FROM pg_database WHERE datname='$db_name'")" = 0
  runuser -u postgres -- psql -v ON_ERROR_STOP=1 >/dev/null <<SQL
CREATE ROLE $db_role LOGIN PASSWORD '$db_password';
SQL
  runuser -u postgres -- createdb -O "$db_role" "$db_name"
  install -d -m 0700 -o root -g root "$envdir"
  cat > "$envdir/suprimentos.env" <<EOF
SUPRIMENTOS_DATABASE_URL=postgresql+psycopg://$db_role:$db_password@127.0.0.1:5432/$db_name
SUPRIMENTOS_EXPECTED_DATABASE=$db_name
SUPRIMENTOS_MIGRATION_DATABASE_URL=postgresql+psycopg://$db_role:$db_password@127.0.0.1:5432/$db_name
SUPRIMENTOS_ENVIRONMENT=production
SUPRIMENTOS_UPLOAD_DIR=$service/data/photos
SUPRIMENTOS_PUBLIC_DIR=$base/public
SUPRIMENTOS_GATEWAY_SIGNING_KEY=$signing_key
EOF
  cat > "$envdir/suprimentos-gateway.env" <<EOF
SUPRIMENTOS_GATEWAY_SIGNING_KEY=$signing_key
SUPRIMENTOS_INTERNAL_URL=http://127.0.0.1:13267
EOF
  chmod 0600 "$envdir"/*.env
else
  sed -i 's/:13067$/:13267/' "$envdir/suprimentos-gateway.env"
fi
set -a
. "$envdir/suprimentos.env"
set +a
(cd "$service" && "$service/venv/bin/alembic" -c migrations/alembic.ini upgrade head)
test "$(runuser -u postgres -- psql -At -d "$db_name" -c 'SELECT version_num FROM alembic_version')" = sup_0012

install -d -m 0755 -o root -g root "$public/suprimentos"
for folder in frontend painel solicitacoes solicitacao nova fornecedores cadastros cotacoes almoxarifado inventario recebimento analises pwa; do
  install -d -m 0755 -o root -g root "$public/suprimentos/$folder"
  cp -a "$payload/module/$folder/." "$public/suprimentos/$folder/"
done
find "$public/suprimentos" -type d -exec chmod 0755 {} +
find "$public/suprimentos" -type f -exec chmod 0644 {} +
chown -R root:root "$public/suprimentos"

cat > /etc/systemd/system/suprimentos-prod.service <<EOF
[Unit]
Description=Suprimentos production API
After=network-online.target postgresql.service
[Service]
Type=simple
User=concrefer-suprimentos
Group=concrefer-suprimentos
WorkingDirectory=$service/service
EnvironmentFile=$envdir/suprimentos.env
ExecStart=$service/venv/bin/uvicorn suprimentos.main:app --host 127.0.0.1 --port 13267 --workers 1
Restart=on-failure
RestartSec=3
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=$service/data
[Install]
WantedBy=multi-user.target
EOF
for item in fechamento nf-worker; do
  if test "$item" = fechamento; then module=close_delivered; else module=nf_worker; fi
  cat > "/etc/systemd/system/suprimentos-prod-$item.service" <<EOF
[Unit]
Description=Suprimentos production $item
After=network-online.target postgresql.service
[Service]
Type=oneshot
User=concrefer-suprimentos
Group=concrefer-suprimentos
WorkingDirectory=$service/service
EnvironmentFile=$envdir/suprimentos.env
ExecStart=$service/venv/bin/python -m suprimentos.$module
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=$service/data
EOF
done
cat > /etc/systemd/system/suprimentos-prod-fechamento.timer <<EOF
[Unit]
Description=Suprimentos production hourly closing
[Timer]
OnCalendar=hourly
Persistent=true
Unit=suprimentos-prod-fechamento.service
[Install]
WantedBy=timers.target
EOF
cat > /etc/systemd/system/suprimentos-prod-nf-worker.timer <<EOF
[Unit]
Description=Suprimentos production NF worker
[Timer]
OnBootSec=2min
OnUnitInactiveSec=1min
Unit=suprimentos-prod-nf-worker.service
[Install]
WantedBy=timers.target
EOF
chmod 0644 /etc/systemd/system/suprimentos-prod*service /etc/systemd/system/suprimentos-prod*timer
systemctl daemon-reload
systemctl enable --now suprimentos-prod.service >/dev/null
for n in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS http://127.0.0.1:13267/api/suprimentos/health > "$backup/health.json"; then break; fi
  sleep 1
done
test -s "$backup/health.json"
grep -q '"modulo":"suprimentos"' "$backup/health.json"

# Shared files are installed only after the isolated API is healthy.
for path in "${shared[@]:0:9}"; do
  install -m 0644 "$payload/overlay/${path#opt/concrefer-unificado/}" "/$path"
done
install -m 0644 "$payload/suprimentos-production.nginx.conf" "$snippet"
install -d -m 0755 /etc/systemd/system/mapa-unificado-auth.service.d
printf '[Service]\nEnvironmentFile=%s/suprimentos-gateway.env\n' "$envdir" > "$dropin"
chmod 0644 "$dropin"
python3 - "$vhost" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1]); content = p.read_text()
anchor = '    include /etc/nginx/snippets/unificado-screen-access.conf;\n'
assert content.count(anchor) == 1
content = content.replace(anchor, anchor + '    include /etc/nginx/snippets/suprimentos-unificado-prod.conf;\n', 1)
p.write_text(content)
PY
systemctl daemon-reload
systemctl restart mapa-unificado-auth.service
test "$(systemctl is-active mapa-unificado-auth.service)" = active
nginx -t
systemctl reload nginx
echo 'GATE_SHARED_APPLIED'
test "$(cat "$public/VERSION")" = "$version"

# The master exemption already provides all ten screen grants. Add business
# roles only to currently active masters; no DEMO users or IAM mutations.
masters="$(psql "$auth_dsn" -At -c "SELECT id FROM public.usuarios WHERE id IN ('user-ricardo','marcelo','alex') AND ativo AND NOT primeiro_acesso AND deleted_at IS NULL ORDER BY id")"
test -n "$masters"
echo 'GATE_MASTERS_FOUND'
while IFS= read -r master; do
  for role in ADMIN APROVADOR:1 APROVADOR:2; do
    kind="${role%%:*}"; level="${role#*:}"
    if test "$kind" = ADMIN; then level=NULL; fi
    runuser -u postgres -- psql -v ON_ERROR_STOP=1 -d "$db_name" >/dev/null <<SQL
INSERT INTO suprimentos.sup_usuario_papel
  (id,iam_user_id,unidade_id,papel,cc_id,nivel,criado_por,atualizado_por)
VALUES (gen_random_uuid(),'$master',1,'$kind',NULL,$level,'deploy:suprimentos:20261026','deploy:suprimentos:20261026')
ON CONFLICT DO NOTHING;
SQL
  done
done <<< "$masters"
printf '%s\n' "$masters" > "$backup/masters-granted.txt"
chmod 0600 "$backup/masters-granted.txt"
runuser -u postgres -- psql -v ON_ERROR_STOP=1 -d "$db_name" >/dev/null <<'SQL'
UPDATE suprimentos.sup_flag SET habilitado=true, atualizado_por='deploy:suprimentos:20261026'
WHERE unidade_id=1 AND fase IN ('S0','S1','S2','S3A','S3B','S5');
SQL
test "$(runuser -u postgres -- psql -At -d "$db_name" -c "SELECT count(*) FROM suprimentos.sup_flag WHERE unidade_id=1 AND fase IN ('S0','S1','S2','S3A','S3B','S5') AND habilitado")" = 6
systemctl enable --now suprimentos-prod-fechamento.timer suprimentos-prod-nf-worker.timer >/dev/null
nginx -t >/dev/null
test "$(systemctl is-active suprimentos-prod.service)" = active
test "$(systemctl is-active mapa-unificado-auth.service)" = active
test "$(curl -s -o /dev/null -w '%{http_code}' https://concrefer.concretrack.com.br/api/suprimentos/health)" = 401
test "$(curl -s -o /dev/null -w '%{http_code}' https://concrefer.concretrack.com.br/unificado/)" = 200
test "$(curl -s -o /dev/null -w '%{http_code}' https://concrefer.concretrack.com.br/unificado/suprimentos/painel/)" = 403
if find "$service/service" "$service/migrations" "$public/suprimentos" -type f \( -perm -0002 -o -perm -0020 \) | grep -q .; then
  echo 'Unsafe file mode' >&2; false
fi
for path in "${shared[@]:0:9}"; do sha256sum "/$path"; done > "$backup/hashes-after.txt"
trap - ERR
echo "PRODUCTION_INSTALL_OK $backup version=$version masters=$(echo "$masters" | wc -l)"

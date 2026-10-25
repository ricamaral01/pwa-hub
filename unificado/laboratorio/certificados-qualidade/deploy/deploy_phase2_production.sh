#!/usr/bin/env bash
set -euo pipefail

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
base=/opt/concrefer-unificado
backup="$base/backups/cq-production-$stamp"
code="$base/cq"
data=/var/lib/concrefer-cq
gateway="$base/mapa-api"
shell="$base/public/unificado/shell"
nginx=/etc/nginx/snippets/laboratorio-unificado.conf
service=/etc/systemd/system/cq-laboratorio.service
db=concretrack_postes
mkdir -p "$backup/gateway" "$backup/shell/modelo-a"
chmod 0700 "$backup"
cp -a "$gateway/app.py" "$gateway/screen_access.py" "$gateway/screen_catalog.json" "$backup/gateway/"
cp -a "$shell/menu.config.js" "$shell/router.js" "$backup/shell/"
cp -a "$shell/modelo-a/menu.js" "$backup/shell/modelo-a/"
cp -a "$nginx" "$backup/nginx-before.conf"
if [[ -f "$service" ]]; then cp -a "$service" "$backup/service-before"; fi
if [[ -d "$code" ]]; then cp -a "$code" "$backup/code-before"; fi
stat -c '%n %U:%G %a' "$gateway/app.py" "$gateway/screen_access.py" "$gateway/screen_catalog.json" \
  "$shell/menu.config.js" "$shell/modelo-a/menu.js" "$shell/router.js" "$nginx" > "$backup/permissions-before.txt"
sudo -u postgres pg_dump -Fc -d "$db" > "$backup/laboratorio-before.dump"
initial="$(sudo -u postgres psql -d "$db" -Atc "SELECT to_regclass('public.cq_certificados') IS NOT NULL")"
rollback() {
  echo 'CQ production gate failed; restoring gateway, menu, Nginx and source route.' >&2
  systemctl stop cq-laboratorio.service >/dev/null 2>&1 || true
  cp -a "$backup/gateway/." "$gateway/"
  cp -a "$backup/shell/menu.config.js" "$backup/shell/router.js" "$shell/"
  cp -a "$backup/shell/modelo-a/menu.js" "$shell/modelo-a/"
  cp -a "$backup/nginx-before.conf" "$nginx"
  if [[ -f "$backup/service-before" ]]; then cp -a "$backup/service-before" "$service"; else rm -f "$service"; fi
  systemctl daemon-reload
  systemctl restart mapa-unificado-auth.service || true
  nginx -t >/dev/null 2>&1 && systemctl reload nginx || true
  if [[ "$initial" == f ]]; then
    cat "$code/migrations/999_rollback.sql" | sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db" >/dev/null || true
  fi
  if [[ -f "$backup/service-before" ]]; then systemctl restart cq-laboratorio.service || true; fi
  echo "Rolled back; backup: $backup" >&2
}
trap rollback ERR

install -d -o monitorconcreto -g monitorconcreto -m 0750 "$code"
tar -xzf /tmp/cq-phase2-release.tar.gz -C "$code"
chown -R monitorconcreto:monitorconcreto "$code"
find "$code" -type d -exec chmod 0750 {} +
find "$code" -type f -exec chmod 0640 {} +
install -d -o monitorconcreto -g monitorconcreto -m 0700 "$data" "$data/pdf"
install -o monitorconcreto -g monitorconcreto -m 0400 \
  "$base/homolog/data/cq/assinatura-marcelo.png" "$data/assinatura-marcelo.png"
install -o monitorconcreto -g monitorconcreto -m 0600 \
  "$base/homolog/data/cq/legacy-readonly.json" "$data/legacy-readonly.json"
install -o root -g root -m 0644 /tmp/cq-phase2-production.service "$service"

python3 /tmp/cq-phase2-patch-gateway.py gateway "$gateway"
python3 /tmp/cq-phase2-patch-gateway.py menu "$shell/menu.config.js"
python3 /tmp/cq-phase2-patch-gateway.py model_a "$shell/modelo-a/menu.js"
python3 /tmp/cq-phase2-patch-gateway.py router "$shell/router.js"
chmod 0644 "$gateway/app.py" "$gateway/screen_access.py" "$gateway/screen_catalog.json" \
  "$shell/menu.config.js" "$shell/modelo-a/menu.js" "$shell/router.js"
python3 /tmp/cq-phase2-insert-nginx.py "$nginx" /tmp/cq-phase2-nginx-production.conf
chmod 0644 "$nginx"
nginx -t

cat "$code/migrations/001_schema.sql" | sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db" >/dev/null
for table in cq_parametros cq_modelos_poste cq_prensas cq_sequencias cq_certificados cq_itens cq_resultados_data; do
  sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db" -c "ALTER TABLE $table OWNER TO postes_app" >/dev/null
done
cat "$code/migrations/002_seed_modelos_existentes.sql" | sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db" >/dev/null
cat "$code/migrations/003_seed_prensa_existente.sql" | sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db" >/dev/null
cd "$code"
sudo -u monitorconcreto /opt/monitor_concreto/.venv/bin/python \
  deploy/import_legacy_with_env.py "$data/legacy-readonly.json"

systemctl daemon-reload
systemctl enable cq-laboratorio.service >/dev/null
systemctl restart mapa-unificado-auth.service
systemctl restart cq-laboratorio.service
systemctl reload nginx
ready=0
for attempt in {1..20}; do
  if curl --fail --silent http://127.0.0.1:13074/health >/dev/null; then ready=1; break; fi
  sleep 1
done
test "$ready" = 1
check() {
  local path="$1" expected="$2" actual
  actual="$(curl -sS -o /dev/null -w '%{http_code}' "https://concrefer.concretrack.com.br$path")"
  test "$actual" = "$expected" || { echo "$path: $actual/$expected" >&2; return 1; }
}
check /unificado/laboratorio/certificados-qualidade/ 302
check /v/CQ-2026-0001 200
check /unificado/ 200
check /unificado/login.html 200
check /unificado/pcp/api/dashboard 403
check /unificado/mapa/api/health 200
check /unificado/laboratorio/ 302
check /unificado/qualidade/api/health 401
check /unificado/ged/calibrations/verify/b3e3ac18-01fa-40d2-9629-9390b60e5dfc 200
sudo -u www-data test -r "$shell/menu.config.js"
sudo -u www-data test -r "$shell/modelo-a/menu.js"
sudo -u www-data test -r "$shell/router.js"
sudo -u www-data test -r "$gateway/app.py"
test -z "$(find "$code" "$data" -perm /0002 -print -quit)"
test -z "$(find "$gateway/app.py" "$gateway/screen_access.py" "$gateway/screen_catalog.json" \
  "$shell/menu.config.js" "$shell/modelo-a/menu.js" "$shell/router.js" "$nginx" -perm /0002 -print -quit)"
test "$(systemctl is-active cq-laboratorio.service)" = active
stat -c '%n %U:%G %a' "$code" "$data" "$data/assinatura-marcelo.png" "$gateway/app.py" \
  "$shell/menu.config.js" "$shell/modelo-a/menu.js" "$shell/router.js" "$nginx" > "$backup/permissions-after.txt"
trap - ERR
echo "CQ production deployed with CQ_FONTE_CP=novo; gate 7/7. Backup: $backup"

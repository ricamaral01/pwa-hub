#!/usr/bin/env bash
set -euo pipefail

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
base=/opt/concrefer-unificado
backup="$base/homolog/backups/cq-$stamp"
code="$base/homolog/cq"
data="$base/homolog/data/cq"
gateway="$base/homolog-next/mapa-api"
menu="$base/homolog-next/public/unificado/shell/menu.config.js"
modela="$base/homolog-next/public/unificado/shell/modelo-a/menu.js"
router="$base/homolog-next/public/unificado/shell/router.js"
nginx=/etc/nginx/snippets/laboratorio-unificado-homolog.conf
mkdir -p "$backup"
chmod 0700 "$backup"
printf '%s\n' "$backup" >/tmp/cq-last-homolog-backup
stat -c '%n %U:%G %a' "$gateway" "$gateway/app.py" "$gateway/screen_access.py" "$gateway/screen_catalog.json" "$menu" "$modela" "$router" "$nginx" >"$backup/permissions-before.txt"
cp -a "$gateway/app.py" "$gateway/screen_access.py" "$gateway/screen_catalog.json" "$menu" "$modela" "$router" "$nginx" "$backup/"
sudo -u postgres pg_dump -Fc -d concretrack_postes_homolog >"$backup/laboratorio-before.dump"
initial="$(sudo -u postgres psql -d concretrack_postes_homolog -Atc "SELECT to_regclass('public.cq_certificados') IS NOT NULL")"
rollback() {
  echo 'Deployment failed; restoring homolog gateway, menu and Nginx.' >&2
  cp -a "$backup/app.py" "$backup/screen_access.py" "$backup/screen_catalog.json" "$gateway/"
  cp -a "$backup/menu.config.js" "$menu"
  cp -a "$backup/menu.js" "$modela"
  cp -a "$backup/router.js" "$router"
  cp -a "$backup/laboratorio-unificado-homolog.conf" "$nginx"
  systemctl stop cq-laboratorio-homolog.service >/dev/null 2>&1 || true
  systemctl restart unificado-homolog-mapa.service >/dev/null 2>&1 || true
  nginx -t >/dev/null 2>&1 && systemctl reload nginx || true
  if [[ "$initial" == f && -f "$code/migrations/999_rollback.sql" ]]; then
    cat "$code/migrations/999_rollback.sql" | sudo -u postgres psql -v ON_ERROR_STOP=1 -d concretrack_postes_homolog >/dev/null || true
  fi
}
trap rollback ERR

install -d -o monitorconcreto -g monitorconcreto -m 0750 "$code"
tar -xzf /tmp/cq-release.tar.gz -C "$code"
chown -R monitorconcreto:monitorconcreto "$code"
find "$code" -type d -exec chmod 0750 {} +
find "$code" -type f -exec chmod 0640 {} +
install -d -o monitorconcreto -g monitorconcreto -m 0700 "$data" "$data/pdf"
install -o monitorconcreto -g monitorconcreto -m 0400 /tmp/cq-assinatura-marcelo.png "$data/assinatura-marcelo.png"
install -o root -g root -m 0644 /tmp/cq-laboratorio-homolog.service /etc/systemd/system/cq-laboratorio-homolog.service

cp /tmp/app.py "$gateway/app.py"
cp /tmp/screen_access.py "$gateway/screen_access.py"
cp /tmp/screen_catalog.json "$gateway/screen_catalog.json"
chown --reference="$backup/app.py" "$gateway/app.py"
chown --reference="$backup/screen_access.py" "$gateway/screen_access.py"
chown --reference="$backup/screen_catalog.json" "$gateway/screen_catalog.json"
chmod --reference="$backup/app.py" "$gateway/app.py"
chmod --reference="$backup/screen_access.py" "$gateway/screen_access.py"
chmod --reference="$backup/screen_catalog.json" "$gateway/screen_catalog.json"
cp /tmp/cq-homolog-menu.config.js "$menu"
chown --reference="$backup/menu.config.js" "$menu"
chmod --reference="$backup/menu.config.js" "$menu"
cp /tmp/cq-homolog-modelo-a-menu.js "$modela"
chown --reference="$backup/menu.js" "$modela"
chmod --reference="$backup/menu.js" "$modela"
cp /tmp/cq-homolog-router.js "$router"
chown --reference="$backup/router.js" "$router"
chmod --reference="$backup/router.js" "$router"
python3 /tmp/insert_nginx.py "$nginx" /tmp/nginx-homolog.conf
nginx -t

systemctl daemon-reload
cat "$code/migrations/001_schema.sql" | sudo -u postgres psql -v ON_ERROR_STOP=1 -d concretrack_postes_homolog >/dev/null
for table in cq_parametros cq_modelos_poste cq_prensas cq_sequencias cq_certificados cq_itens cq_resultados_data; do
  sudo -u postgres psql -v ON_ERROR_STOP=1 -d concretrack_postes_homolog -c "ALTER TABLE $table OWNER TO postes_app" >/dev/null
done
cat "$code/migrations/002_seed_modelos_existentes.sql" | sudo -u postgres psql -v ON_ERROR_STOP=1 -d concretrack_postes_homolog >/dev/null
systemctl restart unificado-homolog-mapa.service
systemctl enable cq-laboratorio-homolog.service
systemctl restart cq-laboratorio-homolog.service
systemctl reload nginx
ready=0
for attempt in {1..20}; do
  if curl --fail --silent http://127.0.0.1:13075/health; then ready=1; break; fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then echo 'CQ health failed' >&2; exit 1; fi
echo
stat -c '%n %U:%G %a' "$code" "$data" "$data/assinatura-marcelo.png" "$gateway/app.py" "$menu" "$modela" "$router" "$nginx" >"$backup/permissions-after.txt"
if find "$code" "$data" -perm /0002 -print | grep -q .; then
  echo 'World-writable CQ path found' >&2
  exit 1
fi
trap - ERR
echo "Homolog CQ deployed. Backup: $backup"

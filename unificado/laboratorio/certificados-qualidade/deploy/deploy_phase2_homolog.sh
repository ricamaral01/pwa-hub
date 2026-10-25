#!/usr/bin/env bash
set -euo pipefail

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
base=/opt/concrefer-unificado
backup="$base/homolog/backups/cq-phase2-$stamp"
code="$base/homolog/cq"
service=/etc/systemd/system/cq-laboratorio-homolog.service
nginx=/etc/nginx/snippets/laboratorio-unificado-homolog.conf
mkdir -p "$backup"
chmod 0700 "$backup"
cp -a "$code" "$service" "$nginx" "$backup/"
stat -c '%n %U:%G %a' "$code" "$service" "$nginx" "$base/homolog/data/cq" > "$backup/permissions-before.txt"
sudo -u postgres pg_dump -Fc -d concretrack_postes_homolog > "$backup/laboratorio-before.dump"
rollback() {
  echo 'Phase 2 homolog failed; restoring code and service.' >&2
  cp -a "$backup/cq/." "$code/"
  cp -a "$backup/cq-laboratorio-homolog.service" "$service"
  systemctl daemon-reload
  systemctl restart cq-laboratorio-homolog.service || true
}
trap rollback ERR

tar -xzf /tmp/cq-phase2-release.tar.gz -C "$code"
chown -R monitorconcreto:monitorconcreto "$code"
find "$code" -type d -exec chmod 0750 {} +
find "$code" -type f -exec chmod 0640 {} +
cat "$code/migrations/004_responsavel_padrao.sql" | sudo -u postgres psql -v ON_ERROR_STOP=1 -d concretrack_postes_homolog >/dev/null
install -o root -g root -m 0644 /tmp/cq-phase2-homolog.service "$service"
systemctl daemon-reload
systemctl restart cq-laboratorio-homolog.service
ready=0
for attempt in {1..20}; do
  if curl --fail --silent http://127.0.0.1:13075/health >/dev/null; then ready=1; break; fi
  sleep 1
done
test "$ready" = 1
test "$(curl -sS -o /dev/null -w '%{http_code}' https://concrefer.concretrack.com.br:18446/unificado/laboratorio/certificados-qualidade/)" = 302
nginx -t
check() {
  local path="$1" expected="$2" actual
  actual="$(curl -sS -o /dev/null -w '%{http_code}' "https://concrefer.concretrack.com.br:18446$path")"
  test "$actual" = "$expected" || { echo "$path: $actual/$expected" >&2; return 1; }
}
check /unificado/ 200
check /unificado/login.html 200
check /unificado/pcp/api/dashboard 401
check /unificado/mapa/api/health 200
check /unificado/laboratorio/ 302
check /unificado/qualidade/api/health 401
check /unificado/ged/calibrations/verify/b3e3ac18-01fa-40d2-9629-9390b60e5dfc 200
stat -c '%n %U:%G %a' "$code" "$service" "$nginx" "$base/homolog/data/cq" > "$backup/permissions-after.txt"
test -z "$(find "$code" "$base/homolog/data/cq" -perm /0002 -print -quit)"
test "$(systemctl is-active cq-laboratorio-homolog.service)" = active
trap - ERR
echo "Homolog phase 2 deployed; gate 7/7. Backup: $backup"

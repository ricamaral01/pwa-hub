#!/usr/bin/env bash
set -euo pipefail
action="${1:?install ou rollback}"; backup="${2:?diretorio de backup}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"; service="$base/suprimentos/service"
package=/tmp/sup-f4-package
case "$backup" in "$base"/backups/suprimentos-f4-*) ;; *) exit 2;; esac
set -a
. /etc/concrefer-unificado/homolog/suprimentos.env
. /etc/concrefer-unificado/homolog/mapa-auth.env
set +a
test "$SUPRIMENTOS_ENVIRONMENT" = homolog
dsn="${SUPRIMENTOS_DATABASE_URL/postgresql+psycopg:/postgresql:}"
rollback(){
  trap - ERR
  "$base/suprimentos/venv/bin/alembic" -c "$base/suprimentos/migrations/alembic.ini" downgrade sup_0010 || true
  tar -C / -xzf "$backup/files-before.tgz"
  rm -f "$service/suprimentos/api/integracao.py" "$service/suprimentos/integration_auth.py" \
    "$base/suprimentos/migrations/versions/0011_laboratorio_contrato.py"
  systemctl restart suprimentos-homolog.service
  nginx -t; systemctl reload nginx
  echo F4_ROLLBACK_OK
}
if test "$action" = rollback; then rollback; exit; fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.81
for file in main.py integracao.py integration_auth.py solicitacoes.py 0011_laboratorio_contrato.py app.js; do test -s "$package/$file"; done
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/main.py \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/api/solicitacoes.py \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/frontend/app.js \
  opt/concrefer-unificado/homolog-next/public/unificado/{index.html,sw.js,VERSION} \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/pwa/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/{painel,solicitacoes,solicitacao,nova,fornecedores,cadastros,cotacoes,almoxarifado,inventario,recebimento}/index.html
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$service/suprimentos/main.py" "$public/suprimentos/frontend/app.js" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
pg_dump --format=custom --file="$backup/suprimentos-before.dump" "$dsn"
chmod 0600 "$backup/suprimentos-before.dump"
trap 'echo F4_FAILED >&2; rollback' ERR
install -o root -g root -m 0644 "$package/main.py" "$service/suprimentos/main.py"
install -o root -g root -m 0644 "$package/integration_auth.py" "$service/suprimentos/integration_auth.py"
for file in integracao.py solicitacoes.py; do install -o root -g root -m 0644 "$package/$file" "$service/suprimentos/api/$file"; done
install -o root -g root -m 0644 "$package/0011_laboratorio_contrato.py" "$base/suprimentos/migrations/versions/0011_laboratorio_contrato.py"
install -o root -g root -m 0644 "$package/app.js" "$public/suprimentos/frontend/app.js"
cd "$base/suprimentos/migrations"
"$base/suprimentos/venv/bin/alembic" -c alembic.ini upgrade head
python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{name}/index.html' for name in ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros','cotacoes','almoxarifado','inventario','recebimento')]
for name in files:
    path=root/name; data=path.read_text(); assert '1.0.81' in data,name
    path.write_text(data.replace('1.0.81','1.0.82'))
(root/'VERSION').write_text('1.0.82\n')
PY
test "$(psql "$dsn" -Atqc "SELECT habilitado FROM suprimentos.sup_flag WHERE unidade_id=1 AND fase='S4'")" = f
systemctl restart suprimentos-homolog.service
nginx -t; systemctl reload nginx
ready=false
for attempt in {1..20}; do if curl -fsS http://127.0.0.1:13167/api/suprimentos/health >/dev/null 2>&1; then ready=true; break; fi; sleep .5; done
test "$ready" = true
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" "$backup/smoke-43.json"
trap - ERR
echo F4_OK

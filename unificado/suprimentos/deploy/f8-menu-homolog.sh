#!/usr/bin/env bash
set -euo pipefail
action="${1:?install ou rollback}"; backup="${2:?backup}"
base=/opt/concrefer-unificado/homolog-next; public="$base/public/unificado"
case "$backup" in "$base"/backups/suprimentos-f8-menu-*) ;; *) exit 2;; esac
rollback(){ trap - ERR; tar -C / -xzf "$backup/files-before.tgz"; nginx -t; systemctl reload nginx; echo F8_MENU_ROLLBACK_OK; }
if test "$action" = rollback; then rollback; exit; fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.91
set -a
. /etc/concrefer-unificado/homolog/suprimentos.env
set +a
test "$SUPRIMENTOS_ENVIRONMENT" = homolog
dsn="${SUPRIMENTOS_DATABASE_URL/postgresql+psycopg:/postgresql:}"
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/public/unificado/{index.html,sw.js,VERSION} \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/modelo-a/menu.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/pwa/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/{painel,solicitacoes,solicitacao,nova,fornecedores,cadastros,cotacoes,almoxarifado,inventario,recebimento,analises}/index.html
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$public/index.html" "$public/sw.js" "$public/shell/shell.js" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
pg_dump --format=custom --file="$backup/suprimentos-before.dump" "$dsn"
chmod 0600 "$backup/suprimentos-before.dump"
trap 'echo F8_MENU_FAILED >&2; rollback' ERR
install -o root -g root -m 0644 /tmp/suprimentos-f8-menu.js "$public/shell/modelo-a/menu.js"
python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1]);files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{name}/index.html' for name in ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros','cotacoes','almoxarifado','inventario','recebimento','analises')]
for name in files:
    path=root/name;value=path.read_text();assert '1.0.91' in value,name
    path.write_text(value.replace('1.0.91','1.0.92'))
(root/'VERSION').write_text('1.0.92\n')
PY
nginx -t; systemctl reload nginx
test "$(curl -fsS http://127.0.0.1:13167/api/suprimentos/health | python3 -c 'import json,sys;print(json.load(sys.stdin)["ok"])')" = True
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" "$backup/smoke-43.json"
trap - ERR
echo F8_MENU_HOMOLOG_OK

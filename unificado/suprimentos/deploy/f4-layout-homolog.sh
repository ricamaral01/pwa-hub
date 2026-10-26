#!/usr/bin/env bash
set -euo pipefail
action="${1:?install ou rollback}"; backup="${2:?backup}"
base=/opt/concrefer-unificado/homolog-next; public="$base/public/unificado"
case "$backup" in "$base"/backups/suprimentos-f4-layout-*) ;; *) exit 2;; esac
rollback(){ trap - ERR; tar -C / -xzf "$backup/files-before.tgz"; nginx -t; systemctl reload nginx; echo F4_LAYOUT_ROLLBACK_OK; }
if test "$action" = rollback; then rollback; exit; fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.83
test -s /tmp/sup-f4-package/app.js; test -s /tmp/sup-f4-package/app.css
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/frontend/{app.js,app.css} \
  opt/concrefer-unificado/homolog-next/public/unificado/{index.html,sw.js,VERSION} \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/pwa/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/{painel,solicitacoes,solicitacao,nova,fornecedores,cadastros,cotacoes,almoxarifado,inventario,recebimento}/index.html
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$public/suprimentos/frontend/app.js" "$public/suprimentos/frontend/app.css" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
trap 'echo F4_LAYOUT_FAILED >&2; rollback' ERR
for file in app.js app.css; do install -o root -g root -m 0644 "/tmp/sup-f4-package/$file" "$public/suprimentos/frontend/$file"; done
python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1]); files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{name}/index.html' for name in ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros','cotacoes','almoxarifado','inventario','recebimento')]
for name in files:
    path=root/name; value=path.read_text(); assert '1.0.83' in value,name
    path.write_text(value.replace('1.0.83','1.0.84'))
(root/'VERSION').write_text('1.0.84\n')
PY
nginx -t; systemctl reload nginx
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" "$backup/smoke-43.json"
trap - ERR
echo F4_LAYOUT_OK

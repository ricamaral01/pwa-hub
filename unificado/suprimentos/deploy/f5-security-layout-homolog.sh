#!/usr/bin/env bash
set -euo pipefail
action="${1:?install ou rollback}"; backup="${2:?backup}"
base=/opt/concrefer-unificado/homolog-next; public="$base/public/unificado"
case "$backup" in "$base"/backups/suprimentos-f5-security-*) ;; *) exit 2;; esac
rollback(){ trap - ERR; tar -C / -xzf "$backup/files-before.tgz"; systemctl restart suprimentos-homolog.service; nginx -t; systemctl reload nginx; echo F5_SECURITY_ROLLBACK_OK; }
if test "$action" = rollback; then rollback; exit; fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.86
for file in analises.py analises.js analises.css; do test -s "/tmp/sup-f5-package/$file"; done
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/api/analises.py \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/frontend/{analises.js,analises.css} \
  opt/concrefer-unificado/homolog-next/public/unificado/{index.html,sw.js,VERSION} \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/pwa/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/{painel,solicitacoes,solicitacao,nova,fornecedores,cadastros,cotacoes,almoxarifado,inventario,recebimento,analises}/index.html
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$base/suprimentos/service/suprimentos/api/analises.py" \
  "$public/suprimentos/frontend/analises.js" "$public/suprimentos/frontend/analises.css" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
trap 'echo F5_SECURITY_FAILED >&2; rollback' ERR
install -o root -g root -m 0644 /tmp/sup-f5-package/analises.py "$base/suprimentos/service/suprimentos/api/analises.py"
for file in analises.js analises.css; do install -o root -g root -m 0644 "/tmp/sup-f5-package/$file" "$public/suprimentos/frontend/$file"; done
python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1]);files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{name}/index.html' for name in ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros','cotacoes','almoxarifado','inventario','recebimento','analises')]
for name in files:
    path=root/name;value=path.read_text();assert '1.0.86' in value,name
    path.write_text(value.replace('1.0.86','1.0.87'))
(root/'VERSION').write_text('1.0.87\n')
PY
systemctl restart suprimentos-homolog.service
nginx -t; systemctl reload nginx
ready=false
for attempt in {1..20}; do if curl -fsS http://127.0.0.1:13167/api/suprimentos/health >/dev/null 2>&1; then ready=true; break; fi; sleep .5; done
test "$ready" = true
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" "$backup/smoke-43.json"
trap - ERR
echo F5_SECURITY_OK

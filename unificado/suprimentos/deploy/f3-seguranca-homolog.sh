#!/usr/bin/env bash
set -euo pipefail
action="${1:?install ou rollback}";backup="${2:?backup}"
base=/opt/concrefer-unificado/homolog-next;public="$base/public/unificado"
service="$base/suprimentos/service"
case "$backup" in "$base"/backups/suprimentos-f3-seguranca-*) ;; *) exit 2;; esac
rollback(){ trap - ERR; tar -C / -xzf "$backup/files-before.tgz"; systemctl restart suprimentos-homolog.service; nginx -t; systemctl reload nginx; echo F3_SEGURANCA_ROLLBACK_OK; }
if test "$action" = rollback;then rollback;exit;fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.80
test -s /tmp/sup-f3-package/recebimento.py
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/api/recebimento.py \
  opt/concrefer-unificado/homolog-next/public/unificado/{index.html,sw.js,VERSION} \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/pwa/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/{painel,solicitacoes,solicitacao,nova,fornecedores,cadastros,cotacoes,almoxarifado,inventario,recebimento}/index.html
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$service/suprimentos/api/recebimento.py" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
trap 'echo F3_SEGURANCA_FAILED >&2;rollback' ERR
install -o root -g root -m 0644 /tmp/sup-f3-package/recebimento.py "$service/suprimentos/api/recebimento.py"
python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1]);files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{name}/index.html' for name in ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros','cotacoes','almoxarifado','inventario','recebimento')]
for name in files:
    p=root/name;s=p.read_text();assert '1.0.80' in s,name;p.write_text(s.replace('1.0.80','1.0.81'))
(root/'VERSION').write_text('1.0.81\n')
PY
systemctl restart suprimentos-homolog.service
nginx -t;systemctl reload nginx
ready=false
for attempt in {1..20};do if curl -fsS http://127.0.0.1:13167/api/suprimentos/health >/dev/null 2>&1;then ready=true;break;fi;sleep .5;done
test "$ready" = true
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" "$backup/smoke-43.json"
trap - ERR;echo F3_SEGURANCA_OK

#!/usr/bin/env bash
set -euo pipefail
action="${1:?install ou rollback}"
backup="${2:?diretorio de backup}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"
service="$base/suprimentos/service"
package=/tmp/sup-f1-ui-polish
case "$backup" in "$base"/backups/suprimentos-f1-iqf-*) ;; *) exit 2;; esac
rollback() {
  trap - ERR
  tar -C / -xzf "$backup/files-before.tgz"
  systemctl restart suprimentos-homolog.service
  nginx -t
  systemctl reload nginx
  echo F1_IQF_ROLLBACK_OK
}
if test "$action" = rollback; then rollback; exit; fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.68
test -s "$package/compras.py"
test -s "$package/compras.js"
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/api/compras.py \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/frontend/compras.js \
  opt/concrefer-unificado/homolog-next/public/unificado/index.html \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js \
  opt/concrefer-unificado/homolog-next/public/unificado/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/pwa/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/VERSION \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/{painel,solicitacoes,solicitacao,nova,fornecedores,cadastros,cotacoes}/index.html
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$service/suprimentos/api/compras.py" "$public/suprimentos/frontend/compras.js" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
trap 'echo F1_IQF_FAILED >&2; rollback' ERR
install -o root -g root -m 0644 "$package/compras.py" "$service/suprimentos/api/compras.py"
install -o root -g root -m 0644 "$package/compras.js" "$public/suprimentos/frontend/compras.js"
python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{name}/index.html' for name in
          ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros','cotacoes')]
for name in files:
    path=root/name; data=path.read_text(encoding='utf-8')
    assert '1.0.68' in data,name
    path.write_text(data.replace('1.0.68','1.0.69'),encoding='utf-8')
(root/'VERSION').write_text('1.0.69\n',encoding='utf-8')
PY
systemctl restart suprimentos-homolog.service
nginx -t
systemctl reload nginx
ready=false
for attempt in {1..20}; do
  if curl -fsS http://127.0.0.1:13167/api/suprimentos/health >/dev/null 2>&1; then ready=true; break; fi
  sleep 0.5
done
test "$ready" = true
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py \
  "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" \
  "$backup/smoke-43.json"
trap - ERR
echo "F1_IQF_OK $backup"

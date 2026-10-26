#!/usr/bin/env bash
set -euo pipefail
action="${1:?install ou rollback}"
backup="${2:?diretorio de backup}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"
case "$backup" in "$base"/backups/suprimentos-f1-mobile-*) ;; *) exit 2;; esac
rollback() {
  trap - ERR
  tar -C / -xzf "$backup/files-before.tgz"
  nginx -t
  systemctl reload nginx
  echo F1_MOBILE_ROLLBACK_OK
}
if test "$action" = rollback; then rollback; exit; fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.69
test -s /tmp/sup-f1-mobile-compras.css
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/frontend/compras.css \
  opt/concrefer-unificado/homolog-next/public/unificado/index.html \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js \
  opt/concrefer-unificado/homolog-next/public/unificado/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/pwa/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/VERSION \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/{painel,solicitacoes,solicitacao,nova,fornecedores,cadastros,cotacoes}/index.html
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$public/suprimentos/frontend/compras.css" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
trap 'echo F1_MOBILE_FAILED >&2; rollback' ERR
install -o root -g root -m 0644 /tmp/sup-f1-mobile-compras.css "$public/suprimentos/frontend/compras.css"
python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{name}/index.html' for name in
          ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros','cotacoes')]
for name in files:
    path=root/name; data=path.read_text(encoding='utf-8')
    assert '1.0.69' in data,name
    path.write_text(data.replace('1.0.69','1.0.70'),encoding='utf-8')
(root/'VERSION').write_text('1.0.70\n',encoding='utf-8')
PY
nginx -t
systemctl reload nginx
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py \
  "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" \
  "$backup/smoke-43.json"
trap - ERR
echo "F1_MOBILE_OK $backup"

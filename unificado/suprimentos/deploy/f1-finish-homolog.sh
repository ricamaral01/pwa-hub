#!/usr/bin/env bash
set -euo pipefail
action="${1:?install ou rollback}"
backup="${2:?backup}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"
service="$base/suprimentos/service"
package=/tmp/sup-f1-finish
case "$backup" in "$base"/backups/suprimentos-f1-finish-*) ;; *) exit 2;; esac
rollback(){
  trap - ERR
  tar -C / -xzf "$backup/files-before.tgz"
  systemctl restart suprimentos-homolog.service
  nginx -t
  systemctl reload nginx
  echo "F1_FINISH_ROLLBACK_OK"
}
if test "$action" = rollback; then rollback; exit; fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.63
for name in compras.py app.js compras.js compras.css; do test -s "$package/$name"; done
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/api/compras.py \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos \
  opt/concrefer-unificado/homolog-next/public/unificado/index.html \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js \
  opt/concrefer-unificado/homolog-next/public/unificado/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/VERSION
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$service/suprimentos/api/compras.py" \
 "$public/suprimentos/frontend/compras.js" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
trap 'echo F1_FINISH_FAILED >&2; rollback' ERR
install -o root -g root -m 0644 "$package/compras.py" "$service/suprimentos/api/compras.py"
for name in app.js compras.js compras.css; do
  install -o root -g root -m 0644 "$package/$name" "$public/suprimentos/frontend/$name"
done
python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{name}/index.html' for name in
          ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros','cotacoes')]
for name in files:
    path=root/name; data=path.read_text(encoding='utf-8')
    assert '1.0.63' in data,name
    path.write_text(data.replace('1.0.63','1.0.64'),encoding='utf-8')
(root/'VERSION').write_text('1.0.64\n',encoding='utf-8')
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
echo "F1_FINISH_OK $backup"

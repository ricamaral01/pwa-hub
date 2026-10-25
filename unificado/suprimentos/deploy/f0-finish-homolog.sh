#!/usr/bin/env bash
# Conclui os rótulos do histórico S1 somente em homolog-next/:18446.
set -euo pipefail
action="${1:?install ou rollback}"
backup="${2:?backup absoluto protegido}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"
package=/tmp/suprimentos-f0-package
test "${backup#"$base/backups/"}" != "$backup"
test -d "$base/suprimentos/service"

rollback() {
  trap - ERR
  tar -C / -xzf "$backup/files-before.tgz"
  systemctl restart suprimentos-homolog.service
  nginx -t
  systemctl reload nginx
  echo "F0_ROLLBACK_OK $backup"
}

if test "$action" = rollback; then rollback; exit 0; fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.61
test -f "$package/solicitacoes.py"
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/api/solicitacoes.py \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos \
  opt/concrefer-unificado/homolog-next/public/unificado/index.html \
  opt/concrefer-unificado/homolog-next/public/unificado/VERSION \
  opt/concrefer-unificado/homolog-next/public/unificado/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$base/suprimentos/service/suprimentos/api/solicitacoes.py" \
  "$public/suprimentos/frontend/app.js" "$public/suprimentos/pwa/app.js" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
trap 'echo F0_INSTALL_FAILED >&2; rollback' ERR
install -o root -g root -m 0644 "$package/solicitacoes.py" "$base/suprimentos/service/suprimentos/api/solicitacoes.py"
install -o root -g root -m 0644 "$package/frontend-app.js" "$public/suprimentos/frontend/app.js"
install -o root -g root -m 0644 "$package/pwa-app.js" "$public/suprimentos/pwa/app.js"
python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{name}/index.html' for name in ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros')]
for rel in files:
    path=root/rel
    data=path.read_text(encoding='utf-8')
    if '1.0.61' not in data:
        raise RuntimeError(f'versão anterior ausente: {rel}')
    path.write_text(data.replace('1.0.61','1.0.62'),encoding='utf-8',newline='\n')
(root/'VERSION').write_text('1.0.62\n',encoding='utf-8')
PY
systemctl restart suprimentos-homolog.service
nginx -t
systemctl reload nginx
test "$(cat "$public/VERSION")" = 1.0.62
ready=false
for attempt in 1 2 3 4 5 6 7 8 9 10; do
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
echo "F0_INSTALL_OK $backup"

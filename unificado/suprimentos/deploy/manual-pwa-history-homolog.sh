#!/usr/bin/env bash
set -euo pipefail
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"
backup="$base/backups/suprimentos-pwa-history-20261025T224500Z"
test "$(cat "$public/VERSION")" = 1.0.61
test -f /tmp/suprimentos-manual-pwa-app.js
test -f /tmp/suprimentos-manual-pwa-sw.js
test -f /tmp/suprimentos-manual-nav.js
test -f /tmp/suprimentos-manual-nav.css
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" opt/concrefer-unificado/homolog-next/public/unificado
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$public/suprimentos/pwa/app.js" "$public/suprimentos/pwa/sw.js" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
rollback() {
  trap - ERR
  tar -C / -xzf "$backup/files-before.tgz" opt/concrefer-unificado/homolog-next/public/unificado
  nginx -t
  systemctl reload nginx
  echo MANUAL_PWA_ROLLBACK_OK
}
trap rollback ERR
install -o root -g root -m 0644 /tmp/suprimentos-manual-pwa-app.js "$public/suprimentos/pwa/app.js"
install -o root -g root -m 0644 /tmp/suprimentos-manual-pwa-sw.js "$public/suprimentos/pwa/sw.js"
install -o root -g root -m 0644 /tmp/suprimentos-manual-nav.js "$public/shell/navigation.js"
install -o root -g root -m 0644 /tmp/suprimentos-manual-nav.css "$public/shell/navigation.css"
python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
for rel, changes in {
    'index.html': (('navigation.css?v=1.0.61','navigation.css?v=1.0.61-r2'),
                   ('navigation.js?v=1.0.61','navigation.js?v=1.0.61-r2')),
    'sw.js': (('concrefer-unificado-shell-v1.0.61',
               'concrefer-unificado-shell-v1.0.61-r2'),),
}.items():
    path=root/rel
    data=path.read_text(encoding='utf-8')
    for before,after in changes:
        if data.count(before)!=1:
            raise RuntimeError(f'Âncora ausente ou duplicada em {rel}: {before}')
        data=data.replace(before,after)
    path.write_text(data,encoding='utf-8',newline='\n')
PY
nginx -t
systemctl reload nginx
test "$(cat "$public/VERSION")" = 1.0.61
test "$(cat "$public/shell/navigation.js" | grep -c "suprimentos:'SU'")" = 1
test "$(head -1 "$public/suprimentos/pwa/sw.js")" = "const CACHE = 'suprimentos-shell-s1-v1.0.61-r2';"
test -f /tmp/suprimentos-make-smoke-sessions.py
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py \
  "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" \
  "$backup/smoke-43.json"
trap - ERR
echo MANUAL_PWA_PATCH_OK

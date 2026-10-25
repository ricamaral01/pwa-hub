#!/usr/bin/env bash
# Acabamentos do manual: somente homolog-next/:18446. Recebe backup completo da E7.
set -euo pipefail
action="${1:?install ou rollback}"
backup="${2:?backup obrigatório}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"
package=/tmp/suprimentos-manual-1.0.61/unificado
test "$backup" != "$base"
test -f "$backup/files-before.tgz"
test -d "$public/suprimentos"

rollback() {
    trap - ERR
    tar -C / -xzf "$backup/files-before.tgz" opt/concrefer-unificado/homolog-next/public/unificado
    nginx -t
    systemctl reload nginx
    echo "MANUAL_ROLLBACK_OK $backup"
}

if test "$action" = rollback; then rollback; exit 0; fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.60
test -f "$package/suprimentos/frontend/app.js"
trap 'echo "MANUAL_INSTALL_FAILED: retorno automático" >&2; rollback' ERR

for relative in suprimentos/frontend/app.js suprimentos/frontend/app.css \
    suprimentos/painel/index.html suprimentos/solicitacoes/index.html \
    suprimentos/solicitacao/index.html suprimentos/nova/index.html \
    suprimentos/fornecedores/index.html suprimentos/cadastros/index.html \
    suprimentos/pwa/sw.js; do
    install -o root -g root -m 0644 "$package/$relative" "$public/$relative"
done

python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
def replace(relative,old,new,expected=None):
    path=root/relative
    value=path.read_text(encoding='utf-8-sig')
    count=value.count(old)
    if not count or expected is not None and count!=expected:
        raise RuntimeError(f'Âncora de versão ausente ou alterada: {relative}: {count}')
    path.write_text(value.replace(old,new),encoding='utf-8',newline='\n')
replace('shell/shell.js',"key === 'suprimentos' ? 'SP'","key === 'suprimentos' ? 'SU'",2)
replace('shell/shell.js',"const APP_VERSION = '1.0.60';","const APP_VERSION = '1.0.61';",1)
replace('shell/shared-menu.css','data-short="SP"','data-short="SU"',1)
css=root/'shell/shared-menu.css'
value=css.read_text(encoding='utf-8')
value+='\nbody.unificado-shared-menu:is(.unificado-menu-collapsed,.unificado-tablet-menu:not(.unificado-tablet-menu-open)) #sidebar .module-button[data-module="suprimentos"].is-active{background:#2DD4BF;color:#0B1730}\n'
css.write_text(value,encoding='utf-8',newline='\n')
replace('index.html','v=1.0.60','v=1.0.61')
replace('sw.js','concrefer-unificado-shell-v1.0.60','concrefer-unificado-shell-v1.0.61',1)
(root/'VERSION').write_text('1.0.61\n',encoding='utf-8')
PY

nginx -t
systemctl reload nginx
test "$(cat "$public/VERSION")" = 1.0.61
curl -fsS http://127.0.0.1:13167/api/suprimentos/health >/dev/null
test -s "$public/suprimentos/frontend/app.js"
python3 /tmp/suprimentos-layout-smoke.py \
    "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" \
    "$backup/manual-smoke-43.json"
trap - ERR
echo "MANUAL_INSTALL_OK $backup"

#!/usr/bin/env bash
# Publica ou desfaz somente a correção visual do Suprimentos em :18446.
set -euo pipefail
action="${1:?install ou rollback}"
backup="${2:?backup obrigatório}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"
package=/tmp/suprimentos-layout-package/unificado
test -f "$backup/files-before.tgz"
test -d "$public/suprimentos"
test "$base" = /opt/concrefer-unificado/homolog-next

rollback() {
    trap - ERR
    tar -C / -xzf "$backup/files-before.tgz" opt/concrefer-unificado/homolog-next/public/unificado
    if test -f "$backup/layout-added.txt"; then
        while IFS= read -r relative; do
            case "$relative" in
                shell/home-header-compact.css|shell/home-header-compact.js|shell/module-pages.js|assets/img/pederh-icon.png|assets/img/faleaqui-icon.png)
                    rm -f -- "$public/$relative" ;;
                *) echo "Caminho inesperado no manifesto de retorno" >&2; exit 1 ;;
            esac
        done < "$backup/layout-added.txt"
    fi
    nginx -t
    systemctl reload nginx
    echo "LAYOUT_ROLLBACK_OK $backup"
}

if test "$action" = rollback; then
    rollback
    exit 0
fi
test "$action" = install
test -d "$package/suprimentos"
test "$(cat "$public/VERSION")" = 1.0.59
trap 'echo "LAYOUT_INSTALL_FAILED: retorno automático" >&2; rollback' ERR

: > "$backup/layout-added.txt"
for relative in shell/home-header-compact.css shell/home-header-compact.js shell/module-pages.js \
                assets/img/pederh-icon.png assets/img/faleaqui-icon.png; do
    if ! test -e "$public/$relative"; then printf '%s\n' "$relative" >> "$backup/layout-added.txt"; fi
done
chmod 0600 "$backup/layout-added.txt"

for relative in \
    suprimentos/frontend/app.css \
    suprimentos/painel/index.html suprimentos/solicitacoes/index.html \
    suprimentos/solicitacao/index.html suprimentos/nova/index.html \
    suprimentos/fornecedores/index.html suprimentos/cadastros/index.html \
    suprimentos/pwa/app.css suprimentos/pwa/index.html suprimentos/pwa/sw.js \
    shell/home-header-compact.css shell/home-header-compact.js shell/module-pages.js \
    assets/img/pederh-icon.png assets/img/faleaqui-icon.png; do
    install -o root -g root -m 0644 "$package/$relative" "$public/$relative"
done

python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
def change(relative,old,new):
    path=root/relative
    value=path.read_text(encoding='utf-8')
    if old not in value: raise RuntimeError(f'Âncora de versão ausente: {relative}')
    path.write_text(value.replace(old,new),encoding='utf-8',newline='\n')
change('index.html','v=1.0.59','v=1.0.60')
change('index.html','home-header-compact.css?v=20261024-1','home-header-compact.css?v=1.0.60')
change('index.html','home-header-compact.js?v=20261024-1','home-header-compact.js?v=1.0.60')
change('index.html','module-pages.js?v=20261024-mobile-cards-1','module-pages.js?v=1.0.60')
change('shell/shell.js',"const APP_VERSION = '1.0.59';","const APP_VERSION = '1.0.60';")
change('sw.js','concrefer-unificado-shell-v1.0.59','concrefer-unificado-shell-v1.0.60')
(root/'VERSION').write_text('1.0.60\n',encoding='utf-8')
PY

nginx -t
systemctl reload nginx
test "$(cat "$public/VERSION")" = 1.0.60
curl -fsS http://127.0.0.1:13167/api/suprimentos/health >/dev/null
for resource in shell/home-header-compact.css shell/home-header-compact.js shell/module-pages.js \
                assets/img/pederh-icon.png assets/img/faleaqui-icon.png; do
    curl -fsS "https://concrefer.concretrack.com.br:18446/unificado/$resource" >/dev/null
done
python3 /tmp/suprimentos-layout-smoke.py \
    /opt/concrefer-unificado/homolog-next/backups/suprimentos-s1-20261025T171546Z/test-logins.json \
    "$backup/layout-smoke.json"
trap - ERR
echo "LAYOUT_INSTALL_OK $backup"

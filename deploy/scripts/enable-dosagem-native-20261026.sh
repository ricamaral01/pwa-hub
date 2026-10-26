#!/usr/bin/env bash
set -euo pipefail

vhost=/etc/nginx/sites-enabled/concrefer.concretrack.com.br
snippet=/etc/nginx/snippets/laboratorio-dosagem-native.conf
backup=/opt/concrefer-unificado/backups/master-access-quality-20261026-20261026T100828Z
test -f "$vhost" && test -f "$snippet" && test -d "$backup"
test "$(systemctl is-active concrefer-dosagem-native.service)" = active
cp -p "$vhost" "$backup/nginx-vhost-before-dosagem.conf"

rollback() {
  cp -p "$backup/nginx-vhost-before-dosagem.conf" "$vhost"
  nginx -t && systemctl reload nginx
}
trap rollback ERR

python3 - "$vhost" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
data = p.read_text(encoding='utf-8')
anchor = '    include /etc/nginx/snippets/laboratorio-unificado.conf;'
line = '    include /etc/nginx/snippets/laboratorio-dosagem-native.conf;'
if data.count(anchor) != 1 or line in data:
    raise SystemExit('unexpected nginx include state')
p.write_text(data.replace(anchor, anchor + '\n' + line, 1), encoding='utf-8')
PY
chown root:root "$vhost"
chmod 0644 "$vhost"
nginx -t
systemctl reload nginx
test "$(systemctl is-active nginx)" = active
echo 'dosagem native nginx route active'
trap - ERR

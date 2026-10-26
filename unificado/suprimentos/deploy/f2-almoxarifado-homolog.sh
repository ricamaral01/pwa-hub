#!/usr/bin/env bash
set -euo pipefail
action="${1:?install ou rollback}"
backup="${2:?backup absoluto}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"
service="$base/suprimentos/service"
package=/tmp/sup-f2-package
case "$backup" in "$base"/backups/suprimentos-f2-*) ;; *) exit 2;; esac
rollback(){
  trap - ERR
  set -a; . /etc/concrefer-unificado/homolog/suprimentos.env; set +a
  dsn="${SUPRIMENTOS_DATABASE_URL/postgresql+psycopg:/postgresql:}"
  psql "$dsn" -v ON_ERROR_STOP=1 -qAtc "UPDATE suprimentos.sup_flag SET habilitado=false,atualizado_por='rollback:F2' WHERE unidade_id=1 AND fase='S2'" || true
  tar -C / -xzf "$backup/files-before.tgz"
  rm -rf "$public/suprimentos/almoxarifado" "$public/suprimentos/inventario"
  rm -f "$public/suprimentos/frontend/estoque.js" "$public/suprimentos/frontend/estoque.css"
  rm -f "$service/suprimentos/api/estoque.py"
  systemctl restart suprimentos-homolog.service
  systemctl restart unificado-homolog-mapa.service
  nginx -t; systemctl reload nginx
  echo F2_ROLLBACK_OK
}
if test "$action" = rollback; then rollback; exit 0; fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.72
for file in estoque.py 0007_almoxarifado.py estoque.js estoque.css almoxarifado.html inventario.html; do test -s "$package/$file"; done
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/auth.py \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/main.py \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/workflow.py \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/api/solicitacoes.py \
  opt/concrefer-unificado/homolog-next/suprimentos/migrations/versions/0007_almoxarifado.py \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/menu.config.js \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/router.js \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js \
  opt/concrefer-unificado/homolog-next/public/unificado/index.html \
  opt/concrefer-unificado/homolog-next/public/unificado/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/pwa/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/VERSION \
  opt/concrefer-unificado/homolog-next/mapa-api/screen_catalog.json \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/{painel,solicitacoes,solicitacao,nova,fornecedores,cadastros,cotacoes}/index.html
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$service/suprimentos/main.py" "$public/shell/router.js" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
set -a; . /etc/concrefer-unificado/homolog/suprimentos.env; set +a
dsn="${SUPRIMENTOS_DATABASE_URL/postgresql+psycopg:/postgresql:}"
pg_dump --format=custom --file="$backup/suprimentos-before.dump" "$dsn"
chmod 0600 "$backup/suprimentos-before.dump"
trap 'echo F2_FAILED >&2; rollback' ERR
for f in auth.py main.py workflow.py; do install -o root -g root -m 0644 "$package/$f" "$service/suprimentos/$f"; done
for f in solicitacoes.py estoque.py; do install -o root -g root -m 0644 "$package/$f" "$service/suprimentos/api/$f"; done
install -o root -g root -m 0644 "$package/0007_almoxarifado.py" "$base/suprimentos/migrations/versions/0007_almoxarifado.py"
cd "$base/suprimentos/migrations"
"$base/suprimentos/venv/bin/alembic" -c alembic.ini upgrade head
install -d -o root -g root -m 0755 "$public/suprimentos/almoxarifado" "$public/suprimentos/inventario"
install -o root -g root -m 0644 "$package/almoxarifado.html" "$public/suprimentos/almoxarifado/index.html"
install -o root -g root -m 0644 "$package/inventario.html" "$public/suprimentos/inventario/index.html"
for f in estoque.js estoque.css; do install -o root -g root -m 0644 "$package/$f" "$public/suprimentos/frontend/$f"; done
python3 - "$public" "$base/mapa-api/screen_catalog.json" <<'PY'
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);catalog=Path(sys.argv[2])
router=root/'shell/router.js';code=router.read_text(encoding='utf-8')
old='fornecedores|cotacoes|cadastros';assert old in code
router.write_text(code.replace(old,'fornecedores|cotacoes|almoxarifado|inventario|cadastros'),encoding='utf-8')
rows=json.loads(catalog.read_text(encoding='utf-8'))
for name,title in [('Almoxarifado','Almoxarifado'),('Inventario','Inventário')]:
    sid='suprimentos'+name
    assert not any(row['id']==sid for row in rows)
    path='almoxarifado' if name=='Almoxarifado' else 'inventario'
    rows.append(dict(id=sid,module='suprimentos',label=title,path=f'/unificado/suprimentos/{path}/',query='',screen=None,require=None))
catalog.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{name}/index.html' for name in ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros','cotacoes')]
for name in files:
    path=root/name;data=path.read_text(encoding='utf-8');assert '1.0.72' in data,name
    path.write_text(data.replace('1.0.72','1.0.73'),encoding='utf-8')
(root/'VERSION').write_text('1.0.73\n',encoding='utf-8')
PY
psql "$dsn" -v ON_ERROR_STOP=1 -qAtc "UPDATE suprimentos.sup_flag SET habilitado=true,atualizado_por='deploy:F2' WHERE unidade_id=1 AND fase='S2'"
systemctl restart suprimentos-homolog.service
systemctl restart unificado-homolog-mapa.service
nginx -t;systemctl reload nginx
ready=false
for attempt in {1..20}; do if curl -fsS http://127.0.0.1:13167/api/suprimentos/health >/dev/null 2>&1;then ready=true;break;fi;sleep .5;done
test "$ready" = true
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" "$backup/smoke-43.json"
trap - ERR
echo F2_OK

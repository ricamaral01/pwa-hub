#!/usr/bin/env bash
set -euo pipefail
action="${1:?install ou rollback}"; backup="${2:?backup}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"; service="$base/suprimentos/service"; package=/tmp/sup-f5-package
case "$backup" in "$base"/backups/suprimentos-f5-*) ;; *) exit 2;; esac
set -a
. /etc/concrefer-unificado/homolog/suprimentos.env
. /etc/concrefer-unificado/homolog/mapa-auth.env
set +a
test "$SUPRIMENTOS_ENVIRONMENT" = homolog
dsn="${SUPRIMENTOS_DATABASE_URL/postgresql+psycopg:/postgresql:}"
rollback(){
  trap - ERR
  "$base/suprimentos/venv/bin/alembic" -c "$base/suprimentos/migrations/alembic.ini" downgrade sup_0011 || true
  tar -C / -xzf "$backup/files-before.tgz"
  rm -f "$service/suprimentos/api/analises.py" "$base/suprimentos/migrations/versions/0012_analises.py" \
    "$public/suprimentos/frontend/analises.js" "$public/suprimentos/frontend/analises.css" "$public/suprimentos/analises/index.html"
  rmdir "$public/suprimentos/analises" 2>/dev/null || true
  if test -s "$backup/iam-indicadores-before.json"; then
    "$base/suprimentos/venv/bin/python" "$package/f5-grants-homolog.py" rollback "$backup" || true
  fi
  systemctl restart suprimentos-homolog.service unificado-homolog-mapa.service
  nginx -t; systemctl reload nginx
  echo F5_ROLLBACK_OK
}
if test "$action" = rollback; then rollback; exit; fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.84
for file in main.py analises.py 0012_analises.py analises.html analises.js analises.css f5-grants-homolog.py; do test -s "$package/$file"; done
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/main.py \
  opt/concrefer-unificado/homolog-next/public/unificado/{index.html,sw.js,VERSION} \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/{shell.js,router.js,menu.config.js} \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/pwa/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/{painel,solicitacoes,solicitacao,nova,fornecedores,cadastros,cotacoes,almoxarifado,inventario,recebimento}/index.html \
  opt/concrefer-unificado/homolog-next/mapa-api/screen_catalog.json
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$service/suprimentos/main.py" "$public/shell/router.js" \
  "$base/mapa-api/screen_catalog.json" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
pg_dump --format=custom --file="$backup/suprimentos-before.dump" "$dsn"
chmod 0600 "$backup/suprimentos-before.dump"
trap 'echo F5_FAILED >&2; rollback' ERR
install -o root -g root -m 0644 "$package/main.py" "$service/suprimentos/main.py"
install -o root -g root -m 0644 "$package/analises.py" "$service/suprimentos/api/analises.py"
install -o root -g root -m 0644 "$package/0012_analises.py" "$base/suprimentos/migrations/versions/0012_analises.py"
cd "$base/suprimentos/migrations"
"$base/suprimentos/venv/bin/alembic" -c alembic.ini upgrade head
install -d -o root -g root -m 0755 "$public/suprimentos/analises"
install -o root -g root -m 0644 "$package/analises.html" "$public/suprimentos/analises/index.html"
for file in analises.js analises.css; do install -o root -g root -m 0644 "$package/$file" "$public/suprimentos/frontend/$file"; done
python3 - "$public" "$base/mapa-api/screen_catalog.json" <<'PY'
from pathlib import Path
import json,sys
root=Path(sys.argv[1]); catalog=Path(sys.argv[2])
router=root/'shell/router.js'; value=router.read_text()
old='cotacoes|recebimento|almoxarifado'; assert old in value
value=value.replace(old,'cotacoes|recebimento|analises|almoxarifado')
needle="    if (route.module === 'suprimentos' && route.path === 'suprimentos/recebimento/') return 'suprimentosRecebimento';"
assert needle in value
router.write_text(value.replace(needle,needle+"\n    if (route.module === 'suprimentos' && route.path === 'suprimentos/analises/') return 'suprimentosIndicadores';"))
menu=root/'shell/menu.config.js'; value=menu.read_text()
needle="{ id:'suprimentosFornecedores', label:'Fornecedores', path:'fornecedores/', futurePhase:'S3A' }"
assert needle in value
menu.write_text(value.replace(needle,needle+",\n        { id:'suprimentosIndicadores', label:'Indicadores', path:'analises/', futurePhase:'S5' }"))
rows=json.loads(catalog.read_text()); assert not any(x['id']=='suprimentosIndicadores' for x in rows)
rows.append(dict(id='suprimentosIndicadores',module='suprimentos',label='Indicadores',path='/unificado/suprimentos/analises/',query='',screen=None,require=None))
catalog.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{name}/index.html' for name in ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros','cotacoes','almoxarifado','inventario','recebimento')]
for name in files:
    path=root/name; data=path.read_text(); assert '1.0.84' in data,name
    path.write_text(data.replace('1.0.84','1.0.85'))
(root/'VERSION').write_text('1.0.85\n')
PY
psql "$dsn" -v ON_ERROR_STOP=1 -qAtc "UPDATE suprimentos.sup_flag SET habilitado=true,atualizado_por='deploy:F5' WHERE unidade_id=1 AND fase='S5'"
"$base/suprimentos/venv/bin/python" "$package/f5-grants-homolog.py" grant "$backup"
systemctl restart suprimentos-homolog.service unificado-homolog-mapa.service
nginx -t; systemctl reload nginx
ready=false
for attempt in {1..20}; do if curl -fsS http://127.0.0.1:13167/api/suprimentos/health >/dev/null 2>&1; then ready=true; break; fi; sleep .5; done
test "$ready" = true
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" "$backup/smoke-43.json"
trap - ERR
echo F5_OK

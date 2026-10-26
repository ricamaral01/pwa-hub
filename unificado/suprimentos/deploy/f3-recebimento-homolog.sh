#!/usr/bin/env bash
set -euo pipefail
action="${1:?install ou rollback}";backup="${2:?backup}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado";service="$base/suprimentos/service";package=/tmp/sup-f3-package
case "$backup" in "$base"/backups/suprimentos-f3-*) ;; *) exit 2;; esac
set -a
. /etc/concrefer-unificado/homolog/suprimentos.env
. /etc/concrefer-unificado/homolog/mapa-auth.env
set +a
test "$SUPRIMENTOS_ENVIRONMENT" = homolog
dsn="${SUPRIMENTOS_DATABASE_URL/postgresql+psycopg:/postgresql:}"
rollback(){
  trap - ERR
  systemctl stop suprimentos-nf-worker.timer 2>/dev/null || true
  "$base/suprimentos/venv/bin/alembic" -c "$base/suprimentos/migrations/alembic.ini" downgrade sup_0008 || true
  tar -C / -xzf "$backup/files-before.tgz"
  for file in "$service/suprimentos/api/recebimento.py" "$service/suprimentos/nf_worker.py" \
      "$base/suprimentos/migrations/versions/0009_recebimento.py" \
      "$public/suprimentos/frontend/recebimento.js" "$public/suprimentos/frontend/recebimento.css" \
      "$public/suprimentos/recebimento/index.html" \
      /etc/systemd/system/suprimentos-nf-worker.service /etc/systemd/system/suprimentos-nf-worker.timer; do rm -f "$file";done
  rmdir "$public/suprimentos/recebimento" 2>/dev/null || true
  systemctl daemon-reload
  if test -s "$backup/iam-recebimento-before.json";then
    "$base/suprimentos/venv/bin/python" "$package/f3-grants-homolog.py" rollback "$backup" || true
  fi
  systemctl restart suprimentos-homolog.service unificado-homolog-mapa.service
  nginx -t;systemctl reload nginx
  echo F3_ROLLBACK_OK
}
if test "$action" = rollback;then rollback;exit;fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.77
for file in auth.py main.py compras.py recebimento.py nf_worker.py 0009_recebimento.py \
  recebimento.html recebimento.js recebimento.css f3-grants-homolog.py;do test -s "$package/$file";done
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/{auth.py,main.py} \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/api/compras.py \
  opt/concrefer-unificado/homolog-next/public/unificado/{index.html,sw.js,VERSION} \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/{shell.js,router.js,menu.config.js} \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/pwa/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/{painel,solicitacoes,solicitacao,nova,fornecedores,cadastros,cotacoes,almoxarifado,inventario}/index.html \
  opt/concrefer-unificado/homolog-next/mapa-api/screen_catalog.json
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$service/suprimentos/main.py" "$public/shell/router.js" \
  "$base/mapa-api/screen_catalog.json" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
pg_dump --format=custom --file="$backup/suprimentos-before.dump" "$dsn"
chmod 0600 "$backup/suprimentos-before.dump"
trap 'echo F3_FAILED >&2;rollback' ERR
for file in auth.py main.py nf_worker.py;do install -o root -g root -m 0644 "$package/$file" "$service/suprimentos/$file";done
for file in compras.py recebimento.py;do install -o root -g root -m 0644 "$package/$file" "$service/suprimentos/api/$file";done
install -o root -g root -m 0644 "$package/0009_recebimento.py" "$base/suprimentos/migrations/versions/0009_recebimento.py"
cd "$base/suprimentos/migrations"
"$base/suprimentos/venv/bin/alembic" -c alembic.ini upgrade head
install -d -o root -g root -m 0755 "$public/suprimentos/recebimento"
install -o root -g root -m 0644 "$package/recebimento.html" "$public/suprimentos/recebimento/index.html"
for file in recebimento.js recebimento.css;do install -o root -g root -m 0644 "$package/$file" "$public/suprimentos/frontend/$file";done
python3 - "$public" "$base/mapa-api/screen_catalog.json" <<'PY'
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);catalog=Path(sys.argv[2])
router=root/'shell/router.js';s=router.read_text();old='cotacoes|almoxarifado|inventario';assert old in s
router.write_text(s.replace(old,'cotacoes|recebimento|almoxarifado|inventario'))
s=router.read_text();needle="    if (route.module === 'suprimentos' && route.path === 'suprimentos/cotacoes/') return 'suprimentosCotacoes';"
assert needle in s
router.write_text(s.replace(needle,needle+"\n    if (route.module === 'suprimentos' && route.path === 'suprimentos/recebimento/') return 'suprimentosRecebimento';"))
menu=root/'shell/menu.config.js';s=menu.read_text();old="id:'suprimentosRecebimento', label:'Recebimento', path:'recebimento/', futurePhase:'S3'";assert old in s
menu.write_text(s.replace(old,old.replace("'S3'","'S3B'")))
rows=json.loads(catalog.read_text());assert not any(x['id']=='suprimentosRecebimento' for x in rows)
rows.append(dict(id='suprimentosRecebimento',module='suprimentos',label='Recebimento',path='/unificado/suprimentos/recebimento/',query='',screen=None,require=None))
catalog.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{name}/index.html' for name in ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros','cotacoes','almoxarifado','inventario')]
for name in files:
    path=root/name;data=path.read_text();assert '1.0.77' in data,name
    path.write_text(data.replace('1.0.77','1.0.78'))
(root/'VERSION').write_text('1.0.78\n')
PY
psql "$dsn" -v ON_ERROR_STOP=1 -qAtc "UPDATE suprimentos.sup_flag SET habilitado=true,atualizado_por='deploy:F3' WHERE unidade_id=1 AND fase='S3B'"
"$base/suprimentos/venv/bin/python" "$package/f3-grants-homolog.py" grant "$backup"
install -o root -g root -m 0644 "$package/suprimentos-nf-worker.service" /etc/systemd/system/suprimentos-nf-worker.service
install -o root -g root -m 0644 "$package/suprimentos-nf-worker.timer" /etc/systemd/system/suprimentos-nf-worker.timer
systemctl daemon-reload;systemctl enable --now suprimentos-nf-worker.timer
systemctl restart suprimentos-homolog.service unificado-homolog-mapa.service
nginx -t;systemctl reload nginx
ready=false
for attempt in {1..20};do if curl -fsS http://127.0.0.1:13167/api/suprimentos/health >/dev/null 2>&1;then ready=true;break;fi;sleep .5;done
test "$ready" = true
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" "$backup/smoke-43.json"
trap - ERR
echo F3_OK

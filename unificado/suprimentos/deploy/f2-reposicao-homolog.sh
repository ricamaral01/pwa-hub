#!/usr/bin/env bash
set -euo pipefail
action="${1:?install ou rollback}";backup="${2:?backup}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado";service="$base/suprimentos/service";package=/tmp/sup-f2-reposicao
case "$backup" in "$base"/backups/suprimentos-f2-reposicao-*) ;; *) exit 2;; esac
rollback(){
  trap - ERR
  set -a;. /etc/concrefer-unificado/homolog/suprimentos.env;set +a
  dsn="${SUPRIMENTOS_DATABASE_URL/postgresql+psycopg:/postgresql:}"
  cd "$base/suprimentos/migrations"
  "$base/suprimentos/venv/bin/alembic" -c alembic.ini downgrade sup_0007
  psql "$dsn" -v ON_ERROR_STOP=1 -qAtc "CREATE TABLE IF NOT EXISTS suprimentos.sup_sugestao_reposicao (id uuid PRIMARY KEY,unidade_id smallint NOT NULL,material_id uuid NOT NULL,quantidade numeric(18,4) NOT NULL,status text NOT NULL,origem text NOT NULL,motivo text,criado_em timestamptz NOT NULL DEFAULT now(),criado_por text NOT NULL,atualizado_em timestamptz NOT NULL DEFAULT now(),atualizado_por text NOT NULL); INSERT INTO suprimentos.sup_sugestao_reposicao SELECT id,unidade_id,material_id,qtd,status,'PONTO_PEDIDO',destino_ref,criado_em,criado_por,atualizado_em,atualizado_por FROM suprimentos.sup_sugestao_ressuprimento WHERE origem='almoxarifado' ON CONFLICT(id) DO NOTHING"
  tar -C / -xzf "$backup/files-before.tgz"
  rm -f "$base/suprimentos/migrations/versions/0008_reposicao.py"
  systemctl restart suprimentos-homolog.service
  nginx -t;systemctl reload nginx
  echo F2_REPOSICAO_ROLLBACK_OK
}
if test "$action" = rollback;then rollback;exit;fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.75
for f in 0007_almoxarifado.py 0008_reposicao.py estoque.py solicitacoes.py estoque.js estoque.css;do test -s "$package/$f";done
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
 opt/concrefer-unificado/homolog-next/suprimentos/migrations/versions/0007_almoxarifado.py \
 opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/api/{estoque,solicitacoes}.py \
 opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/frontend/{estoque.js,estoque.css} \
 opt/concrefer-unificado/homolog-next/public/unificado/{index.html,sw.js,VERSION} \
 opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js \
 opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/pwa/sw.js \
 opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/{painel,solicitacoes,solicitacao,nova,fornecedores,cadastros,cotacoes,almoxarifado,inventario}/index.html
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$service/suprimentos/api/estoque.py" "$public/suprimentos/frontend/estoque.css" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
set -a;. /etc/concrefer-unificado/homolog/suprimentos.env;set +a
dsn="${SUPRIMENTOS_DATABASE_URL/postgresql+psycopg:/postgresql:}"
pg_dump --format=custom --file="$backup/suprimentos-before.dump" "$dsn";chmod 0600 "$backup/suprimentos-before.dump"
trap 'echo F2_REPOSICAO_FAILED >&2;rollback' ERR
install -o root -g root -m 0644 "$package/0007_almoxarifado.py" "$base/suprimentos/migrations/versions/0007_almoxarifado.py"
install -o root -g root -m 0644 "$package/0008_reposicao.py" "$base/suprimentos/migrations/versions/0008_reposicao.py"
cd "$base/suprimentos/migrations";"$base/suprimentos/venv/bin/alembic" -c alembic.ini upgrade head
for f in estoque.py solicitacoes.py;do install -o root -g root -m 0644 "$package/$f" "$service/suprimentos/api/$f";done
for f in estoque.js estoque.css;do install -o root -g root -m 0644 "$package/$f" "$public/suprimentos/frontend/$f";done
python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1]);files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{n}/index.html' for n in ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros','cotacoes','almoxarifado','inventario')]
for name in files:
    p=root/name;s=p.read_text(encoding='utf-8');assert '1.0.75' in s,name;p.write_text(s.replace('1.0.75','1.0.76'),encoding='utf-8')
(root/'VERSION').write_text('1.0.76\n',encoding='utf-8')
PY
systemctl restart suprimentos-homolog.service
nginx -t;systemctl reload nginx
ready=false
for attempt in {1..20};do if curl -fsS http://127.0.0.1:13167/api/suprimentos/health >/dev/null 2>&1;then ready=true;break;fi;sleep .5;done
test "$ready" = true
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" "$backup/smoke-43.json"
trap - ERR;echo F2_REPOSICAO_OK

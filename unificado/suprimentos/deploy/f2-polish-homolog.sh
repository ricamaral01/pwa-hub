#!/usr/bin/env bash
set -euo pipefail
action="${1:?install ou rollback}"
backup="${2:?backup absoluto}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"
service="$base/suprimentos/service"
package=/tmp/sup-f2-polish
case "$backup" in "$base"/backups/suprimentos-f2-polish-*) ;; *) exit 2;; esac
rollback(){
  trap - ERR
  set -a; . /etc/concrefer-unificado/homolog/suprimentos.env; set +a
  dsn="${SUPRIMENTOS_DATABASE_URL/postgresql+psycopg:/postgresql:}"
  psql "$dsn" -v ON_ERROR_STOP=1 -qAtc "UPDATE suprimentos.sup_flag SET habilitado=false,atualizado_por='rollback:F2-polish' WHERE unidade_id=1 AND fase='S2'; ALTER TABLE suprimentos.sup_solicitacao_item ADD COLUMN IF NOT EXISTS qtd_compra numeric(18,4) NOT NULL DEFAULT 0 CHECK (qtd_compra>=0); DELETE FROM suprimentos.sup_parametro WHERE chave='inventario_tolerancia_pct' AND criado_por='migration'" || true
  tar -C / -xzf "$backup/files-before.tgz"
  systemctl restart suprimentos-homolog.service
  nginx -t;systemctl reload nginx
  echo F2_POLISH_ROLLBACK_OK
}
if test "$action" = rollback; then rollback; exit 0; fi
test "$action" = install
test "$(cat "$public/VERSION")" = 1.0.73
for f in estoque.py solicitacoes.py compras.py 0007_almoxarifado.py estoque.js estoque.css almoxarifado.html inventario.html;do test -s "$package/$f";done
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/api/{estoque,solicitacoes,compras}.py \
  opt/concrefer-unificado/homolog-next/suprimentos/migrations/versions/0007_almoxarifado.py \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/frontend/{estoque.js,estoque.css} \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/{almoxarifado,inventario}/index.html \
  opt/concrefer-unificado/homolog-next/public/unificado/{index.html,sw.js,VERSION} \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/pwa/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos/{painel,solicitacoes,solicitacao,nova,fornecedores,cadastros,cotacoes}/index.html
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$service/suprimentos/api/estoque.py" "$public/suprimentos/frontend/estoque.js" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
set -a; . /etc/concrefer-unificado/homolog/suprimentos.env; set +a
dsn="${SUPRIMENTOS_DATABASE_URL/postgresql+psycopg:/postgresql:}"
pg_dump --format=custom --file="$backup/suprimentos-before.dump" "$dsn"
chmod 0600 "$backup/suprimentos-before.dump"
trap 'echo F2_POLISH_FAILED >&2; rollback' ERR
for f in estoque.py solicitacoes.py compras.py;do install -o root -g root -m 0644 "$package/$f" "$service/suprimentos/api/$f";done
install -o root -g root -m 0644 "$package/0007_almoxarifado.py" "$base/suprimentos/migrations/versions/0007_almoxarifado.py"
for f in estoque.js estoque.css;do install -o root -g root -m 0644 "$package/$f" "$public/suprimentos/frontend/$f";done
for f in almoxarifado inventario;do install -o root -g root -m 0644 "$package/$f.html" "$public/suprimentos/$f/index.html";done
psql "$dsn" -v ON_ERROR_STOP=1 -qAtc "ALTER TABLE suprimentos.sup_solicitacao_item DROP COLUMN IF EXISTS qtd_compra; INSERT INTO suprimentos.sup_parametro(id,unidade_id,chave,valor,a_confirmar,criado_por,atualizado_por) SELECT gen_random_uuid(),id,'inventario_tolerancia_pct',2,true,'migration','migration' FROM suprimentos.sup_unidade ON CONFLICT(unidade_id,chave) DO NOTHING"
psql "$dsn" -v ON_ERROR_STOP=1 -qAtc "UPDATE suprimentos.sup_flag SET habilitado=true,atualizado_por='deploy:F2-polish' WHERE unidade_id=1 AND fase='S2'"
python3 - "$public" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1]);files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{n}/index.html' for n in ('painel','solicitacoes','solicitacao','nova','fornecedores','cadastros','cotacoes','almoxarifado','inventario')]
for name in files:
    path=root/name;data=path.read_text(encoding='utf-8');assert '1.0.73' in data,name
    path.write_text(data.replace('1.0.73','1.0.74'),encoding='utf-8')
(root/'VERSION').write_text('1.0.74\n',encoding='utf-8')
PY
systemctl restart suprimentos-homolog.service
nginx -t;systemctl reload nginx
ready=false
for attempt in {1..20};do if curl -fsS http://127.0.0.1:13167/api/suprimentos/health >/dev/null 2>&1;then ready=true;break;fi;sleep .5;done
test "$ready" = true
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" "$backup/smoke-43.json"
trap - ERR
echo F2_POLISH_OK

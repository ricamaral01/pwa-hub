#!/usr/bin/env bash
# F1 somente homolog-next/:18446. Nenhum caminho de produção ou VPS antiga.
set -euo pipefail
action="${1:?install ou rollback}"
backup="${2:?backup absoluto}"
base=/opt/concrefer-unificado/homolog-next
public="$base/public/unificado"
service="$base/suprimentos/service"
package=/tmp/sup-f1-package
case "$backup" in "$base"/backups/suprimentos-f1-*) ;; *) echo "Backup fora de homolog-next" >&2; exit 2;; esac

rollback(){
  trap - ERR
  systemctl stop suprimentos-homolog.service || true
  set -a
  . /etc/concrefer-unificado/homolog/suprimentos.env
  set +a
  local dsn="${SUPRIMENTOS_DATABASE_URL/postgresql+psycopg:/postgresql:}"
  psql "$dsn" -v ON_ERROR_STOP=1 -qAtc "UPDATE suprimentos.sup_flag SET habilitado=false, atualizado_por='rollback:F1' WHERE unidade_id=1 AND fase='S3A'" || true
  if test -f "$backup/files-before.tgz"; then tar -C / -xzf "$backup/files-before.tgz"; fi
  # A migration é aditiva e fica instalada para corresponder ao alembic_version;
  # a flag desligada e o código anterior restauram o comportamento anterior.
  rm -f "$service/suprimentos/api/compras.py"
  rm -f "$public/suprimentos/frontend/compras.js" "$public/suprimentos/frontend/compras.css"
  rm -f "$public/suprimentos/cotacoes/index.html"
  rmdir "$public/suprimentos/cotacoes" 2>/dev/null || true
  systemctl start suprimentos-homolog.service
  systemctl restart unificado-homolog-mapa.service
  nginx -t
  systemctl reload nginx
  echo "F1_ROLLBACK_CODE_AND_FLAG_OK $backup"
}
if test "$action" = rollback; then rollback; exit 0; fi
test "$action" = install
test "$(cat "$public/VERSION")" = "1.0.62"
for file in "$package/compras.py" "$package/0005_compras.py" "$package/compras.js" "$package/compras.css"; do test -s "$file"; done
install -d -o root -g root -m 0700 "$backup"
tar -C / -czf "$backup/files-before.tgz" \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/api/cadastros.py \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/auth.py \
  opt/concrefer-unificado/homolog-next/suprimentos/service/suprimentos/main.py \
  opt/concrefer-unificado/homolog-next/suprimentos/service/requirements.txt \
  opt/concrefer-unificado/homolog-next/public/unificado/suprimentos \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/menu.config.js \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/router.js \
  opt/concrefer-unificado/homolog-next/public/unificado/shell/shell.js \
  opt/concrefer-unificado/homolog-next/public/unificado/index.html \
  opt/concrefer-unificado/homolog-next/public/unificado/sw.js \
  opt/concrefer-unificado/homolog-next/public/unificado/VERSION \
  opt/concrefer-unificado/homolog-next/mapa-api/screen_catalog.json
chmod 0600 "$backup/files-before.tgz"
stat -c '%a %U:%G %n' "$service/suprimentos/main.py" "$public/suprimentos/frontend/app.js" \
  "$public/shell/menu.config.js" "$base/mapa-api/screen_catalog.json" > "$backup/permissions-before.txt"
chmod 0600 "$backup/permissions-before.txt"
set -a
. /etc/concrefer-unificado/homolog/suprimentos.env
set +a
dsn="${SUPRIMENTOS_DATABASE_URL/postgresql+psycopg:/postgresql:}"
pg_dump --format=custom --file="$backup/suprimentos-before.dump" "$dsn"
chmod 0600 "$backup/suprimentos-before.dump"
trap 'echo F1_INSTALL_FAILED >&2; rollback' ERR
install -o root -g root -m 0644 "$package/0005_compras.py" "$base/suprimentos/migrations/versions/0005_compras.py"
cd "$base/suprimentos/migrations"
"$base/suprimentos/venv/bin/alembic" -c alembic.ini upgrade head
install -o root -g root -m 0644 "$package/auth.py" "$service/suprimentos/auth.py"
install -o root -g root -m 0644 "$package/main.py" "$service/suprimentos/main.py"
install -o root -g root -m 0644 "$package/cadastros.py" "$service/suprimentos/api/cadastros.py"
install -o root -g root -m 0644 "$package/compras.py" "$service/suprimentos/api/compras.py"
install -o root -g root -m 0644 "$package/requirements.txt" "$service/requirements.txt"
for file in app.js compras.js compras.css; do
  install -o root -g root -m 0644 "$package/$file" "$public/suprimentos/frontend/$file"
done
install -o root -g root -m 0644 "$package/fornecedores.html" "$public/suprimentos/fornecedores/index.html"
install -d -o root -g root -m 0755 "$public/suprimentos/cotacoes"
install -o root -g root -m 0644 "$package/cotacoes.html" "$public/suprimentos/cotacoes/index.html"
python3 - "$public" "$base/mapa-api/screen_catalog.json" <<'PY'
from pathlib import Path
import json,sys
root=Path(sys.argv[1]); catalog_path=Path(sys.argv[2])
menu=root/'shell/menu.config.js'
text=menu.read_text(encoding='utf-8')
old="id:'suprimentosCotacoes', label:'Cotações e pedidos', path:'cotacoes/', futurePhase:'S3'"
assert old in text
text=text.replace(old,old.replace("futurePhase:'S3'","futurePhase:'S3A'"))
old_supplier="id:'suprimentosFornecedores', label:'Fornecedores', path:'fornecedores/'"
assert old_supplier in text
text=text.replace(old_supplier,old_supplier+", futurePhase:'S3A'")
menu.write_text(text,encoding='utf-8')
router=root/'shell/router.js'
text=router.read_text(encoding='utf-8')
old='solicitacao|nova|fornecedores|cadastros'
assert old in text
router.write_text(text.replace(old,'solicitacao|nova|fornecedores|cotacoes|cadastros'),encoding='utf-8')
catalog=json.loads(catalog_path.read_text(encoding='utf-8'))
assert not any(row['id']=='suprimentosCotacoes' for row in catalog)
catalog.append(dict(id='suprimentosCotacoes',module='suprimentos',label='Cotações e pedidos',
                    path='/unificado/suprimentos/cotacoes/',query='',screen=None,require=None))
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
files=['index.html','shell/shell.js','sw.js','suprimentos/pwa/sw.js']
files += [f'suprimentos/{name}/index.html' for name in
          ('painel','solicitacoes','solicitacao','nova','cadastros')]
for name in files:
    path=root/name; text=path.read_text(encoding='utf-8')
    assert '1.0.62' in text,name
    path.write_text(text.replace('1.0.62','1.0.63'),encoding='utf-8')
(root/'VERSION').write_text('1.0.63\n',encoding='utf-8')
PY
psql "$dsn" -v ON_ERROR_STOP=1 -qAtc "UPDATE suprimentos.sup_flag SET habilitado=true, atualizado_por='deploy:F1' WHERE unidade_id=1 AND fase='S3A'"
systemctl restart suprimentos-homolog.service
systemctl restart unificado-homolog-mapa.service
nginx -t
systemctl reload nginx
ready=false
for attempt in {1..20}; do
  if curl -fsS http://127.0.0.1:13167/api/suprimentos/health >/dev/null 2>&1; then ready=true; break; fi
  sleep 0.5
done
test "$ready" = true
test "$(cat "$public/VERSION")" = 1.0.63
test "$(psql "$dsn" -v ON_ERROR_STOP=1 -qAtc "SELECT habilitado FROM suprimentos.sup_flag WHERE unidade_id=1 AND fase='S3A'")" = t
grep -q 'compras.js' "$public/suprimentos/cotacoes/index.html"
grep -q 'Telas S3-A' "$public/suprimentos/frontend/compras.js"
test -f /tmp/suprimentos-make-smoke-sessions.py
bash /tmp/suprimentos-env-run-homolog.sh /tmp/suprimentos-make-smoke-sessions.py "$backup/smoke-sessions.json"
export SUPRIMENTOS_SMOKE_TOKENS="$backup/smoke-sessions.json"
python3 /tmp/suprimentos-layout-smoke.py \
  "$base/backups/suprimentos-s1-20261025T171546Z/test-logins.json" \
  "$backup/smoke-43.json"
trap - ERR
echo "F1_INSTALL_OK $backup"

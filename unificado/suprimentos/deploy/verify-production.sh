#!/usr/bin/env bash
set -euo pipefail
base=/opt/concrefer-unificado
public="$base/public/unificado"
database=suprimentos_prod
pass=0
gate() { "$@"; pass=$((pass+1)); echo "GATE $pass/7 OK"; }

version_gate() {
  test "$(cat "$public/VERSION")" = 1.0.95
  grep -q "const APP_VERSION = '1.0.95'" "$public/shell/shell.js"
  grep -q 'concrefer-unificado-shell-v1.0.95' "$public/sw.js"
  grep -q 'suprimentos-shell-s1-v1.0.95' "$public/suprimentos/pwa/sw.js"
}
service_gate() {
  test "$(systemctl is-active suprimentos-prod.service)" = active
  test "$(systemctl is-active mapa-unificado-auth.service)" = active
  curl -fsS http://127.0.0.1:13267/api/suprimentos/health | grep -q '"modulo":"suprimentos"'
}
database_gate() {
  test "$(runuser -u postgres -- psql -At -d "$database" -c 'SELECT version_num FROM alembic_version')" = sup_0012
  test "$(runuser -u postgres -- psql -At -d "$database" -c "SELECT count(*) FROM suprimentos.sup_usuario_papel WHERE criado_por='deploy:suprimentos:20261026'")" = 9
  test "$(runuser -u postgres -- psql -At -d "$database" -c 'SELECT count(*) FROM suprimentos.sup_solicitacao')" = 0
}
flag_gate() {
  test "$(runuser -u postgres -- psql -At -d "$database" -c "SELECT count(*) FROM suprimentos.sup_flag WHERE fase IN ('S0','S1','S2','S3A','S3B','S5') AND habilitado")" = 6
  test "$(runuser -u postgres -- psql -At -d "$database" -c "SELECT count(*) FROM suprimentos.sup_flag WHERE fase IN ('S4','S3A_EMAIL') AND NOT habilitado")" = 2
  curl -fsS http://127.0.0.1:13267/api/suprimentos/flags | grep -q '"S1":true'
}
route_gate() {
  test "$(curl -s -o /dev/null -w '%{http_code}' https://concrefer.concretrack.com.br/unificado/)" = 200
  test "$(curl -s -o /dev/null -w '%{http_code}' https://concrefer.concretrack.com.br/api/suprimentos/health)" = 401
  test "$(curl -s -o /dev/null -w '%{http_code}' https://concrefer.concretrack.com.br/unificado/suprimentos/painel/)" = 403
  test "$(curl -s -o /dev/null -w '%{http_code}' https://concrefer.concretrack.com.br/unificado/suprimentos/pwa/)" = 403
}
catalog_gate() {
  python3 - "$base/mapa-api/screen_catalog.json" "$public/shell/menu.config.js" <<'PY'
import json, sys
catalog = json.load(open(sys.argv[1], encoding='utf-8'))
assert len([s for s in catalog if s['module'] == 'suprimentos']) == 10
assert 'suprimentos' in open(sys.argv[2], encoding='utf-8').read()
PY
  for screen in painel solicitacoes solicitacao nova fornecedores cadastros cotacoes almoxarifado inventario recebimento analises pwa; do
    test -f "$public/suprimentos/$screen/index.html"
  done
}
security_gate() {
  nginx -t >/dev/null 2>&1
  test "$(stat -c %a /etc/concrefer-unificado/prod/suprimentos.env)" = 600
  test "$(stat -c %a "$base/suprimentos/data/photos")" = 700
  test "$(stat -c %U "$base/suprimentos/data/photos")" = concrefer-suprimentos
  if find "$base/suprimentos/service" "$base/suprimentos/migrations" "$public/suprimentos" -type f \( -perm -0002 -o -perm -0020 \) | grep -q .; then return 1; fi
}

gate version_gate
gate service_gate
gate database_gate
gate flag_gate
gate route_gate
gate catalog_gate
gate security_gate

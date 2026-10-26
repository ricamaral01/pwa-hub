#!/usr/bin/env bash
set -Eeuo pipefail

environment="${1:?stage or production}"
payload="${2:?absolute payload directory}"
final_id="${3:?existing finalized test ID for smoke}"
draft_id="${4:?existing draft test ID for smoke}"
case "$environment" in
  stage)
    shell_root=/opt/concrefer-unificado/homolog-next/public/unificado
    lab_root=/opt/concrefer-unificado/homolog/laboratorio/service/server
    lab_service=laboratorio-homolog.service
    nginx_file=/etc/nginx/snippets/laboratorio-unificado-homolog.conf
    port=13065
    db_name=concretrack_postes_homolog
    origin=https://concrefer.concretrack.com.br:18446
    api_file=postes_api_stage.py ;;
  production)
    shell_root=/opt/concrefer-unificado/public/unificado
    lab_root=/opt/concrefer-unificado/laboratorio/service/server
    lab_service=laboratorio-unificado.service
    nginx_file=/etc/nginx/snippets/laboratorio-unificado.conf
    port=13064
    db_name=concretrack_postes
    origin=https://concrefer.concretrack.com.br
    api_file=postes_api.py ;;
  *) echo "Unknown environment" >&2; exit 2 ;;
esac

backup="/opt/concrefer-unificado/backups/laudo-postes-${environment}-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -m 0700 -p "$backup/files"
declare -a target source owner
add() { target+=("$1"); source+=("$2"); owner+=("$3"); }
add "$shell_root/VERSION" VERSION www-data:www-data
add "$shell_root/index.html" index.html www-data:www-data
add "$shell_root/sw.js" sw.js www-data:www-data
add "$shell_root/shell/shell.js" shell.js www-data:www-data
add "$lab_root/postes_api.py" "$api_file" root:monitorconcreto
add "$lab_root/postes_report_v2.py" postes_report_v2.py root:monitorconcreto
add "$lab_root/postes_public.py" postes_public.py root:monitorconcreto
add "$lab_root/static/novo/postes/novo.html" novo.html www-data:www-data
add "$lab_root/static/novo/postes/assets/novo-16d78bdbc677.js" novo-16d78bdbc677.js www-data:www-data
if [[ "$environment" == production ]]; then
  add "$lab_root/postes_certificates.py" postes_certificates.py root:monitorconcreto
fi
add "$nginx_file" nginx.conf root:root

rollback() {
  local i
  set +e
  for i in "${!target[@]}"; do
    if [[ -f "$backup/files/$i" ]]; then
      cp -a -- "$backup/files/$i" "${target[$i]}"
    else
      rm -f -- "${target[$i]}"
    fi
  done
  nginx -t && systemctl reload nginx
  systemctl restart "$lab_service"
  echo "ROLLED_BACK=$backup" >&2
}
for i in "${!target[@]}"; do
  [[ -f "$payload/${source[$i]}" || "${source[$i]}" == nginx.conf ]] || { echo "Missing payload ${source[$i]}" >&2; exit 1; }
  if [[ -f "${target[$i]}" ]]; then
    cp -a -- "${target[$i]}" "$backup/files/$i"
    stat -c '%n|%U:%G|%a' "${target[$i]}" >> "$backup/permissions.txt"
  else
    printf '%s|absent\n' "${target[$i]}" >> "$backup/permissions.txt"
  fi
done
runuser -u postgres -- pg_dump -Fc "$db_name" > "$backup/${db_name}.dump"
chmod 0600 "$backup/${db_name}.dump"
nginx -t
trap 'code=$?; trap - ERR; rollback; exit "$code"' ERR
for i in "${!target[@]}"; do
  [[ "${source[$i]}" == nginx.conf ]] && continue
  install -o "${owner[$i]%:*}" -g "${owner[$i]#*:}" -m 0644 -- "$payload/${source[$i]}" "${target[$i]}"
done

python3 - "$nginx_file" "$port" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
port = sys.argv[2]
text = p.read_text()
marker = '    location ^~ /v/ {'
assert text.count(marker) == 1
if 'location ^~ /v/postes/' in text:
    assert f'proxy_pass http://127.0.0.1:{port}/v/postes/;' in text
    raise SystemExit(0)
block = f'''    # Signed, read-only verification and PDF download for finalized pole tests.
    location ^~ /v/postes/ {{
        limit_except GET {{ deny all; }}
        proxy_pass http://127.0.0.1:{port}/v/postes/;
        proxy_set_header Host $http_host;
        proxy_set_header Cookie "";
        proxy_set_header X-Forwarded-For "";
        proxy_set_header X-Forwarded-Proto https;
        add_header Cache-Control "private, no-store" always;
        add_header X-Content-Type-Options "nosniff" always;
    }}

'''
p.write_text(text.replace(marker, block + marker), encoding='utf-8')
PY
nginx -t
systemctl restart "$lab_service"
systemctl is-active --quiet "$lab_service"
systemctl reload nginx
ready=0
for _ in {1..30}; do
  if curl -fsS "http://127.0.0.1:$port/" -o /dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
[[ "$ready" == 1 ]]
[[ "$(curl -fkLsS "$origin/unificado/VERSION")" == '1.0.105' ]]
curl -fkLsS "$origin/unificado/laboratorio/novo/postes/assets/novo-16d78bdbc677.js" -o /dev/null
[[ "$(curl -kLsS -o /dev/null -w '%{http_code}' "$origin/v/postes/not-a-record/bad-token")" == 404 ]]
python3 /tmp/smoke_laudo_remote.py "$environment" "$final_id" "$draft_id"
echo "DEPLOY_OK=$environment"
echo "BACKUP_PATH=$backup"
trap - ERR

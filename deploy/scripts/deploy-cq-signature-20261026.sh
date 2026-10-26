#!/usr/bin/env bash
set -Eeuo pipefail

environment="${1:?stage or production}"
payload="$(realpath -e -- "${2:?release archive}")"
case "$environment" in
  stage)
    code=/opt/concrefer-unificado/homolog/cq
    service=cq-laboratorio-homolog.service
    port=13075
    signature=/opt/concrefer-unificado/homolog/data/cq/assinatura-marcelo.png ;;
  production)
    code=/opt/concrefer-unificado/cq
    service=cq-laboratorio.service
    port=13074
    signature=/var/lib/concrefer-cq/assinatura-marcelo.png ;;
  *) echo 'Unknown environment' >&2; exit 2 ;;
esac

backup="/opt/concrefer-unificado/backups/cq-signature-${environment}-$(date -u +%Y%m%dT%H%M%SZ)"
work="$(mktemp -d)"
trap 'rm -rf -- "$work"' EXIT
tar -xzf "$payload" -C "$work"
for file in app.py report.py; do test -f "$work/$file"; done
test -r "$signature"
python3 - "$work/app.py" "$work/report.py" <<'PY'
from pathlib import Path
import sys
for name in sys.argv[1:]:
    compile(Path(name).read_bytes(), name, 'exec')
PY
mkdir -m 0700 -p "$backup"
for file in app.py report.py; do
  cp -a -- "$code/$file" "$backup/$file"
  stat -c '%n|%U:%G|%a' "$code/$file" >> "$backup/permissions-before.txt"
done

rollback() {
  local status=$?
  trap - EXIT
  if (( status != 0 )); then
    for file in app.py report.py; do cp -a -- "$backup/$file" "$code/$file"; done
    systemctl restart "$service"
    echo "ROLLED_BACK=$backup" >&2
  fi
  rm -rf -- "$work"
  exit "$status"
}
trap rollback EXIT
for file in app.py report.py; do
  install -o monitorconcreto -g monitorconcreto -m 0640 -- "$work/$file" "$code/$file"
done
systemctl restart "$service"
systemctl is-active --quiet "$service"
ready=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:$port/health" >/dev/null; then ready=1; break; fi
  sleep 1
done
test "$ready" = 1
CQ_CODE="$code" CQ_SIGNATURE="$signature" /opt/monitor_concreto/.venv/bin/python - <<'PY'
import os
import sys
sys.path.insert(0, os.environ['CQ_CODE'])
from report import make_pdf

day = '2026-10-01'
cert = dict(numero=None, revisao=0, cliente='TESTE ASSINATURA', endereco='Campinas',
            nota_fiscal='123456', data_emissao=day, resp_laboratorio='Ricardo Do Amaral',
            fck_mpa=35, prensa_snapshot={})
item = dict(modelo='C 10/2500', altura_m=10, carga_dan=2500, peso_kg=None,
            quantidade=1, data_producao=day)
result = dict(data_producao=day, n_cps=2, r3_media=32.9, r7_media=39.1,
              r28_media=None, resultado='aguardando_28_dias')
pdf = make_pdf(cert, [item], [result], issued=False,
               signature_path=os.environ['CQ_SIGNATURE'])
assert pdf.startswith(b'%PDF-')
assert pdf.count(b'/Subtype /Image') >= 1, 'draft PDF has no signature image'
print('DRAFT_SIGNATURE_IMAGE_OK')
PY
test -z "$(find "$code/app.py" "$code/report.py" -perm /0002 -print -quit)"
for file in app.py report.py; do stat -c '%n|%U:%G|%a' "$code/$file" >> "$backup/permissions-after.txt"; done
trap - EXIT
rm -rf -- "$work"
echo "DEPLOY_OK=$environment"
echo "BACKUP_PATH=$backup"

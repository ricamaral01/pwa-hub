#!/usr/bin/env bash
set -Eeuo pipefail

environment="${1:?stage or production}"
case "$environment" in
  stage)
    cq=/opt/concrefer-unificado/homolog/cq
    lab=/opt/concrefer-unificado/homolog/laboratorio/service/server
    cq_service=cq-laboratorio-homolog.service
    lab_service=laboratorio-homolog.service
    cq_port=13075
    lab_port=13065 ;;
  production)
    cq=/opt/concrefer-unificado/cq
    lab=/opt/concrefer-unificado/laboratorio/service/server
    cq_service=cq-laboratorio.service
    lab_service=laboratorio-unificado.service
    cq_port=13074
    lab_port=13064 ;;
  *) echo 'Unknown environment' >&2; exit 2 ;;
esac

files=("$cq/app.py" "$cq/report.py" "$cq/static/index.html" "$lab/postes_report_v2.py")
backup="/opt/concrefer-unificado/backups/quality-manager-labels-${environment}-$(date -u +%Y%m%dT%H%M%SZ)"
work="$(mktemp -d)"
trap 'rm -rf -- "$work"' EXIT
mkdir -m 0700 -p "$backup"
for i in "${!files[@]}"; do
  cp -a -- "${files[$i]}" "$backup/$i"
  cp -- "${files[$i]}" "$work/$i"
  stat -c '%n|%U:%G|%a' "${files[$i]}" >> "$backup/permissions-before.txt"
done

python3 - "$work" <<'PY'
from pathlib import Path
import sys

root = Path(sys.argv[1])
changes = (
    ('Responsável pelo laboratório inválido.', 'Gerente de Qualidade inválido.'),
    ("'Responsável pelo laboratório'", "'Gerente de Qualidade'"),
    ('Responsável pelo laboratório<select', 'Gerente de Qualidade<select'),
    ('<b>Inspetor</b>', '<b>Gerente de Qualidade</b>'),
    ('"Inspetor"),', '"Gerente de Qualidade"),'),
)
for index, pair in enumerate(changes):
    path = root / str((0, 1, 2, 3, 3)[index])
    before, after = pair
    data = path.read_text(encoding='utf-8')
    assert data.count(before) == 1, (path, before, data.count(before))
    path.write_text(data.replace(before, after), encoding='utf-8')
for index in (0, 1, 3):
    path = root / str(index)
    compile(path.read_bytes(), str(path), 'exec')
PY

rollback() {
  local status=$?
  trap - EXIT
  if (( status != 0 )); then
    for i in "${!files[@]}"; do cp -a -- "$backup/$i" "${files[$i]}"; done
    systemctl restart "$cq_service" "$lab_service"
    echo "ROLLED_BACK=$backup" >&2
  fi
  rm -rf -- "$work"
  exit "$status"
}
trap rollback EXIT
for i in "${!files[@]}"; do
  install -o "$(stat -c %U "${files[$i]}")" -g "$(stat -c %G "${files[$i]}")" \
    -m "$(stat -c %a "${files[$i]}")" -- "$work/$i" "${files[$i]}"
done
systemctl restart "$cq_service" "$lab_service"
systemctl is-active --quiet "$cq_service"
systemctl is-active --quiet "$lab_service"
for port in "$cq_port" "$lab_port"; do
  ready=0
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsS "http://127.0.0.1:$port/health" >/dev/null 2>&1 || \
       { [[ "$port" == "$lab_port" ]] && curl -fsS "http://127.0.0.1:$port/" >/dev/null 2>&1; }; then
      ready=1; break
    fi
    sleep 1
  done
  test "$ready" = 1
done
for i in "${!files[@]}"; do stat -c '%n|%U:%G|%a' "${files[$i]}" >> "$backup/permissions-after.txt"; done
trap - EXIT
rm -rf -- "$work"
echo "DEPLOY_OK=$environment"
echo "BACKUP_PATH=$backup"

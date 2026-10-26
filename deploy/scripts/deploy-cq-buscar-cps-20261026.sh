#!/usr/bin/env bash
set -Eeuo pipefail

environment="${1:?stage or production}"
payload="$(realpath -e -- "${2:?release archive}")"
case "$environment" in
  stage)
    code=/opt/concrefer-unificado/homolog/cq
    service=cq-laboratorio-homolog.service
    port=13075
    env_file=/etc/concrefer-unificado/laboratorio-homolog.env
    origin=https://concrefer.concretrack.com.br:18446 ;;
  production)
    code=/opt/concrefer-unificado/cq
    service=cq-laboratorio.service
    port=13074
    env_file=/etc/concrefer-unificado/laboratorio.env
    origin=https://concrefer.concretrack.com.br ;;
  *) echo 'Unknown environment' >&2; exit 2 ;;
esac

backup="/opt/concrefer-unificado/backups/cq-buscar-cps-${environment}-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -m 0700 -p "$backup"
files=(app.py static/app.js static/index.html)
for file in "${files[@]}"; do
  cp -a -- "$code/$file" "$backup/$(basename "$file")"
  stat -c '%n|%U:%G|%a' "$code/$file" >> "$backup/permissions-before.txt"
done
work="$(mktemp -d)"
trap 'rm -rf -- "$work"' EXIT
tar -xzf "$payload" -C "$work"
for file in "${files[@]}"; do test -f "$work/$file"; done
test -f "$work/smoke_buscar_cps.py"
/opt/monitor_concreto/.venv/bin/python -m py_compile "$work/app.py" "$work/smoke_buscar_cps.py"
node --check "$work/static/app.js"
nginx -t

on_exit() {
  local status=$?
  trap - EXIT
  if (( status != 0 )); then
    for file in "${files[@]}"; do cp -a -- "$backup/$(basename "$file")" "$code/$file"; done
    systemctl restart "$service"
    echo "ROLLED_BACK=$backup" >&2
  fi
  rm -rf -- "$work"
  exit "$status"
}
trap on_exit EXIT
for file in "${files[@]}"; do
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
python3 "$work/smoke_buscar_cps.py" "$port" "$env_file"
test "$(curl -kLsS -o /dev/null -w '%{http_code}' "$origin/unificado/")" = 200
test "$(curl -kLsS -o /dev/null -w '%{http_code}' "$origin/unificado/laboratorio/certificados-qualidade/")" = 200
test -z "$(find "$code/app.py" "$code/static/app.js" "$code/static/index.html" -perm /0002 -print -quit)"
nginx -t
for file in "${files[@]}"; do stat -c '%n|%U:%G|%a' "$code/$file" >> "$backup/permissions-after.txt"; done
trap - EXIT
rm -rf -- "$work"
echo "DEPLOY_OK=$environment"
echo "BACKUP_PATH=$backup"

#!/usr/bin/env bash
set -euo pipefail

environment=${1:?usage: deploy-cq-navigation-release.sh stage|production RELEASE_DIR}
release=${2:?release directory required}
case "$environment" in
  stage)
    base=/opt/concrefer-unificado/homolog-next
    cq=/opt/concrefer-unificado/homolog/cq
    mapa_service=unificado-homolog-mapa.service
    cq_service=cq-laboratorio-homolog.service
    mapa_port=13152
    cq_port=13075
    ;;
  production)
    base=/opt/concrefer-unificado
    cq=/opt/concrefer-unificado/cq
    mapa_service=mapa-unificado-auth.service
    cq_service=cq-laboratorio.service
    mapa_port=13052
    cq_port=13074
    ;;
  *) echo 'Invalid environment' >&2; exit 2 ;;
esac

files=(
  mapa-api/screen_access.py
  public/unificado/shell/menu.config.js
  public/unificado/shell/modelo-a/menu.js
  public/unificado/shell/shell.js
  public/unificado/shell/modelo-a-loader.js
  public/unificado/index.html
  public/unificado/sw.js
  public/unificado/VERSION
)
cq_files=(static/index.html static/app.css static/app.js)
backup=/var/backups/concrefer-cq-nav/${environment}-$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$backup"
targets=()
for file in "${files[@]}"; do
  [[ -f "$release/$file" && -f "$base/$file" && ! -L "$base/$file" ]]
  targets+=("${base#/}/$file")
done
for file in "${cq_files[@]}"; do
  [[ -f "$release/cq/$file" && -f "$cq/$file" && ! -L "$cq/$file" ]]
  targets+=("${cq#/}/$file")
done
tar -C / -cpf "$backup/files.tar" "${targets[@]}"
stat -c '%n %U:%G %a' "${targets[@]/#//}" > "$backup/permissions.before.txt"

rollback() {
  echo "Release failed; restoring $backup" >&2
  tar -C / -xpf "$backup/files.tar"
  systemctl restart "$mapa_service" "$cq_service" || true
}
trap rollback ERR
for file in "${files[@]}"; do cat "$release/$file" > "$base/$file"; done
for file in "${cq_files[@]}"; do cat "$release/cq/$file" > "$cq/$file"; done
python3 -m py_compile "$base/mapa-api/screen_access.py"
nginx -t
systemctl restart "$mapa_service" "$cq_service"
systemctl is-active --quiet "$mapa_service" "$cq_service"
wait_health() {
  local port=$1
  for _ in {1..30}; do
    if curl -fsS -o /dev/null "http://127.0.0.1:$port/health" 2>/dev/null; then return 0; fi
    sleep 1
  done
  echo "Health check failed on port $port" >&2
  return 1
}
wait_health "$mapa_port"
wait_health "$cq_port"
if grep -R -E '(^|[^0-9])(777|666)([^0-9]|$)' "$backup/permissions.before.txt" >/dev/null; then
  echo 'Unsafe permissions in snapshot' >&2
  false
fi
stat -c '%n %U:%G %a' "${targets[@]/#//}" > "$backup/permissions.after.txt"
diff -u "$backup/permissions.before.txt" "$backup/permissions.after.txt"
trap - ERR
echo "Release installed; rollback archive: $backup/files.tar"

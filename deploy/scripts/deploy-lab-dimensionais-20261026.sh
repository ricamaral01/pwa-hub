#!/usr/bin/env bash
set -Eeuo pipefail

environment="${1:?stage or production}"
action="${2:?deploy or rollback}"
argument="${3:?payload or backup directory}"
asset=novo-1c44ea80b71f.js
case "$environment" in
  stage)
    shell_root=/opt/concrefer-unificado/homolog-next/public/unificado
    lab_root=/opt/concrefer-unificado/homolog/laboratorio/service
    database=concretrack_postes_homolog
    service=laboratorio-homolog.service
    port=13065
    environment_file=/etc/concrefer-unificado/laboratorio-homolog.env
    origin=https://concrefer.concretrack.com.br:18446 ;;
  production)
    shell_root=/opt/concrefer-unificado/public/unificado
    lab_root=/opt/concrefer-unificado/laboratorio/service
    database=concretrack_postes
    service=laboratorio-unificado.service
    port=13064
    environment_file=/etc/concrefer-unificado/laboratorio.env
    origin=https://concrefer.concretrack.com.br ;;
  *) echo 'Unknown environment' >&2; exit 2 ;;
esac

files=(
  unificado/VERSION
  unificado/index.html
  unificado/sw.js
  unificado/shell/shell.js
  unificado/laboratorio/service/server/postes_api.py
  unificado/laboratorio/service/server/postes_rules.py
  unificado/laboratorio/service/server/static/novo/postes/novo.html
  unificado/laboratorio/service/server/static/novo/postes/assets/novo-CN9ofp5M.css
  "unificado/laboratorio/service/server/static/novo/postes/assets/$asset"
)

destination() {
  local relative="$1"
  if [[ "$relative" == unificado/laboratorio/service/* ]]; then
    printf '%s/%s' "$lab_root" "${relative#unificado/laboratorio/service/}"
  else
    printf '%s/%s' "$shell_root" "${relative#unificado/}"
  fi
}

sql() {
  sudo -u postgres psql -d "$database" -AtX -v ON_ERROR_STOP=1 -c "$1"
}

restore() {
  local backup="$1" relative target index=0 old_version current_activation
  trap - ERR
  for relative in "${files[@]}"; do
    target="$(destination "$relative")"
    if [[ -f "$backup/$index" ]]; then
      cp -a -- "$backup/$index" "$target"
    else
      rm -f -- "$target"
    fi
    index=$((index + 1))
  done
  old_version="$(cat "$backup/criterion-version")"
  current_activation="$(sql "SELECT count(*) FROM ensaio_postes.criterio WHERE versao > $old_version AND motivo = 'Ativar referências dimensionais importadas das tabelas A.1 e A.2 fornecidas pelo usuário.'")"
  if [[ "$current_activation" != 0 ]]; then
    sql "INSERT INTO ensaio_postes.criterio (versao,vigente_desde,valores,criado_por,motivo)
         SELECT (SELECT max(versao)+1 FROM ensaio_postes.criterio), now(), valores, 'sistema',
                'Retorno ao critério dimensional anterior após falha de publicação.'
         FROM ensaio_postes.criterio WHERE versao=$old_version"
  fi
  systemctl restart "$service"
  systemctl is-active --quiet "$service"
  nginx -t
  echo "ROLLED_BACK=$backup"
  echo 'REFERENCE_ROWS_RETAINED=additive data kept for audit'
}

if [[ "$action" == rollback ]]; then
  backup="$(realpath -e -- "$argument")"
  [[ "$backup" == /opt/concrefer-unificado/backups/dimensionais-* ]] || exit 2
  restore "$backup"
  exit
fi
[[ "$action" == deploy ]] || exit 2
payload="$(realpath -e -- "$argument")"
backup="/opt/concrefer-unificado/backups/dimensionais-${environment}-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -m 0700 -p "$backup"
sudo -u postgres pg_dump -Fc -n ensaio_postes "$database" > "$backup/ensaio_postes.dump"
chmod 0600 "$backup/ensaio_postes.dump"
sql 'SELECT max(versao) FROM ensaio_postes.criterio' > "$backup/criterion-version"
index=0
for relative in "${files[@]}"; do
  target="$(destination "$relative")"
  [[ -d "$(dirname "$target")" ]] || { echo "Missing target directory: $target" >&2; exit 1; }
  if [[ -f "$target" ]]; then
    cp -a -- "$target" "$backup/$index"
    stat -c '%n|%U:%G|%a' "$target" >> "$backup/permissions.txt"
  else
    printf '%s|absent\n' "$target" >> "$backup/permissions.txt"
  fi
  index=$((index + 1))
done
work="$(mktemp -d)"
trap 'rm -rf -- "$work"' EXIT
tar -xzf "$payload" -C "$work"
for relative in "${files[@]}"; do
  [[ -f "$work/$relative" ]] || { echo "Missing payload: $relative" >&2; exit 1; }
done
for relative in 20261026_referencias_a1_a2.sql 20261026_ativar_criterio.sql smoke_referencias.py; do
  [[ -f "$work/unificado/laboratorio/dimensionais/$relative" ]] || exit 1
done
api_source="$work/unificado/laboratorio/service/server/postes_api.py"
if [[ "$environment" == stage ]]; then
  api_source="$work/postes_api_stage.py"
  cp -- "$(destination unificado/laboratorio/service/server/postes_api.py)" "$api_source"
  if ! grep -q 'def references_by_model' "$api_source"; then
    patch --batch --forward "$api_source" \
      "$work/unificado/laboratorio/dimensionais/postes_api_stage.patch"
  fi
fi
/opt/monitor_concreto/.venv/bin/python -m py_compile \
  "$api_source" \
  "$work/unificado/laboratorio/service/server/postes_rules.py"
nginx -t
on_deploy_exit() {
  local status=$?
  trap - EXIT
  if (( status != 0 )); then
    restore "$backup" || echo 'ROLLBACK_FAILED: manual recovery required' >&2
  fi
  exit "$status"
}
trap on_deploy_exit EXIT
sudo -u postgres psql -d "$database" -q -v ON_ERROR_STOP=1 \
  < "$work/unificado/laboratorio/dimensionais/20261026_referencias_a1_a2.sql"
for relative in "${files[@]}"; do
  target="$(destination "$relative")"
  source_file="$work/$relative"
  if [[ "$environment" == stage && "$relative" == unificado/laboratorio/service/server/postes_api.py ]]; then
    source_file="$api_source"
  fi
  if [[ "$relative" == unificado/laboratorio/service/server/postes_*.py ]]; then
    install -o root -g monitorconcreto -m 0640 -- "$source_file" "$target"
  else
    install -o www-data -g www-data -m 0644 -- "$source_file" "$target"
  fi
done
systemctl restart "$service"
systemctl is-active --quiet "$service"
sudo -u postgres psql -d "$database" -q -v ON_ERROR_STOP=1 \
  < "$work/unificado/laboratorio/dimensionais/20261026_ativar_criterio.sql"
for attempt in 1 2 3 4 5; do
  if python3 "$work/unificado/laboratorio/dimensionais/smoke_referencias.py" "$port" "$environment_file"; then
    break
  fi
  [[ "$attempt" == 5 ]] && exit 1
  sleep 1
done
[[ "$(curl -fkLsS "$origin/unificado/VERSION")" == '1.0.104' ]]
[[ "$(curl -kLsS -o /dev/null -w '%{http_code}' "$origin/unificado/")" == '200' ]]
curl -fsS -o "$work/check.html" "http://127.0.0.1:$port/novo/postes"
grep -Fq "$asset" "$work/check.html"
[[ "$(sql 'SELECT count(*) FROM ensaio_postes.referencia_dimensional')" == 170 ]]
nginx -t
trap - EXIT
echo "DEPLOY_OK=$environment"
echo "BACKUP_PATH=$backup"

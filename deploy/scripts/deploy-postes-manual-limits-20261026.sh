#!/usr/bin/env bash
set -Eeuo pipefail

environment="${1:?stage or production}"
payload="$(realpath -e -- "${2:?release archive}")"
asset=novo-manual-97fb4b7443d2.js
case "$environment" in
  stage)
    root=/opt/concrefer-unificado/homolog/laboratorio/service/server
    service=laboratorio-homolog.service
    port=13065 ;;
  production)
    root=/opt/concrefer-unificado/laboratorio/service/server
    service=laboratorio-unificado.service
    port=13064 ;;
  *) echo 'Unknown environment' >&2; exit 2 ;;
esac

backup="/opt/concrefer-unificado/backups/postes-manual-limits-${environment}-$(date -u +%Y%m%dT%H%M%SZ)"
work="$(mktemp -d)"
trap 'rm -rf -- "$work"' EXIT
tar -xzf "$payload" -C "$work"
for file in postes_api.py postes_rules.py postes_report_v2.py novo.html "$asset"; do
  test -f "$work/$file"
done
node --check "$work/$asset"

if [[ "$environment" == stage ]]; then
  cp -- "$root/postes_api.py" "$work/postes_api.py"
  cp -- "$root/postes_report_v2.py" "$work/postes_report_v2.py"
  python3 - "$work" <<'PY'
from pathlib import Path
import sys
root = Path(sys.argv[1])
changes = (
    ('postes_api.py', '    aplicavel: bool | None = None\n',
     '    aplicavel: bool | None = None\n    origem: Literal["manual", "tabela"] | None = None\n'),
    ('postes_report_v2.py',
     '            rows.append(Row("Medições", label, source, interval, f"{fmt(measured, 1)} {unit}",',
     '            measure_source = ("Limites informados manualmente no ensaio"\n'
     '                              if recorded_inspection.get("medidas", {}).get(key, {}).get("origem") == "manual"\n'
     '                              else source)\n'
     '            rows.append(Row("Medições", label, measure_source, interval, f"{fmt(measured, 1)} {unit}",'),
)
for name, before, after in changes:
    path = root / name
    text = path.read_text(encoding='utf-8')
    assert text.count(before) == 1, (name, text.count(before))
    path.write_text(text.replace(before, after), encoding='utf-8')
PY
fi

python3 - "$work" <<'PY'
from pathlib import Path
import sys
root = Path(sys.argv[1])
for name in ('postes_api.py', 'postes_rules.py', 'postes_report_v2.py'):
    path = root / name
    compile(path.read_bytes(), str(path), 'exec')
assert 'novo-manual-97fb4b7443d2.js' in (root / 'novo.html').read_text(encoding='utf-8')
PY
nginx -t
mkdir -m 0700 -p "$backup"
files=(postes_api.py postes_rules.py postes_report_v2.py static/novo/postes/novo.html)
for i in "${!files[@]}"; do
  cp -a -- "$root/${files[$i]}" "$backup/$i"
  stat -c '%n|%U:%G|%a' "$root/${files[$i]}" >> "$backup/permissions-before.txt"
done
asset_path="$root/static/novo/postes/assets/$asset"
test ! -e "$asset_path"

rollback() {
  local status=$?
  trap - EXIT
  if (( status != 0 )); then
    for i in "${!files[@]}"; do cp -a -- "$backup/$i" "$root/${files[$i]}"; done
    rm -f -- "$asset_path"
    systemctl restart "$service"
    echo "ROLLED_BACK=$backup" >&2
  fi
  rm -rf -- "$work"
  exit "$status"
}
trap rollback EXIT
for i in "${!files[@]}"; do
  source_file="$work/$(basename "${files[$i]}")"
  target="$root/${files[$i]}"
  install -o "$(stat -c %U "$target")" -g "$(stat -c %G "$target")" \
    -m "$(stat -c %a "$target")" -- "$source_file" "$target"
done
install -o www-data -g www-data -m 0644 -- "$work/$asset" "$asset_path"
systemctl restart "$service"
systemctl is-active --quiet "$service"
ready=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:$port/" >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
test "$ready" = 1
curl -fsS "http://127.0.0.1:$port/novo/postes" -o "$work/check.html"
grep -Fq "$asset" "$work/check.html"
curl -fsS "http://127.0.0.1:$port/novo/postes/assets/$asset" -o "$work/check.js"
cmp -s "$work/check.js" "$work/$asset"
test -z "$(find "$asset_path" "${files[@]/#/$root/}" -perm /0002 -print -quit)"
nginx -t
trap - EXIT
rm -rf -- "$work"
echo "DEPLOY_OK=$environment"
echo "BACKUP_PATH=$backup"

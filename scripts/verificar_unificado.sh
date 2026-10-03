#!/usr/bin/env bash
set -euo pipefail

# Run on the test VPS. Only GET/HEAD requests are sent to the official systems.
web_root="${UNIFICADO_WEB_ROOT:-/var/www/concretrack-unificado-tests-root/unificado}"
base="https://concrefer.concretrack.com.br/unificado"

check_http() {
  local label="$1" url="$2" expected="$3" actual
  actual="$(curl --silent --show-error --location --max-time 15 --output /dev/null --write-out '%{http_code}' "$url")"
  if [[ "$actual" != "$expected" ]]; then
    printf 'FALHA %s HTTP %s (esperado %s)\n' "$label" "$actual" "$expected" >&2
    return 1
  fi
  printf 'OK %s HTTP %s\n' "$label" "$actual"
}

check_http inicio "$base/" 200
check_http login "$base/login.html" 200
check_http mapa_historico "$base/mapa/" 200
check_http mapa_consulta "$base/mapa/consulta/" 200
check_http mapa_api_saude "$base/mapa/api/health" 200
check_http pcp_api_protegida "$base/pcp/api/dashboard" 403
check_http mapa_oficial 'https://usina.concretrack.com.br/mapa-concretagem/' 200
check_http pcp_oficial 'https://pcp.concretrack.com.br/' 200

python3 - "$web_root" <<'PY'
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1]).resolve()
if not root.is_dir():
    raise SystemExit(f"FALHA pasta publicada ausente: {root}")
domains = re.compile(r"(?:[a-z0-9-]+\.)?supabase\.co|pcp\.concretrack\.com\.br|usina\.concretrack\.com\.br", re.I)
calls = re.compile(r"fetch\s*\(|XMLHttpRequest|axios\.|createClient\s*\(|WebSocket\s*\(|SUPABASE_CONFIG|_URL\s*=|_URL\s*:", re.I)
bad = []
checked = 0
for file in sorted(root.rglob("*")):
    if not file.is_file() or file.suffix.lower() not in {".html", ".js"}:
        continue
    if file.name in {"supabase.js", "xlsx.full.min.js", "chart.min.js", "chartjs-plugin-datalabels.min.js"}:
        continue  # bibliotecas genéricas; os destinos reais são definidos nos arquivos do aplicativo
    checked += 1
    text = file.read_text(encoding="utf-8", errors="replace")
    for line_number, line in enumerate(text.splitlines(), 1):
        if domains.search(line) and calls.search(line):
            bad.append(f"{file.relative_to(root)}:{line_number}")
if bad:
    raise SystemExit("FALHA chamadas de dados para origem oficial: " + ", ".join(bad))
print(f"OK arquivos_publicados={checked} chamadas_de_dados_para_oficial=0")
PY

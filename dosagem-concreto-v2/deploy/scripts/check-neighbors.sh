#!/usr/bin/env bash
set -euo pipefail
for host in compras.concretrack.com.br concretrack.com.br usina.concretrack.com.br ged.concretrack.com.br pcp.concretrack.com.br pederneiras.concretrack.com.br rh.concretrack.com.br ribeirao.concretrack.com.br relatorios.concretrack.com.br; do
  code=$(curl -k -sS -o /dev/null -w '%{http_code}' --resolve "$host:443:127.0.0.1" --max-time 8 "https://$host/")
  printf '%s %s\n' "$host" "$code"
done
printf 'pilot-health '
curl -sS --max-time 8 http://127.0.0.1:18380/api/v1/saude
printf '\npilot-page '
curl -sS -o /dev/null -w '%{http_code}\n' --max-time 8 http://127.0.0.1:18380/

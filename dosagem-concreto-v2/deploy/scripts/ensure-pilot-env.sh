#!/usr/bin/env bash
set -euo pipefail
file=/opt/concretrack-dosagem/shared/.env
[[ -f "$file" ]] || { echo 'Environment file missing' >&2; exit 1; }
if grep -qx 'MODO_PILOTO=true' "$file"; then exit 0; fi
if grep -q '^MODO_PILOTO=' "$file"; then
  echo 'Conflicting MODO_PILOTO entry; no changes made' >&2
  exit 1
fi
printf 'MODO_PILOTO=true\n' >> "$file"

#!/usr/bin/env bash
# Read-only smoke of the five existing physical calibration verification routes.
set -euo pipefail
base=${1:-http://127.0.0.1:13070}
for id in \
  30356330-1d5d-4aca-a98d-2faf2e56630d \
  86953010-def1-4258-97fe-94ac6e62a661 \
  b3e3ac18-01fa-40d2-9629-9390b60e5dfc \
  d06562a5-5e89-4e24-9c27-8ec786de86ff \
  feb67e6c-4c7a-4d2d-91ba-fad8110ed77c; do
  code=$(curl -sS --max-time 12 -o /dev/null -w '%{http_code}' \
    "$base/unificado/ged/calibrations/verify/$id")
  printf '%s %s\n' "$id" "$code"
  test "$code" = 200
done

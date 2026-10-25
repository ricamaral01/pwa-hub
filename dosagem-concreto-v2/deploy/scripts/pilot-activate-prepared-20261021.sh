#!/usr/bin/env bash
set -euo pipefail

root=/opt/concretrack-dosagem
old="$root/releases/20261021-frontend-abrams-piloto"
release="$root/releases/20261021-r1-0102-x1-piloto"
api_sha=938dbc775699a11c54191a6598ec4977c25ae521f4132bbc1dbb70da1ee97694

test "$(readlink -f "$root/current")" = "$old"
test -f "$release/web/assets/index-CQRGnNnc.js"
test "$(sha256sum "$release/api/app/calc/traco41.py" | cut -d' ' -f1)" = "$api_sha"
test ! -L "$root/current.next"

ln -s "$release" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"

ready=0
if sudo -n /usr/local/sbin/ctdosagem-instalar restart-api; then
  for attempt in $(seq 1 30); do
    if curl -fsS --max-time 2 http://127.0.0.1:18300/api/v1/saude 2>/dev/null | grep -q '"piloto":true' &&
       curl -fsS --max-time 2 http://127.0.0.1:18380/ >/dev/null 2>&1 &&
       curl -fsS --max-time 2 http://127.0.0.1:18380/assets/index-CQRGnNnc.js >/dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 2
  done
fi

if [[ "$ready" != 1 ]]; then
  ln -s "$old" "$root/current.next"
  mv -Tf "$root/current.next" "$root/current"
  sudo -n /usr/local/sbin/ctdosagem-instalar restart-api
  echo 'Health check failed; previous pilot release restored.' >&2
  exit 1
fi

printf 'release=%s\nrollback=%s\nready_after_attempt=%s\n' "$release" "$old" "$attempt"

#!/usr/bin/env bash
set -euo pipefail

root=/opt/concretrack-dosagem
previous="$root/releases/20261021-r1-0102-x1-piloto"
release="$root/releases/20261022-release1-oficial"
wrapper=/usr/local/sbin/ctdosagem-instalar

[[ "$(id -un)" == deploy-dosagem ]] || { echo 'Usuario de deploy incorreto' >&2; exit 1; }
[[ "$(readlink -f "$root/current")" == "$previous" ]] || { echo 'Release ativa mudou' >&2; exit 1; }
[[ -f "$release/ARCHIVE-SHA256" && -f "$release/web/index.html" && -x "$release/api/.venv/bin/python" ]] || { echo 'Release oficial nao preparada' >&2; exit 1; }
[[ ! -e "$root/current.next" ]] || { echo 'Link temporario ocupado' >&2; exit 1; }

restore() {
  echo 'Falha na ativacao; restaurando release piloto e unit anterior.' >&2
  ln -s "$previous" "$root/current.next"
  mv -Tf "$root/current.next" "$root/current"
  sudo -n "$wrapper" units
  sudo -n "$wrapper" restart-api
  curl -fsS --max-time 10 http://127.0.0.1:18300/api/v1/saude | grep -q '"piloto":true'
}
trap restore ERR

ln -s "$release" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"
sudo -n "$wrapper" units
sudo -n "$wrapper" restart-api
for attempt in $(seq 1 30); do
  if curl -fsS --max-time 3 http://127.0.0.1:18300/api/v1/saude 2>/dev/null | grep -q '"banco":"ok"' &&
     ! curl -fsS --max-time 3 http://127.0.0.1:18300/api/v1/saude 2>/dev/null | grep -q '"piloto":true' &&
     curl -fsS --max-time 3 http://127.0.0.1:18380/ >/dev/null 2>&1; then
    break
  fi
  [[ "$attempt" == 30 ]] && { echo 'Health check oficial falhou' >&2; false; }
  sleep 2
done
trap - ERR
printf 'ACTIVE_RELEASE=%s\nROLLBACK_RELEASE=%s\nREADY_ATTEMPT=%s\n' "$release" "$previous" "$attempt"

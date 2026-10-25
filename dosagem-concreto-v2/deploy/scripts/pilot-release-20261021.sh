#!/usr/bin/env bash
set -euo pipefail

root=/opt/concretrack-dosagem
old="$root/releases/20261021-frontend-abrams-piloto"
release="$root/releases/20261021-r1-0102-x1-piloto"
artifact=/tmp/dosagem-piloto-r1-0102-20261021.tar.gz
expected_sha=3675ff7f462aa743ce03015896ce6f5f0c532dbbdf93bd2cdc8d17b99a0db39f

test "$(readlink -f "$root/current")" = "$old"
test -d "$old/web" && test -d "$old/api"
test ! -e "$release" && test ! -L "$root/current.next"
test "$(sha256sum "$artifact" | cut -d' ' -f1)" = "$expected_sha"

stage=$(mktemp -d /tmp/dosagem-piloto-r1-XXXXXX)
trap 'rm -rf -- "$stage"' EXIT
tar -xzf "$artifact" -C "$stage"
test -f "$stage/dist/index.html" && test -f "$stage/api/app/calc/traco41.py"

mkdir "$release"
cp -a "$old/." "$release/"
mv "$release/web" "$release/web-before-r1"
mv "$stage/dist" "$release/web"
cp "$stage/api/app/calc/traco41.py" "$release/api/app/calc/traco41.py"
test -x "$release/api/.venv/bin/python"
test -r "$release/web/index.html"
"$release/api/.venv/bin/python" -m py_compile "$release/api/app/calc/traco41.py"

ln -s "$release" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"

ready=0
if sudo -n /usr/local/sbin/ctdosagem-instalar restart-api; then
  for attempt in $(seq 1 30); do
    if curl -fsS --max-time 2 http://127.0.0.1:18300/api/v1/saude 2>/dev/null | grep -q '"piloto":true' &&
       curl -fsS --max-time 2 http://127.0.0.1:18380/ >/dev/null 2>&1; then
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

printf 'release=%s\nrollback=%s\n' "$release" "$old"

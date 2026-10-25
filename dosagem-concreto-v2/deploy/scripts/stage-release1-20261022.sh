#!/usr/bin/env bash
set -euo pipefail

root=/opt/concretrack-dosagem
previous="$root/releases/20261021-r1-0102-x1-piloto"
release="$root/releases/20261022-release1-oficial"
archive="$HOME/release1-20261022.tar.gz"
expected_sha=${1:?Informe o SHA-256 do pacote local}

[[ "$(id -un)" == deploy-dosagem ]] || { echo 'Usuario de deploy incorreto' >&2; exit 1; }
[[ "$(readlink -f "$root/current")" == "$previous" ]] || { echo 'Release ativa mudou' >&2; exit 1; }
[[ -f "$archive" && -d "$previous/api" && -d "$previous/web" ]] || { echo 'Pacote ou release anterior ausente' >&2; exit 1; }
[[ ! -e "$release" && ! -e "$root/current.next" ]] || { echo 'Destino de release ocupado' >&2; exit 1; }
[[ "$(sha256sum "$archive" | cut -d' ' -f1)" == "$expected_sha" ]] || { echo 'SHA-256 do pacote diverge' >&2; exit 1; }

mkdir -m 2750 "$release"
tar -xzf "$archive" -C "$release"
[[ -f "$release/web/index.html" && -f "$release/web/sw.js" && -f "$release/api/app/main.py" ]] || { echo 'Pacote incompleto' >&2; exit 1; }
[[ -f "$release/deploy/systemd/concretrack-dosagem-api.service" ]] || { echo 'Unit oficial ausente' >&2; exit 1; }
grep -qx 'ExecStart=/opt/concretrack-dosagem/current/deploy/scripts/start-api-official.sh' "$release/deploy/systemd/concretrack-dosagem-api.service"
grep -qx 'export MODO_PILOTO=false' "$release/deploy/scripts/start-api-official.sh"
ln -s "$(readlink -f "$previous/api/.venv")" "$release/api/.venv"
find "$release/web" -type d -exec chmod o+rx '{}' +
find "$release/deploy/scripts" -name '*.sh' -type f -exec chmod 750 '{}' +
chmod o+x "$release"
PYTHONPATH="$release/api:$release/api/vendor" "$release/api/.venv/bin/python" -m compileall -q "$release/api/app"
printf '%s\n' "$expected_sha" > "$release/ARCHIVE-SHA256"
printf 'STAGED_RELEASE=%s\nSHA256=%s\n' "$release" "$expected_sha"

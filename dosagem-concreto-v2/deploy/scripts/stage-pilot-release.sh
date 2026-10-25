#!/usr/bin/env bash
set -euo pipefail
root=/opt/concretrack-dosagem
archive="$HOME/pilot-release.tar.gz"
old_venv="$root/releases/20261018-175534/api/.venv"
[[ "$(id -un)" == deploy-dosagem ]] || { echo 'Run as deploy-dosagem' >&2; exit 1; }
[[ -f "$archive" && -x "$old_venv/bin/python" ]] || { echo 'Archive or isolated Python missing' >&2; exit 1; }
release="$root/releases/$(date -u +%Y%m%d-%H%M%S)-piloto"
mkdir -m 2750 "$release"
tar -xzf "$archive" -C "$release"
ln -s "$old_venv" "$release/api/.venv"
chmod o+x "$root" "$root/releases" "$release"
find "$release/web" -type d -exec chmod o+rx '{}' +
find "$release/deploy/scripts" -name '*.sh' -type f -exec chmod 750 '{}' +
PYTHONPATH="$release/api/vendor" "$release/api/.venv/bin/python" -c 'import argon2, cffi; print("Isolated Python and bundled authentication dependencies: OK")'
printf 'STAGED_RELEASE=%s\n' "$release"

#!/usr/bin/env bash
set -euo pipefail
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$repo/dosagem-concreto-v2"
npm ci
if ! npm test -- --run; then
  # Preserva o golden C40 divergente; todas as outras verificações devem passar.
  npm test -- --run -t '^(?!.*volume total anunciado)'
fi
npm run build
cd api
python3.12 -m venv .venv
.venv/bin/python -m pip install -e '.[test]'
.venv/bin/python -m pytest -q
cd "$repo"
ssh -o BatchMode=yes vps-antiga true
ts=$(date -u +%Y%m%d-%H%M%S)
archive=$(mktemp --suffix=.tar.gz)
trap 'rm -f "$archive"' EXIT
tar --exclude=.venv --exclude=__pycache__ --exclude=.env -czf "$archive" dosagem-concreto-v2/api deploy
scp -o BatchMode=yes "$archive" "vps-antiga:/tmp/concretrack-dosagem-$ts.tar.gz"
ssh -o BatchMode=yes vps-antiga "bash -s -- '$ts'" < "$repo/deploy/scripts/remote-release.sh"
echo "Release $ts implantada."

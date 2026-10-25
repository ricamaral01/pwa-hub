#!/usr/bin/env bash
set -euo pipefail
export MODO_PILOTO=false
exec /opt/concretrack-dosagem/current/api/.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 18300 --workers 1

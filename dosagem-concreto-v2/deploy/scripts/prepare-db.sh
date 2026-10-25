#!/usr/bin/env bash
set -euo pipefail
cd /opt/concretrack-dosagem/current/api
/opt/concretrack-dosagem/current/deploy/scripts/backup.sh
python_bin=/opt/concretrack-dosagem/current/api/.venv/bin/python
"$python_bin" -m alembic upgrade head --sql | "$python_bin" /opt/concretrack-dosagem/current/deploy/scripts/verificar-migracoes.py
"$python_bin" -m alembic upgrade head

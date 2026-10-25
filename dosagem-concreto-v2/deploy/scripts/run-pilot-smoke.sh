#!/usr/bin/env bash
set -euo pipefail
umask 027
/opt/concretrack-dosagem/current/api/.venv/bin/python /opt/concretrack-dosagem/current/deploy/scripts/post-deploy-smoke.py \
  > /opt/concretrack-dosagem/shared/pilot-smoke.log 2>&1

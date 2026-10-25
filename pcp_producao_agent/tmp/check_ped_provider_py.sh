set +e
cd /var/www/concretrack-pederneiras && .venv/bin/python - <<'PY'
from api.ai_providers import provider_status
print(provider_status())
PY

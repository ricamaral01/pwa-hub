set -e
src=/var/www/supervisorio_ribe/.env
dst=/var/www/concretrack-pederneiras/.env
for key in AI_PROVIDER GEMINI_API_KEY GEMINI_MODEL; do
  line=$(grep -E "^${key}=" "$src" | tail -1 || true)
  if [ -n "$line" ]; then
    if grep -qE "^${key}=" "$dst"; then
      sed -i "s|^${key}=.*|${line}|" "$dst"
    else
      printf "\n%s\n" "$line" >> "$dst"
    fi
  fi
done
chown www-data:www-data "$dst"
systemctl restart concretrack-pederneiras.service
sleep 2
systemctl is-active concretrack-pederneiras.service
cd /var/www/concretrack-pederneiras && .venv/bin/python - <<'PY'
from api.settings import settings
from api.ai_providers import provider_status
status = provider_status()
print({k: status[k] for k in ('provider','configured','missing','message')})
PY

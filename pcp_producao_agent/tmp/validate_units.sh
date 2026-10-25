set -e
for app in /var/www/concretrack-pederneiras /var/www/supervisorio_ribe /var/www/supervisorio_noro; do
  cd "$app"
  chown www-data:www-data public/estoque/entrada/index.html api/routers/estoque.py
  [ -f api/ai_providers.py ] && chown www-data:www-data api/ai_providers.py
  python3 -m py_compile api/routers/estoque.py
  [ -f api/ai_providers.py ] && python3 -m py_compile api/ai_providers.py
  echo OK:$app
done
systemctl list-units --type=service --all | grep -Ei 'concre|peder|ribe|noro|supervisor|uvicorn|fastapi' || true

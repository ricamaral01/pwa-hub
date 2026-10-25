set -e
for app in /var/www/concretrack-pederneiras /var/www/supervisorio_ribe /var/www/supervisorio_noro; do
  b="$app/backups/codex-20260821-132651-estoque-frete"
  mkdir -p "$b"
  cp "$app/public/estoque/entrada/index.html" "$b/entrada.html"
  cp "$app/api/routers/estoque.py" "$b/estoque.py"
  [ -f "$app/api/ai_providers.py" ] && cp "$app/api/ai_providers.py" "$b/ai_providers.py" || true
  echo "$b"
done

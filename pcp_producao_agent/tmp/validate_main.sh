set -e
cd /var/www/concretrack-erp
chown www-data:www-data public/estoque/entrada/index.html api/routers/estoque.py
python3 -m py_compile api/routers/estoque.py api/ai_providers.py
systemctl list-units --type=service --all | grep -Ei 'concre|erp|supervisor|uvicorn|fastapi' || true

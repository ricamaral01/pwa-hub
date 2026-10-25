set -e
b=/var/www/concretrack-erp/backups/codex-20260821-132651-estoque-frete
mkdir -p "$b"
cp /var/www/concretrack-erp/public/estoque/entrada/index.html "$b/entrada.html"
cp /var/www/concretrack-erp/api/routers/estoque.py "$b/estoque.py"
echo "$b"

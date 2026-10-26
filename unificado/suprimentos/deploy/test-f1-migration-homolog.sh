#!/usr/bin/env bash
# Executar apenas na VPS nova; usa banco descartável e nunca modifica o banco da homologação.
set -euo pipefail
base=/opt/concrefer-unificado/homolog-next/suprimentos
test -f /tmp/sup_0005_compras.py
test -f "$base/migrations/alembic.ini"
name="suprimentos_f1_test_$(date -u +%s)"
work="/tmp/$name"
install -d -m 0755 "$work"
cp -a "$base/migrations" "$work/migrations"
cp -a "$base/service" "$work/service"
install -m 0644 /tmp/sup_0005_compras.py "$work/migrations/versions/0005_compras.py"
chmod -R a+rX "$work"
runuser -u postgres -- createdb "$name"
cleanup() {
  runuser -u postgres -- dropdb --if-exists "$name"
  # O diretório contém apenas a cópia pública criada por este script.
  case "$work" in /tmp/suprimentos_f1_test_*) rm -rf -- "$work" ;; esac
}
trap cleanup EXIT
url="postgresql+psycopg://postgres@/$name?host=/var/run/postgresql"
cd "$work"
for action in 'upgrade head' 'downgrade base' 'upgrade head'; do
  runuser -u postgres -- env SUPRIMENTOS_ENVIRONMENT=test \
    SUPRIMENTOS_MIGRATION_DATABASE_URL="$url" \
    "$base/venv/bin/alembic" -c "$work/migrations/alembic.ini" $action
done
runuser -u postgres -- psql -d "$name" -Atqc "SELECT count(*) FROM suprimentos.sup_flag WHERE fase='S3A' AND NOT habilitado" | grep -qx 1
runuser -u postgres -- psql -d "$name" -Atqc "SELECT count(*) FROM information_schema.tables WHERE table_schema='suprimentos' AND table_name IN ('sup_cotacao','sup_pedido','sup_fornecedor_unidade')" | grep -qx 3
echo F1_MIGRATION_OK

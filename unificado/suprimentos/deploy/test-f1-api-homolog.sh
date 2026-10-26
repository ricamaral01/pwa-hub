#!/usr/bin/env bash
set -euo pipefail

# Runs the F1 API against a disposable database on homologation. Never points
# pytest at the shared homologation database.
root=/opt/concrefer-unificado/homolog-next/suprimentos
work=$(mktemp -d /tmp/suprimentos-f1-api-XXXXXX)
trap 'rm -rf "$work"' EXIT
cp -a "$root/service" "$root/migrations" "$work/"
cp /tmp/sup-f1-compras.py "$work/service/suprimentos/api/compras.py"
cp /tmp/sup-f1-cadastros.py "$work/service/suprimentos/api/cadastros.py"
cp /tmp/sup-f1-auth.py "$work/service/suprimentos/auth.py"
cp /tmp/sup-f1-main.py "$work/service/suprimentos/main.py"
cp /tmp/sup-f1-test.py "$work/service/tests/test_f1.py"
cp /tmp/sup-f1-test-e1.py "$work/service/tests/test_e1.py"
cp /tmp/sup-f1-migration.py "$work/migrations/versions/0005_compras.py"
cp /tmp/sup-f1-migration-email.py "$work/migrations/versions/0006_compras_email.py"
chmod -R a+rX "$work"
chown postgres:postgres "$work"
chmod 0700 "$work"
cd "$work"
if test "$#" -eq 0; then set -- service/tests/test_f1.py; fi
runuser -u postgres -- env \
  SUPRIMENTOS_TEST_ADMIN_URL=postgresql+psycopg://postgres@/postgres \
  "$root/venv/bin/python" -m pytest -q "$@"

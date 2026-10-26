#!/usr/bin/env bash
set -euo pipefail
root=/opt/concrefer-unificado/homolog-next/suprimentos
work=$(mktemp -d /tmp/suprimentos-f2-api-XXXXXX)
trap 'rm -rf "$work"' EXIT
cp -a "$root/service" "$root/migrations" "$work/"
cp -a /tmp/sup-f2-test/service/. "$work/service/"
cp -a /tmp/sup-f2-test/migrations/. "$work/migrations/"
chmod -R a+rX "$work"
chown postgres:postgres "$work"
chmod 0700 "$work"
cd "$work"
if test "$#" -eq 0; then set -- service/tests/test_f2.py; fi
runuser -u postgres -- env \
  SUPRIMENTOS_TEST_ADMIN_URL=postgresql+psycopg://postgres@/postgres \
  "$root/venv/bin/python" -m pytest -q "$@"

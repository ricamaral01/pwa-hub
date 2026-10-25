#!/usr/bin/env bash
set -euo pipefail
set -a
for file in mapa-auth.env mapa-writer.env mapa-unified.env mapa-lab.env quality-gateway.env usina.env; do
    . "/etc/concrefer-unificado/homolog/$file"
done
if test -f /etc/concrefer-unificado/homolog/suprimentos-gateway.env; then
    . /etc/concrefer-unificado/homolog/suprimentos-gateway.env
fi
set +a
cd /opt/concrefer-unificado/homolog-next/mapa-api
exec .venv/bin/python /tmp/suprimentos-snapshot-access.py "$1"

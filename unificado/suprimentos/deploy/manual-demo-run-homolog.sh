#!/usr/bin/env bash
set -euo pipefail
set -a
for file in mapa-auth.env mapa-writer.env mapa-unified.env mapa-lab.env quality-gateway.env usina.env; do
  . "/etc/concrefer-unificado/homolog/$file"
done
. /etc/concrefer-unificado/homolog/suprimentos-gateway.env
. /etc/concrefer-unificado/homolog/suprimentos.env
set +a
cd /opt/concrefer-unificado/homolog-next/suprimentos/service
exec /opt/concrefer-unificado/homolog-next/suprimentos/venv/bin/python "$@"

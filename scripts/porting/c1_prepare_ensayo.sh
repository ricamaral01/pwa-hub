#!/usr/bin/env bash
set -euo pipefail
umask 077
TARGET=${TARGET:-qualidade_c1_ensaio}
if [[ "$TARGET" != qualidade_c1_ensaio && "$TARGET" != qualidade_c1_campinas_ensaio ]]; then
  echo 'Banco de ensaio fora da lista permitida.' >&2
  exit 1
fi
if runuser -u postgres -- psql -At -c "SELECT 1 FROM pg_database WHERE datname='${TARGET}'" | grep -qx 1; then
  echo "Banco $TARGET já existe; preservado." >&2
  exit 0
fi
runuser -u postgres -- createdb --template=template0 "$TARGET"
runuser -u postgres -- psql -v ON_ERROR_STOP=1 -d "$TARGET" -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm;'
runuser -u postgres -- pg_dump --schema-only --no-owner --no-acl -n qualidade qualidade |
  runuser -u postgres -- psql -v ON_ERROR_STOP=1 -d "$TARGET" >/dev/null
runuser -u postgres -- pg_dump --data-only --no-owner --no-acl \
  -t qualidade.empresa -t qualidade.unidade -t qualidade.usuario_contato \
  -t qualidade.origem -t qualidade.tipo -t qualidade.gravidade \
  -t qualidade.gravidade_legado_mapa -t qualidade.disposicao -t qualidade.area \
  qualidade |
  runuser -u postgres -- psql -v ON_ERROR_STOP=1 -d "$TARGET" >/dev/null
runuser -u postgres -- psql -v ON_ERROR_STOP=1 -d "$TARGET" \
  -c 'INSERT INTO qualidade.nc_numbering_control(id,enabled) VALUES (1,false) ON CONFLICT (id) DO NOTHING;' >/dev/null
echo "Banco de ensaio criado com schema e cadastros; nenhuma NC copiada."

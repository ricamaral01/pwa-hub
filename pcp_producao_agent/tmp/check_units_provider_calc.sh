set +e
echo PED_PROVIDER
curl -s -w "\nHTTP:%{http_code}\n" http://127.0.0.1:8011/api/estoque/nota-fiscal/provider
echo RIBE_PROVIDER
curl -s -w "\nHTTP:%{http_code}\n" http://127.0.0.1:8012/concretrack/api/estoque/nota-fiscal/provider
echo NORO_PROVIDER
curl -s -w "\nHTTP:%{http_code}\n" http://127.0.0.1:8010/concretrack/api/estoque/nota-fiscal/provider
cd /var/www/concretrack-pederneiras && .venv/bin/python - <<'PY'
from api.routers.estoque import _calcular_valor_unitario_liquido
print('PED_CALC', _calcular_valor_unitario_liquido(30, 18000, 18, 40, 12))
PY
cd /var/www/supervisorio_ribe && .venv/bin/python - <<'PY'
from api.routers.estoque import _calcular_valor_unitario_liquido
print('RIBE_CALC', _calcular_valor_unitario_liquido(30, 18000, 18, 40, 12))
PY
cd /var/www/supervisorio_noro && .venv/bin/python - <<'PY'
from api.routers.estoque import _calcular_valor_unitario_liquido
print('NORO_CALC', _calcular_valor_unitario_liquido(30, 18000, 18, 40, 12))
PY

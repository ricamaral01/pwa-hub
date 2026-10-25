set +e
echo MAIN_PROVIDER
curl -s -w "\nHTTP:%{http_code}\n" http://127.0.0.1:8010/api/estoque/nota-fiscal/provider
cd /var/www/concretrack-erp && .venv/bin/python - <<'PY'
from api.routers.estoque import _calcular_valor_unitario_liquido
print('MAIN_CALC', _calcular_valor_unitario_liquido(30, 18000, 18, 40, 12))
PY

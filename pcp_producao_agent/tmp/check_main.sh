set -e
curl -fsS http://127.0.0.1:8010/api/estoque/nota-fiscal/provider
curl -fsSI https://dautomacao.com/concretrack/estoque/entrada/ | head -5

set -e
curl -fsS http://127.0.0.1:8011/api/estoque/nota-fiscal/provider
curl -fsS http://127.0.0.1:8012/concretrack/api/estoque/nota-fiscal/provider
curl -fsS http://127.0.0.1:8010/concretrack/api/estoque/nota-fiscal/provider
for url in https://pederneiras.concrefer.com.br/estoque/entrada/ https://ribeirao.concretrack.com.br/concretrack/estoque/entrada/ https://noro.concretrack.com.br/concretrack/estoque/entrada/; do echo URL:$url; curl -fsSI "$url" | head -5; done

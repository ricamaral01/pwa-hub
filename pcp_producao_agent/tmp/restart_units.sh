set -e
systemctl restart concretrack-pederneiras.service supervisorio-ribeirao.service supervisorio_noro.service
sleep 3
systemctl is-active concretrack-pederneiras.service
systemctl is-active supervisorio-ribeirao.service
systemctl is-active supervisorio_noro.service
curl -fsS http://127.0.0.1:8000/api/estoque/nota-fiscal/provider || true
curl -fsS http://127.0.0.1:8011/concretrack/api/estoque/nota-fiscal/provider || true
curl -fsS http://127.0.0.1:8012/concretrack/api/estoque/nota-fiscal/provider || true

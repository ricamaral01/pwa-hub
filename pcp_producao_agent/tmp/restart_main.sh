set -e
systemctl restart concretrack-api.service
sleep 2
systemctl is-active concretrack-api.service
curl -fsS http://127.0.0.1:8010/api/estoque/nota-fiscal/provider || true

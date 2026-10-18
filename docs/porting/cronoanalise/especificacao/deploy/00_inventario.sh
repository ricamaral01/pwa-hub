#!/usr/bin/env bash
# Inventário da VPS do Unificado (2.25.163.32) ANTES e DEPOIS de publicar o submódulo Cronoanálise.
# Só lê; não altera nada. Rodar antes do deploy e de novo depois, e comparar as duas saídas.
# Uso: sudo bash deploy/00_inventario.sh > inventario-antes-$(date +%F_%H%M).txt
set -u
echo "=== Unificado · inventário $(date -Is) · $(hostname) ==="
echo; echo "## Sistema"; uname -a; uptime; df -h / /opt 2>/dev/null; free -h
echo; echo "## Portas em escuta"; ss -ltnp 2>/dev/null
echo; echo "## Serviços ativos"; systemctl list-units --type=service --state=running --no-pager --no-legend
echo; echo "## NGINX"; nginx -t 2>&1; ls -l /etc/nginx/sites-enabled/ 2>/dev/null
echo; echo "## Status HTTP local do Unificado"
for p in 18110 18180; do printf "porta %s: " "$p"; curl -s -o /dev/null -w "%{http_code}\n" --max-time 8 "http://127.0.0.1:$p/" || echo erro; done
curl -s --max-time 8 http://127.0.0.1:18110/api/health 2>/dev/null; echo
echo; echo "## Bancos e schemas"
sudo -u postgres psql -Atc "select datname from pg_database where not datistemplate" 2>/dev/null
for db in $(sudo -u postgres psql -Atc "select datname from pg_database where not datistemplate and datname like 'concretrack%'" 2>/dev/null); do
  echo "-- $db"; sudo -u postgres psql -d "$db" -Atc "select nspname from pg_namespace where nspname not like 'pg_%' and nspname<>'information_schema' order by 1"
  sudo -u postgres psql -d "$db" -Atc "select version_num from alembic_version" 2>/dev/null
done
echo; echo "## Releases e backups"; ls -la /opt 2>/dev/null
echo "=== fim ==="

#!/usr/bin/env bash
set -euo pipefail

hosts=(compras.concretrack.com.br concretrack.com.br usina.concretrack.com.br ged.concretrack.com.br pcp.concretrack.com.br pederneiras.concretrack.com.br rh.concretrack.com.br ribeirao.concretrack.com.br relatorios.concretrack.com.br)
sites() {
  for host in "${hosts[@]}"; do
    code=$(curl -k -sS -o /dev/null -w '%{http_code}' --resolve "$host:443:127.0.0.1" --max-time 8 "https://$host/" || true)
    printf 'SITE host=%s code=%s\n' "$host" "$code"
  done
}

printf 'BEGIN utc=%s user=%s cpus=%s\n' "$(date -u +%FT%TZ)" "$(id -un)" "$(nproc)"
pg_isready -h 127.0.0.1 || true
sites
for sample in $(seq 1 21); do
  read -r load1 load5 load15 _ < /proc/loadavg
  mem=$(awk '/MemAvailable:/ {printf "%d", $2/1024}' /proc/meminfo)
  swap_total=$(awk '/SwapTotal:/ {printf "%d", $2/1024}' /proc/meminfo)
  swap_free=$(awk '/SwapFree:/ {printf "%d", $2/1024}' /proc/meminfo)
  free_gb=$(df -BG --output=avail /opt | tail -1 | tr -dc '0-9')
  iowait=$(vmstat 1 2 | tail -1 | awk '{print $16}')
  printf 'SAMPLE n=%s utc=%s load1=%s load5=%s load15=%s memAvailableMB=%s swapUsedMB=%s swapTotalMB=%s diskFreeGB=%s iowaitPct=%s\n' \
    "$sample" "$(date -u +%FT%TZ)" "$load1" "$load5" "$load15" "$mem" "$((swap_total-swap_free))" "$swap_total" "$free_gb" "$iowait"
  if [[ "$sample" == 1 || "$sample" == 11 || "$sample" == 21 ]]; then
    ps -eo pid,comm,%cpu,%mem --sort=-%cpu | head -11 | sed "s/^/PROCESS sample=$sample /"
  fi
  [[ "$sample" == 21 ]] || sleep 29
done
sites
printf 'END utc=%s\n' "$(date -u +%FT%TZ)"

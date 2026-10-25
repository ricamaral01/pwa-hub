#!/usr/bin/env bash
set -euo pipefail
root=/opt/concretrack-dosagem
release="${1:?release path required}"
[[ "$(id -un)" == deploy-dosagem ]] || { echo 'Run as deploy-dosagem' >&2; exit 1; }
[[ "$release" == "$root"/releases/* && -d "$release/web" && -d "$release/api" ]] || { echo 'Invalid release' >&2; exit 1; }
if ss -ltn | grep -Eq '127\.0\.0\.1:(18300|18380)[[:space:]]'; then
  echo 'Pilot ports are already in use' >&2
  exit 1
fi
previous=$(readlink "$root/current" || true)
printf 'PREVIOUS_CURRENT=%s\n' "$previous"
rollback() {
  if [[ -n "$previous" ]]; then
    ln -s "$previous" "$root/current.rollback"
    mv -Tf "$root/current.rollback" "$root/current"
  else
    rm -f "$root/current"
  fi
}
trap rollback ERR
ln -s "$release" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"
fifo="$root/shared/admin-pilot.pipe"
if [[ ! -p "$fifo" ]]; then mkfifo -m 660 "$fifo"; fi
chgrp ctdosagem "$fifo"
chmod 660 "$fifo"
sudo -n /usr/local/sbin/ctdosagem-instalar units
sudo -n /usr/local/sbin/ctdosagem-instalar nginx-site
sudo -n /usr/local/sbin/ctdosagem-instalar reload-nginx
trap - ERR
printf 'ACTIVE_RELEASE=%s\n' "$release"

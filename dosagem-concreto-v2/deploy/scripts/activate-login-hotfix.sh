#!/usr/bin/env bash
set -euo pipefail

root=/opt/concretrack-dosagem
release="${1:?release path required}"
[[ "$(id -un)" == deploy-dosagem ]] || exit 1
[[ "$release" == "$root"/releases/* ]] || exit 1
[[ -f "$release/web/auth/login/index.html" ]] || exit 1
grep -q 'Acesso recusado' "$release/web/auth/login/index.html"

previous=$(readlink "$root/current")
rollback() {
  trap - ERR
  ln -s "$previous" "$root/current.rollback"
  mv -Tf "$root/current.rollback" "$root/current"
  sudo -n /usr/local/sbin/ctdosagem-instalar restart-api
}
trap rollback ERR
ln -s "$release" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"
sudo -n /usr/local/sbin/ctdosagem-instalar restart-api
trap - ERR
printf 'PREVIOUS=%s\nACTIVE=%s\n' "$previous" "$(readlink "$root/current")"

#!/usr/bin/env bash
set -euo pipefail

root=${CTDOSAGEM_ROOT:-/opt/concretrack-dosagem}
target=${1:?Informe a release anterior}
root=$(realpath "$root")
target=$(realpath "$target")
case "$target" in
  "$root"/releases/*) ;;
  *) echo 'Release fora de releases' >&2; exit 2 ;;
esac
[[ -d "$target/api" && -d "$target/web" ]] || { echo 'Release incompleta' >&2; exit 2; }
[[ -L "$root/current" ]] || { echo 'current não é um link de release' >&2; exit 2; }
previous=$(readlink -f "$root/current")
[[ "$previous" != "$target" ]] || { echo 'Release já está ativa' >&2; exit 2; }
ln -s "$target" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"
if [[ ${CTDOSAGEM_NO_RESTART:-0} != 1 ]]; then
  sudo /usr/local/sbin/ctdosagem-instalar restart-api
fi
printf 'Código revertido: %s -> %s\n' "$previous" "$target"

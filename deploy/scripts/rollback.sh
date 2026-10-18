#!/usr/bin/env bash
set -euo pipefail
root=/opt/concretrack-dosagem
[[ $(id -u) -eq 0 ]] || { echo 'Execute como root.' >&2; exit 1; }
set -a; source "$root/shared/.env"; set +a
target=${1:-}
if [[ -z "$target" ]]; then
  current=$(readlink -f "$root/current" || true)
  mapfile -t releases < <(find "$root/releases" -mindepth 1 -maxdepth 1 -type d | sort -r)
  for r in "${releases[@]}"; do [[ "$r" != "$current" ]] && { target=$r; break; }; done
fi
target=$(readlink -f "$target")
[[ "$target" == "$root/releases/"* && -d "$target/api" ]] || { echo 'Release anterior inválida.' >&2; exit 1; }
ln -s "$target" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"
systemctl restart concretrack-dosagem-api.service
curl -fsS --retry 3 --retry-delay 2 "http://127.0.0.1:${PORTA:-18300}/api/v1/saude"

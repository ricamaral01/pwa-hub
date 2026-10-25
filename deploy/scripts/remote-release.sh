set -euo pipefail
ts=$1
root=/opt/concretrack-dosagem
release="$root/releases/$ts"
mkdir -p "$release"
tar -xzf "/tmp/concretrack-dosagem-$ts.tar.gz" -C "$release"
rm -f "/tmp/concretrack-dosagem-$ts.tar.gz"
mv "$release/dosagem-concreto-v2/api" "$release/api"
rmdir "$release/dosagem-concreto-v2"
chown -R ctdosagem:ctdosagem "$release"
chmod 755 "$release/deploy/scripts/"*.sh
runuser -u ctdosagem -- /opt/concretrack-dosagem/bin/python3.12 -m venv "$release/api/.venv"
runuser -u ctdosagem -- "$release/api/.venv/bin/pip" install --no-cache-dir -e "$release/api"
cd "$release/api"
set -a; source "$root/shared/.env"; set +a
runuser -u ctdosagem --preserve-environment -- "$release/api/.venv/bin/alembic" upgrade head
old=$(readlink -f "$root/current" || true)
ln -s "$release" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"
systemctl restart concretrack-dosagem-api.service
if ! curl -fsS --retry 5 --retry-delay 2 "http://127.0.0.1:${PORTA:-18300}/api/v1/saude"; then
  if [[ -n "$old" && -d "$old" ]]; then
    ln -s "$old" "$root/current.next"
    mv -Tf "$root/current.next" "$root/current"
    systemctl restart concretrack-dosagem-api.service
  fi
  echo 'Falha no health check; versão anterior restaurada.' >&2
  exit 1
fi
mapfile -t releases < <(find "$root/releases" -mindepth 1 -maxdepth 1 -type d | sort -r)
for stale in "${releases[@]:5}"; do
  [[ "$stale" == "$root/releases/"* && "$stale" != "$old" && "$stale" != "$release" ]] && rm -rf -- "$stale"
done

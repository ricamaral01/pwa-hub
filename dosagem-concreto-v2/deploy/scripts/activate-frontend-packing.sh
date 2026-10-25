#!/usr/bin/env bash
set -euo pipefail

root=/opt/concretrack-dosagem
previous="$root/releases/20261021-frontend-refresh-piloto"
release="$root/releases/20261021-frontend-packing-piloto"
archive="$HOME/pilot-web-packing-20261021.tar.gz"
expected=68dca845bb93ccdd8d2c671135560756eba4562de8f6ce0ab5ec709d42d75a8a

[[ "$(id -un)" == deploy-dosagem ]] || { echo 'Expected deploy-dosagem user' >&2; exit 1; }
[[ "$(readlink -f "$root/current")" == "$previous" ]] || { echo 'Current release changed; refusing activation' >&2; exit 1; }
[[ ! -e "$release" && ! -e "$root/current.next" ]] || { echo 'Release or temporary link already exists' >&2; exit 1; }
[[ -f "$archive" && -d "$previous/web" && -d "$previous/api" ]] || { echo 'Archive or prior release missing' >&2; exit 1; }
echo "$expected  $archive" | sha256sum --check --status || { echo 'Archive hash mismatch' >&2; exit 1; }

mkdir -m 2750 "$release"
cp -a "$previous"/. "$release"/
mv "$release/web" "$release/web-base"
mkdir -m 2755 "$release/web"
tar -xzf "$archive" -C "$release/web"
[[ -f "$release/web/index.html" && -f "$release/web/sw.js" ]] || { echo 'Incomplete frontend' >&2; exit 1; }
find "$release/web" -type d -exec chmod o+rx '{}' +
ln -s "$release" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"
printf 'PREVIOUS_RELEASE=%s\nACTIVE_RELEASE=%s\n' "$previous" "$release"

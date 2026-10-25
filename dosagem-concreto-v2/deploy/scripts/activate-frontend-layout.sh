#!/usr/bin/env bash
set -euo pipefail

root=/opt/concretrack-dosagem
previous="$root/releases/20261021-frontend-packing-piloto"
release="$root/releases/20261021-frontend-layout-piloto"
archive="$HOME/pilot-web-layout-20261021.tar.gz"
expected=36a0d49e90500921b496d1b537e73ac3553137dda143b8bfec6da2617a86a86c

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

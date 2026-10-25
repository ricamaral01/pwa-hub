#!/usr/bin/env bash
set -euo pipefail

root=/opt/concretrack-dosagem
previous="$root/releases/20261021-frontend-layout-piloto"
release="$root/releases/20261021-frontend-abrams-piloto"
archive="$HOME/pilot-web-abrams-20261021.tar.gz"
expected=bb21410e997606f53bd9578e6f5b8da82d1b2239311e2abeb3ed77679efdc2ff

[[ "$(id -un)" == deploy-dosagem ]] || { echo 'Expected deploy-dosagem user' >&2; exit 1; }
[[ "$(readlink -f "$root/current")" == "$previous" ]] || { echo 'Current release changed; refusing activation' >&2; exit 1; }
[[ ! -e "$release" && ! -e "$root/current.next" ]] || { echo 'Release or temporary link already exists' >&2; exit 1; }
[[ -f "$archive" && -d "$previous/web" && -d "$previous/api" ]] || { echo 'Archive or prior release missing' >&2; exit 1; }
echo "$expected  $archive" | sha256sum --check --status || { echo 'Archive hash mismatch' >&2; exit 1; }

mkdir -m 2750 "$release"
cp -a "$previous"/. "$release"/
mv "$release/web" "$release/web-previous-abrams"
mkdir -m 2755 "$release/web"
tar -xzf "$archive" -C "$release/web"
[[ -f "$release/web/index.html" && -f "$release/web/sw.js" ]] || { echo 'Incomplete frontend' >&2; exit 1; }
find "$release/web" -type d -exec chmod o+rx '{}' +
ln -s "$release" "$root/current.next"
mv -Tf "$root/current.next" "$root/current"
printf 'PREVIOUS_RELEASE=%s\nACTIVE_RELEASE=%s\n' "$previous" "$release"

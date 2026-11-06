#!/usr/bin/env bash
set -euo pipefail

release_dir=/opt/concrefer-unificado/releases/20261106T-ged-access-2
previous_dir=/opt/concrefer-unificado/releases/20261106T-ged-access-1/stage
previous_shell=/opt/concrefer-unificado/releases/20261106T-links-1/stage/shell/shell.js
public_dir=/opt/concrefer-unificado/public/unificado

test "$(cat "$public_dir/VERSION")" = '1.0.108'
cmp -s "$public_dir/shell/shell.js" "$previous_shell"
for file in index.html sw.js VERSION shell/router.js; do
  cmp -s "$public_dir/$file" "$previous_dir/$file"
done
for file in index.html sw.js VERSION shell/shell.js shell/router.js; do
  test -s "$release_dir/stage/$file"
  cp -p "$public_dir/$file" "$release_dir/backup/$file"
  install -m 0644 "$release_dir/stage/$file" "$public_dir/$file.next"
done
for file in shell/shell.js shell/router.js sw.js index.html VERSION; do
  mv -f "$public_dir/$file.next" "$public_dir/$file"
done
test "$(cat "$public_dir/VERSION")" = '1.0.109'

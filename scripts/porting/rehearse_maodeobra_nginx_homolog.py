#!/usr/bin/env python3
"""Rehearse removal and restoration of only the dedicated PWA locations."""

import hashlib
import re
import shutil
import subprocess
from pathlib import Path

vhost = Path("/etc/nginx/sites-enabled/unificado-homolog.conf")
backup = Path("/root/backups/maodeobra-homolog-rehearsal-20261017/nginx-before.conf")
if backup.exists():
    raise SystemExit("Refusing to overwrite vhost backup")
original = vhost.read_bytes()
backup.write_bytes(original)
baseline = hashlib.sha256(original).hexdigest()
pattern = r"(?ms)^    location = /unificado/m/maodeobra/(?:manifest\.webmanifest|sw\.js) \{\n.*?^    \}\n\n"
without, count = re.subn(pattern, "", original.decode("utf-8"))
if count != 2:
    raise SystemExit(f"Expected exactly two dedicated locations; found {count}")


def check_and_reload():
    subprocess.run(["nginx", "-t"], check=True)
    subprocess.run(["systemctl", "reload", "nginx"], check=True)


try:
    vhost.write_text(without, encoding="utf-8")
    check_and_reload()
    print("Two PWA locations removed in :18446; nginx -t and reload passed")
finally:
    shutil.copyfile(backup, vhost)
    check_and_reload()

assert hashlib.sha256(vhost.read_bytes()).hexdigest() == baseline
print(f"Two PWA locations restored; nginx -t and reload passed; original SHA-256 {baseline}")

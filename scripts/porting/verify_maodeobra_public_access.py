#!/usr/bin/env python3
"""Fail before functional smoke if the shell or dedicated PWA is unreadable."""

import argparse
import json
import os
import stat
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("root", type=Path)
parser.add_argument("snapshot", type=Path)
parser.add_argument("port", type=int)
args = parser.parse_args()
root = args.root.resolve(strict=True)
prior = json.loads(args.snapshot.read_text(encoding="utf-8"))["paths"]
for relative, before in prior.items():
    if before is None:
        continue
    target = root / relative
    info = target.stat()
    current = {
        "kind": "dir" if target.is_dir() else "file",
        "owner": info.st_uid,
        "group": info.st_gid,
        "mode": format(stat.S_IMODE(info.st_mode), "04o"),
    }
    if current != before:
        raise SystemExit(f"Existing metadata changed: {relative}: {before} -> {current}")

root_info = root.stat()
expected = (root_info.st_uid, root_info.st_gid, stat.S_IMODE(root_info.st_mode))
for relative in ("m", "m/maodeobra", "m/maodeobra/icons"):
    target = root / relative
    info = target.stat()
    current = (info.st_uid, info.st_gid, stat.S_IMODE(info.st_mode))
    if not target.is_dir() or current != expected:
        raise SystemExit(f"New directory metadata differs from unificado/: {relative}: {current} != {expected}")
    subprocess.run(["sudo", "-u", "www-data", "test", "-x", str(target)], check=True)

for relative in (
    "index.html", "login.html", "m/maodeobra/index.html", "m/maodeobra/login.html",
    "m/maodeobra/manifest.webmanifest", "m/maodeobra/sw.js",
    "m/maodeobra/icons/icon-192.png", "m/maodeobra/icons/icon-512.png",
    "m/maodeobra/icons/icon-maskable-512.png", "m/maodeobra/icons/apple-touch-icon.png",
):
    subprocess.run(["sudo", "-u", "www-data", "test", "-r", str(root / relative)], check=True)

for relative in ("/unificado/", "/unificado/login.html", "/unificado/m/maodeobra/"):
    response = subprocess.check_output([
        "curl", "-sk", "--resolve", f"concrefer.concretrack.com.br:{args.port}:127.0.0.1",
        "-o", "/dev/null", "-w", "%{http_code}",
        f"https://concrefer.concretrack.com.br:{args.port}{relative}",
    ], text=True)
    if response != "200":
        raise SystemExit(f"{relative}: HTTP {response}, expected 200")
    print(f"{relative}: HTTP 200")
print("Existing metadata unchanged; new directories match unificado/; www-data reads all PWA assets")

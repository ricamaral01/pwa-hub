"""Bump the three shell entry points after publishing Cronoanálise.

Usage: python3 corrige-cache-shell.py /path/to/public/unificado
The replacements assert the previous production bytes to avoid overwriting later edits.
"""
from pathlib import Path
import sys


VERSION = b"1.0.16-cronoanalise"
ROOT = Path(sys.argv[1]).resolve()

changes = {
    "index.html": [
        (b"shell/menu.config.js?v=1.0.15", b"shell/menu.config.js?v=" + VERSION),
        (b"shell/shell.js?v=1.0.15", b"shell/shell.js?v=" + VERSION),
        (b"shell/router.js?v=1.0.15", b"shell/router.js?v=" + VERSION),
        (b"shell/modelo-a-loader.js?v=1.0.15", b"shell/modelo-a-loader.js?v=" + VERSION),
    ],
    "sw.js": [
        (b"concrefer-unificado-shell-v1.0.15", b"concrefer-unificado-shell-v" + VERSION),
        (b"shell/modelo-a/menu.js?v=1.0.15", b"shell/modelo-a/menu.js?v=" + VERSION),
        (b"shell/modelo-a-loader.js?v=1.0.15", b"shell/modelo-a-loader.js?v=" + VERSION),
        (b"shell/menu.config.js?v=1.0.15", b"shell/menu.config.js?v=" + VERSION),
        (b"shell/shell.js?v=1.0.15", b"shell/shell.js?v=" + VERSION),
        (b"shell/router.js?v=1.0.15", b"shell/router.js?v=" + VERSION),
    ],
    "shell/modelo-a-loader.js": [
        (b"./modelo-a/menu.js?v=1.0.13", b"./modelo-a/menu.js?v=" + VERSION),
    ],
}

prepared = {}
for name, replacements in changes.items():
    path = ROOT / name
    data = path.read_bytes()
    for old, new in replacements:
        count = data.count(old)
        if count != 1:
            raise SystemExit(f"{path}: expected exactly one {old!r}, found {count}")
        data = data.replace(old, new)
    prepared[path] = data

for path, data in prepared.items():
    path.write_bytes(data)
    print(path)

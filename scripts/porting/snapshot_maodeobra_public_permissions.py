#!/usr/bin/env python3
"""Record and compare the public paths touched by the Mão de Obra release."""

import argparse
import json
import os
import stat
from pathlib import Path

PATHS = (
    ".", "index.html", "login.html", "shell", "shell/auth.js", "pcp",
    "pcp/maodeobra", "pcp/maodeobra/index.html", "pcp/static",
    "pcp/static/js", "pcp/static/js/app.js", "pcp/static/js/maodeobra-grupos.js",
    "pcp/static/js/maodeobra-core.js", "pcp/static/js/maodeobra-mobile.js",
    "pcp/static/css", "pcp/static/css/maodeobra-mobile.css", "m",
    "m/maodeobra", "m/maodeobra/index.html", "m/maodeobra/login.html",
    "m/maodeobra/manifest.webmanifest", "m/maodeobra/sw.js",
    "m/maodeobra/icons",
)


def capture(root):
    result = {}
    for relative in PATHS:
        path = root / relative
        if not path.exists():
            result[relative] = None
            continue
        info = path.lstat()
        result[relative] = {
            "kind": "dir" if path.is_dir() else "file",
            "owner": info.st_uid,
            "group": info.st_gid,
            "mode": format(stat.S_IMODE(info.st_mode), "04o"),
        }
    return result


parser = argparse.ArgumentParser()
parser.add_argument("root", type=Path)
parser.add_argument("--output", type=Path)
parser.add_argument("--compare", type=Path)
args = parser.parse_args()
current = capture(args.root)
if args.compare:
    prior = json.loads(args.compare.read_text(encoding="utf-8"))["paths"]
    changed = {key: (prior[key], current[key]) for key in prior if prior[key] is not None and prior[key] != current[key]}
    print(json.dumps({"changed_existing_paths": changed}, indent=2))
    if changed:
        raise SystemExit(1)
else:
    output = {"root": str(args.root), "paths": current}
    rendered = json.dumps(output, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")

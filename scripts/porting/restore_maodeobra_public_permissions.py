#!/usr/bin/env python3
"""Restore existing public path metadata captured before the release."""

import argparse
import json
import os
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("root", type=Path)
parser.add_argument("snapshot", type=Path)
args = parser.parse_args()
prior = json.loads(args.snapshot.read_text(encoding="utf-8"))["paths"]
for relative, expected in prior.items():
    if expected is None:
        continue
    path = args.root / relative
    if not path.exists() or path.is_symlink():
        raise SystemExit(f"Cannot restore missing or symlink path: {path}")
    if ("dir" if path.is_dir() else "file") != expected["kind"]:
        raise SystemExit(f"Kind changed: {path}")
    os.chown(path, expected["owner"], expected["group"])
    os.chmod(path, int(expected["mode"], 8))
print("Existing public path owner/group/mode restored from snapshot")

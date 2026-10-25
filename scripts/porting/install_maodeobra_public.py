#!/usr/bin/env python3
"""Install a prepared public overlay without changing existing destination metadata."""

import argparse
import os
import stat
import tempfile
from pathlib import Path


def ensure_directory(path: Path, root: Path):
    if path == root:
        if not path.is_dir() or path.is_symlink():
            raise ValueError(f"Invalid public root: {path}")
        return
    ensure_directory(path.parent, root)
    if path.exists():
        if not path.is_dir() or path.is_symlink():
            raise ValueError(f"Invalid destination directory: {path}")
        return
    root_info = root.stat()
    mode = stat.S_IMODE(root_info.st_mode)
    path.mkdir(mode=mode)
    os.chown(path, root_info.st_uid, root_info.st_gid)
    os.chmod(path, mode)


parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path, help="Prepared package's public/unificado directory")
parser.add_argument("destination", type=Path, help="Live public/unificado directory")
args = parser.parse_args()
source = args.source.resolve(strict=True)
destination = args.destination.resolve(strict=True)
if not source.is_dir() or not destination.is_dir():
    raise SystemExit("Source and destination must be directories")

installed = 0
for item in sorted(source.rglob("*")):
    relative = item.relative_to(source)
    target = destination / relative
    if item.is_symlink() or target.is_symlink():
        raise SystemExit(f"Symlink refused: {relative}")
    if item.is_dir():
        ensure_directory(target, destination)
        continue
    if not item.is_file():
        raise SystemExit(f"Unsupported source item: {relative}")
    ensure_directory(target.parent, destination)
    old = target.stat() if target.exists() else None
    if old and not target.is_file():
        raise SystemExit(f"Destination is not a file: {relative}")
    mode = stat.S_IMODE(old.st_mode) if old else 0o644
    root_info = destination.stat()
    uid = old.st_uid if old else root_info.st_uid
    gid = old.st_gid if old else root_info.st_gid
    fd, temporary = tempfile.mkstemp(prefix=".maodeobra-", dir=target.parent)
    try:
        with os.fdopen(fd, "wb") as output, item.open("rb") as input_file:
            while chunk := input_file.read(1024 * 1024):
                output.write(chunk)
            output.flush()
            os.fsync(output.fileno())
        os.chown(temporary, uid, gid)
        os.chmod(temporary, mode)
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    installed += 1

print(f"Installed {installed} files; existing destination owner/group/mode preserved")

#!/usr/bin/env python3
"""Build a 0700 transport package from the files currently approved in :18446."""

import argparse
import os
import shutil
from pathlib import Path


parser = argparse.ArgumentParser()
parser.add_argument("release_public", type=Path, help="Production package public/unificado")
parser.add_argument("homolog_public", type=Path, help="Homolog public/unificado")
parser.add_argument("staged_public", type=Path, help="New rehearsal package public/unificado")
args = parser.parse_args()
if args.staged_public.exists():
    raise SystemExit("Refusing to overwrite a staged package")
files = [p.relative_to(args.release_public) for p in args.release_public.rglob("*") if p.is_file()]
for relative in files:
    source = args.homolog_public / relative
    if not source.is_file():
        raise SystemExit(f"Missing homolog file: {relative}")
    destination = args.staged_public / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    os.chmod(destination, 0o644)
for directory in sorted((p for p in args.staged_public.rglob("*") if p.is_dir()), reverse=True):
    os.chmod(directory, 0o700)
os.chmod(args.staged_public, 0o700)
print(f"Staged {len(files)} tested homolog files with transport directories at 0700")

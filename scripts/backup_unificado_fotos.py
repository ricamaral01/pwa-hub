"""Daily backup of the isolated Mapa photo store, with optional restore check."""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import pwd
import re
import tarfile
import tempfile


SOURCE = Path("/opt/concrefer-unificado/photo-storage")
ROOT = Path("/var/backups/concrefer-unificado-fotos")
STAMP = re.compile(r"^\d{8}T\d{6}Z$")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def restore_check(archive: Path, expected: dict[str, str]) -> None:
    with tempfile.TemporaryDirectory(prefix="photo-restore-", dir=ROOT) as temp:
        destination = Path(temp)
        with tarfile.open(archive, "r:gz") as tar:
            members = {member.name: member for member in tar.getmembers()}
            if set(members) != set(expected) or any(not member.isfile() for member in members.values()):
                raise RuntimeError("Photo archive file list differs from source")
            for name, sha256 in expected.items():
                content = tar.extractfile(members[name])
                if content is None:
                    raise RuntimeError("Photo archive member is unreadable")
                copy = destination / name
                copy.parent.mkdir(parents=True, exist_ok=True)
                copy.write_bytes(content.read())
                if digest(copy) != sha256:
                    raise RuntimeError("Restored photo differs from source: " + name)
        json.loads((destination / "fotos-inspecao.json").read_text(encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--restore-check", action="store_true")
    args = parser.parse_args()
    if pwd.getpwuid(os.geteuid()).pw_name != "www-data":
        raise SystemExit("Run as www-data OS user")
    if SOURCE.resolve() != SOURCE or ROOT.resolve() != ROOT:
        raise SystemExit("Photo source or backup root redirected")
    if not (SOURCE / "fotos-inspecao.json").is_file():
        raise SystemExit("Photo index missing")
    now = datetime.now(timezone.utc)
    folder = ROOT / now.strftime("%Y%m%dT%H%M%SZ")
    folder.mkdir(mode=0o700)
    files = [path for path in SOURCE.rglob("*") if path.is_file() and not path.is_symlink()]
    names = [path.relative_to(SOURCE).as_posix() for path in files]
    if len(names) != len(set(names)):
        raise RuntimeError("Duplicate photo archive member")
    expected = {name: digest(path) for name, path in zip(names, files)}
    archive = folder / "fotos.tar.gz"
    with tarfile.open(archive, "w:gz") as tar:
        for name, path in zip(names, files):
            tar.add(path, arcname=name, recursive=False)
    if args.restore_check:
        restore_check(archive, expected)
    manifest = {"created_utc": now.isoformat(), "files": expected,
                "archive_sha256": digest(archive), "restore_checked": args.restore_check}
    (folder / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
    threshold = now - timedelta(days=30)
    pruned = 0
    for old in ROOT.iterdir():
        if not old.is_dir() or not STAMP.fullmatch(old.name):
            continue
        created = datetime.strptime(old.name, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
        if created >= threshold:
            continue
        if old.resolve().parent != ROOT:
            raise RuntimeError("Unexpected backup path")
        for child in old.iterdir():
            if child.name not in {"fotos.tar.gz", "manifest.json"} or not child.is_file():
                raise RuntimeError("Unexpected file in old photo backup")
            child.unlink()
        old.rmdir()
        pruned += 1
    print(f"photo_backup={folder} files={len(files)} restored={args.restore_check} pruned={pruned}")


if __name__ == "__main__":
    main()

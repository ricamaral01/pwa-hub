"""Back up both isolated PostgreSQL test databases with 14-day retention.

Run as the local postgres OS user. --restore-check restores each new dump into
a temporary database, compares all public base-table counts, then drops it.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import pwd
import re
import subprocess


ROOT = Path("/var/backups/concrefer-unificado")
DATABASES = ("mapa_unificado_teste", "pcp_unificado_teste")
STAMP = re.compile(r"^\d{8}T\d{6}Z$")


def run(*args: str) -> str:
    result = subprocess.run(args, text=True, capture_output=True, check=True)
    return result.stdout


def table_counts(database: str) -> dict[str, int]:
    names = run("psql", "-X", "-A", "-t", "-d", database, "-c",
                "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename").splitlines()
    counts = {}
    for name in names:
        if not re.fullmatch(r"[a-z_][a-z_0-9]*", name):
            raise RuntimeError(f"Unexpected table name: {name!r}")
        counts[name] = int(run("psql", "-X", "-A", "-t", "-d", database, "-c",
                               f"SELECT count(*) FROM public.{name}").strip())
    return counts


def restore_check(database: str, dump: Path) -> dict[str, int]:
    temporary = "unificado_restore_" + os.urandom(5).hex()
    run("createdb", "--template=template0", temporary)
    try:
        run("pg_restore", "--exit-on-error", "--no-owner", "--no-acl", "-d", temporary, str(dump))
        source, restored = table_counts(database), table_counts(temporary)
        if source != restored:
            raise RuntimeError(f"Restore count mismatch for {database}: {source} != {restored}")
        return source
    finally:
        run("dropdb", "--if-exists", temporary)


def prune(now: datetime) -> int:
    removed = 0
    threshold = now - timedelta(days=14)
    for folder in ROOT.iterdir():
        if not folder.is_dir() or not STAMP.fullmatch(folder.name):
            continue
        created = datetime.strptime(folder.name, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
        if created >= threshold:
            continue
        if folder.resolve().parent != ROOT.resolve():
            raise RuntimeError(f"Unexpected backup path: {folder}")
        for file in folder.iterdir():
            if file.name not in {"manifest.json", *(db + ".dump" for db in DATABASES)} or not file.is_file():
                raise RuntimeError(f"Unexpected file in old backup: {file}")
            file.unlink()
        folder.rmdir()
        removed += 1
    return removed


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--restore-check", action="store_true")
    args = parser.parse_args()
    if pwd.getpwuid(os.geteuid()).pw_name != "postgres":
        raise SystemExit("Run as postgres OS user")
    if not ROOT.is_dir() or ROOT.resolve() != Path("/var/backups/concrefer-unificado"):
        raise SystemExit("Backup root missing or redirected")
    now = datetime.now(timezone.utc)
    folder = ROOT / now.strftime("%Y%m%dT%H%M%SZ")
    folder.mkdir(mode=0o700)
    manifest = {"created_utc": now.isoformat(), "databases": {}, "restore_checked": args.restore_check}
    for database in DATABASES:
        destination = folder / (database + ".dump")
        partial = folder / (database + ".partial")
        run("pg_dump", "--format=custom", "--file=" + str(partial), database)
        run("pg_restore", "--list", str(partial))
        partial.replace(destination)
        record = {"size": destination.stat().st_size,
                  "sha256": hashlib.sha256(destination.read_bytes()).hexdigest()}
        if args.restore_check:
            record["table_counts"] = restore_check(database, destination)
        manifest["databases"][database] = record
        print(f"OK {database} bytes={record['size']} restored={args.restore_check}")
    (folder / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
    print(f"backup={folder} pruned={prune(now)}")


if __name__ == "__main__":
    main()

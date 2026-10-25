"""Export exposed Supabase tables through REST to a private VPS snapshot.

This is a data-only fallback, not a PostgreSQL pg_dump or a transactionally
consistent snapshot. It does not export internal schemas, roles or policies.
"""

from __future__ import annotations

import gzip
import hashlib
import importlib.util
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


DIRECTORY = Path("/opt/concrefer-unificado/migration/supabase-rest-snapshot-20261023")
TABLES = (
    "app_permissions", "producao", "formas_manutencao", "montagem_poste",
    "programacao_pcp", "liberacao_formas", "login_attempts", "usuarios",
    "users_app", "prog_s3_s4", "login_logs", "dashboard_retrabalho_eventos_v1",
)
PAGE_SIZE = 1000
mirror_path = Path(__file__).with_name("sync.py")
if not mirror_path.exists():
    mirror_path = Path(__file__).with_name("sync_supabase_legacy_tables.py")
spec = importlib.util.spec_from_file_location("supabase_mirror", mirror_path)
assert spec and spec.loader
mirror = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mirror)


def fetch(base: str, secret: str, table: str) -> list[dict]:
    rows: list[dict] = []
    expected: int | None = None
    while True:
        params = {"select": "*", "limit": PAGE_SIZE, "offset": len(rows)}
        if table != "dashboard_retrabalho_eventos_v1":
            params["order"] = "id.asc"
        url = f"{base}/rest/v1/{table}?{urllib.parse.urlencode(params)}"
        request = urllib.request.Request(url, headers={
            "apikey": secret, "Authorization": "Bearer " + secret,
            "Prefer": "count=exact",
        })
        with urllib.request.urlopen(request, timeout=60) as response:
            page = json.load(response)
            content_range = response.headers.get("Content-Range", "")
        match = re.search(r"/(\d+)$", content_range)
        if not isinstance(page, list) or not match:
            raise RuntimeError(f"{table}: invalid REST page/count")
        count = int(match.group(1))
        if expected is None:
            expected = count
        elif count != expected:
            raise RuntimeError(f"{table}: count changed during pagination")
        rows.extend(page)
        if len(page) < PAGE_SIZE:
            break
        if len(rows) > 100000:
            raise RuntimeError(f"{table}: unexpectedly large table")
    if len(rows) != expected:
        raise RuntimeError(f"{table}: incomplete snapshot")
    if table != "dashboard_retrabalho_eventos_v1" and len({str(row["id"]) for row in rows}) != len(rows):
        raise RuntimeError(f"{table}: duplicate IDs")
    return rows


def write_private(path: Path, data: bytes) -> str:
    temporary = path.with_suffix(path.suffix + ".tmp")
    descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(descriptor, "wb") as output:
            output.write(data)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    if DIRECTORY.exists():
        raise RuntimeError("snapshot directory already exists; refusing to overwrite")
    DIRECTORY.mkdir(parents=True, mode=0o700)
    os.chmod(DIRECTORY, 0o700)
    base, secret = mirror.source_credentials()
    manifest = {
        "captured_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_host": urllib.parse.urlparse(base).hostname,
        "scope": "exposed REST tables only; not a PostgreSQL pg_dump",
        "transactionally_consistent": False,
        "tables": {},
    }
    for table in TABLES:
        rows = fetch(base, secret, table)
        payload = ("\n".join(json.dumps(row, ensure_ascii=False, separators=(",", ":"))
                             for row in rows) + ("\n" if rows else "")).encode("utf-8")
        compressed = gzip.compress(payload, compresslevel=6, mtime=0)
        name = f"{table}.jsonl.gz"
        sha256 = write_private(DIRECTORY / name, compressed)
        manifest["tables"][table] = {"rows": len(rows), "file": name, "sha256": sha256,
                                      "compressed_bytes": len(compressed)}
        print(f"{table} rows={len(rows)} compressed_bytes={len(compressed)}")
    write_private(DIRECTORY / "manifest.json",
                  (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
    print("snapshot_complete=1")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        # Fail closed without logging REST response bodies or credentials.
        print(f"snapshot_failed={type(exc).__name__}", file=sys.stderr)
        sys.exit(1)

"""Mirror two legacy Supabase tables into the isolated Mapa PostgreSQL database.

The source is always read only. A complete source scan each run detects late edits
and deletions without relying on an unproven monotonic cursor. Unexpected conflicts
stop the transaction; source deletions are never propagated automatically.
"""

from __future__ import annotations

import argparse
import fcntl
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID


ENV_PATH = Path("/opt/concrefer-unificado/migration/supabase-source.env")
STATE_PATH = Path("/opt/concrefer-unificado/migration/supabase-sync/state.json")
LOCK_PATH = Path("/opt/concrefer-unificado/migration/supabase-sync/run.lock")
EXCEPTIONS_PATH = Path("/opt/concrefer-unificado/migration/supabase-sync/accepted-collisions.json")
LOCAL_BASELINE_PATH = Path("/opt/concrefer-unificado/migration/supabase-sync/local-only-baseline.json")
DATABASE = "mapa_unificado_teste"
PAGE_SIZE = 1000
TABLES = {
    "liberacao_formas": (
        "id", "data_fabricacao", "setor", "forma", "colaborador", "data_hora"
    ),
    "prog_s3_s4": (
        "id", "data", "forma", "setor", "modelo", "observacao",
        "created_at", "updated_at"
    ),
}


def source_credentials() -> tuple[str, str]:
    values: dict[str, str] = {}
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            name, value = line.strip().split("=", 1)
            values[name] = value.strip().strip("\"'")
    return values["SUPABASE_URL"].rstrip("/"), values["SUPABASE_SECRET_KEY"]


def fetch_table_once(base: str, key: str, table: str, columns: tuple[str, ...]) -> list[dict]:
    rows: list[dict] = []
    expected_total: int | None = None
    while True:
        query = urllib.parse.urlencode({
            "select": ",".join(columns), "order": "id.asc",
            "offset": len(rows), "limit": PAGE_SIZE,
        })
        request = urllib.request.Request(
            f"{base}/rest/v1/{table}?{query}",
            headers={
                "apikey": key, "Authorization": "Bearer " + key,
                "Prefer": "count=exact",
            },
        )
        with urllib.request.urlopen(request, timeout=45) as response:
            page = json.load(response)
            content_range = response.headers.get("Content-Range", "")
        if not isinstance(page, list):
            raise RuntimeError(f"{table}: response is not an array")
        match = re.search(r"/(\d+)$", content_range)
        if not match:
            raise RuntimeError(f"{table}: exact source count unavailable")
        page_total = int(match.group(1))
        if expected_total is None:
            expected_total = page_total
        elif page_total != expected_total:
            raise RuntimeError(f"{table}: source changed during pagination")
        rows.extend(page)
        if len(page) < PAGE_SIZE:
            break
        if len(rows) > 100000:
            raise RuntimeError(f"{table}: unexpected source size")
    if len(rows) != expected_total or len({r["id"] for r in rows}) != len(rows):
        raise RuntimeError(f"{table}: incomplete or duplicate source snapshot")
    if any(set(row) != set(columns) for row in rows):
        raise RuntimeError(f"{table}: source columns differ from contract")
    return rows


def fetch_table(base: str, key: str, table: str, columns: tuple[str, ...]) -> list[dict]:
    # REST pages are separate source transactions. A concurrent insert can shift
    # offsets or the exact count; discard the scan and start again in that case.
    for attempt in range(5):
        try:
            return fetch_table_once(base, key, table, columns)
        except RuntimeError as error:
            if not any(marker in str(error) for marker in (
                "source changed during pagination",
                "incomplete or duplicate source snapshot",
            )) or attempt == 4:
                raise
            time.sleep(0.25 * (attempt + 1))
    raise AssertionError("unreachable")


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_for_table(table: str, rows: list[dict], exceptions: list[dict],
                  local_baseline: list[str]) -> str:
    columns = TABLES[table]
    if not rows:
        raise RuntimeError(f"{table}: empty source snapshot requires manual review")
    payload = sql_literal(json.dumps(rows, ensure_ascii=False, separators=(",", ":")))
    field_list = ",".join(columns)
    key_fields = ("data_fabricacao", "setor", "forma") if table == "liberacao_formas" else ("data", "forma", "setor")
    timestamp = "data_hora" if table == "liberacao_formas" else "updated_at"
    key_match = " AND ".join(f"d.{field} IS NOT DISTINCT FROM s.{field}" for field in key_fields)
    distinct = " OR ".join(f"d.{field} IS DISTINCT FROM s.{field}" for field in columns if field != "id")
    update_fields = ",".join(f"{field}=EXCLUDED.{field}" for field in columns if field != "id")
    unchanged_key = " AND ".join(
        f"public.{table}.{field} IS NOT DISTINCT FROM EXCLUDED.{field}" for field in key_fields
    )
    collision = " AND ".join(f"d.{field} IS NOT DISTINCT FROM s.{field}" for field in key_fields)
    local_baseline_sql = ",".join(sql_literal(str(UUID(value))) + "::uuid" for value in local_baseline)
    allowed_local = f"d.id IN ({local_baseline_sql})" if local_baseline_sql else "FALSE"
    if table == "liberacao_formas":
        # A private allowlist pins the thirteen independently created ID pairs.
        pairs = ",".join(
            f"({sql_literal(str(UUID(item['source_id'])))}::uuid,"
            f"{sql_literal(str(UUID(item['destination_id'])))}::uuid)"
            for item in exceptions
        )
        if not pairs:
            raise RuntimeError("liberacao_formas: collision allowlist is empty")
        legacy_exception = f"""s.data_fabricacao = DATE '2026-10-20'
          AND s.colaborador IS NOT DISTINCT FROM d.colaborador
          AND d.data_hora > s.data_hora
          AND EXISTS (SELECT 1 FROM (VALUES {pairs}) AS allowed(source_id,destination_id)
                      WHERE allowed.source_id=s.id AND allowed.destination_id=d.id)"""
    else:
        legacy_exception = "FALSE"
    return f"""
CREATE TEMP TABLE source_{table} ON COMMIT DROP AS
  SELECT * FROM jsonb_populate_recordset(NULL::public.{table}, {payload}::jsonb);
DO $guard$
BEGIN
  IF EXISTS (SELECT 1 FROM source_{table} WHERE {timestamp} IS NULL) THEN
    RAISE EXCEPTION '{table}: source timestamp is null';
  END IF;
  IF EXISTS (SELECT 1 FROM public.{table} d
             WHERE NOT EXISTS (SELECT 1 FROM source_{table} s WHERE {collision})
               AND NOT ({allowed_local})) THEN
    RAISE EXCEPTION '{table}: new destination-only row violates source ownership';
  END IF;
  IF EXISTS (SELECT 1 FROM source_{table} s JOIN public.{table} d
             ON ({collision}) WHERE d.id <> s.id
             AND NOT ({legacy_exception})) THEN
    RAISE EXCEPTION '{table}: new natural key collision with a different ID';
  END IF;
  IF EXISTS (SELECT 1 FROM source_{table} s JOIN public.{table} d ON d.id=s.id
             WHERE NOT ({key_match})) THEN
    RAISE EXCEPTION '{table}: existing ID changed natural key';
  END IF;
  IF EXISTS (SELECT 1 FROM source_{table} s JOIN public.{table} d ON d.id=s.id
             WHERE ({distinct}) AND s.{timestamp} IS NOT NULL
               AND (d.{timestamp} IS NULL OR s.{timestamp} <= d.{timestamp})) THEN
    RAISE EXCEPTION '{table}: divergent local row is as new as source';
  END IF;
END $guard$;
INSERT INTO public.{table} ({field_list})
SELECT {','.join('s.' + field for field in columns)} FROM source_{table} s
WHERE NOT EXISTS (SELECT 1 FROM public.{table} d WHERE {collision} AND d.id <> s.id)
ON CONFLICT (id) DO UPDATE SET {update_fields}
WHERE {unchanged_key} AND EXCLUDED.{timestamp} > public.{table}.{timestamp};
SELECT '{table}', count(*) FROM public.{table};
"""


def run_psql(sql: str, *, dry_run: bool) -> str:
    # The JSON payload is sent on stdin, so it never appears in the process list.
    prefix = "BEGIN; SET LOCAL statement_timeout='90s'; "
    if dry_run:
        suffix = "ROLLBACK;"
    else:
        suffix = "COMMIT;"
    command = ["runuser", "-u", "postgres", "--", "psql", "-X", "-A", "-t",
               "-v", "ON_ERROR_STOP=1", "-d", DATABASE]
    result = subprocess.run(command, input=prefix + sql + suffix,
                            text=True, capture_output=True, timeout=120)
    if result.returncode:
        # PostgreSQL errors can contain business data: retain only the first line.
        error = next((line for line in result.stderr.splitlines() if "ERROR:" in line), "psql failed")
        raise RuntimeError(error)
    return result.stdout.strip()


def save_state(state: dict) -> None:
    STATE_PATH.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    descriptor, name = tempfile.mkstemp(prefix="state-", dir=STATE_PATH.parent)
    try:
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "w", encoding="utf-8") as output:
            json.dump(state, output, separators=(",", ":"))
        os.replace(name, STATE_PATH)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    LOCK_PATH.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    with LOCK_PATH.open("a+") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = json.loads(STATE_PATH.read_text(encoding="utf-8")) if STATE_PATH.exists() else {}
        base, key = source_credentials()
        snapshots = {table: fetch_table(base, key, table, columns)
                     for table, columns in TABLES.items()}
        exceptions = json.loads(EXCEPTIONS_PATH.read_text(encoding="utf-8"))
        if len(exceptions) != 13 or len({item["source_id"] for item in exceptions}) != 13:
            raise RuntimeError("collision allowlist must contain 13 distinct source IDs")
        local_baseline = json.loads(LOCAL_BASELINE_PATH.read_text(encoding="utf-8"))
        if set(local_baseline) != set(TABLES) or len(local_baseline["liberacao_formas"]) != 403 or local_baseline["prog_s3_s4"]:
            raise RuntimeError("unexpected destination-only baseline")
        for table, rows in snapshots.items():
            old_ids = set(state.get("source_ids", {}).get(table, []))
            new_ids = {row["id"] for row in rows}
            if old_ids - new_ids:
                raise RuntimeError(f"{table}: {len(old_ids - new_ids)} source deletions require review")
        statements = "SET LOCAL session_replication_role=replica; " + "\n".join(
            sql_for_table(table, rows, exceptions, local_baseline[table])
            for table, rows in snapshots.items()
        )
        result = run_psql(statements, dry_run=args.dry_run)
        print(f"mode={'dry-run' if args.dry_run else 'apply'} source_counts=" +
              ",".join(f"{table}:{len(rows)}" for table, rows in snapshots.items()))
        print(result)
        if not args.dry_run:
            save_state({
                "last_success_utc": datetime.now(timezone.utc).isoformat(),
                "source_ids": {table: sorted(row["id"] for row in rows)
                               for table, rows in snapshots.items()},
                "source_max": {table: max(str(row["data_hora" if table == "liberacao_formas" else "updated_at"])
                                          for row in rows) for table, rows in snapshots.items()},
            })
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"sync failed: {error}", file=sys.stderr)
        sys.exit(1)

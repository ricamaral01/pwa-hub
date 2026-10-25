"""Read-only reconciliation of the two temporary Supabase mirror tables.

Run on the new VPS alongside sync.py. Only aggregate results are printed;
credentials and business rows stay in memory. Exit 1 on unexplained drift.
"""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


directory = Path(__file__).resolve().parent
mirror_path = directory / "sync.py"
if not mirror_path.exists():
    mirror_path = directory / "sync_supabase_legacy_tables.py"
spec = importlib.util.spec_from_file_location("supabase_mirror", mirror_path)
assert spec and spec.loader
mirror = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mirror)


def destination_rows(table: str, columns: tuple[str, ...]) -> list[dict]:
    # Names come only from the mirror's fixed TABLES catalog.
    query = ("SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) "
             f"FROM (SELECT {','.join(columns)} FROM public.{table}) t")
    result = subprocess.run(
        ["runuser", "-u", "postgres", "--", "psql", "-X", "-A", "-t",
         "-v", "ON_ERROR_STOP=1", "-d", mirror.DATABASE, "-c", query],
        text=True, capture_output=True, check=True, timeout=60,
    )
    return json.loads(result.stdout)


def normalized(field: str, value):
    if field in {"data_hora", "created_at", "updated_at"} and value:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    return value


def audit_table(table: str, columns: tuple[str, ...], source: list[dict],
                destination: list[dict], pairs: list[dict], baseline: list[str]) -> bool:
    source_by_id = {row["id"]: row for row in source}
    destination_by_id = {row["id"]: row for row in destination}
    key_fields = ("data_fabricacao", "setor", "forma") if table == "liberacao_formas" else ("data", "forma", "setor")
    key = lambda row: tuple(row[field] for field in key_fields)
    source_keys = {key(row) for row in source}
    destination_keys = {key(row) for row in destination}
    shared = source_by_id.keys() & destination_by_id.keys()
    mismatched = sum(
        any(normalized(field, source_by_id[row_id][field]) != normalized(field, destination_by_id[row_id][field])
            for field in columns if field != "id")
        for row_id in shared
    )
    source_only = source_by_id.keys() - destination_by_id.keys()
    destination_only = destination_by_id.keys() - source_by_id.keys()
    expected_source_only = {pair["source_id"] for pair in pairs}
    expected_destination_only = set(baseline) | {pair["destination_id"] for pair in pairs}
    pair_mismatches = 0
    for pair in pairs:
        source_row = source_by_id.get(pair["source_id"])
        destination_row = destination_by_id.get(pair["destination_id"])
        if (source_row is None or destination_row is None
                or key(source_row) != key(destination_row)
                or source_row["colaborador"] != destination_row["colaborador"]
                or normalized("data_hora", destination_row["data_hora"])
                <= normalized("data_hora", source_row["data_hora"])):
            pair_mismatches += 1

    problems = {
        "duplicate_source_ids": len(source) - len(source_by_id),
        "duplicate_destination_ids": len(destination) - len(destination_by_id),
        "duplicate_source_keys": len(source) - len(source_keys),
        "duplicate_destination_keys": len(destination) - len(destination_keys),
        "shared_field_mismatches": mismatched,
        "missing_source_keys": len(source_keys - destination_keys),
        "source_only_id_diff": len(source_only ^ expected_source_only),
        "destination_only_id_diff": len(destination_only ^ expected_destination_only),
        "collision_pair_mismatches": pair_mismatches,
    }
    print(f"{table}: source={len(source)} destination={len(destination)} shared_ids={len(shared)} "
          f"extra_destination_keys={len(destination_keys - source_keys)}")
    print(" ".join(f"{name}={count}" for name, count in problems.items()))
    return all(count == 0 for count in problems.values())


def main() -> int:
    base, secret = mirror.source_credentials()
    pairs = json.loads(mirror.EXCEPTIONS_PATH.read_text(encoding="utf-8"))
    baseline = json.loads(mirror.LOCAL_BASELINE_PATH.read_text(encoding="utf-8"))
    ok = True
    for table, columns in mirror.TABLES.items():
        source = mirror.fetch_table(base, secret, table, columns)
        destination = destination_rows(table, columns)
        ok = audit_table(table, columns, source, destination,
                         pairs if table == "liberacao_formas" else [], baseline[table]) and ok
    return 0 if ok else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as exc:
        print(f"audit_failed={type(exc).__name__}", file=sys.stderr)
        sys.exit(1)

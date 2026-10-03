"""Summarize private source/test order pairs without publishing their row data."""

from __future__ import annotations

import collections
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PAIRS = ROOT / ".work-mapa-unificado" / "order-pairs-private.json"
OUT = ROOT / ".work-mapa-unificado" / "order-analysis.json"


def canonical(row: dict) -> str:
    return json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def digest(rows: list[dict]) -> str:
    return hashlib.sha256("\n".join(sorted(map(canonical, rows))).encode()).hexdigest()


def main() -> None:
    pairs = json.loads(PAIRS.read_text(encoding="utf-8"))
    results = []
    for index, pair in enumerate(pairs, 1):
        source, test = pair["source"], pair["test"]
        key = lambda row: (row.get("data_fabricacao"), row.get("setor"),
                           row.get("forma") or row.get("forma_numero"))
        sorted_ids = lambda rows, field: [row.get("id") or key(row) for row in
                                          sorted(rows, key=lambda row: str(row.get(field) or ""))]
        time_values = [row.get("data_hora") for row in source if row.get("data_hora")]
        results.append({
            "case": index, "path": pair["path"], "source_count": len(source),
            "test_count": len(test), "same_rows": digest(source) == digest(test),
            "source_distinct_keys": len(set(map(key, source))),
            "test_distinct_keys": len(set(map(key, test))),
            "unique_data_hora": len(time_values) == len(set(time_values)),
            "same_order_after_data_hora_sort": sorted_ids(source, "data_hora") == sorted_ids(test, "data_hora"),
            "same_counts_by_status": collections.Counter(row.get("status") for row in source)
                                     == collections.Counter(row.get("status") for row in test),
        })
    OUT.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    for item in results:
        print(item["case"], item["source_count"], item["same_rows"],
              item["source_distinct_keys"], item["unique_data_hora"],
              item["same_order_after_data_hora_sort"], item["same_counts_by_status"])


if __name__ == "__main__":
    main()

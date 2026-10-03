"""Map intercepted requests back to original app.js network call sites."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "tests" / "mapa" / "fixtures" / "static-call-sites.json"
CAPTURE = ROOT / "tests" / "mapa" / "fixtures" / "captured-offline.json"
SUMMARY = ROOT / "tests" / "mapa" / "fixtures" / "coverage-summary.json"
NETWORK = {"supabase.from", "supabase.rpc", "supabase.storage", "supabase.channel", "fetch", "XMLHttpRequest"}
STACK_TO_CALL = {
    742: (743,), 1467: (1467,), 1517: (1509,), 1596: (1597,),
    1631: (1631,), 1647: (1647,), 1677: (1677,), 1690: (1690,),
    1778: (1778,), 3220: (3220,), 3322: (3322,), 4112: (4112,),
    7730: (7730,), 7840: (7841,), 14486: (14487,),
}
SECTOR_STATUS = {"programacao_pcp": 3268, "liberacao_formas": 3269, "producao": 3270}


def main():
    inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
    capture = json.loads(CAPTURE.read_text(encoding="utf-8"))
    by_line = {row["line"]: row for row in inventory["calls"] if row["kind"] in NETWORK}
    for row in inventory["calls"]:
        row["covered_by"] = []
    unmapped = []
    for request in capture["requests"]:
        stack = request["source_line_stack"]
        if stack == 3267:
            table = request["path"].rsplit("/", 1)[-1]
            lines = (SECTOR_STATUS[table],) if table in SECTOR_STATUS else ()
        else:
            lines = STACK_TO_CALL.get(stack, ())
        if not lines:
            unmapped.append(request["id"])
        for line in lines:
            if line not in by_line:
                raise RuntimeError(f"Static inventory lacks app.js:{line} for {request['id']}")
            if request["flow"] not in by_line[line]["covered_by"]:
                by_line[line]["covered_by"].append(request["flow"])
    eligible = [row for row in inventory["calls"] if row["kind"] in NETWORK and row["classification"] != "collection_helper"]
    covered = [row for row in eligible if row["covered_by"]]
    INVENTORY.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    summary = {"network_sites": len(eligible), "covered_sites": len(covered),
               "uncovered_sites": [row["id"] for row in eligible if not row["covered_by"]],
               "unmapped_requests": unmapped,
               "interpretation": "A covered site has at least one intercepted request. Full flow and response parity are not proven."}
    SUMMARY.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"covered={len(covered)}/{len(eligible)} unmapped_requests={len(unmapped)}")
    if unmapped:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

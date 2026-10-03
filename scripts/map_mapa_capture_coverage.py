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
    759: (760,), 1579: (1579,), 1588: (1588,), 4724: (4724,),
    4943: (4943,), 5299: (5299,),
    6093: (6094,), 6118: (6119,), 6548: (6548,), 6572: (6572,),
    6739: (6736,), 8057: (8053,), 8069: (8063, 8064,),
    14704: (14704,),
    3470: (3470,), 3497: (3497,), 4138: (4138,), 4161: (4162,),
    5127: (5123,), 6863: (6862,), 14125: (14126,),
    1739: (1736,), 1759: (1756,), 1786: (1786,), 1810: (1810,),
    1825: (1825,), 1835: (1835,), 7584: (7584,), 7598: (7598,),
    7990: (7990,), 8015: (8015,), 10175: (10176,),
    14381: (14381,), 14438: (14438,), 14769: (14769,), 14782: (14782,),
    6481: (6481,), 14341: (14341,), 14832: (14832,),
    1583: (1583,), 1591: (1591,), 1608: (1609,), 1615: (1616,),
    1623: (1624,), 1635: (1635,), 7759: (7759,),
    14125: (14126,), 14647: (14620,),
}
SECTOR_STATUS = {"programacao_pcp": 3268, "liberacao_formas": 3269, "producao": 3270}


def main():
    inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
    capture = json.loads(CAPTURE.read_text(encoding="utf-8"))
    by_line = {row["line"]: row for row in inventory["calls"] if row["kind"] in NETWORK}
    for row in inventory["calls"]:
        row["covered_by"] = []
    unmapped = []
    asset_requests = []
    for request in capture["requests"]:
        stack = request["source_line_stack"]
        if stack is None and request["path"].startswith("/captura-local/"):
            asset_requests.append(request["id"])
            continue
        if stack == 13267:
            table = request["path"].rsplit("/", 1)[-1]
            lines = {"montagem_poste": (13298,), "producao": (13417,)}.get(table, ())
        elif stack == 3267:
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
    for invocation in capture.get("local_invocations", []):
        line = invocation["app_line"]
        if line not in by_line:
            raise RuntimeError(f"Static inventory lacks local call app.js:{line}")
        if invocation["flow"] not in by_line[line]["covered_by"]:
            by_line[line]["covered_by"].append(invocation["flow"])
    eligible = [row for row in inventory["calls"] if row["kind"] in NETWORK and row["classification"] != "collection_helper"]
    covered = [row for row in eligible if row["covered_by"]]
    INVENTORY.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    summary = {"network_sites": len(eligible), "covered_sites": len(covered),
               "uncovered_sites": [row["id"] for row in eligible if not row["covered_by"]],
               "unmapped_requests": unmapped,
               "asset_requests_without_fetch_stack": asset_requests,
               "interpretation": "A covered site has at least one intercepted request. Full flow and response parity are not proven."}
    SUMMARY.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"covered={len(covered)}/{len(eligible)} unmapped_requests={len(unmapped)}")
    if unmapped:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

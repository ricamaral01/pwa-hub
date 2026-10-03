"""List every requested Mapa data, browser storage and cache call site.

This is a static denominator for flow coverage, not a claim of exercised flows.
"""

from __future__ import annotations

import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "mapa-concretagem" / "app.js"
OUT = ROOT / "tests" / "mapa" / "fixtures" / "static-call-sites.json"
PATTERNS = {
    "supabase.from": re.compile(r"\.from\s*\("),
    "supabase.rpc": re.compile(r"\.rpc\s*\("),
    "supabase.storage": re.compile(r"\.storage\b"),
    "supabase.channel": re.compile(r"\.channel\s*\("),
    "fetch": re.compile(r"\bfetch\s*\("),
    "XMLHttpRequest": re.compile(r"\bXMLHttpRequest\b"),
    "localStorage": re.compile(r"\blocalStorage\b"),
    "indexedDB": re.compile(r"\bindexedDB\b"),
    "caches": re.compile(r"\bcaches\b"),
}
FUNCTION = re.compile(r"^\s*(?:(?:async\s+)?function\s+|window\.)([\w$]+)")


def main() -> None:
    source_lines = SOURCE.read_text(encoding="utf-8").splitlines()
    rows = []
    function = "escopo global"
    for line_number, line in enumerate(source_lines, 1):
        match = FUNCTION.match(line)
        if match:
            function = match.group(1)
        if line.lstrip().startswith("//"):
            continue
        for kind, pattern in PATTERNS.items():
            for hit in pattern.finditer(line):
                # Array.from is a JavaScript collection helper, not a data call.
                classification = "collection_helper" if kind == "supabase.from" and line[max(0, hit.start()-5):hit.start()] == "Array" else "unclassified"
                rows.append({"id": f"app.js:{line_number}:{hit.start()+1}:{kind}",
                             "line": line_number, "column": hit.start()+1,
                             "function": function, "kind": kind,
                             "classification": classification,
                             "covered_by": []})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"source": "mapa-concretagem/app.js",
                               "meaning": "static inventory; no flow coverage asserted",
                               "calls": rows}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    counts = {kind: sum(row["kind"] == kind for row in rows) for kind in PATTERNS}
    print(f"occurrences={len(rows)} file={OUT.relative_to(ROOT)} counts={json.dumps(counts)}")


if __name__ == "__main__":
    main()

"""Export the intercepted original-app requests as draft, synthetic fixtures."""

import json
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / ".work-mapa-unificado" / "requests-original.json"
TARGET = ROOT / "tests" / "mapa" / "fixtures" / "captured-offline.json"


def main():
    raw = json.loads(SOURCE.read_text(encoding="utf-8"))
    rows = []
    for index, item in enumerate(raw["requests"], 1):
        url = urlsplit(item["path_query"])
        body = item.get("body") or ""
        try:
            body = json.loads(body) if body else None
        except json.JSONDecodeError:
            pass
        rows.append({
            "id": f"offline-{index:03d}",
            "flow": item["flow"],
            "source_line_stack": item.get("app_line"),
            "method": item["method"],
            "path": url.path,
            "headers": item.get("headers", {}),
            "query": parse_qs(url.query, keep_blank_values=True),
            "body": body,
            "stub_response": {"status": 200, "shape": "object" if url.path.endswith("/rpc/rpc_dashboard_produtividade_resumo_v1") else "list"},
        })
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(json.dumps({
        "status": "draft: intercepted with synthetic empty responses; not a contract fixture",
        "network": "all external requests aborted and locally fulfilled",
        "requests": rows,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"requests={len(rows)} unique_source_stack_lines={len({row['source_line_stack'] for row in rows})} output={TARGET.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

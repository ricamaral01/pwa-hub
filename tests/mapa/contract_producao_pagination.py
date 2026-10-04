"""Compare the complete two-page production result, GET only on source."""

from __future__ import annotations

import collections
import json
import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode

from contract_read_tables import AUTH_ENV, OUT, SOURCE_ENV, call, digest, load_env


def main() -> None:
    load_env(SOURCE_ENV)
    load_env(AUTH_ENV)
    os.chdir("/opt/concrefer-unificado/mapa-api")
    import sys

    sys.path.insert(0, os.getcwd())
    from app import COOKIE_NAME, connect, signer

    with connect() as conn, conn.cursor() as cursor:
        cursor.execute("""SELECT id,updated_at FROM public.usuarios
                          WHERE perfil='GERENCIA' AND ativo AND NOT primeiro_acesso
                          ORDER BY id LIMIT 1""")
        user = cursor.fetchone()
    if not user:
        raise RuntimeError("No active test session")
    cookie = COOKIE_NAME + "=" + signer().dumps({
        "scope": "session", "id": user["id"],
        "updated_at": user["updated_at"].isoformat(),
    })
    cases = json.loads(OUT.read_text(encoding="utf-8"))["cases"]
    pages = [item for item in cases if item["path_query"].startswith("/rest/v1/producao?")
             and "order=data_fabricacao.desc" in item["path_query"]
             and ("offset=0&limit=1000" in item["path_query"]
                  or "offset=1000&limit=1000" in item["path_query"])]
    if len(pages) != 2:
        raise RuntimeError(f"Expected two captured pages, found {len(pages)}")
    source_base = os.environ["SUPABASE_URL"].rstrip("/")
    source_key = os.environ["SUPABASE_SECRET_KEY"]
    official, test = [], []
    for page in sorted(pages, key=lambda item: int(dict(parse_qsl(item["path_query"].split("?", 1)[1]))["offset"])):
        path = page["path_query"]
        source_status, source_body = call(source_base + path, {
            "apikey": source_key, "Authorization": "Bearer " + source_key,
        })
        test_status, test_body = call("http://127.0.0.1:13052" + path, {"Cookie": cookie})
        if source_status != 200 or test_status != 200:
            raise RuntimeError(f"Page status {source_status}/{test_status}")
        official.extend(json.loads(source_body))
        test.extend(json.loads(test_body))

    def multiset(rows: list[dict]) -> collections.Counter[str]:
        return collections.Counter(json.dumps(row, ensure_ascii=False, sort_keys=True,
                                              separators=(",", ":")) for row in rows)

    left, right = multiset(official), multiset(test)
    report = {
        "official_count": len(official), "test_count": len(test),
        "official_unique_ids": len({row["id"] for row in official}),
        "test_unique_ids": len({row["id"] for row in test}),
        "official_multiset_sha256": digest(json.dumps(sorted(left.elements())).encode()),
        "test_multiset_sha256": digest(json.dumps(sorted(right.elements())).encode()),
        "official_only_rows": sum((left - right).values()),
        "test_only_rows": sum((right - left).values()),
        "same_rows": left == right,
    }
    target = Path("/opt/concrefer-unificado/migration/contract-producao-pagination.json")
    target.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report))
    if not report["same_rows"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

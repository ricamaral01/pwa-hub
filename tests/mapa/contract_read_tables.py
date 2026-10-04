"""Compare captured Mapa table GETs with official read-only source and test proxy.

Runs on the test VPS. It never sends writes to the official Supabase. Bodies are
hashed in memory; the report contains no row data, credentials or session token.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import urllib.error
import urllib.request


SOURCE_ENV = Path("/opt/concrefer-unificado/migration/supabase-source.env")
AUTH_ENV = Path("/etc/mapa-unificado/auth.env")
FIXTURE = Path("/opt/concrefer-unificado/migration/captured-offline.json")
OUT = Path("/opt/concrefer-unificado/migration/contract-read-tables.json")
TABLES = {
    "programacao_pcp", "liberacao_formas", "producao", "montagem_poste",
    "formas_manutencao", "prog_s3_s4", "vw_formas_status",
}


def load_env(path: Path) -> None:
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")


def call(url: str, headers: dict[str, str]) -> tuple[int, bytes]:
    request = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()


def digest(body: bytes) -> str:
    try:
        payload = json.loads(body)
        body = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    except (ValueError, UnicodeDecodeError):
        pass
    return hashlib.sha256(body).hexdigest()


def difference_shape(left: bytes, right: bytes) -> dict:
    try:
        a, b = json.loads(left), json.loads(right)
    except (ValueError, UnicodeDecodeError):
        return {"bytes": [len(left), len(right)]}
    if isinstance(a, list) and isinstance(b, list):
        detail = {"rows": [len(a), len(b)]}
        if a and b and isinstance(a[0], dict) and isinstance(b[0], dict):
            common = set(a[0]) & set(b[0])
            detail["first_row_different_fields"] = sorted(key for key in common if a[0][key] != b[0][key])
            detail["official_only_fields"] = sorted(set(a[0]) - set(b[0]))
            detail["test_only_fields"] = sorted(set(b[0]) - set(a[0]))
            if all(isinstance(row, dict) and row.get("id") for row in a + b):
                aid = {row["id"] for row in a}
                bid = {row["id"] for row in b}
                detail["id_difference_counts"] = [len(aid - bid), len(bid - aid)]
        return detail
    return {"shapes": [type(a).__name__, type(b).__name__]}


def row_multiset_equal(left: bytes, right: bytes) -> bool:
    try:
        a, b = json.loads(left), json.loads(right)
    except (ValueError, UnicodeDecodeError):
        return left == right
    if not isinstance(a, list) or not isinstance(b, list):
        return a == b
    canonical = lambda rows: sorted(json.dumps(row, ensure_ascii=False, sort_keys=True,
                                              separators=(",", ":")) for row in rows)
    return canonical(a) == canonical(b)


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
        raise RuntimeError("No active test GERENCIA session available")
    cookie = COOKIE_NAME + "=" + signer().dumps({
        "scope": "session", "id": user["id"],
        "updated_at": user["updated_at"].isoformat(),
    })
    source_base = os.environ["SUPABASE_URL"].rstrip("/")
    source_key = os.environ["SUPABASE_SECRET_KEY"]
    test_base = "http://127.0.0.1:13052"
    requests = json.loads(FIXTURE.read_text(encoding="utf-8"))["requests"]
    seen: set[tuple] = set()
    results = []
    for item in requests:
        path = item["path"]
        resource = path.rsplit("/", 1)[-1]
        if item["method"] != "GET" or not path.startswith("/rest/v1/") or resource not in TABLES:
            continue
        query = item.get("query") or {}
        from urllib.parse import urlencode
        query_string = urlencode([(key, value) for key, values in query.items() for value in values])
        relative = path + ("?" + query_string if query_string else "")
        range_header = item.get("headers", {}).get("Range")
        prefer_header = item.get("headers", {}).get("Prefer")
        signature = (relative, range_header, prefer_header)
        if signature in seen:
            continue
        seen.add(signature)
        extra = {}
        if range_header:
            extra["Range"] = range_header
        if prefer_header:
            extra["Prefer"] = prefer_header
        expected_status, expected_body = call(source_base + relative, {
            **extra, "apikey": source_key, "Authorization": "Bearer " + source_key,
        })
        actual_status, actual_body = call(test_base + relative, {**extra, "Cookie": cookie})
        expected_hash, actual_hash = digest(expected_body), digest(actual_body)
        results.append({
            "method": "GET", "path_query": relative, "range": range_header,
            "prefer": prefer_header, "official_status": expected_status,
            "test_status": actual_status, "official_sha256": expected_hash,
            "test_sha256": actual_hash,
            "equal": expected_status == actual_status and expected_hash == actual_hash,
            "same_rows_any_order": expected_status == actual_status
                and row_multiset_equal(expected_body, actual_body),
            "difference_shape": difference_shape(expected_body, actual_body)
                if expected_hash != actual_hash else None,
        })
    OUT.write_text(json.dumps({"cases": results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    passed = sum(item["equal"] for item in results)
    same_rows = sum(item["same_rows_any_order"] for item in results)
    print(f"read_table_contract_exact={passed}/{len(results)} same_rows={same_rows}/{len(results)} report={OUT}")
    for item in results:
        if not item["equal"]:
            print(f"DIFF {item['path_query']} HTTP {item['official_status']}/{item['test_status']} "
                  f"SHA {item['official_sha256'][:12]}/{item['test_sha256'][:12]} "
                  f"SHAPE {item['difference_shape']}")


if __name__ == "__main__":
    main()

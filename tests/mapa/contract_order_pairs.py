"""Save private paired GET bodies for UI order comparison; source is read only."""

from __future__ import annotations

import json
import os
from pathlib import Path

from contract_read_tables import AUTH_ENV, OUT, SOURCE_ENV, call, load_env


def main() -> None:
    load_env(SOURCE_ENV)
    load_env(AUTH_ENV)
    os.chdir("/opt/mapa-unificado-api")
    import sys
    sys.path.insert(0, os.getcwd())
    from app import COOKIE_NAME, connect, signer
    with connect() as conn, conn.cursor() as cursor:
        cursor.execute("""SELECT id,updated_at FROM public.usuarios
                          WHERE perfil='GERENCIA' AND ativo AND NOT primeiro_acesso
                          ORDER BY id LIMIT 1""")
        user = cursor.fetchone()
    cookie = COOKIE_NAME + "=" + signer().dumps({
        "scope": "session", "id": user["id"],
        "updated_at": user["updated_at"].isoformat(),
    })
    cases = json.loads(OUT.read_text(encoding="utf-8"))["cases"]
    source_base = os.environ["SUPABASE_URL"].rstrip("/")
    source_key = os.environ["SUPABASE_SECRET_KEY"]
    results = []
    for item in cases:
        if item["equal"]:
            continue
        path = item["path_query"]
        source_status, source_body = call(source_base + path, {
            "apikey": source_key, "Authorization": "Bearer " + source_key,
        })
        test_status, test_body = call("http://127.0.0.1:13052" + path, {"Cookie": cookie})
        results.append({"path": path, "source_status": source_status,
                        "test_status": test_status,
                        "source": json.loads(source_body), "test": json.loads(test_body)})
    target = Path("/root/mapa-unificado-migration/order-pairs-private.json")
    target.write_text(json.dumps(results, ensure_ascii=False), encoding="utf-8")
    print(f"order_pairs={len(results)} private={target}")


if __name__ == "__main__":
    main()

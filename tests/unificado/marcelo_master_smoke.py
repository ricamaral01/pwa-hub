"""Read-only HTTP smoke for Ricardo, Marcelo and Alex using short-lived sessions.

Run on the target VPS with that environment's Mapa auth env file. Never prints
session cookies, bearer tokens, signing keys or database credentials.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import psycopg
from itsdangerous import URLSafeTimedSerializer


def env_value(path: Path, key: str) -> str:
    for line in path.read_text().splitlines():
        if line.startswith(key + "="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise KeyError(key)


def fetch(base: str, path: str, cookie: str = "", *, method: str = "GET", token: str = ""):
    headers = {"Cookie": cookie} if cookie else {}
    if token:
        headers["Authorization"] = "Bearer " + token
    request = Request(base + path, headers=headers, method=method)
    try:
        response = urlopen(request, timeout=15)
    except HTTPError as error:
        response = error
    with response:
        body = response.read()
        data = json.loads(body) if body else {}
        return response.status, data, response.headers.get("Set-Cookie", "")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env", type=Path, required=True)
    parser.add_argument("--base", required=True)
    parser.add_argument("--cookie-name", required=True)
    args = parser.parse_args()
    signing = env_value(args.env, "MAPA_AUTH_SIGNING_KEY")
    dsn = env_value(args.env, "MAPA_AUTH_DATABASE_URL")
    signer = URLSafeTimedSerializer(signing, salt="mapa-login-v1")
    report = {}
    with psycopg.connect(dsn) as conn:
        for user_id in ("user-ricardo", "marcelo", "alex"):
            with conn.cursor() as cur:
                cur.execute("""SELECT id,updated_at,ativo,primeiro_acesso,deleted_at
                               FROM public.usuarios WHERE id=%s""", (user_id,))
                row = cur.fetchone()
            assert row and row[2] and not row[3] and row[4] is None
            claim = {"scope": "session", "id": user_id, "updated_at": row[1].isoformat()}
            cookie = args.cookie_name + "=" + signer.dumps(claim)
            status, access, _ = fetch(args.base, "/unificado/mapa/api/unified/screen-access/me", cookie)
            assert status == 200 and access.get("ok") and access.get("preview_modules"), (user_id, status, sorted(access))
            status, _, _ = fetch(args.base, "/unificado/mapa/api/unified/users/pcp/999999/screens", cookie)
            assert status == 404  # Passou pela autorização exclusiva de superusuário.
            status, lab, _ = fetch(args.base, "/unificado/mapa/api/unified/laboratorio-bootstrap", cookie, method="POST")
            assert status == 200 and lab["role"] == "admin"
            status, _, quality_cookie = fetch(args.base, "/unificado/mapa/api/unified/qualidade-bootstrap", cookie, method="POST")
            assert status == 200 and quality_cookie
            status, quality, _ = fetch(args.base, "/unificado/qualidade/api/contexto",
                                       cookie + "; " + quality_cookie.split(";", 1)[0])
            assert status == 200 and quality["user"]["superuser"] is True
            status, ged, _ = fetch(args.base, "/unificado/ged/api/auth/unified-session", cookie)
            assert status == 200 and ged["user"]["role"] == "ADMIN_MASTER"
            assert ged["user"]["must_change_password"] is False
            status, ged_me, _ = fetch(args.base, "/unificado/ged/api/auth/me", token=ged["token"])
            assert status == 200 and ged_me["must_change_password"] is False
            status, ged_users, _ = fetch(args.base, "/unificado/ged/api/users", token=ged["token"])
            assert status == 200 and isinstance(ged_users, list), (user_id, status)
            report[user_id] = {
                "screens": sorted(access["screens"]), "laboratorio": lab["role"],
                "qualidade_superuser": quality["user"]["superuser"],
                "ged": ged["user"]["role"], "ged_session": status,
                "ged_permissions": sorted(ged["user"].get("permissions", [])),
                "ged_users_endpoint": status,
            }
    assert report["marcelo"]["screens"] == report["user-ricardo"]["screens"]
    assert report["alex"]["screens"] == report["user-ricardo"]["screens"]
    assert report["alex"]["ged_permissions"] == report["user-ricardo"]["ged_permissions"]
    assert report["alex"]["ged_permissions"] == report["marcelo"]["ged_permissions"]
    print(json.dumps({user_id: {"screens": len(row["screens"]),
                                "laboratorio": row["laboratorio"],
                                "qualidade_superuser": row["qualidade_superuser"],
                                "ged": row["ged"], "ged_session": row["ged_session"],
                                "ged_permissions": len(row["ged_permissions"]),
                                "ged_users_endpoint": row["ged_users_endpoint"]}
                      for user_id, row in report.items()}, ensure_ascii=False))


if __name__ == "__main__":
    main()

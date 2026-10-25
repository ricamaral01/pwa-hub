"""Add only TV session handling to the isolated homolog Mapa API source."""

from __future__ import annotations

import sys
from pathlib import Path


path = Path(sys.argv[1])
source = path.read_text(encoding="utf-8")


def replace(before: str, after: str) -> None:
    global source
    if source.count(before) != 1:
        raise RuntimeError(f"Expected one anchor, got {source.count(before)}: {before[:75]!r}")
    source = source.replace(before, after, 1)


replace('SESSION_SECONDS = 36 * 60 * 60\n', '''SESSION_SECONDS = 36 * 60 * 60
TV_SESSION_SECONDS = 30 * 24 * 60 * 60
TV_USER_ID = 'tv-producao'


def session_scope_and_age(user):
    return ('tv_session', TV_SESSION_SECONDS) if user['id'] == TV_USER_ID else ('session', SESSION_SECONDS)

''')
replace('''    response = jsonify(ok=True, user=public_user(row))
    token = signer().dumps({
        "scope": "session", "id": row["id"],''', '''    response = jsonify(ok=True, user=public_user(row))
    scope, age = session_scope_and_age(row)
    token = signer().dumps({
        "scope": scope, "id": row["id"],''')
replace('''        COOKIE_NAME, token, max_age=SESSION_SECONDS, httponly=True,
        secure=True, samesite="Lax", path=COOKIE_PATH,
    )
    response.delete_cookie(COOKIE_NAME, path=LEGACY_COOKIE_PATH)
    response.set_cookie(
        TEST_PAGE_COOKIE_NAME, token, max_age=SESSION_SECONDS, httponly=True,''', '''        COOKIE_NAME, token, max_age=age, httponly=True,
        secure=True, samesite="Lax", path=COOKIE_PATH,
    )
    response.delete_cookie(COOKIE_NAME, path=LEGACY_COOKIE_PATH)
    response.set_cookie(
        TEST_PAGE_COOKIE_NAME, token, max_age=age, httponly=True,''')
replace('''    if mapa and mapa["ativo"]:
        token = signer().dumps({"scope": "session", "id": mapa["id"],''', '''    if mapa and mapa["ativo"]:
        scope, age = session_scope_and_age(mapa)
        token = signer().dumps({"scope": scope, "id": mapa["id"],''')
replace('''        response.set_cookie(COOKIE_NAME, token, max_age=SESSION_SECONDS,
                            httponly=True, secure=True, samesite="Lax",
                            path=COOKIE_PATH)
        response.delete_cookie(COOKIE_NAME, path=LEGACY_COOKIE_PATH)
        response.set_cookie(TEST_PAGE_COOKIE_NAME, token, max_age=SESSION_SECONDS,''', '''        response.set_cookie(COOKIE_NAME, token, max_age=age,
                            httponly=True, secure=True, samesite="Lax",
                            path=COOKIE_PATH)
        response.delete_cookie(COOKIE_NAME, path=LEGACY_COOKIE_PATH)
        response.set_cookie(TEST_PAGE_COOKIE_NAME, token, max_age=age,''')
replace('''        session = signer().loads(token, max_age=SESSION_SECONDS)
        if (not isinstance(session, dict) or session.get("scope") not in {"session", "legacy_session"}
                or not isinstance(session.get("id"), str)):
            return None
        with connect() as conn, conn.cursor() as cur:''', '''        session = signer().loads(token, max_age=TV_SESSION_SECONDS)
        if (not isinstance(session, dict) or session.get("scope") not in {"session", "legacy_session", "tv_session"}
                or not isinstance(session.get("id"), str)):
            return None
        if session['scope'] == 'tv_session':
            if session['id'] != TV_USER_ID:
                return None
        else:
            signer().loads(token, max_age=SESSION_SECONDS)
        with connect() as conn, conn.cursor() as cur:''')
replace('''    token = signer().dumps({"scope": "legacy_session" if user["primeiro_acesso"] else "session", "id": user["id"],
                            "updated_at": user["updated_at"].isoformat()})
    response.set_cookie(COOKIE_NAME, token, max_age=SESSION_SECONDS,''', '''    scope, age = session_scope_and_age(user)
    token = signer().dumps({"scope": "legacy_session" if user["primeiro_acesso"] else scope, "id": user["id"],
                            "updated_at": user["updated_at"].isoformat()})
    response.set_cookie(COOKIE_NAME, token, max_age=age,''')

path.write_text(source, encoding="utf-8")

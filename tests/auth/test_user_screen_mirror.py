"""Exercise both Users API password paths with removable linked test accounts."""

from __future__ import annotations

import json
import os
from pathlib import Path
import secrets
import sys
import urllib.request


def load(path: str) -> None:
    for line in Path(path).read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")


def call(path: str, body: dict, *, method: str = "POST", token: str = "", cookie: str = ""):
    headers = {"Content-Type": "application/json", "Origin": "https://concrefer.concretrack.com.br"}
    if token:
        headers["Authorization"] = "Bearer " + token
    if cookie:
        headers["Cookie"] = cookie
    base = ("https://concrefer.concretrack.com.br" if path.startswith("/unificado/")
            else "http://127.0.0.1:13052")
    request = urllib.request.Request(base + path,
                                     data=json.dumps(body).encode(), method=method, headers=headers)
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.status, json.loads(response.read() or b"null")


def main() -> None:
    load("/etc/mapa-unificado/auth.env")
    load("/etc/mapa-unificado/unified-auth.env")
    sys.path.insert(0, "/opt/mapa-unificado-api")
    from app import COOKIE_NAME, signer
    from unified_auth import (MAPA_HASHER, PCP_HASHER, check_link_password,
                              confirm_link, link_for, map_connect, pcp_connect)

    suffix = secrets.token_hex(5)
    pcp_admin = "mirror-admin-" + suffix
    mapa_admin = "mirror-gerencia-" + suffix
    pair_name = "mirror-pair-" + suffix
    old_pwd = secrets.token_urlsafe(12)
    admin_pwd = secrets.token_urlsafe(12)
    target_id = admin_id = link_id = None
    results = {}
    try:
        with pcp_connect() as conn, conn.cursor() as cur:
            for username, role, password in ((pcp_admin, "ADMIN", admin_pwd),
                                             (pair_name, "CONSULTA", old_pwd)):
                cur.execute("""INSERT INTO public.usuarios
                  (nome,username,email,senha_hash,nivel_acesso,ativo,trocar_senha_primeiro_acesso)
                  VALUES (%s,%s,%s,%s,%s,true,false) RETURNING id""",
                  (username, username, username + "@local.invalid", PCP_HASHER.hash(password), role))
                if username == pcp_admin:
                    admin_id = cur.fetchone()["id"]
                else:
                    target_id = cur.fetchone()["id"]
        with map_connect() as conn, conn.cursor() as cur:
            for username, password in ((mapa_admin, admin_pwd), (pair_name, old_pwd)):
                cur.execute("""INSERT INTO public.usuarios
                  (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
                  VALUES (%s,%s,'GERENCIA',%s,true,'Todos',false)""",
                  (username, username, MAPA_HASHER.hash(password)))
            cur.execute("SELECT updated_at FROM public.usuarios WHERE id=%s", (mapa_admin,))
            updated_at = cur.fetchone()["updated_at"].isoformat()
        link_id = confirm_link(target_id, pair_name)
        cookie = COOKIE_NAME + "=" + signer().dumps({
            "scope": "session", "id": mapa_admin, "updated_at": updated_at})
        login_req = urllib.request.Request(
            "http://127.0.0.1:13054/api/login",
            data=json.dumps({"username": pcp_admin, "senha": admin_pwd}).encode(),
            headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(login_req, timeout=10) as response:
            token = json.load(response)["access_token"]
        pcp_new = secrets.token_urlsafe(14)
        status, output = call(f"/unificado/pcp/api/usuarios/{target_id}/redefinir-senha",
                              {"nova_senha": pcp_new}, token=token)
        assert status == 200 and output["id"] == target_id
        assert check_link_password(link_for(pcp_id=target_id), pcp_new) == (True, True)
        with map_connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT primeiro_acesso FROM public.usuarios WHERE id=%s", (pair_name,))
            results["pcp_users_reset_mirrors_mapa"] = cur.fetchone()["primeiro_acesso"] is True
        mapa_new = secrets.token_urlsafe(14)
        status, output = call("/unificado/mapa/api/rest/v1/usuarios?id=eq." + pair_name,
                              {"senha": mapa_new, "primeiro_acesso": False},
                              method="PATCH", cookie=cookie)
        assert status == 200 and output[0]["id"] == pair_name
        results["mapa_users_reset_mirrors_pcp"] = (
            check_link_password(link_for(mapa_login=pair_name), mapa_new) == (True, True))
        assert all(results.values())
    finally:
        with map_connect() as conn, conn.cursor() as cur:
            if link_id is not None:
                cur.execute("DELETE FROM unificado_auth.identity_links WHERE id=%s", (link_id,))
            cur.execute("DELETE FROM public.usuarios WHERE id=ANY(%s)", ([mapa_admin, pair_name],))
        with pcp_connect() as conn, conn.cursor() as cur:
            for user_id in (admin_id, target_id):
                if user_id is not None:
                    cur.execute("DELETE FROM public.usuarios WHERE id=%s", (user_id,))
    print("user_screen_mirror=" + ",".join(
        f"{key}:{'ok' if value else 'FAIL'}" for key, value in results.items()) + " cleanup=ok")


if __name__ == "__main__":
    main()

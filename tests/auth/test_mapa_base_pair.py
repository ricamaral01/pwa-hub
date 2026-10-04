"""A confirmed Mapa-base pair adopts its existing Mapa credential on first login."""

from __future__ import annotations

import os
from pathlib import Path
import secrets
import sys


def load(path: Path) -> None:
    for line in path.read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")


def main() -> None:
    load(Path("/etc/mapa-unificado/auth.env"))
    load(Path("/etc/mapa-unificado/unified-auth.env"))
    sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
    from app import app
    from unified_auth import (MAPA_HASHER, PCP_HASHER, confirm_link, link_for,
                              map_connect, pcp_connect, verify_pcp)

    login = "exact-probe-" + secrets.token_hex(5)
    pcp_password = secrets.token_urlsafe(12)
    mapa_password = secrets.token_urlsafe(12)
    pcp_id = link_id = None
    try:
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("""INSERT INTO public.usuarios
                (username,nome,email,senha_hash,nivel_acesso,ativo,trocar_senha_primeiro_acesso)
                VALUES (%s,%s,%s,%s,'CONSULTA',true,false) RETURNING id""",
                (login, login, login + "@local.invalid", PCP_HASHER.hash(pcp_password)))
            pcp_id = cur.fetchone()["id"]
        with map_connect() as conn, conn.cursor() as cur:
            cur.execute("""INSERT INTO public.usuarios
                (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
                VALUES (%s,%s,'GERENCIA',%s,true,'Todos',false)""",
                (login, login, MAPA_HASHER.hash(mapa_password)))
        link_id = confirm_link(pcp_id, login, mapa_base=True)
        client = app.test_client()
        denied = client.post("/unified/login", json={"username": login,
                                                     "password": pcp_password})
        assert denied.status_code == 401
        accepted = client.post("/unified/login", json={"username": login,
                                                       "password": mapa_password})
        assert accepted.status_code == 200 and accepted.json["modules"] == ["pcp", "mapa"]
        assert not accepted.json.get("reset_required")
        assert link_for(pcp_id=pcp_id)["unified_password_set"]
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT senha_hash FROM public.usuarios WHERE id=%s", (pcp_id,))
            assert verify_pcp(mapa_password, cur.fetchone()["senha_hash"])
        again = client.post("/unified/login", json={"username": login,
                                                    "password": mapa_password})
        assert again.status_code == 200 and again.json["modules"] == ["pcp", "mapa"]
        print("mapa_base_pair=ok no_forced_reset=true dual_session=true")
    finally:
        if link_id is not None:
            with map_connect() as conn, conn.cursor() as cur:
                cur.execute("DELETE FROM unificado_auth.identity_links WHERE id=%s", (link_id,))
        if pcp_id is not None:
            with pcp_connect() as conn, conn.cursor() as cur:
                cur.execute("DELETE FROM public.usuarios WHERE id=%s", (pcp_id,))
        with map_connect() as conn, conn.cursor() as cur:
            cur.execute("DELETE FROM public.usuarios WHERE id=%s", (login,))


if __name__ == "__main__":
    main()

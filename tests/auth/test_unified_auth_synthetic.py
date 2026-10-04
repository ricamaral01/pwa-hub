"""Test identity links and hash sync using removable accounts in both test DBs."""

from __future__ import annotations

import os
from pathlib import Path
import secrets
import sys


def load(path: str) -> None:
    for line in Path(path).read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")


def main() -> None:
    load("/etc/mapa-unificado/auth.env")
    load("/etc/mapa-unificado/unified-auth.env")
    sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
    from unified_auth import (MAPA_HASHER, PCP_HASHER, check_link_password,
                              confirm_link, link_for, linked_users, map_connect,
                              mark_existing_shared_password, pcp_connect,
                              reapply_unified_hashes, set_unified_password,
                              verify_map, verify_pcp)
    from app import app
    client = app.test_client()

    suffix = secrets.token_hex(5)
    accounts = []
    links = []
    passwords = [secrets.token_urlsafe(12) for _ in range(7)]

    def make(kind: str, pcp_password: str | None, mapa_password: str | None):
        username = f"unified-test-{kind}-{suffix}"
        pcp_id = mapa_id = None
        if pcp_password is not None:
            with pcp_connect() as conn, conn.cursor() as cur:
                cur.execute("""INSERT INTO public.usuarios
                    (username,nome,email,senha_hash,nivel_acesso,ativo,trocar_senha_primeiro_acesso)
                    VALUES (%s,%s,%s,%s,'CONSULTA',true,false) RETURNING id""",
                    (username, "Teste Unificado", username + "@local.invalid",
                     PCP_HASHER.hash(pcp_password)))
                pcp_id = cur.fetchone()["id"]
        if mapa_password is not None:
            with map_connect() as conn, conn.cursor() as cur:
                cur.execute("""INSERT INTO public.usuarios
                    (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
                    VALUES (%s,%s,'GERENCIA',%s,true,'Todos',false)""",
                    (username, "Teste Unificado " + kind, MAPA_HASHER.hash(mapa_password)))
                mapa_id = username
        accounts.append((pcp_id, mapa_id))
        return pcp_id, mapa_id

    results = {}
    try:
        same_id, same_map = make("same", passwords[0], passwords[0])
        diff_id, diff_map = make("different", passwords[1], passwords[2])
        only_pcp, _ = make("pcp", passwords[3], None)
        _, only_map = make("mapa", None, passwords[4])
        collision_pcp, collision_map = make("collision", passwords[5], passwords[6])
        same_link = confirm_link(same_id, same_map)
        diff_link = confirm_link(diff_id, diff_map)
        links.extend((same_link, diff_link))
        assert link_for(pcp_id=same_id)["mapa_login"] == same_map
        assert check_link_password(link_for(pcp_id=same_id), passwords[0]) == (True, True)
        response = client.post("/unified/login", json={"username": same_map,
                                                       "password": passwords[0]})
        assert response.status_code == 200 and response.json["modules"] == ["pcp", "mapa"]
        results["same_password_pair"] = bool(link_for(pcp_id=same_id)["unified_password_set"])
        assert check_link_password(link_for(pcp_id=diff_id), passwords[1]) == (True, False)
        assert check_link_password(link_for(mapa_login=diff_map), passwords[2]) == (False, True)
        results["different_password_pair_accepts_either"] = True
        first = client.post("/unified/login", json={"username": diff_map,
                                                    "password": passwords[1]})
        second = client.post("/unified/login", json={"username": diff_map,
                                                     "password": passwords[2]})
        assert first.status_code == second.status_code == 200
        assert first.json["reset_required"] and second.json["reset_required"]
        reset_token = first.json["reset_token"]
        short = client.post("/unified/reset", json={"token": reset_token,
                                                    "password": secrets.token_hex(2)})
        results["short_new_password_rejected"] = short.status_code == 400
        unified = secrets.token_urlsafe(14)
        reset = client.post("/unified/reset", json={"token": reset_token,
                                                    "password": unified})
        assert reset.status_code == 200 and reset.json["modules"] == ["pcp", "mapa"]
        assert check_link_password(link_for(pcp_id=diff_id), unified) == (True, True)
        results["dual_hash_update"] = True
        pcp_only_login = client.post("/unified/login", json={"username": f"unified-test-pcp-{suffix}",
                                                            "password": passwords[3]})
        mapa_only_login = client.post("/unified/login", json={"username": only_map,
                                                             "password": passwords[4]})
        results["single_system_http_login"] = (
            pcp_only_login.status_code == 200 and pcp_only_login.json["modules"] == ["pcp"]
            and mapa_only_login.status_code == 200 and mapa_only_login.json["modules"] == ["mapa"])
        collision_first = client.post("/unified/login", json={"username": collision_map,
                                                               "password": passwords[5]})
        collision_second = client.post("/unified/login", json={"username": collision_map,
                                                                "password": passwords[6]})
        results["same_login_unconfirmed_stays_separate"] = (
            collision_first.status_code == 200 and collision_first.json["modules"] == ["pcp"]
            and collision_second.status_code == 200 and collision_second.json["modules"] == ["mapa"]
            and link_for(pcp_id=collision_pcp) is None)
        invalid = client.post("/unified/login", json={"username": only_map,
                                                      "password": secrets.token_urlsafe(12)})
        results["wrong_password_rejected"] = invalid.status_code == 401
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT senha_hash FROM public.usuarios WHERE id=%s", (only_pcp,))
            pcp_hash = cur.fetchone()["senha_hash"]
        with map_connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT senha_hash FROM public.usuarios WHERE id=%s", (only_map,))
            map_hash = cur.fetchone()["senha_hash"]
        results["single_system_passwords_unchanged"] = (
            verify_pcp(passwords[3], pcp_hash) and verify_map(passwords[4], map_hash)
            and link_for(pcp_id=only_pcp) is None and link_for(mapa_login=only_map) is None)
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("UPDATE public.usuarios SET ativo=false WHERE id=%s", (diff_id,))
        results["one_side_inactive_only"] = check_link_password(
            link_for(pcp_id=diff_id), unified) == (False, True)
        one_side_login = client.post("/unified/login", json={"username": diff_map,
                                                              "password": unified})
        results["one_side_inactive_http"] = (
            one_side_login.status_code == 200 and one_side_login.json["modules"] == ["mapa"])
        with pcp_connect() as conn, conn.cursor() as cur:
            cur.execute("UPDATE public.usuarios SET ativo=true,senha_hash=%s WHERE id=%s",
                        (PCP_HASHER.hash(passwords[1]), diff_id))
        with map_connect() as conn, conn.cursor() as cur:
            cur.execute("UPDATE public.usuarios SET senha_hash=%s WHERE id=%s",
                        (MAPA_HASHER.hash(passwords[2]), diff_map))
        reapply_unified_hashes()
        pcp_after, mapa_after = linked_users(link_for(pcp_id=diff_id))
        results["hashes_reapplied_after_snapshot"] = (
            check_link_password(link_for(pcp_id=diff_id), unified) == (True, True)
            and pcp_after["trocar_senha_primeiro_acesso"] is False
            and mapa_after["primeiro_acesso"] is False)
        assert all(results.values())
    finally:
        with map_connect() as conn, conn.cursor() as cur:
            for link_id in links:
                cur.execute("DELETE FROM unificado_auth.identity_links WHERE id=%s", (link_id,))
            for _, mapa_id in accounts:
                if mapa_id:
                    cur.execute("DELETE FROM public.usuarios WHERE id=%s", (mapa_id,))
        with pcp_connect() as conn, conn.cursor() as cur:
            for pcp_id, _ in accounts:
                if pcp_id:
                    cur.execute("DELETE FROM public.usuarios WHERE id=%s", (pcp_id,))
    print("unified_auth_synthetic=" + ",".join(
        f"{key}:{'ok' if value else 'FAIL'}" for key, value in results.items())
          + " cleanup=ok")


if __name__ == "__main__":
    main()

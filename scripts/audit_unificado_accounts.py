"""Inventory test-only account identities without selecting any password column."""

from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys
import unicodedata


def normalized(value: str) -> str:
    plain = unicodedata.normalize("NFKD", value.casefold())
    return " ".join("".join(c for c in plain if not unicodedata.combining(c)).split())


def pcp_rows() -> list[dict]:
    query = """SELECT coalesce(json_agg(json_build_object(
      'id',id,'login',username,'name',nome,'role',nivel_acesso,
      'active',ativo,'first_access',trocar_senha_primeiro_acesso)
      ORDER BY username),'[]'::json) FROM public.usuarios"""
    result = subprocess.run(
        ["runuser", "-u", "postgres", "--", "psql", "-X", "-A", "-t",
         "-d", "pcp_unificado_teste", "-c", query],
        capture_output=True, text=True, check=True,
    )
    return json.loads(result.stdout)


def mapa_rows() -> list[dict]:
    for line in Path("/etc/mapa-unificado/auth.env").read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")
    sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
    from app import connect
    with connect() as conn, conn.cursor() as cursor:
        cursor.execute("""SELECT id AS login,nome AS name,perfil AS role,
                       ativo AS active,primeiro_acesso AS first_access
                       FROM public.usuarios ORDER BY id""")
        return [dict(row) for row in cursor.fetchall()]


def confirmed_links() -> list[dict]:
    sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
    from app import connect
    with connect() as conn, conn.cursor() as cursor:
        cursor.execute("""SELECT pcp_user_id,mapa_login,unified_password_set,requires_reset
                          FROM unificado_auth.identity_links ORDER BY pcp_user_id""")
        return [dict(row) for row in cursor.fetchall()]


def main() -> None:
    pcp, mapa = pcp_rows(), mapa_rows()
    assert not any(normalized(row["login"]) == "ricardo-operacao-teste" for row in mapa)
    candidates = []
    collision = []
    seen = set()
    for left in pcp:
        for right in mapa:
            same_login = normalized(left["login"]) == normalized(right["login"])
            same_name = normalized(left["name"]) == normalized(right["name"])
            login_matches_name = normalized(left["login"]) == normalized(right["name"])
            if same_login and not same_name:
                collision.append({"pcp": left, "mapa": right})
            if (same_name or login_matches_name) and (left["id"], right["login"]) not in seen:
                candidates.append({"pcp": left, "mapa": right,
                                   "reason": ("same full name and login" if same_name and same_login
                                              else "same full name" if same_name
                                              else "PCP login matches Mapa display name")})
                seen.add((left["id"], right["login"]))
    paired_pcp = {item["pcp"]["id"] for item in candidates}
    paired_mapa = {item["mapa"]["login"] for item in candidates}
    report = {
        "confirmed_links": confirmed_links(),
        "pcp_only": [row for row in pcp if row["id"] not in paired_pcp],
        "mapa_only": [row for row in mapa if row["login"] not in paired_mapa],
        "candidate_pairs": candidates,
        "same_login_different_names": collision,
        "ricardo_mapa": [row for row in mapa if normalized(row["login"]) == "ricardo"
                         or normalized(row["name"]) == "ricardo"],
        "ricardo_pcp": [row for row in pcp if normalized(row["login"]) == "ricardo"
                        or normalized(row["name"]) == "ricardo"],
        "counts": {"pcp": len(pcp), "mapa": len(mapa)},
    }
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()

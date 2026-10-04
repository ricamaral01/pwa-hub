"""Link only unique pairs whose login and full name match in both test DBs."""

from __future__ import annotations

import os
from pathlib import Path
import sys
import unicodedata


def normalized(value: str) -> str:
    plain = unicodedata.normalize("NFKD", value.casefold())
    return " ".join("".join(char for char in plain if not unicodedata.combining(char)).split())


def load(path: Path) -> None:
    for line in path.read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")


def main() -> None:
    load(Path("/etc/mapa-unificado/auth.env"))
    load(Path("/etc/mapa-unificado/unified-auth.env"))
    sys.path.insert(0, "/opt/mapa-unificado-api")
    from unified_auth import confirm_link, link_for, map_connect, pcp_connect

    with pcp_connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT id,username,nome,nivel_acesso,ativo FROM public.usuarios ORDER BY id")
        pcp = cur.fetchall()
    with map_connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT id,nome,perfil,ativo FROM public.usuarios ORDER BY id")
        mapa = cur.fetchall()
    exact = [(left, right) for left in pcp for right in mapa
             if normalized(left["username"]) == normalized(right["id"])
             and normalized(left["nome"]) == normalized(right["nome"])]
    unique = [(left, right) for left, right in exact
              if sum(normalized(other["username"]) == normalized(left["username"])
                     and normalized(other["nome"]) == normalized(left["nome"]) for other in pcp) == 1
              and sum(normalized(other["id"]) == normalized(right["id"])
                      and normalized(other["nome"]) == normalized(right["nome"]) for other in mapa) == 1]
    print("EXATOS — login e nome iguais, únicos nos dois lados")
    print("PCP login | PCP nome | PCP perfil | Mapa login | Mapa nome | Mapa perfil | situação")
    for left, right in unique:
        existing = link_for(pcp_id=left["id"], mapa_login=right["id"])
        if existing and (existing["pcp_user_id"] != left["id"] or
                         existing["mapa_login"] != right["id"]):
            raise ValueError("Exact account already linked to another identity")
        if not existing:
            confirm_link(left["id"], right["id"], mapa_base=True)
        print(f"{left['username']} | {left['nome']} | {left['nivel_acesso']} | "
              f"{right['id']} | {right['nome']} | {right['perfil']} | "
              f"{'ativa' if left['ativo'] and right['ativo'] else 'revisar inatividade'}")
    print(f"confirmed_exact_pairs={len(unique)}")
    print("DEMAIS CANDIDATOS — exigem confirmação individual do Ricardo")
    print("PCP login | PCP nome | Mapa login | Mapa nome")
    pending = []
    for left in pcp:
        for right in mapa:
            if (left, right) in unique:
                continue
            if normalized(left["nome"]) == normalized(right["nome"]) or \
                    normalized(left["username"]) == normalized(right["nome"]):
                pending.append((left, right))
                print(f"{left['username']} | {left['nome']} | {right['id']} | {right['nome']}")
    print(f"pending_candidate_pairs={len(pending)}")


if __name__ == "__main__":
    main()

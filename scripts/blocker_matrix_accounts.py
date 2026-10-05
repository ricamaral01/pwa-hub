"""Create and remove short-lived role/sector accounts in the two unified test databases."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import secrets
import sys


FILE = Path("/etc/mapa-unificado/blocker-matrix.json")
PREFIX = "e2e-matrix-"
ROLES = ("GERENCIA", "GESTOR", "MONTADOR", "APONTADOR")


def load_environment() -> None:
    if all(os.environ.get(key) for key in (
        "MAPA_AUTH_DATABASE_URL", "MAPA_WRITER_DATABASE_URL", "UNIFICADO_PCP_DATABASE_URL"
    )):
        return
    for filename in ("auth.env", "writer.env", "unified-auth.env"):
        for raw in (Path("/etc/mapa-unificado") / filename).read_text().splitlines():
            if raw.strip() and not raw.lstrip().startswith("#") and "=" in raw:
                key, value = raw.strip().split("=", 1)
                os.environ[key] = value.strip().strip('"').strip("'")


def cleanup(connect, writer_connect, pcp_connect) -> tuple[int, int]:
    with connect() as connection, connection.cursor() as cursor:
        cursor.execute("DELETE FROM unificado_auth.identity_links WHERE mapa_login LIKE %s", (PREFIX + "%",))
        cursor.execute("DELETE FROM public.usuarios WHERE id LIKE %s", (PREFIX + "%",))
        mapa_removed = cursor.rowcount
    with writer_connect() as connection, connection.cursor() as cursor:
        cursor.execute("DELETE FROM public.montagem_poste WHERE data_fabricacao::text LIKE '2099-10-%'")
        cursor.execute("DELETE FROM public.producao WHERE data_fabricacao::text LIKE '2099-10-%'")
        cursor.execute("DELETE FROM public.liberacao_formas WHERE data_fabricacao::text LIKE '2099-10-%'")
        cursor.execute("DELETE FROM public.programacao_pcp WHERE data_fabricacao::text LIKE '2099-10-%'")
        cursor.execute("DELETE FROM public.formas_manutencao WHERE id LIKE %s", (PREFIX + "%",))
    with pcp_connect() as connection, connection.cursor() as cursor:
        cursor.execute("DELETE FROM public.usuarios WHERE username LIKE %s", (PREFIX + "%",))
        pcp_removed = cursor.rowcount
    FILE.unlink(missing_ok=True)
    return mapa_removed, pcp_removed


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("create", "cleanup"))
    args = parser.parse_args()
    load_environment()
    sys.path.insert(0, "/opt/concrefer-unificado/mapa-api")
    from app import connect, hasher, writer_connect
    from unified_auth import (PCP_HASHER, confirm_link, pcp_connect,
                              sync_component_password)

    removed = cleanup(connect, writer_connect, pcp_connect)
    if args.action == "cleanup":
        print(f"matrix_accounts removed_mapa={removed[0]} removed_pcp={removed[1]}")
        return

    accounts = []
    with connect() as connection, connection.cursor() as cursor:
        for role in ROLES:
            for sector in range(1, 5):
                login = f"{PREFIX}{role.lower()}-s{sector}"
                password = secrets.token_urlsafe(24)
                name = "Setor 3" if role == "APONTADOR" and sector == 3 else f"Matriz {role} S{sector}"
                cursor.execute("""INSERT INTO public.usuarios
                    (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
                    VALUES (%s,%s,%s,%s,true,%s,false)""",
                    (login, name, role, hasher.hash(password), f"Setor {sector}"))
                accounts.append({"login": login, "password": password, "role": role,
                                 "sector": sector, "kind": "mapa-only", "name": name})

    pair_login = PREFIX + "pair"
    pair_password = secrets.token_urlsafe(24)
    with pcp_connect() as connection, connection.cursor() as cursor:
        cursor.execute("""INSERT INTO public.usuarios
            (nome,username,email,senha_hash,nivel_acesso,ativo,trocar_senha_primeiro_acesso)
            VALUES (%s,%s,%s,%s,'ADMIN',true,false) RETURNING id""",
            ("Matriz Par", pair_login, pair_login + "@local.invalid", PCP_HASHER.hash(pair_password)))
        pcp_id = cursor.fetchone()["id"]
    with connect() as connection, connection.cursor() as cursor:
        cursor.execute("""INSERT INTO public.usuarios
            (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
            VALUES (%s,'Matriz Par','GERENCIA',%s,true,'Todos',false)""",
            (pair_login, hasher.hash(pair_password)))
    link_id = confirm_link(pcp_id, pair_login, mapa_base=True)
    sync_component_password(link_id, pair_password)
    accounts.append({"login": pair_login, "password": pair_password, "role": "GERENCIA",
                     "sector": 0, "kind": "pair", "pcp_role": "ADMIN", "name": "Matriz Par"})

    # Prerequisites for real-touch MONTADOR writes. They live only in the isolated
    # test database and are removed by cleanup(); the browser still performs the
    # inspection itself through the published visible controls.
    with writer_connect() as connection, connection.cursor() as cursor:
        for index in range(1, 61):
            cursor.execute("""INSERT INTO public.producao
                (data_hora,setor,forma,modelo,tipo_concreto,colaborador,
                 data_fabricacao,status)
                VALUES ('2099-10-15T12:00:00-03:00','Setor 3',%s,'SC','PADRAO',
                        'Matriz E2E','2099-10-15','LIBERADO')""",
                (f"E2E-{index:03d}",))

    fd = os.open(FILE, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as stream:
        json.dump({"accounts": accounts}, stream, ensure_ascii=False)
    print(f"matrix_accounts created={len(accounts)} mapa_only=16 pairs=1 prerequisites=60")


if __name__ == "__main__":
    main()

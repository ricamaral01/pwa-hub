"""Provision a reusable GERENCIA account only in the isolated Mapa test DB."""

from __future__ import annotations

import os
from pathlib import Path
import secrets


PRIVATE = Path("/etc/mapa-unificado/operacao-test-login.env")
USER_ID = "ricardo-operacao-teste"


def main() -> None:
    for line in Path("/etc/mapa-unificado/auth.env").read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")
    os.chdir("/opt/mapa-unificado-api")
    import sys
    sys.path.insert(0, os.getcwd())
    from app import connect, hasher

    if PRIVATE.exists():
        pairs = dict(line.split("=", 1) for line in PRIVATE.read_text().splitlines() if "=" in line)
        password = pairs["MAPA_TEST_PASSWORD"]
    else:
        password = secrets.token_urlsafe(18)
    with connect() as conn, conn.cursor() as cursor:
        cursor.execute("""INSERT INTO public.usuarios
                          (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
                          VALUES (%s,%s,'GERENCIA',%s,true,'Todos',false)
                          ON CONFLICT (id) DO UPDATE SET senha_hash=EXCLUDED.senha_hash,
                            nome=EXCLUDED.nome, perfil=EXCLUDED.perfil, ativo=true,
                            setor='Todos', primeiro_acesso=false""",
                       (USER_ID, "Ricardo Teste Operação", hasher.hash(password)))
    if not PRIVATE.exists():
        fd = os.open(PRIVATE, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            file.write(f"MAPA_TEST_USER={USER_ID}\nMAPA_TEST_PASSWORD={password}\n")
    print("account=ready role=GERENCIA credential_file=private")


if __name__ == "__main__":
    main()

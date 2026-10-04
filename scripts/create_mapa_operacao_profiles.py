"""Create isolated test-only Mapa accounts for all operational profiles."""

from __future__ import annotations

import os
from pathlib import Path
import secrets


PRIVATE = Path("/etc/mapa-unificado/operacao-test-profiles.env")
PROFILES = ("GESTOR", "MONTADOR", "APONTADOR")


def main() -> None:
    for line in Path("/etc/mapa-unificado/auth.env").read_text().splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")
    os.chdir("/opt/concrefer-unificado/mapa-api")
    import sys
    sys.path.insert(0, os.getcwd())
    from app import connect, hasher

    if PRIVATE.exists():
        pairs = dict(line.split("=", 1) for line in PRIVATE.read_text().splitlines() if "=" in line)
    else:
        pairs = {f"{role}_PASSWORD": secrets.token_urlsafe(18) for role in PROFILES}
    with connect() as conn, conn.cursor() as cursor:
        for role in PROFILES:
            user_id = "e2e-" + role.lower()
            cursor.execute("""INSERT INTO public.usuarios
                              (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
                              VALUES (%s,%s,%s,%s,true,'Todos',false)
                              ON CONFLICT (id) DO UPDATE SET senha_hash=EXCLUDED.senha_hash,
                                nome=EXCLUDED.nome, perfil=EXCLUDED.perfil, ativo=true,
                                setor='Todos', primeiro_acesso=false""",
                           (user_id, "E2E " + role, role, hasher.hash(pairs[f"{role}_PASSWORD"])))
    if not PRIVATE.exists():
        fd = os.open(PRIVATE, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            for key, value in pairs.items():
                file.write(f"{key}={value}\n")
    print("profiles=GESTOR,MONTADOR,APONTADOR credential_file=private")


if __name__ == "__main__":
    main()

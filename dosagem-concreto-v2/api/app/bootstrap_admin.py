"""Create the one emergency account after database migrations.

Run once as root from provisioning; the initial secret stays outside the release.
"""
import os
import secrets
from pathlib import Path

from .auth_session import senha_hash
from .db import get_sessionmaker
from .modelos import LocalCredencial, Usuario


def bootstrap(path: Path, email: str = "admin@dosagem.local") -> bool:
    factory = get_sessionmaker()
    with factory() as session:
        if session.get(LocalCredencial, email):
            return False
    senha = secrets.token_urlsafe(24)
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    descriptor = os.open(path, flags, 0o600)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as file:
            file.write(f"Email: {email}\nSenha provisória: {senha}\nTroca obrigatória no primeiro acesso.\n")
        with factory.begin() as session:
            if not session.get(Usuario, email):
                session.add(Usuario(email=email, nome="Administrador de emergência", papel="admin", unidades=["*"], ativo=True))
                session.flush()
            session.add(LocalCredencial(email=email, senha_hash=senha_hash(senha), trocar_senha=True))
    except BaseException:
        path.unlink(missing_ok=True)
        raise
    print(f"Conta de emergência criada. Senha provisória guardada em {path}.")
    fifo = os.environ.get("ADMIN_PASSWORD_FIFO")
    if fifo:
        with open(fifo, "w", encoding="utf-8") as delivery:
            delivery.write(f"{email}\n{senha}\n")
    return True


if __name__ == "__main__":
    target = Path(os.environ.get("ADMIN_SENHA_ARQUIVO", "/opt/concretrack-dosagem/shared/ADMIN_SENHA_INICIAL.txt"))
    bootstrap(target)

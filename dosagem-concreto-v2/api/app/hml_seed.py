"""Explicit local homologation account; refuses to run outside AMBIENTE=hml."""
import os

from .auth_session import senha_hash
from .db import get_sessionmaker
from .modelos import LocalCredencial, Usuario


def main() -> None:
    if os.environ.get("AMBIENTE") != "hml":
        raise SystemExit("Only for isolated homologation")
    senha = os.environ.get("HML_TEST_PASSWORD", "")
    if len(senha) < 8:
        raise SystemExit("HML_TEST_PASSWORD required")
    factory = get_sessionmaker()
    with factory.begin() as session:
        email = os.environ.get("HML_TEST_EMAIL", "hml@example.test")
        if not email.endswith("@example.test"):
            raise SystemExit("Only example.test accounts are allowed in homologation")
        initial = os.environ.get("HML_TEST_INITIAL") == "1"
        if not session.get(Usuario, email):
            session.add(Usuario(email=email, nome="Homologação", papel="admin", unidades=["*"], ativo=True))
            session.flush()
        cred = session.get(LocalCredencial, email)
        if cred:
            cred.senha_hash = senha_hash(senha)
            cred.trocar_senha = initial
        else:
            session.add(LocalCredencial(email=email, senha_hash=senha_hash(senha), trocar_senha=initial))
    print("Homologation account ready")


if __name__ == "__main__":
    main()

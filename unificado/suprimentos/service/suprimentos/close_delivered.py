"""Entrada do timer de fechamento automático."""
from .db import database
from .api.solicitacoes import close_delivered
from sqlalchemy.orm import Session


def main():
    engine, _ = database()
    with Session(engine) as db:
        print(f"solicitacoes_fechadas={close_delivered(db)}")


if __name__ == "__main__":
    main()

import os
import time
from pathlib import Path

import jwt
import pytest
import testing.postgresql
from alembic import command
from alembic.config import Config as AlembicConfig
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.config import Config


@pytest.fixture(scope="session")
def banco_url():
    # Docker não é necessário: cluster PostgreSQL temporário isolado.
    with testing.postgresql.Postgresql(initdb_args="-U postgres -A trust --encoding=UTF8 --no-locale") as pg:
        # testing.postgresql envia SIGINT no encerramento; Windows só aceita
        # SIGTERM para este subprocesso criado sem grupo de console.
        if os.name == "nt":
            pg.terminate = lambda *_: testing.postgresql.Postgresql.__mro__[1].terminate(pg)
        url = pg.url().replace("postgresql://", "postgresql+psycopg://", 1)
        os.environ["DATABASE_URL"] = url
        alembic = AlembicConfig(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
        alembic.set_main_option("script_location", str(Path(__file__).resolve().parents[1] / "migrations"))
        command.upgrade(alembic, "head")
        yield url


@pytest.fixture()
def ambiente(banco_url):
    engine = create_engine(banco_url, pool_pre_ping=True)
    with engine.begin() as con:
        for nome in ["legado_ids", "auditoria", "idempotencia", "documentos", "usuarios"]:
            con.execute(text(f"TRUNCATE TABLE {nome} RESTART IDENTITY CASCADE"))
        con.execute(text("ALTER SEQUENCE traco_codigo_seq RESTART WITH 1"))
    from app.main import create_app
    cfg = Config(database_url=banco_url, ambiente="dev", jwt_secret="segredo-de-teste-com-mais-de-trinta-e-dois-bytes", jwt_audience="dosagem-test",
                 admin_email="admin@example.test")
    factory = sessionmaker(engine, expire_on_commit=False)
    with TestClient(create_app(cfg, factory)) as client:
        yield client, factory, cfg
    engine.dispose()


def token(email: str, papel: str = "") -> str:
    return jwt.encode({"email": email, "name": email, "exp": int(time.time()) + 3600, "aud": "dosagem-test"},
                      "segredo-de-teste-com-mais-de-trinta-e-dois-bytes", algorithm="HS256")


def rpc(client, acao: str, dados: dict, email: str = "admin@example.test", request_id: str | None = None, origin: str | None = None):
    import uuid
    request_id = request_id or str(uuid.uuid4())
    headers = {"Authorization": f"Bearer {token(email)}", "Idempotency-Key": request_id}
    if origin:
        headers["Origin"] = origin
    return client.post("/api/v1/rpc", headers=headers, json={"acao": acao, "requestId": request_id, "dados": dados})


@pytest.fixture()
def traco():
    import uuid
    return {"id": str(uuid.uuid4()), "codigo": "", "nome": "Duas areias e dois aditivos", "unidade": "campinas", "versao": 0, "revisao": 0,
            "status": "rascunho", "metodo": "manual", "objetivo": {"fckMPa": 40, "sdMPa": 4, "classe": "III", "estrutura": "armado", "abatimentoMm": 100, "toleranciaMm": 20},
            "arIncorporadoPct": 1.5, "normalizarPara1m3": False, "experimentais": [], "auditoria": {},
            "itens": [
                {"id": "c", "nome": "Cimento", "categoria": "cimento", "massaKgM3": 350, "massaEspecificaKgDm3": 3.12},
                {"id": "a1", "nome": "Areia 1", "categoria": "areia", "massaKgM3": 400, "massaEspecificaKgDm3": 2.6},
                {"id": "a2", "nome": "Areia 2", "categoria": "areia", "massaKgM3": 100, "massaEspecificaKgDm3": 2.5},
                {"id": "w", "nome": "Água", "categoria": "agua", "massaKgM3": 175, "massaEspecificaKgDm3": 1},
                {"id": "d1", "nome": "Aditivo 1", "categoria": "aditivo", "massaKgM3": 3, "massaEspecificaKgDm3": 1.1},
                {"id": "d2", "nome": "Aditivo 2", "categoria": "aditivo", "massaKgM3": 4, "massaEspecificaKgDm3": 1.2},
            ]}

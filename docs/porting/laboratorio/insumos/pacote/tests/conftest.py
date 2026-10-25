"""
Testes de ponta a ponta contra um PostgreSQL REAL e DESCARTÁVEL.

  export PG_TEST_DSN="postgresql://postgres@localhost:5432/lab_teste"
  pytest -q tests/

Os schemas insumos, estoque, carta_traco, carta_traco_stg e erp_espelho do banco indicado são APAGADOS.
"""
import os
import subprocess
import sys
from pathlib import Path

import psycopg
import pytest

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ))
DSN = os.environ.get("PG_TEST_DSN")


def _sqlalchemy_url(dsn: str) -> str:
    if dsn.startswith("postgresql://"):
        return dsn.replace("postgresql://", "postgresql+psycopg://", 1)
    return "postgresql+psycopg:///?" + "&".join(f"{k}={v}" for k, v in (p.split("=") for p in dsn.split()))


def pytest_collection_modifyitems(config, items):
    if not DSN:
        pular = pytest.mark.skip(reason="defina PG_TEST_DSN com um banco descartável")
        for it in items:
            if "banco" in getattr(it, "fixturenames", ()):
                it.add_marker(pular)


@pytest.fixture(scope="session")
def banco(tmp_path_factory):
    with psycopg.connect(DSN, autocommit=True) as con:
        con.execute("DROP SCHEMA IF EXISTS erp_espelho, carta_traco_stg, carta_traco, estoque, insumos CASCADE")
        for f in ("010_insumos.sql", "020_estoque.sql", "030_carta_traco.sql", "090_export_formato_legado.sql"):
            con.execute((RAIZ / "sql" / f).read_text(encoding="utf-8"))
        con.execute((RAIZ / "carga" / "estoque_sincronizar_legado.sql").read_text(encoding="utf-8"))
    pasta = tmp_path_factory.mktemp("carga")
    xlsx = pasta / "legado.xlsx"
    subprocess.run([sys.executable, RAIZ / "tests" / "gerar_planilha_exemplo.py", xlsx], check=True)
    subprocess.run([sys.executable, RAIZ / "carga" / "importar_sheets.py", "--xlsx", xlsx, "--dsn", DSN,
                    "--relatorio", pasta / "rel", "--aplicar"], check=True)
    with psycopg.connect(DSN, autocommit=True) as con:
        con.execute((RAIZ / "tests" / "erp_espelho_exemplo.sql").read_text(encoding="utf-8"))
        with con.transaction():
            sinc = con.execute("SELECT * FROM estoque.sincronizar_legado('Campinas')").fetchall()
    return {"pasta": pasta, "sincronizacao": dict(sinc)}


@pytest.fixture(scope="session")
def app(banco):
    os.environ["DATABASE_URL"] = _sqlalchemy_url(DSN)
    os.environ["NF_UPLOAD_DIR"] = str(banco["pasta"] / "nf")
    from fastapi import FastAPI
    from api.carta_traco_api import router as ct
    from api.estoque_api import router as es
    a = FastAPI()
    a.include_router(ct)
    a.include_router(es)
    return a


@pytest.fixture(scope="session")
def cliente(app):
    from fastapi.testclient import TestClient
    return TestClient(app, headers={"X-Usuario": "ricardo", "X-Papel": "admin"})


@pytest.fixture()
def sql():
    with psycopg.connect(DSN, autocommit=True) as con:
        def _q(q, *a):
            cur = con.execute(q, a or None)
            return cur.fetchall() if cur.description else cur.rowcount
        yield _q


@pytest.fixture()
def ids(cliente):
    base = "/api/laboratorio/carta-traco"
    return {
        "mat": {m["nome"]: m["id"] for m in cliente.get(f"{base}/materiais").json()},
        "cod": {m["codigo"]: m["id"] for m in cliente.get(f"{base}/materiais").json() if m["codigo"]},
        "un": {u["nome"]: u["id"] for u in cliente.get(f"{base}/unidades").json()},
        "forn": {f["nome"]: f["id"] for f in cliente.get(f"{base}/fornecedores").json()},
    }

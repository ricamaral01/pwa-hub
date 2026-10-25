"""E1 against a disposable PostgreSQL database (SUPRIMENTOS_TEST_ADMIN_URL)."""
from __future__ import annotations
import io
import os
import sys
import uuid
from pathlib import Path
import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "service"))
from suprimentos.auth import Actor, current_actor, decode_assertion, sign_assertion
from suprimentos.db import database
from suprimentos.ids import uuid7
from suprimentos.main import app

ADMIN_URL = os.getenv("SUPRIMENTOS_TEST_ADMIN_URL")
pytestmark = pytest.mark.skipif(not ADMIN_URL, reason="SUPRIMENTOS_TEST_ADMIN_URL ausente")

@pytest.fixture(scope="module")
def env():
    dbname = "sup_e1_" + uuid.uuid4().hex[:12]
    admin = create_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        conn.execute(text(f'CREATE DATABASE "{dbname}" ENCODING \'UTF8\' TEMPLATE template0 LC_COLLATE \'C\' LC_CTYPE \'C\''))
    url = ADMIN_URL.rsplit("/", 1)[0] + "/" + dbname
    os.environ["SUPRIMENTOS_DATABASE_URL"] = url
    os.environ["SUPRIMENTOS_EXPECTED_DATABASE"] = dbname
    os.environ["SUPRIMENTOS_MIGRATION_DATABASE_URL"] = url
    os.environ["SUPRIMENTOS_ENVIRONMENT"] = "homolog"
    cfg = Config(str(ROOT / "migrations" / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "migrations"))
    command.upgrade(cfg, "head")
    database.cache_clear()
    engine, _ = database()
    try:
        yield engine, cfg
    finally:
        app.dependency_overrides.clear()
        database.cache_clear()
        engine.dispose()
        cleanup = create_engine(url)
        with cleanup.begin() as conn:
            conn.execute(text("TRUNCATE suprimentos.sup_centro_custo, suprimentos.sup_usuario_papel, suprimentos.sup_fornecedor, suprimentos.sup_material CASCADE"))
        cleanup.dispose()
        command.downgrade(cfg, "base")
        check = create_engine(url)
        with check.connect() as conn:
            assert conn.execute(text("SELECT to_regnamespace('suprimentos') IS NULL")).scalar_one()
        check.dispose()
        with admin.connect() as conn:
            conn.execute(text(f'DROP DATABASE "{dbname}" WITH (FORCE)'))
        admin.dispose()

def grant(engine, user: str, role: str, unit: int = 1):
    with engine.begin() as conn:
        conn.execute(text("""INSERT INTO suprimentos.sup_usuario_papel
           (id,iam_user_id,unidade_id,papel,criado_por,atualizado_por)
           VALUES (:id,:user,:unit,:role,'test','test')"""),
           {"id": uuid7(), "user": user, "unit": unit, "role": role})

def client(user: str):
    app.dependency_overrides[current_actor] = lambda: Actor(user, user)
    return TestClient(app)

def test_schema_seed_and_uuidv7(env):
    engine, _ = env
    with engine.connect() as conn:
        assert conn.execute(text("SELECT count(*) FROM suprimentos.sup_unidade_medida")).scalar_one() == 15
        assert conn.execute(text("SELECT count(*) FROM suprimentos.sup_parametro WHERE a_confirmar")).scalar_one() == 6
        assert conn.execute(text("SELECT count(*) FROM suprimentos.sup_alcada WHERE a_confirmar")).scalar_one() == 2
        assert conn.execute(text("SELECT count(*) FROM suprimentos.sup_material")).scalar_one() == 0
        assert conn.execute(text("SELECT count(*) FROM suprimentos.sup_fornecedor")).scalar_one() == 0
        assert conn.execute(text("SELECT bool_and(habilitado) FROM suprimentos.sup_flag WHERE unidade_id=1")).scalar_one()
    assert uuid7().version == 7

def test_assertion_expiry_and_audience():
    secret = "k" * 40
    signed = sign_assertion("u1", "Usuário", secret, now=100)
    assert decode_assertion(signed, secret, now=101).id == "u1"
    with pytest.raises(Exception):
        decode_assertion(signed, secret, now=122)
    with pytest.raises(Exception):
        decode_assertion(signed, "x" * 40, now=101)

def test_crud_pagination_cnpj_and_soft_deletion(env):
    engine, _ = env
    grant(engine, "admin", "ADMIN")
    c = client("admin")
    assert c.get("/api/suprimentos/health").status_code == 200
    assert c.get("/api/suprimentos/me").json()["unidade"] == "campinas"
    created = c.post("/api/suprimentos/cadastros/centros-custo", json={"codigo": "CC1", "nome": "Produção"})
    assert created.status_code == 201, created.text
    item_id = created.json()["id"]
    assert c.get("/api/suprimentos/cadastros/centros-custo?size=1").json()["total"] >= 1
    assert c.patch(f"/api/suprimentos/cadastros/centros-custo/{item_id}", json={"nome": "Fábrica"}).status_code == 200
    assert c.post(f"/api/suprimentos/cadastros/centros-custo/{item_id}/status", json={"ativo": False}).status_code == 200
    assert c.get("/api/suprimentos/cadastros/centros-custo").json()["total"] == 0
    assert c.delete(f"/api/suprimentos/cadastros/centros-custo/{item_id}").status_code == 405
    assert c.post("/api/suprimentos/cadastros/fornecedores", json={"cnpj": "11111111111111", "razao": "Inválido"}).status_code == 422
    good = c.post("/api/suprimentos/cadastros/fornecedores", json={"cnpj": "11222333000181", "razao": "Exemplo"})
    assert good.status_code == 201, good.text
    assert c.post("/api/suprimentos/cadastros/fornecedores", json={"cnpj": "11222333000181", "razao": "Duplicado"}).status_code == 409

def test_denied_roles_wrong_unit_and_flag(env):
    engine, _ = env
    for role in ("SOLICITANTE", "APROVADOR", "ALMOXARIFE", "COMPRADOR", "QUALIDADE"):
        user = "denied-" + role.lower()
        grant(engine, user, role)
        c = client(user)
        assert c.post("/api/suprimentos/cadastros/flags", json={"fase": "S2", "habilitado": True}).status_code == 403
        assert c.get("/api/suprimentos/cadastros/materiais?unidade=pederneiras").status_code == 403
    c = client("admin")
    with engine.begin() as conn:
        conn.execute(text("UPDATE suprimentos.sup_flag SET habilitado=false WHERE unidade_id=1 AND fase='S0'"))
    assert c.post("/api/suprimentos/cadastros/locais", json={"tipo": "almoxarifado", "nome": "Geral"}).status_code == 403
    with engine.begin() as conn:
        conn.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase='S0'"))

def test_csv_atomic_line_report(env):
    engine, _ = env
    c = client("admin")
    unit = c.get("/api/suprimentos/cadastros/unidades-medida?q=un").json()["items"][0]
    assert unit["sigla"] == "un"
    body = ("codigo,descricao,categoria,un_estoque,dominio,controla_estoque,exige_ca,patrimoniado\n"
            "E1,Exemplo,EPI,un,almoxarifado,true,true,false\n"
            "E2,Erro,EPI,INEXISTENTE,almoxarifado,true,true,false\n")
    res = c.post("/api/suprimentos/cadastros/materiais/importar", files={"arquivo": ("a.csv", io.BytesIO(body.encode()), "text/csv")})
    assert res.status_code == 200 and not res.json()["ok"] and res.json()["gravados"] == 0
    assert [x["ok"] for x in res.json()["linhas"]] == [True, False]
    assert c.get("/api/suprimentos/cadastros/materiais").json()["total"] == 0

"""E2: fluxo real em PostgreSQL descartável, sem mockar banco ou alçada."""
from __future__ import annotations
import io
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "service"))
from suprimentos.auth import sign_assertion
from suprimentos.db import database
from suprimentos.ids import uuid7
from suprimentos.main import app
from suprimentos.api.solicitacoes import close_delivered

ADMIN_URL = os.getenv("SUPRIMENTOS_TEST_ADMIN_URL")
pytestmark = pytest.mark.skipif(not ADMIN_URL, reason="SUPRIMENTOS_TEST_ADMIN_URL ausente")
BASE = "/api/suprimentos"
TEST_KEY = "suprimentos-isolated-test-key-2026-only-0123456789"


class ActorClient:
    def __init__(self, actor):
        self.actor = actor
        self.http = TestClient(app, client=("127.0.0.1", 50100))

    def _send(self, method, path, **kwargs):
        headers = dict(kwargs.pop("headers", {}))
        headers["X-Suprimentos-Assertion"] = sign_assertion(self.actor, self.actor, TEST_KEY)
        return self.http.request(method, path, headers=headers, **kwargs)

    def get(self, path, **kwargs):
        return self._send("GET", path, **kwargs)

    def post(self, path, **kwargs):
        return self._send("POST", path, **kwargs)

    def patch(self, path, **kwargs):
        return self._send("PATCH", path, **kwargs)


class Clients:
    def as_(self, actor):
        return ActorClient(actor)


@pytest.fixture
def api():
    return Clients()


@pytest.fixture(scope="module")
def env(tmp_path_factory):
    dbname = "sup_e2_" + uuid.uuid4().hex[:12]
    admin = create_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        conn.execute(text(f'CREATE DATABASE "{dbname}" ENCODING \'UTF8\' TEMPLATE template0 LC_COLLATE \'C\' LC_CTYPE \'C\''))
    url = ADMIN_URL.rsplit("/", 1)[0] + "/" + dbname
    os.environ.update(SUPRIMENTOS_DATABASE_URL=url, SUPRIMENTOS_EXPECTED_DATABASE=dbname,
                      SUPRIMENTOS_MIGRATION_DATABASE_URL=url, SUPRIMENTOS_ENVIRONMENT="homolog",
                      SUPRIMENTOS_UPLOAD_DIR=str(tmp_path_factory.mktemp("sup-private")),
                      SUPRIMENTOS_GATEWAY_SIGNING_KEY=TEST_KEY)
    cfg = Config(str(ROOT / "migrations" / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "migrations"))
    command.upgrade(cfg, "head")
    database.cache_clear()
    engine, _ = database()
    with engine.begin() as conn:
        cc = uuid7(); cc2 = uuid7()
        conn.execute(text("""INSERT INTO suprimentos.sup_centro_custo(id,unidade_id,codigo,nome,criado_por,atualizado_por)
          VALUES (:id,1,'PROD','Produção','test','test'),(:other,1,'ADM','Administração','test','test')"""), {"id": cc, "other": cc2})
        conn.execute(text("INSERT INTO suprimentos.sup_unidade(id,codigo,nome) VALUES (2,'pederneiras','Pederneiras')"))
        for user, role, role_cc, level, unit in [
            ("sol", "SOLICITANTE", cc, None, 1), ("other", "SOLICITANTE", cc2, None, 1),
            ("apr1", "APROVADOR", cc, 1, 1), ("apr2", "APROVADOR", cc, 2, 1),
            ("wrongcc", "APROVADOR", cc2, 1, 1), ("alm", "ALMOXARIFE", None, None, 1),
            ("buyer", "COMPRADOR", None, None, 1), ("admin", "ADMIN", None, None, 1),
            ("foreign", "ADMIN", None, None, 2)]:
            conn.execute(text("""INSERT INTO suprimentos.sup_usuario_papel
              (id,iam_user_id,unidade_id,papel,cc_id,nivel,criado_por,atualizado_por)
              VALUES (:id,:user,:unit,:role,:cc,:level,'test','test')"""),
              {"id": uuid7(), "user": user, "unit": unit, "role": role, "cc": role_cc, "level": level})
        measure = conn.execute(text("SELECT id FROM suprimentos.sup_unidade_medida WHERE sigla='un'")).scalar_one()
    try:
        yield engine, str(cc), str(cc2), str(measure)
    finally:
        database.cache_clear()
        engine.dispose()
        with admin.connect() as conn:
            conn.execute(text(f'DROP DATABASE "{dbname}" WITH (FORCE)'))
        admin.dispose()


@pytest.fixture(autouse=True)
def isolate_requests(request, env):
    if request.node.name == "test_migration_roundtrip_empty":
        return
    engine = env[0]
    with engine.begin() as conn:
        conn.execute(text("""TRUNCATE suprimentos.sup_aprovacao, suprimentos.sup_solicitacao_foto,
          suprimentos.sup_solicitacao_item, suprimentos.sup_solicitacao,
          suprimentos.sup_numero_solicitacao, suprimentos.sup_evento CASCADE"""))
        conn.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase='S1'"))
        conn.execute(text("DELETE FROM suprimentos.sup_usuario_papel WHERE iam_user_id='admin' AND papel='APROVADOR'"))
        conn.execute(text("UPDATE suprimentos.sup_usuario_papel SET cc_id=:cc WHERE iam_user_id='sol' AND papel='SOLICITANTE'"),
                     {"cc": env[1]})


def draft(api, c, cc, un, *, client_uuid=None, price=None, urgency="NORMAL"):
    body = {"cc_id": cc, "urgencia": urgency, "justificativa": "Peças necessárias para a produção em Campinas",
            "itens": [{"descricao_livre": "Abrasivo especial", "qtd": 1, "un": un}]}
    if client_uuid:
        body["client_uuid"] = client_uuid
    result = c.post(BASE + ("/pwa/solicitacoes" if client_uuid else "/solicitacoes"), json=body)
    assert result.status_code in (200, 201), result.text
    request = result.json()
    if price is not None:
        buyer = api.as_("buyer")
        updated = buyer.post(f"{BASE}/itens/{request['itens'][0]['id']}/preco", json={"preco": price})
        assert updated.status_code == 200, updated.text
    return request


def test_idempotency_and_restrictions(env, api):
    engine, cc, other_cc, un = env
    c = api.as_("sol")
    key = str(uuid7())
    first = draft(api, c, cc, un, client_uuid=key)
    for _ in range(5):
        same = draft(api, c, cc, un, client_uuid=key)
        assert same["id"] == first["id"]
    with engine.connect() as conn:
        assert conn.execute(text("SELECT count(*) FROM suprimentos.sup_solicitacao WHERE client_uuid=:id"), {"id": key}).scalar_one() == 1
    assert c.post(BASE + "/solicitacoes", json={"cc_id": other_cc, "itens": [{"descricao_livre": "X", "qtd": 1, "un": un}]}).status_code == 403
    assert api.as_("other").get(f"{BASE}/solicitacoes/{first['id']}").status_code == 403
    assert api.as_("foreign").get(f"{BASE}/solicitacoes/{first['id']}?unidade=pederneiras").status_code == 403
    assert c.post(f"{BASE}/solicitacoes/{first['id']}/aprovar").status_code == 403
    assert c.post(f"{BASE}/solicitacoes/{first['id']}/cancelar").status_code == 200
    assert c.post(f"{BASE}/solicitacoes/{first['id']}/enviar").status_code == 409


def test_approval_boundary_batch_and_full_flow(env, api):
    engine, cc, _, un = env
    c = api.as_("sol")
    low = draft(api, c, cc, un, price="2500.00")
    high = draft(api, c, cc, un, price="2500.01")
    for request in (low, high):
        sent = c.post(f"{BASE}/solicitacoes/{request['id']}/enviar")
        assert sent.status_code == 200, sent.text
    assert c.get(f"{BASE}/solicitacoes/{low['id']}").json()["niveis_total"] == 1
    assert c.get(f"{BASE}/solicitacoes/{high['id']}").json()["niveis_total"] == 2
    assert api.as_("wrongcc").post(f"{BASE}/solicitacoes/{low['id']}/aprovar").status_code == 403
    assert api.as_("apr2").post(f"{BASE}/solicitacoes/{high['id']}/aprovar").status_code == 403
    batch = api.as_("apr1").post(BASE + "/solicitacoes/aprovar-lote", json={"ids": [low["id"], high["id"], str(uuid7())]})
    assert batch.status_code == 200, batch.text
    assert [x["ok"] for x in batch.json()["resultados"]] == [True, True, False]
    assert api.as_("apr1").post(f"{BASE}/solicitacoes/{high['id']}/aprovar").status_code == 403
    assert api.as_("apr2").post(f"{BASE}/solicitacoes/{high['id']}/aprovar").status_code == 200
    assert api.as_("admin").post(f"{BASE}/solicitacoes/{high['id']}/aprovar").status_code == 403
    alm = api.as_("alm")
    item_id = high["itens"][0]["id"]
    assert alm.post(f"{BASE}/itens/{item_id}/separar").status_code == 200
    assert c.post(f"{BASE}/solicitacoes/{high['id']}/cancelar").status_code == 409
    delivered = alm.post(f"{BASE}/itens/{item_id}/entregar", json={"qtd": "1"})
    assert delivered.status_code == 200, delivered.text
    assert delivered.json()["solicitacao_status"] == "ENTREGUE"
    assert c.post(f"{BASE}/solicitacoes/{high['id']}/confirmar-recebimento").status_code == 200
    assert c.post(f"{BASE}/solicitacoes/{high['id']}/confirmar-recebimento").status_code == 409
    with engine.connect() as conn:
        assert conn.execute(text("SELECT count(*) FROM suprimentos.sup_evento WHERE alvo_id=:id AND alvo_tipo='solicitacao'"), {"id": high["id"]}).scalar_one() >= 5


def test_return_reject_urgency_and_flag(env, api):
    engine, cc, _, un = env
    c = api.as_("sol")
    bad = c.post(BASE + "/solicitacoes", json={"cc_id": cc, "urgencia": "PAROU_PRODUCAO", "justificativa": "curto",
                     "itens": [{"descricao_livre": "X", "qtd": 1, "un": un}]})
    assert bad.status_code == 422
    request = draft(api, c, cc, un, urgency="PAROU_PRODUCAO")
    assert c.post(f"{BASE}/solicitacoes/{request['id']}/enviar").status_code == 200
    assert api.as_("apr1").post(f"{BASE}/solicitacoes/{request['id']}/devolver", json={"comentario": ""}).status_code == 422
    assert api.as_("apr1").post(f"{BASE}/solicitacoes/{request['id']}/devolver", json={"comentario": "Ajuste a especificação"}).status_code == 200
    assert c.patch(f"{BASE}/solicitacoes/{request['id']}", json={"justificativa": "Nova necessidade confirmada na linha"}).status_code == 200
    assert c.post(f"{BASE}/solicitacoes/{request['id']}/enviar").status_code == 200
    assert api.as_("apr1").post(f"{BASE}/solicitacoes/{request['id']}/reprovar", json={"comentario": "Sem demanda"}).status_code == 200
    assert c.post(f"{BASE}/solicitacoes/{request['id']}/enviar").status_code == 409
    with engine.begin() as conn:
        conn.execute(text("UPDATE suprimentos.sup_flag SET habilitado=false WHERE unidade_id=1 AND fase='S1'"))
    assert c.post(BASE + "/solicitacoes", json={"cc_id": cc, "itens": [{"descricao_livre": "X", "qtd": 1, "un": un}]}).status_code == 403
    with engine.begin() as conn:
        conn.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase='S1'"))


def test_cc_null_and_admin_approval_separation(env, api):
    engine, cc, other_cc, un = env
    with engine.begin() as conn:
        conn.execute(text("UPDATE suprimentos.sup_usuario_papel SET cc_id=NULL WHERE iam_user_id='sol'"))
    c = api.as_("sol")
    assert draft(api, c, other_cc, un)["cc_id"] == other_cc
    request = draft(api, c, cc, un)
    assert c.post(f"{BASE}/solicitacoes/{request['id']}/enviar").status_code == 200
    admin = api.as_("admin")
    assert admin.post(f"{BASE}/solicitacoes/{request['id']}/aprovar").status_code == 403
    with engine.begin() as conn:
        conn.execute(text("""INSERT INTO suprimentos.sup_usuario_papel
          (id,iam_user_id,unidade_id,papel,nivel,criado_por,atualizado_por)
          VALUES (:id,'admin',1,'APROVADOR',1,'test','test')"""), {"id": uuid7()})
    assert admin.post(f"{BASE}/solicitacoes/{request['id']}/aprovar").status_code == 200


def test_photos_auto_close(env, api):
    engine, cc, _, un = env
    c = api.as_("sol")
    request = draft(api, c, cc, un)
    oversized = b"\xff\xd8\xff" + b"x" * 2_097_151
    assert c.post(f"{BASE}/solicitacoes/{request['id']}/fotos", files={"arquivo": ("x.jpg", io.BytesIO(oversized), "image/jpeg")}).status_code == 413
    photo = c.post(f"{BASE}/solicitacoes/{request['id']}/fotos", files={"arquivo": ("x.jpg", io.BytesIO(b"\xff\xd8\xffabc"), "image/jpeg")})
    assert photo.status_code == 201, photo.text
    path = f"{BASE}/solicitacoes/{request['id']}/fotos/{photo.json()['id']}"
    assert c.get(path).status_code == 200
    assert api.as_("other").get(path).status_code == 403
    assert api.as_("foreign").get(path + "?unidade=pederneiras").status_code == 403
    assert c.post(f"{BASE}/solicitacoes/{request['id']}/enviar").status_code == 200
    assert api.as_("apr1").post(f"{BASE}/solicitacoes/{request['id']}/aprovar").status_code == 200
    item_id = request["itens"][0]["id"]
    assert api.as_("alm").post(f"{BASE}/itens/{item_id}/separar").status_code == 200
    assert api.as_("alm").post(f"{BASE}/itens/{item_id}/entregar", json={"qtd": 1}).status_code == 200
    with engine.begin() as conn:
        conn.execute(text("UPDATE suprimentos.sup_solicitacao SET entregue_em=:when WHERE id=:id"),
                     {"when": datetime.now(timezone.utc) - timedelta(hours=49), "id": request["id"]})
    with Session(engine) as db:
        assert close_delivered(db) == 1
        assert close_delivered(db) == 0


def test_pwa_photo_replay_and_catalog_isolation(env, api):
    engine, cc, other_cc, un = env
    sol = api.as_("sol")
    request = draft(api, sol, cc, un, client_uuid=str(uuid7()))
    key = str(uuid7())
    path = f"{BASE}/solicitacoes/{request['id']}/fotos"
    content = b"\xff\xd8\xffphoto"
    def upload(payload=content):
        return sol.post(path, data={"client_uuid": key},
                        files={"arquivo": ("foto.jpg", io.BytesIO(payload), "image/jpeg")})
    first = upload()
    assert first.status_code == 201, first.text
    for _ in range(5):
        replay = upload()
        assert replay.status_code == 201 and replay.json()["id"] == first.json()["id"]
    assert upload(b"\xff\xd8\xffdifferent").status_code == 409
    assert sol.post(f"{BASE}/solicitacoes/{request['id']}/enviar").status_code == 200
    assert upload().json()["id"] == first.json()["id"]
    with engine.connect() as conn:
        assert conn.execute(text("SELECT count(*) FROM suprimentos.sup_solicitacao_foto WHERE client_uuid=:key"),
                            {"key": key}).scalar_one() == 1
    assert sol.get(f"{BASE}/pwa/mais-pedidos?cc_id={other_cc}").status_code == 403
    assert {x["id"] for x in sol.get(f"{BASE}/cadastros/centros-custo").json()["items"]} == {cc}
    assert sol.get(f"{BASE}/cadastros/centros-custo/{other_cc}").status_code == 404
    assert api.as_("foreign").get(f"{BASE}/pwa/mais-pedidos?cc_id={cc}&unidade=pederneiras").status_code == 403


def test_partial_delivery_problem_and_item_cancel(env, api):
    _, cc, _, un = env
    c = api.as_("sol")
    body = {"cc_id": cc, "itens": [{"descricao_livre": "Luva", "qtd": 2, "un": un},
                                    {"descricao_livre": "Disco", "qtd": 1, "un": un}]}
    request = c.post(BASE + "/solicitacoes", json=body).json()
    rid = request["id"]
    first, second = (x["id"] for x in request["itens"])
    assert c.post(f"{BASE}/solicitacoes/{rid}/enviar").status_code == 200
    assert api.as_("apr1").post(f"{BASE}/solicitacoes/{rid}/aprovar").status_code == 200
    alm = api.as_("alm")
    assert alm.post(f"{BASE}/itens/{first}/entregar", json={"qtd": 1}).status_code == 409
    assert alm.post(f"{BASE}/itens/{first}/separar").status_code == 200
    partial = alm.post(f"{BASE}/itens/{first}/entregar", json={"qtd": 1})
    assert partial.status_code == 200 and partial.json()["status"] == "SEPARADO"
    assert alm.post(f"{BASE}/itens/{second}/cancelar", json={"comentario": "Sem demanda"}).status_code == 200
    assert alm.post(f"{BASE}/itens/{first}/entregar", json={"qtd": 1}).json()["solicitacao_status"] == "ENTREGUE"
    assert c.post(f"{BASE}/solicitacoes/{rid}/recebi-com-problema", json={"comentario": "Um par veio danificado"}).status_code == 200
    assert alm.post(f"{BASE}/solicitacoes/{rid}/reentregar", json={"comentario": ""}).status_code == 422
    assert alm.post(f"{BASE}/solicitacoes/{rid}/reentregar", json={"comentario": "Troca de item danificado concluída"}).status_code == 200
    assert c.post(f"{BASE}/solicitacoes/{rid}/confirmar-recebimento").status_code == 200


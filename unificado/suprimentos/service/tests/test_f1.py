"""F1 em banco descartável: fornecedor, cotação, OC e entrega simples."""
from __future__ import annotations

import os
import sys
import uuid
from datetime import date, timedelta
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "service"))
from suprimentos.auth import sign_assertion
from suprimentos.db import database
from suprimentos.ids import uuid7
from suprimentos.main import app

ADMIN_URL = os.getenv("SUPRIMENTOS_TEST_ADMIN_URL")
pytestmark = pytest.mark.skipif(not ADMIN_URL, reason="SUPRIMENTOS_TEST_ADMIN_URL ausente")
KEY = "suprimentos-f1-test-signing-key-2026-0123456789"
BASE = "/api/suprimentos"


def cnpj(seed: str) -> str:
    digits = [int(x) for x in seed]
    for weights in ((5,4,3,2,9,8,7,6,5,4,3,2), (6,5,4,3,2,9,8,7,6,5,4,3,2)):
        rem = sum(a*b for a,b in zip(digits,weights)) % 11
        digits.append(0 if rem < 2 else 11-rem)
    return "".join(map(str,digits))


class User:
    def __init__(self, name: str):
        self.name = name
        self.client = TestClient(app, client=("127.0.0.1", 50100))

    def req(self, method: str, path: str, **kwargs):
        headers = dict(kwargs.pop("headers", {}))
        headers["X-Suprimentos-Assertion"] = sign_assertion(self.name, self.name, KEY)
        return self.client.request(method, BASE + path, headers=headers, **kwargs)

    def get(self, path, **kwargs): return self.req("GET", path, **kwargs)
    def post(self, path, **kwargs): return self.req("POST", path, **kwargs)
    def put(self, path, **kwargs): return self.req("PUT", path, **kwargs)


def ok(response, code=200):
    assert response.status_code == code, response.text
    return response.json()


@pytest.fixture
def setup(tmp_path_factory):
    name = "sup_f1_" + uuid.uuid4().hex[:12]
    admin = create_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        conn.execute(text(f'CREATE DATABASE "{name}" ENCODING \'UTF8\' TEMPLATE template0 LC_COLLATE \'C\' LC_CTYPE \'C\''))
    url = ADMIN_URL.rsplit("/", 1)[0] + "/" + name
    os.environ.update(SUPRIMENTOS_DATABASE_URL=url, SUPRIMENTOS_EXPECTED_DATABASE=name,
        SUPRIMENTOS_MIGRATION_DATABASE_URL=url, SUPRIMENTOS_ENVIRONMENT="homolog",
        SUPRIMENTOS_UPLOAD_DIR=str(tmp_path_factory.mktemp("sup-f1-private")),
        SUPRIMENTOS_GATEWAY_SIGNING_KEY=KEY)
    cfg = Config(str(ROOT / "migrations" / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "migrations"))
    command.upgrade(cfg, "head")
    database.cache_clear()
    engine, _ = database()
    with engine.begin() as conn:
        cc = uuid7()
        conn.execute(text("""INSERT INTO suprimentos.sup_centro_custo
          (id,unidade_id,codigo,nome,criado_por,atualizado_por)
          VALUES (:id,1,'F1','Teste F1','test','test')"""), {"id": cc})
        for actor, role, level in (("sol","SOLICITANTE",None),("apr1","APROVADOR",1),
                                    ("apr2","APROVADOR",2),("alm","ALMOXARIFE",None),
                                    ("buyer","COMPRADOR",None),("quality","QUALIDADE",None),
                                    ("foreign","SOLICITANTE",None)):
            conn.execute(text("""INSERT INTO suprimentos.sup_usuario_papel
              (id,iam_user_id,unidade_id,papel,cc_id,nivel,criado_por,atualizado_por)
              VALUES (:id,:actor,1,:role,:cc,:level,'test','test')"""),
              {"id": uuid7(), "actor": actor, "role": role,
               "cc": cc if actor not in {"alm","buyer","quality","foreign"} else None,
               "level": level})
        conn.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase='S3A'"))
        measure = conn.execute(text("SELECT id FROM suprimentos.sup_unidade_medida WHERE sigla='un'")).scalar_one()
    try:
        yield engine, str(cc), str(measure)
    finally:
        database.cache_clear(); engine.dispose()
        with admin.connect() as conn:
            conn.execute(text(f'DROP DATABASE "{name}" WITH (FORCE)'))
        admin.dispose()


def test_purchase_flow(setup):
    engine, cc, measure = setup
    sol, buyer, alm, apr1, quality = map(User, ("sol","buyer","alm","apr1","quality"))
    request = ok(sol.post("/solicitacoes", json={"cc_id": cc,
        "justificativa": "Discos para o acabamento dos postes",
        "itens": [{"descricao_livre": "Disco de corte 7 polegadas", "qtd": 2, "un": measure}]}), 201)
    req_id = request["id"]
    item_id = request["itens"][0]["id"]
    ok(buyer.post(f"/itens/{item_id}/preco", json={"preco": "100"}))
    ok(sol.post(f"/solicitacoes/{req_id}/enviar", json={}))
    ok(apr1.post(f"/solicitacoes/{req_id}/aprovar", json={}))
    assert ok(alm.post(f"/compras/itens/{item_id}/destino", json={"destino": "COMPRA"}))["destino"] == "COMPRA"
    suppliers = []
    for index in range(3):
        created = ok(buyer.post("/compras/fornecedores", json={
            "cnpj": cnpj(f"12345678000{index}"), "razao": f"Fornecedor F1 {index}",
            "categorias": ["ABRASIVO"]}), 201)
        suppliers.append(created["id"])
    quote = ok(buyer.post("/compras/cotacoes", json={"itens": [item_id]}), 201)
    quote_id = quote["id"]
    assert buyer.post(f"/compras/cotacoes/{quote_id}/convidar",
        json={"fornecedor_id": suppliers[0]}).status_code == 200
    assert buyer.post(f"/compras/cotacoes/{quote_id}/propostas", json={
        "item_id": quote["itens"][0]["id"], "fornecedor_id": suppliers[0],
        "preco_unit": "120", "prazo_dias": 3,
        "validade": str(date.today()+timedelta(days=10))}).status_code == 200
    first_offer = buyer.get(f"/compras/cotacoes/{quote_id}").json()["propostas"][0]["id"]
    ok(buyer.post(f"/compras/cotacoes/{quote_id}/propostas/{first_offer}/anexo",
        files={"arquivo":("proposta.pdf",b"%PDF-1.4\n%%EOF","application/pdf")}))
    shown = ok(buyer.get(f"/compras/cotacoes/{quote_id}"))["propostas"][0]
    assert shown["tem_anexo"] and "anexo_path" not in shown
    assert buyer.get(f"/compras/cotacoes/{quote_id}/propostas/{first_offer}/anexo").content.startswith(b"%PDF-")
    assert buyer.post(f"/compras/cotacoes/{quote_id}/escolher", json={
        "proposta_id": buyer.get(f"/compras/cotacoes/{quote_id}").json()["propostas"][0]["id"]}).status_code == 409
    for supplier_id in suppliers:
        ok(quality.post(f"/compras/fornecedores/{supplier_id}/homologar", json={
            "situacao": "HOMOLOGADO", "parecer": "Documentação conferida para o ensaio"}))
        ok(buyer.post(f"/compras/cotacoes/{quote_id}/convidar", json={"fornecedor_id": supplier_id})) if supplier_id != suppliers[0] else None
    for supplier_id, price in zip(suppliers[1:], ("130", "115")):
        ok(buyer.post(f"/compras/cotacoes/{quote_id}/propostas", json={
            "item_id": quote["itens"][0]["id"], "fornecedor_id": supplier_id,
            "preco_unit": price, "prazo_dias": 5,
            "validade": str(date.today()+timedelta(days=10))}))
    offers = ok(buyer.get(f"/compras/cotacoes/{quote_id}"))["propostas"]
    chosen = next(x for x in offers if x["fornecedor_unidade_id"] == suppliers[0])
    assert buyer.post(f"/compras/cotacoes/{quote_id}/escolher",
        json={"proposta_id": chosen["id"]}).status_code == 422
    ok(buyer.post(f"/compras/cotacoes/{quote_id}/escolher", json={
        "proposta_id": chosen["id"], "justificativa": "Prazo menor que o menor preço"}))
    ok(buyer.post(f"/compras/cotacoes/{quote_id}/fechar", json={}))
    orders = ok(buyer.post(f"/compras/cotacoes/{quote_id}/gerar-pedidos", json={}), 201)["pedidos"]
    assert len(orders) == 1 and orders[0]["status"] == "REAPROVACAO"
    order_id = orders[0]["id"]
    listed_orders = ok(buyer.get(f"/compras/cotacoes/{quote_id}"))["pedidos"]
    assert len(listed_orders) == 1 and listed_orders[0]["id"] == order_id
    assert buyer.post(f"/compras/cotacoes/{quote_id}/gerar-pedidos", json={}).status_code == 409
    ok(apr1.post(f"/compras/pedidos/{order_id}/aprovar", json={}))
    ok(buyer.post(f"/compras/pedidos/{order_id}/emitir", json={}))
    assert buyer.get(f"/compras/pedidos/{order_id}/pdf").content.startswith(b"%PDF-")
    assert buyer.post(f"/compras/pedidos/{order_id}/enviar-email", json={}).status_code == 409
    ok(buyer.post(f"/compras/pedidos/{order_id}/enviar", json={}))
    summary = ok(buyer.get("/compras/resumo"))
    assert summary["pedidos_abertos"] >= 1
    item_order = ok(buyer.get(f"/compras/pedidos/{order_id}"))["itens"][0]["id"]
    first = ok(alm.post(f"/compras/pedidos/{order_id}/receber", json={
        "item_id": item_order, "qtd": 1, "numero_nf": "NF-F1-01"}))
    assert first["pedido_status"] == "PARCIAL"
    second = ok(alm.post(f"/compras/pedidos/{order_id}/receber", json={
        "item_id": item_order, "qtd": 1, "numero_nf": "NF-F1-01"}))
    assert second["pedido_status"] == "RECEBIDO" and second["solicitacao_status"] == "ENTREGUE"
    rated = ok(alm.post(f"/compras/fornecedores/{suppliers[0]}/avaliacoes", json={
        "pedido_id": order_id, "prazo": 5, "quantidade": 5, "qualidade": 4,
        "documentacao": 5, "atendimento": 4}), 201)
    assert rated["faixa"] == "A"
    with engine.begin() as conn:
        conn.execute(text("UPDATE suprimentos.sup_parametro SET valor=95 WHERE unidade_id=1 AND chave='iqf_faixa_a'"))
    assert ok(buyer.get(f"/compras/fornecedores/{suppliers[0]}"))["faixa"] == "B"
    with engine.begin() as conn:
        conn.execute(text("UPDATE suprimentos.sup_flag SET habilitado=false WHERE fase='S3A' AND unidade_id=1"))
    assert buyer.get("/compras/cotacoes").status_code == 403


def test_supplier_criteria_emergency_and_low_value_approval(setup):
    engine, cc, measure = setup
    with engine.begin() as conn:
        conn.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase='S3A'"))
    sol, buyer, alm, apr1, quality, foreign = map(User,
        ("sol", "buyer", "alm", "apr1", "quality", "foreign"))
    ok(quality.put("/compras/criterios/EPI", json={"documentos": ["CA"],
        "questionario": {}, "exige_amostra": False}))
    supplier = ok(buyer.post("/compras/fornecedores", json={
        "cnpj": cnpj("234567890001"), "razao": "EPI homologação F1",
        "categorias": ["EPI"]}), 201)
    supplier_id = supplier["id"]
    path = f"/compras/fornecedores/{supplier_id}"
    assert quality.post(path+"/homologar", json={
        "situacao": "HOMOLOGADO", "parecer": "Qualificação completa"}).status_code == 409
    document = ok(buyer.post(path+"/documentos", data={"tipo":"CA",
        "validade":str(date.today()+timedelta(days=31))},
        files={"arquivo":("ca.pdf",b"%PDF-1.4\n%%EOF", "application/pdf")}),201)
    assert foreign.get(path+"/documentos/"+document["id"]).status_code == 403
    ok(quality.post(path+"/homologar", json={
        "situacao": "HOMOLOGADO", "parecer": "CA válido foi conferido"}))

    request = ok(sol.post("/solicitacoes", json={"cc_id": cc,
        "justificativa": "Compra emergencial de abrasivo",
        "itens": [{"descricao_livre": "Abrasivo de teste", "qtd": 1, "un": measure}]}),201)
    req_id, item_id = request["id"], request["itens"][0]["id"]
    ok(buyer.post(f"/itens/{item_id}/preco", json={"preco":"100"}))
    ok(sol.post(f"/solicitacoes/{req_id}/enviar", json={}))
    ok(apr1.post(f"/solicitacoes/{req_id}/aprovar", json={}))
    ok(alm.post(f"/compras/itens/{item_id}/destino",json={"destino":"COMPRA"}))
    unqualified = ok(buyer.post("/compras/fornecedores", json={
        "cnpj": cnpj("345678900001"), "razao":"Fornecedor emergencial F1",
        "categorias":["ABRASIVO"]}),201)
    quote = ok(buyer.post("/compras/cotacoes",json={"itens":[item_id]}),201)
    quote_id = quote["id"]
    ok(buyer.post(f"/compras/cotacoes/{quote_id}/convidar",json={
        "fornecedor_id":unqualified["id"]}))
    offer = ok(buyer.post(f"/compras/cotacoes/{quote_id}/propostas",json={
        "item_id":quote["itens"][0]["id"],"fornecedor_id":unqualified["id"],
        "preco_unit":"100","prazo_dias":1,
        "validade":str(date.today()+timedelta(days=7))}))
    assert buyer.post(f"/compras/cotacoes/{quote_id}/escolher",json={
        "proposta_id":offer["id"]}).status_code == 409
    assert buyer.post(f"/compras/cotacoes/{quote_id}/excecao-fornecedor",json={
        "fornecedor_id":unqualified["id"],"parecer":"Aprovação emergencial documentada pela Qualidade"}).status_code == 403
    ok(quality.post(f"/compras/cotacoes/{quote_id}/excecao-fornecedor",json={
        "fornecedor_id":unqualified["id"],"parecer":"Aprovação emergencial documentada pela Qualidade"}))
    ok(buyer.post(f"/compras/cotacoes/{quote_id}/escolher",json={"proposta_id":offer["id"]}))
    assert buyer.post(f"/compras/cotacoes/{quote_id}/fechar",json={}).status_code == 422
    closed = ok(buyer.post(f"/compras/cotacoes/{quote_id}/fechar",json={
        "justificativa":"Só este fornecedor consegue entregar no prazo"}))
    assert closed["status"] == "PENDENTE_APROVACAO"
    assert buyer.post(f"/compras/cotacoes/{quote_id}/aprovar-fechamento",json={}).status_code == 403
    ok(apr1.post(f"/compras/cotacoes/{quote_id}/aprovar-fechamento",json={}))
    result = ok(buyer.post(f"/compras/cotacoes/{quote_id}/gerar-pedidos",json={}),201)
    order_id = result["pedidos"][0]["id"]
    assert result["pedidos"][0]["status"] == "RASCUNHO"
    ok(buyer.post(f"/compras/pedidos/{order_id}/emitir",json={}))


def test_invite_filters_material_category(setup):
    _, cc, measure = setup
    sol, buyer, alm, apr1, quality = map(User, ("sol", "buyer", "alm", "apr1", "quality"))
    material = ok(buyer.post("/cadastros/materiais", json={
        "codigo": "F1-ABR-01", "descricao": "Disco para categoria", "categoria": "ABRASIVO",
        "un_estoque": measure, "dominio": "almoxarifado"}), 201)
    request = ok(sol.post("/solicitacoes", json={"cc_id": cc,
        "itens": [{"material_id": material["id"], "qtd": 1, "un": measure}]}), 201)
    item_id = request["itens"][0]["id"]
    ok(buyer.post(f"/itens/{item_id}/preco", json={"preco": "50"}))
    ok(sol.post(f"/solicitacoes/{request['id']}/enviar", json={}))
    ok(apr1.post(f"/solicitacoes/{request['id']}/aprovar", json={}))
    ok(alm.post(f"/compras/itens/{item_id}/destino", json={"destino": "COMPRA"}))
    quote = ok(buyer.post("/compras/cotacoes", json={"itens": [item_id]}), 201)
    assert quote["itens"][0]["categoria"] == "ABRASIVO"
    wrong = ok(buyer.post("/compras/fornecedores", json={
        "cnpj": cnpj("123456780008"), "razao": "Fornecedor EPI", "categorias": ["EPI"]}), 201)
    right = ok(buyer.post("/compras/fornecedores", json={
        "cnpj": cnpj("123456780009"), "razao": "Fornecedor Abrasivo", "categorias": ["ABRASIVO"]}), 201)
    for supplier_id in (wrong["id"], right["id"]):
        ok(quality.post(f"/compras/fornecedores/{supplier_id}/homologar", json={
            "situacao": "HOMOLOGADO", "parecer": "Cadastro e documentos conferidos"}))
    assert buyer.post(f"/compras/cotacoes/{quote['id']}/convidar", json={
        "fornecedor_id": wrong["id"]}).status_code == 409
    ok(buyer.post(f"/compras/cotacoes/{quote['id']}/convidar", json={
        "fornecedor_id": right["id"]}))


def test_cost_with_cif_fob_and_allocation():
    from suprimentos.api.compras import offer_cost
    from decimal import Decimal
    q=Decimal("3")
    assert offer_cost(q,Decimal("10"),Decimal("2"),Decimal("1"),Decimal("1"),
                      "CIF",Decimal("99"),"TOTAL") == Decimal("32.00")
    assert offer_cost(q,Decimal("10"),Decimal("2"),Decimal("1"),Decimal("1"),
                      "FOB",Decimal("5"),"TOTAL") == Decimal("37.00")
    assert offer_cost(q,Decimal("10"),Decimal("2"),Decimal("1"),Decimal("1"),
                      "FOB",Decimal("5"),"UNIDADE") == Decimal("47.00")


def test_three_proposals_threshold_and_two_level_close(setup):
    _engine, cc, measure = setup
    sol,buyer,alm,apr1,apr2,quality=map(User,
        ("sol","buyer","alm","apr1","apr2","quality"))
    request=ok(sol.post("/solicitacoes",json={"cc_id":cc,
        "justificativa":"DEMO teste da alçada da cotação",
        "itens":[{"descricao_livre":"Abrasivo especial","qtd":1,"un":measure}]}),201)
    rid,item=request["id"],request["itens"][0]["id"]
    ok(buyer.post(f"/itens/{item}/preco",json={"preco":"3000"}))
    ok(sol.post(f"/solicitacoes/{rid}/enviar",json={}))
    ok(apr1.post(f"/solicitacoes/{rid}/aprovar",json={}))
    ok(apr2.post(f"/solicitacoes/{rid}/aprovar",json={}))
    ok(alm.post(f"/compras/itens/{item}/destino",json={"destino":"COMPRA"}))
    supplier=ok(buyer.post("/compras/fornecedores",json={
        "cnpj":cnpj("567890000001"),"razao":"Fornecedor teste da alçada",
        "categorias":["ABRASIVO"]}),201)
    ok(quality.post(f"/compras/fornecedores/{supplier['id']}/homologar",json={
        "situacao":"HOMOLOGADO","parecer":"Aprovado para teste de alçada"}))
    q=ok(buyer.post("/compras/cotacoes",json={"itens":[item]}),201)
    qid=q["id"]
    ok(buyer.post(f"/compras/cotacoes/{qid}/convidar",json={"fornecedor_id":supplier["id"]}))
    payload={"item_id":q["itens"][0]["id"],"fornecedor_id":supplier["id"],
        "preco_unit":"2000","prazo_dias":2,"validade":str(date.today()+timedelta(days=7))}
    offer=ok(buyer.post(f"/compras/cotacoes/{qid}/propostas",json=payload))
    ok(buyer.post(f"/compras/cotacoes/{qid}/escolher",json={"proposta_id":offer["id"]}))
    assert buyer.post(f"/compras/cotacoes/{qid}/fechar",json={
        "justificativa":"Único fornecedor para entrega imediata"}).status_code==409
    payload["preco_unit"]="900"
    ok(buyer.post(f"/compras/cotacoes/{qid}/propostas",json=payload))
    result=ok(buyer.post(f"/compras/cotacoes/{qid}/fechar",json={
        "justificativa":"Único fornecedor para entrega imediata"}))
    assert result["status"]=="PENDENTE_APROVACAO" and result["niveis_exigidos"]==2
    first=ok(apr1.post(f"/compras/cotacoes/{qid}/aprovar-fechamento",json={}))
    assert first["status"]=="PENDENTE_APROVACAO" and first["nivel_aprovado"]==1
    assert apr1.post(f"/compras/cotacoes/{qid}/aprovar-fechamento",json={}).status_code==403
    second=ok(apr2.post(f"/compras/cotacoes/{qid}/aprovar-fechamento",json={}))
    assert second["status"]=="FECHADA" and second["nivel_aprovado"]==2

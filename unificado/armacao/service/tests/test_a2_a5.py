"""Real PostgreSQL integration for the first five Armação stages.

Run against a disposable local clone with ARMACAO_DATABASE_URL; never production.
"""
from __future__ import annotations

import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

from armacao.auth import Actor, Context, context, get_actor
from armacao.main import app


@pytest.fixture(scope="module")
def client():
    url=os.environ.get("ARMACAO_DATABASE_URL","")
    if "127.0.0.1:55439/armacao_test" not in url:
        pytest.skip("Set ARMACAO_DATABASE_URL to the disposable local armacao_test DB")
    actor=Actor("alex","Alex",frozenset({"armacao.corte","armacao.banca",
                "armacao.supervisor","armacao.consulta","armacao.cadastros"}),
                frozenset({"campinas","pederneiras","ribeirao","noroeste"}),True)
    def fake_context(): return Context(actor,1,"campinas","CAM",.03)
    app.dependency_overrides[context]=fake_context
    app.dependency_overrides[get_actor]=lambda:actor
    engine=create_engine(url)
    with engine.begin() as conn:
        conn.execute(text("UPDATE armacao.aco_produto_unidade SET ativo=true WHERE produto_codigo IN (3,11408)"))
    with TestClient(app,base_url="http://localhost:5173") as client:
        client.headers.update({"Origin":"http://localhost:5173","X-Unidade":"campinas"})
        yield client
    app.dependency_overrides.clear()
    engine.dispose()


def ok(response, status=200):
    assert response.status_code==status,response.text
    return response.json()


def test_cadastros_rolo_corte_etiqueta_banca(client):
    suffix=uuid.uuid4().hex[:8]
    printer=ok(client.post("/api/armacao/cadastros/impressoras",json={
        "nome":"Teste-"+suffix,"linguagem":"PDF","conexao":"NAVEGADOR",
        "porta":9100,"largura_mm":100,"altura_mm":60,"ativa":True}),201)["id"]
    assert client.get(f"/api/armacao/cadastros/impressoras/{printer}/teste").content.startswith(b"%PDF")
    machine=ok(client.post("/api/armacao/cadastros/maquinas",json={
        "nome":"Desbob-"+suffix,"tipo":"DESBOBINADEIRA","impressora_id":printer,"ativa":True}),201)["id"]
    bank1=ok(client.post("/api/armacao/cadastros/bancas",json={
        "nome":"Banca-1-"+suffix,"setor":"1","ativa":True}),201)["id"]
    bank2=ok(client.post("/api/armacao/cadastros/bancas",json={
        "nome":"Banca-2-"+suffix,"setor":"1","ativa":True}),201)["id"]
    coil=ok(client.post("/api/armacao/bobinas",json={
        "produto_mp_codigo":3,"fornecedor":"Usina teste","peso_liquido_kg":1000,
        "corrida":"COR-TESTE-"+suffix}),201)["id"]
    ok(client.post(f"/api/armacao/maquinas/{machine}/montar-bobina",json={"bobina_id":coil}))
    available=ok(client.get(f"/api/armacao/maquinas/{machine}/produtos-disponiveis"))
    assert 11408 in [p["codigo"] for p in available]
    first=ok(client.post("/api/armacao/lotes-corte",json={
        "maquina_id":machine,"produto_codigo":11408,"qtd_barras":10}),201)
    second=ok(client.post("/api/armacao/lotes-corte",json={
        "maquina_id":machine,"produto_codigo":11408,"qtd_barras":5}),201)
    assert first["codigo"]!=second["codigo"]
    assert float(first["peso_kg"])==58
    assert first["qrcode"]=="CFAC1|"+first["codigo"]
    printed=ok(client.post(f"/api/armacao/lotes-corte/{first['codigo']}/imprimir",json={}))
    assert printed["via"]==1
    pdf=client.get(f"/api/armacao/impressoes/{printed['id']}/pdf")
    assert pdf.status_code==200 and pdf.content.startswith(b"%PDF")
    assert client.post(f"/api/armacao/lotes-corte/{first['codigo']}/imprimir",json={}).status_code==422
    assert ok(client.post(f"/api/armacao/lotes-corte/{first['codigo']}/imprimir",
                          json={"motivo":"Etiqueta danificada"}))["via"]==2
    qr=first["qrcode"]
    assert ok(client.post(f"/api/armacao/bancas/{bank1}/entradas",json={"qr":qr}))["resultado"]=="ENTROU"
    assert ok(client.post(f"/api/armacao/bancas/{bank1}/entradas",json={"qr":qr}))["resultado"]=="JA_NA_BANCA"
    conflict=client.post(f"/api/armacao/bancas/{bank2}/entradas",json={"qr":qr})
    assert conflict.status_code==409 and conflict.json()["detail"]["resultado"]=="TRANSFERIR"
    assert ok(client.post(f"/api/armacao/bancas/{bank2}/transferir",json={
        "qr":qr,"confirmar":True}))["resultado"]=="TRANSFERIDO"
    assert [row["codigo"] for row in ok(client.get(f"/api/armacao/bancas/{bank2}/feixes"))]==[first["codigo"]]
    assert client.post(f"/api/armacao/lotes-corte/{first['codigo']}/cancelar",
                       json={"motivo":"Teste de cancelamento"}).status_code==200
    assert client.post(f"/api/armacao/bancas/{bank1}/entradas",json={"qr":qr}).status_code==409
    # A cancelled bundle ceases to occupy the active bench.
    assert ok(client.get(f"/api/armacao/bancas/{bank2}/feixes"))==[]
    # The second cut remains available for later stages.
    assert ok(client.get(f"/api/armacao/lotes-corte/{second['codigo']}"))["status"]=="CORTADO"
    from armacao.auth import Context
    original=app.dependency_overrides[context]
    app.dependency_overrides[context]=lambda:Context(original().actor,2,"pederneiras","PED",.03)
    try:
        assert client.post(f"/api/armacao/bancas/{bank1}/entradas",json={"qr":second["qrcode"]}).status_code==404
        assert client.get(f"/api/armacao/lotes-corte/{second['codigo']}").status_code==404
    finally:
        app.dependency_overrides[context]=original


def test_ocr_parser():
    from armacao.ocr import parse_label
    fields=parse_label("FORNECEDOR: Aco Brasil\nCA 50 BITOLA: 12,5 mm\nCORRIDA: X123\nLOTE: L54\nPESO LIQUIDO: 998,5 kg NBR 7480")
    assert fields["classe"]["valor"]=="CA50"
    assert fields["bitola_mm"]["valor"]=="12.5"
    assert fields["corrida"]["valor"]=="X123"
    assert fields["peso_liquido_kg"]["valor"]=="998.5"


def test_qr_round_trip_and_supervisor_scope():
    import cv2
    import numpy as np
    import qrcode
    from armacao.auth import Actor, Context, need
    from fastapi import HTTPException
    payload="CFAC1|LC-CAM-261029-0001"
    image=np.array(qrcode.make(payload).convert("RGB"))
    decoded,_,_=cv2.QRCodeDetector().detectAndDecode(image)
    assert decoded==payload
    supervisor=Actor("sup","Supervisor",frozenset({"armacao.supervisor"}),frozenset({"campinas"}))
    ctx=Context(supervisor,1,"campinas","CAM",.03)
    need(ctx,"armacao.corte",write=True)
    need(ctx,"armacao.banca",write=True)
    with pytest.raises(HTTPException): need(ctx,"armacao.cadastros",write=True)


def test_operator_can_read_operational_lists_but_not_edit(client):
    actor=Actor("operator","Operador",frozenset({"armacao.corte"}),frozenset({"campinas"}))
    original=app.dependency_overrides[context]
    app.dependency_overrides[context]=lambda:Context(actor,1,"campinas","CAM",.03)
    try:
        assert client.get("/api/armacao/cadastros/maquinas").status_code==200
        assert client.get("/api/armacao/cadastros/produtos").status_code==200
        assert client.get("/api/armacao/cadastros/impressoras").status_code==403
        assert client.post("/api/armacao/cadastros/maquinas",json={
            "nome":"SemPermissao","tipo":"CORTE"}).status_code==403
    finally:
        app.dependency_overrides[context]=original


def test_photo_ocr_confirmation_private_storage(client, monkeypatch, tmp_path):
    from io import BytesIO
    from PIL import Image
    from armacao import bobinas
    from armacao.ocr import OcrResult, parse_label
    monkeypatch.setenv("ARMACAO_PRIVATE_STORAGE",str(tmp_path))
    raw="FORNECEDOR: Aco Brasil\nCA50 BITOLA: 12,5 MM\nCORRIDA: ABC123\nPESO LIQUIDO: 500 KG"
    monkeypatch.setattr(bobinas.TesseractOcrProvider,"read",
                        lambda self,path:OcrResult(raw,parse_label(raw),.92))
    buffer=BytesIO();Image.new("RGB",(50,50),"white").save(buffer,format="JPEG")
    parsed=ok(client.post("/api/armacao/bobinas/ocr",files={"foto":("rolo.jpg",buffer.getvalue(),"image/jpeg")}))
    assert parsed["produto_mp_codigo_sugerido"]==3
    assert parsed["campos"]["corrida"]["valor"]=="ABC123"
    saved=ok(client.post("/api/armacao/bobinas",json={
        "produto_mp_codigo":3,"fornecedor":"Aco Brasil","corrida":"ABC123",
        "peso_liquido_kg":500,"foto_token":parsed["foto_token"],
        "ocr_json":{"texto":parsed["texto_bruto"],"campos":parsed["campos"]},
        "ocr_confianca":parsed["confianca"]}),201)
    photo=client.get(f"/api/armacao/bobinas/{saved['id']}/foto")
    assert photo.status_code==200 and photo.content.startswith(b"\xff\xd8")
    assert client.post("/api/armacao/bobinas/ocr",files={"foto":("bad.txt",b"hello","text/plain")}).status_code==422


def test_a6_fifo_shortage_and_correction(client):
    suffix=uuid.uuid4().hex[:8]
    engine=create_engine(os.environ["ARMACAO_DATABASE_URL"])
    with engine.begin() as conn:
        model=conn.execute(text("""INSERT INTO armacao.modelo_poste_ref
          (unidade_id,fonte,origem_id,codigo,descricao)
          VALUES (1,'CAMPINAS_PCP',:origin,:code,'Poste teste') RETURNING id"""),
          {"origin":int(suffix,16),"code":suffix}).scalar_one()
    engine.dispose()
    ok(client.post("/api/armacao/cadastros/bom",json={"modelo_poste_id":model,
      "produto_codigo":11408,"posicao":"N1","barras_por_armadura":3,
      "vigente_desde":"2026-10-01"}),201)
    machine=ok(client.post("/api/armacao/cadastros/maquinas",json={
      "nome":"A6-"+suffix,"tipo":"DESBOBINADEIRA","ativa":True}),201)["id"]
    bank=ok(client.post("/api/armacao/cadastros/bancas",json={
      "nome":"A6-B-"+suffix,"ativa":True}),201)["id"]
    coil=ok(client.post("/api/armacao/bobinas",json={
      "produto_mp_codigo":3,"fornecedor":"Teste A6","peso_liquido_kg":500}),201)["id"]
    ok(client.post(f"/api/armacao/maquinas/{machine}/montar-bobina",json={"bobina_id":coil}))
    cuts=[]
    for _ in range(2):
        cut=ok(client.post("/api/armacao/lotes-corte",json={
          "maquina_id":machine,"produto_codigo":11408,"qtd_barras":4}),201)
        cuts.append(cut["codigo"])
        ok(client.post(f"/api/armacao/bancas/{bank}/entradas",json={"qr":cut["qrcode"]}))
    base={"data":"2026-10-29","modelos":[{"modelo_poste_id":model,"qtd_armaduras":3}],
          "requisicao_id":str(uuid.uuid4())}
    blocked=client.post(f"/api/armacao/bancas/{bank}/fechamento",json=base)
    assert blocked.status_code==409 and blocked.json()["detail"]["faltam_barras"]==1
    base["ajustes"]=[{"modelo_poste_id":model,"produto_codigo":11408,
                      "motivo":"Barras extras registradas em papel"}]
    closed=ok(client.post(f"/api/armacao/bancas/{bank}/fechamento",json=base),201)
    assert len(closed["lotes"])==1
    repeated=ok(client.post(f"/api/armacao/bancas/{bank}/fechamento",json=base),201)
    assert repeated["repetida"] and repeated["lotes"][0]["codigo"]==closed["lotes"][0]["codigo"]
    trace=ok(client.get("/api/armacao/rastreio",params={"q":closed["lotes"][0]["codigo"]}))
    assert trace["total"]==2 and {row["feixe_codigo"] for row in trace["registros"]}==set(cuts)
    assert client.get("/api/armacao/relatorios/feixes-abertos").status_code==200
    assert client.get("/api/armacao/relatorios/saldo-rolos").status_code==200
    assert client.get("/api/armacao/supervisor").status_code==200
    apont=closed["lotes"][0]["apontamento_id"]
    with create_engine(os.environ["ARMACAO_DATABASE_URL"]).connect() as conn:
        consumed=conn.execute(text("""SELECT l.codigo,c.barras_baixadas
          FROM armacao.armacao_consumo c JOIN armacao.aco_lote_corte l ON l.id=c.lote_corte_id
          WHERE c.apontamento_id=:id ORDER BY c.id"""),{"id":apont}).all()
        assert consumed==[(cuts[0],4),(cuts[1],4)]
        missing=conn.execute(text("SELECT barras_faltantes FROM armacao.armacao_ajuste WHERE apontamento_id=:id"),
                             {"id":apont}).scalar_one()
        assert missing==1
    corrected=ok(client.post(f"/api/armacao/apontamentos/{apont}/corrigir",json={
      "motivo":"Contagem física revisada","qtd_armaduras":2}))
    assert corrected["status"]=="CORRIGIDO"
    with create_engine(os.environ["ARMACAO_DATABASE_URL"]).connect() as conn:
        consumed=conn.execute(text("""SELECT l.codigo,c.barras_baixadas
          FROM armacao.armacao_consumo c JOIN armacao.aco_lote_corte l ON l.id=c.lote_corte_id
          WHERE c.apontamento_id=:id ORDER BY c.id"""),{"id":apont}).all()
        assert consumed==[(cuts[0],4),(cuts[1],2)]
        assert conn.execute(text("SELECT count(*) FROM armacao.armacao_ajuste WHERE apontamento_id=:id"),
                            {"id":apont}).scalar_one()==0

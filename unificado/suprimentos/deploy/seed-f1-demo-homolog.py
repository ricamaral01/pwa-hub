"""Exemplo DEMO-F1 em :18446, com IDs registrados para a remoção na F6.

Usa as sessões efêmeras protegidas criadas pelo smoke. Não lê produção.
"""
from __future__ import annotations
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path
import requests

ROOT="https://concrefer.concretrack.com.br:18446"
OUTPUT=Path(sys.argv[2])
assert "/homolog-next/backups/suprimentos-f1-" in str(OUTPUT)
if OUTPUT.exists():
    raise SystemExit("Exemplo já criado; consulte o JSON de IDs")
tokens=json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
def session(actor):
    client=requests.Session()
    client.cookies.set("mapa_unificado_homolog_session",tokens[actor],
        domain="concrefer.concretrack.com.br",path="/unificado/")
    response=client.post(ROOT+"/unificado/mapa/api/unified/suprimentos-bootstrap",timeout=20)
    assert response.status_code==200,(actor,response.status_code)
    return client
def call(client,method,path,expected=200,**kwargs):
    response=client.request(method,ROOT+"/api/suprimentos"+path,timeout=20,**kwargs)
    if response.status_code!=expected:
        raise RuntimeError(f"{method} {path} HTTP {response.status_code}: {response.text[:250]}")
    return response.json()
def cnpj(seed):
    digits=[int(x) for x in seed]
    for w in ((5,4,3,2,9,8,7,6,5,4,3,2),(6,5,4,3,2,9,8,7,6,5,4,3,2)):
        rem=sum(x*y for x,y in zip(digits,w))%11
        digits.append(0 if rem<2 else 11-rem)
    return ''.join(map(str,digits))

sol=session("e2e-suprimentos-sol")
buyer=session("e2e-suprimentos-compras")
alm=session("e2e-suprimentos-almox")
apr=session("e2e-suprimentos-aprov1")
quality=session("e2e-suprimentos-qualidade")
centers=call(sol,"GET","/cadastros/centros-custo")["items"]
cc=next(x["id"] for x in centers if x["codigo"]=="E2E-SUP")
measure=next(x["id"] for x in call(sol,"GET","/cadastros/unidades-medida")["items"] if x["sigla"]=="un")
created=call(sol,"POST","/solicitacoes",201,json={"cc_id":cc,
    "justificativa":"DEMO-F1 cotação comparativa e pedido para teste visual",
    "itens":[{"descricao_livre":"DEMO-F1 disco de corte 7 pol.","qtd":1,"un":measure}]})
rid=created["id"]; item=created["itens"][0]["id"]
call(buyer,"POST",f"/itens/{item}/preco",json={"preco":"100"})
call(sol,"POST",f"/solicitacoes/{rid}/enviar",json={})
call(apr,"POST",f"/solicitacoes/{rid}/aprovar",json={})
call(alm,"POST",f"/compras/itens/{item}/destino",json={"destino":"COMPRA"})
suppliers=[]
for idx,price in enumerate(("105","101","98")):
    supplier=call(buyer,"POST","/compras/fornecedores",201,json={
        "cnpj":cnpj(f"4567890000{idx:02d}"),"razao":f"DEMO-F1 Fornecedor {idx+1}",
        "fantasia":f"DEMO F1 {idx+1}","categorias":["ABRASIVO"],
        "email_pedido":"demo@example.invalid","frete_padrao":"CIF",
        "condicao_pagamento":"30 dias"})
    suppliers.append(supplier["id"])
    call(quality,"POST",f"/compras/fornecedores/{supplier['id']}/homologar",json={
        "situacao":"HOMOLOGADO","parecer":"DEMO-F1 verificação simulada para teste visual"})
quote=call(buyer,"POST","/compras/cotacoes",201,json={"itens":[item]})
qid=quote["id"]; qitem=quote["itens"][0]["id"]
for supplier_id,price in zip(suppliers,("105","101","98")):
    call(buyer,"POST",f"/compras/cotacoes/{qid}/convidar",json={"fornecedor_id":supplier_id})
    call(buyer,"POST",f"/compras/cotacoes/{qid}/propostas",json={
        "item_id":qitem,"fornecedor_id":supplier_id,"preco_unit":price,"prazo_dias":3,
        "validade":str(date.today()+timedelta(days=30)),"pagamento":"30 dias"})
offers=call(buyer,"GET",f"/compras/cotacoes/{qid}")["propostas"]
selected=next(x["id"] for x in offers if x["fornecedor_unidade_id"]==suppliers[-1])
call(buyer,"POST",f"/compras/cotacoes/{qid}/escolher",json={"proposta_id":selected})
call(buyer,"POST",f"/compras/cotacoes/{qid}/fechar",json={})
orders=call(buyer,"POST",f"/compras/cotacoes/{qid}/gerar-pedidos",201,json={})["pedidos"]
oid=orders[0]["id"]
call(buyer,"POST",f"/compras/pedidos/{oid}/emitir",json={})
call(buyer,"POST",f"/compras/pedidos/{oid}/enviar",json={})
pdf=buyer.get(ROOT+f"/api/suprimentos/compras/pedidos/{oid}/pdf",timeout=20)
assert pdf.status_code==200 and pdf.content.startswith(b"%PDF-")
pdf_path=OUTPUT.with_suffix(".pdf")
pdf_path.write_bytes(pdf.content);pdf_path.chmod(0o600)
OUTPUT.write_text(json.dumps({"solicitacao":rid,"item":item,"fornecedores":suppliers,
    "cotacao":qid,"pedido":oid,"pdf":str(pdf_path)},indent=2),encoding="utf-8")
OUTPUT.chmod(0o600)
print("DEMO_F1_OK pedido="+orders[0]["numero"])

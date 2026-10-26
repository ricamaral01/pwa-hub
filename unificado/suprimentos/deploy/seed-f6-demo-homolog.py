"""Massa DEMO removível para o manual F6, exclusivamente em homologação.

Uso: wrapper protegido manual-demo-run-homolog.sh seed-f6-demo-homolog.py MANIFEST.
O manifesto é salvo após cada criação, em backup 0700 fora de public.
"""
from __future__ import annotations

import importlib.util
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path
from uuid import uuid4

import psycopg

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("manual_demo", HERE / "manual-demo-homolog.py")
demo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(demo)
demo.ACTORS["quality"] = ("e2e-suprimentos-qualidade", "Qualidade Demo")
api = demo.api

F1 = {"fornecedores": ["01a1758f-75bd-7939-aa2c-d82bcbaf167c",
                       "01a1758f-7636-707c-a0fb-f0ce41bc1b38",
                       "01a1758f-769c-703c-a717-70ca9bba7b2b"],
      "pedido": "01a1758f-7906-7e45-9eba-991dd64bad66"}


def save(path, state):
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    path.chmod(0o600)


def create_order(state, path, label, cc, unit, suppliers, received=False):
    if label in state["orders"]:
        return state["orders"][label]
    request = api("sol", "POST", "/solicitacoes", {
        "cc_id": cc, "justificativa": "DEMO-F6: exemplo de pedido de compra para treinamento.",
        "itens": [{"descricao_livre": f"DEMO-F6 {label} material de manutenção", "qtd": 1, "un": unit}]})
    rid, item = request["id"], request["itens"][0]["id"]
    state["requests"][label] = rid
    save(path, state)
    api("buyer", "POST", f"/itens/{item}/preco", {"preco": "100"})
    api("sol", "POST", f"/solicitacoes/{rid}/enviar", {})
    api("apr1", "POST", f"/solicitacoes/{rid}/aprovar", {})
    api("almox", "POST", f"/compras/itens/{item}/destino", {"destino": "COMPRA"})
    quote = api("buyer", "POST", "/compras/cotacoes", {"itens": [item]})
    qid, qi = quote["id"], quote["itens"][0]["id"]
    state["quotes"][label] = qid
    save(path, state)
    for supplier, price in zip(suppliers, ("110", "105", "100")):
        api("buyer", "POST", f"/compras/cotacoes/{qid}/convidar", {"fornecedor_id": supplier})
        api("buyer", "POST", f"/compras/cotacoes/{qid}/propostas", {
            "item_id": qi, "fornecedor_id": supplier, "preco_unit": price, "prazo_dias": 3,
            "validade": str(date.today()+timedelta(days=30)), "pagamento": "30 dias"})
    offers = api("buyer", "GET", f"/compras/cotacoes/{qid}")["propostas"]
    selected = next(row["id"] for row in offers if row["fornecedor_unidade_id"] == suppliers[-1])
    api("buyer", "POST", f"/compras/cotacoes/{qid}/escolher", {"proposta_id": selected})
    api("buyer", "POST", f"/compras/cotacoes/{qid}/fechar", {})
    order = api("buyer", "POST", f"/compras/cotacoes/{qid}/gerar-pedidos", {})["pedidos"][0]
    oid = order["id"]
    state["orders"][label] = oid
    save(path, state)
    api("buyer", "POST", f"/compras/pedidos/{oid}/emitir", {})
    api("buyer", "POST", f"/compras/pedidos/{oid}/enviar", {})
    if received:
        receipt = api("almox", "POST", "/recebimentos", {
            "pedido_id": oid, "numero_nf": "DEMO-F6-NF-RECEBIDA"})
        state["receipts"][label] = receipt["id"]
        save(path, state)
        rec_item = receipt["itens"][0]
        api("almox", "PUT", f"/recebimentos/{receipt['id']}/itens/{rec_item['id']}", {
            "qtd_nf": 1, "qtd_contada": 1, "preco_nf": 100,
            "embalagem_ok": True, "quantidade_ok": True})
        api("almox", "POST", f"/recebimentos/{receipt['id']}/conferir", {"confirmo_campos_nf": True})
        api("quality", "POST", f"/recebimentos/{receipt['id']}/inspecionar", {
            "itens": [{"item_id": rec_item["id"], "decisao": "LIBERADO"}]})
        api("almox", "POST", f"/recebimentos/{receipt['id']}/confirmar", {})
    return oid


def main(path):
    dsn = demo.check_stage(path)
    state = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {
        "prefix": "DEMO-F6-20261026", "fornecedores": [], "requests": {}, "quotes": {},
        "orders": {}, "receipts": {}, "stock_request": None, "epi": None, "inventory": None}
    save(path, state)
    suppliers = F1["fornecedores"]
    if not state["fornecedores"]:
        fourth = api("buyer", "POST", "/compras/fornecedores", {
            "cnpj": "45678900000392", "razao": "DEMO-F6 Fornecedor em qualificação",
            "fantasia": "DEMO F6", "categorias": ["ABRASIVO"]})
        state["fornecedores"].append(fourth["id"])
        save(path, state)
        for supplier, scores in zip(suppliers[:2], ((5,5,5,5,5),(3,4,3,4,3))):
            api("almox", "POST", f"/compras/fornecedores/{supplier}/avaliacoes", dict(zip(
                ("prazo","quantidade","qualidade","documentacao","atendimento"),scores)) |
                {"comentario": "DEMO-F6 avaliação de treinamento"})
    centers = api("sol", "GET", "/cadastros/centros-custo?size=100")["items"]
    cc = next(row["id"] for row in centers if row["codigo"] == "DEMO-MANUAL-20261025")
    unit = next(row["id"] for row in api("sol", "GET", "/cadastros/unidades-medida?size=100")["items"] if row["sigla"] == "un")
    if "aberto" not in state["orders"]:
        create_order(state,path,"aberto",cc,unit,suppliers)
    if "atrasado" not in state["orders"]:
        create_order(state,path,"atrasado",cc,unit,suppliers)
    if "recebido" not in state["orders"]:
        create_order(state,path,"recebido",cc,unit,suppliers,received=True)
    if not state.get("statuses_set"):
        api("quality", "POST", f"/compras/fornecedores/{suppliers[1]}/homologar", {
            "situacao": "HOMOLOGADO_CONDICIONAL", "parecer": "DEMO-F6: pendência de documento em treinamento.",
            "condicional_ate": str(date.today()+timedelta(days=30)), "pendencias": "DEMO-F6 certidão"})
        api("quality", "POST", f"/compras/fornecedores/{suppliers[2]}/homologar", {
            "situacao": "SUSPENSO", "parecer": "DEMO-F6: suspensão para exercício de bloqueio."})
        state["statuses_set"] = True
        save(path, state)
    with psycopg.connect(dsn) as db:
        with db.cursor() as cursor:
            cursor.execute("UPDATE suprimentos.sup_pedido SET entrega_prevista=current_date-3 WHERE id=%s AND numero LIKE 'OC-%%' AND criado_por=%s",
                           (state["orders"]["atrasado"], demo.ACTORS["buyer"][0]))
            if cursor.rowcount != 1:
                raise RuntimeError("OC DEMO em atraso não localizada")
        db.commit()
    if not state["stock_request"]:
        material = next(row for row in api("almox", "GET", "/estoque/saldos")["items"] if row["codigo"] == "DEMO-F2-ABR")
        req = api("sol", "POST", "/solicitacoes", {"cc_id": cc, "justificativa": "DEMO-F6 reserva de estoque para treinamento",
            "itens": [{"material_id": material["material_id"], "qtd": 2, "un": unit}]})
        state["stock_request"] = req["id"]
        save(path, state)
        api("sol", "POST", f"/solicitacoes/{req['id']}/enviar", {})
        api("apr1", "POST", f"/solicitacoes/{req['id']}/aprovar", {})
    if not state["epi"]:
        balance = next(row for row in api("almox", "GET", "/estoque/saldos")["items"] if row["codigo"] == "DEMO-F2-EPI")
        address = api("almox", "GET", "/cadastros/enderecos")["items"][0]["id"]
        person = api("almox", "POST", "/estoque/colaboradores", {
            "nome": "DEMO-F6 Colaborador", "matricula": "DEMO-F6-001", "setor": "DEMO produção"})
        state["employee"] = person["id"]
        save(path, state)
        card = api("almox", "POST", "/estoque/epi/entregar", {
            "colaborador_id": person["id"], "material_id": balance["material_id"],
            "endereco_id": address, "numero_ca": "DEMO-CA-2026", "quantidade": 1,
            "chave_idempotencia": "DEMO-F6:EPI:001"})
        state["epi"] = card["id"]
        save(path, state)
        api("almox", "POST", f"/estoque/epi/{card['id']}/confirmar", {})
    if not state["inventory"]:
        address = api("almox", "GET", "/cadastros/enderecos")["items"][0]["id"]
        inv = api("almox", "POST", "/estoque/inventarios", {"endereco_id": address, "tipo": "CICLICO"})
        state["inventory"] = inv["id"]
        save(path, state)
        material = next(row for row in api("almox", "GET", "/estoque/saldos")["items"] if row["codigo"] == "DEMO-F2-FER")
        api("almox", "POST", f"/estoque/inventarios/{inv['id']}/contagens", {
            "material_id": material["material_id"], "quantidade": 3})
        api("almox", "POST", f"/estoque/inventarios/{inv['id']}/concluir", {})
    order_states = {label: api("buyer", "GET", f"/compras/pedidos/{oid}")["status"]
                    for label, oid in state["orders"].items()}
    if order_states != {"aberto": "ENVIADO", "atrasado": "ENVIADO", "recebido": "RECEBIDO"}:
        raise RuntimeError(f"Situações DEMO divergentes: {order_states}")
    supplier_states = [api("buyer", "GET", f"/compras/fornecedores/{sid}")["situacao"]
                       for sid in [*suppliers, *state["fornecedores"]]]
    if supplier_states != ["HOMOLOGADO", "HOMOLOGADO_CONDICIONAL", "SUSPENSO", "EM_QUALIFICACAO"]:
        raise RuntimeError(f"Homologações DEMO divergentes: {supplier_states}")
    print("F6_DEMO_OK fornecedores=4 pedidos=3 reserva=1 epi=1 inventario=1", order_states)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Uso: seed-f6-demo-homolog.py MANIFEST")
    main(Path(sys.argv[1]))

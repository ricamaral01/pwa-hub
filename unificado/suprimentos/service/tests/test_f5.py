"""Indicadores S5 em banco descartável com identidade assinada por chamada."""
from __future__ import annotations

from datetime import date, timedelta
from time import monotonic

from sqlalchemy import text

from test_f1 import User, ok, setup
from test_f3 import seed_order
from suprimentos.ids import uuid7


def test_filters_roles_sources_and_exports(setup):
    engine, cc, measure = setup
    ids = seed_order(engine, cc, measure)
    buyer, sol, foreign = User("buyer"), User("sol"), User("foreign")
    assert buyer.get("/analises/indicadores").status_code == 403
    with engine.begin() as db:
        db.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase='S5'"))
        db.execute(text("UPDATE suprimentos.sup_pedido SET entrega_prevista=current_date-1 WHERE id=:id"), {"id": ids["order"]})
    report = ok(buyer.get("/analises/indicadores", params={"inicio": str(date.today()), "fim": str(date.today())}))
    assert report["pedidos_atrasados"][0]["numero"] == "OC-F3"
    assert report["itens_zerados"][0]["codigo"] == "F3-MAT"
    assert "sup_solicitacao" in report["fontes"]["lead_solicitacao"]
    assert sol.get("/analises/indicadores").status_code == 403
    assert foreign.get("/analises/indicadores").status_code == 403
    assert buyer.get("/analises/indicadores", params={"unidade": "pederneiras"}).status_code == 403
    assert buyer.get("/analises/indicadores", params={"cc_id": "00000000-0000-0000-0000-000000000001"}).status_code == 422
    filtered = ok(buyer.get("/analises/indicadores", params={"cc_id": cc, "categoria": "ABRASIVO"}))
    assert filtered["filtros"]["cc_ids"] == [cc]
    assert filtered["estoque"]["valor"] is None and filtered["itens_zerados"] == []
    assert buyer.get("/analises/indicadores", params={"categoria": "invalida"}).status_code == 422
    csv_file = buyer.get("/analises/exportar.csv")
    assert csv_file.status_code == 200 and csv_file.content.startswith(b"\xef\xbb\xbf")
    assert b"lead_solicitacao" in csv_file.content
    pdf = buyer.get("/analises/exportar.pdf")
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF-")


def test_fifty_thousand_movements_under_two_seconds(setup):
    engine, cc, measure = setup
    ids = seed_order(engine, cc, measure)
    with engine.begin() as db:
        db.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase='S5'"))
        db.execute(text("""INSERT INTO suprimentos.sup_movimento
          (unidade_id,material_id,endereco_id,tipo,quantidade,custo_unitario,custo_total,
           referencia_tipo,referencia_id,chave_idempotencia,criado_por)
          SELECT 1,CAST(:material AS uuid),CAST(:address AS uuid),'ENTREGA',-1,10,10,
            'SOLICITACAO',CAST(:line AS uuid),'f5-load-'||g,'test'
          FROM generate_series(1,50000) g"""), {"material": ids["material"],
              "address": ids["address"], "line": ids["request_item"]})
    start = monotonic()
    report = ok(User("buyer").get("/analises/indicadores"))
    elapsed = monotonic() - start
    print(f"F5_50K_RESPONSE_SECONDS={elapsed:.3f}")
    assert report["consumo"][0]["quantidade"] == 50000
    assert elapsed < 2.0, f"Indicadores levaram {elapsed:.3f}s com 50 mil movimentos"


def test_completed_flow_metric_values(setup):
    engine, cc, measure = setup
    ids = seed_order(engine, cc, measure)
    first, chosen, evaluation, delivery, other_supplier, other_profile = (uuid7() for _ in range(6))
    with engine.begin() as db:
        db.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase='S5'"))
        db.execute(text("INSERT INTO suprimentos.sup_fornecedor(id,cnpj,razao,criado_por,atualizado_por) VALUES (:id,'99999999000199','Outro F5','test','test')"),{"id":other_supplier})
        db.execute(text("INSERT INTO suprimentos.sup_fornecedor_unidade(id,unidade_id,fornecedor_id,situacao,criado_por,atualizado_por) VALUES (:id,1,:base,'HOMOLOGADO','test','test')"),{"id":other_profile,"base":other_supplier})
        db.execute(text("""UPDATE suprimentos.sup_solicitacao SET status='ENTREGUE',
          criado_em=now()-interval '3 days',entregue_em=now(),nivel_atual=NULL WHERE id=:id"""), {"id": ids["request"]})
        db.execute(text("""UPDATE suprimentos.sup_pedido SET status='RECEBIDO',
          enviado_em=now()-interval '2 days',entrega_prevista=current_date WHERE id=:id"""), {"id": ids["order"]})
        db.execute(text("""INSERT INTO suprimentos.sup_pedido_entrega(id,unidade_id,pedido_id,pedido_item_id,qtd,numero_nf,criado_por,atualizado_por)
          VALUES (:id,1,:order,:item,2,'NF-F5','test','test')"""),
          {"id": delivery, "order": ids["order"], "item": ids["order_item"]})
        db.execute(text("""INSERT INTO suprimentos.sup_aprovacao(id,solicitacao_id,unidade_id,nivel,aprovador_id,aprovador_nome,decisao,em,criado_por,atualizado_por)
          VALUES (:id,:req,1,1,'apr1','Aprovador','APROVADA',now()-interval '2 days 12 hours','test','test')"""),
          {"id": uuid7(), "req": ids["request"]})
        for price_id,cost,selected,created,supplier in ((first,250,False,"2 days",other_profile),(chosen,200,True,"1 day",ids["profile"])):
            db.execute(text("""INSERT INTO suprimentos.sup_cotacao_preco
              (id,unidade_id,cotacao_item_id,fornecedor_unidade_id,preco_unit,frete_tipo,prazo_dias,validade,custo_posto,escolhido,criado_em,criado_por,atualizado_por)
              VALUES (:id,1,:quote,:supplier,:cost,'CIF',2,current_date+10,:cost,:selected,now()-CAST(:age AS interval),'test','test')"""),
              {"id": price_id, "quote": ids["quote_item"], "supplier": supplier,
               "cost": cost, "selected": selected, "age": created})
        db.execute(text("""INSERT INTO suprimentos.sup_fornecedor_avaliacao
          (id,unidade_id,fornecedor_unidade_id,pedido_id,nota_prazo,nota_quantidade,nota_qualidade,nota_documentacao,nota_atendimento,iqf,criado_por,atualizado_por)
          VALUES (:id,1,:supplier,:order,5,5,5,5,5,100,'test','test')"""),
          {"id": evaluation, "supplier": ids["profile"], "order": ids["order"]})
        db.execute(text("""INSERT INTO suprimentos.sup_custo_medio(unidade_id,material_id,quantidade,custo_total,custo_medio)
          VALUES (1,:material,10,40,4)"""), {"material": ids["material"]})
        db.execute(text("""INSERT INTO suprimentos.sup_movimento
          (unidade_id,material_id,endereco_id,tipo,quantidade,custo_unitario,custo_total,referencia_tipo,referencia_id,chave_idempotencia,criado_por)
          VALUES (1,:material,:address,'ENTREGA',-2,4,8,'SOLICITACAO',:line,'f5-metric','test')"""),
          {"material": ids["material"], "address": ids["address"], "line": ids["request_item"]})
    report = ok(User("buyer").get("/analises/indicadores", params={"inicio": str(date.today()-timedelta(days=4))}))
    assert report["lead_solicitacao"]["amostra"] == 1
    assert 2.9 < report["lead_solicitacao"]["media_dias"] < 3.1
    assert report["lead_oc"]["amostra"] == 1
    assert report["consumo"][0]["valor"] == 8
    assert report["estoque"]["valor"] == 40
    assert report["iqf"][0]["iqf"] == 100
    assert report["economia"]["economia"] == 50

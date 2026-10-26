"""F3: NF, inspeção, IQF, NC e estorno em banco descartável com auth real."""
from __future__ import annotations

import uuid
from datetime import date, timedelta

from sqlalchemy import text

from test_f1 import User, ok, setup  # fixture por teste: cria e remove banco real
from suprimentos.ids import uuid7
from suprimentos.db import database


def seed_order(engine, cc, measure, *, with_material=True):
    ids = {key: uuid7() for key in ("supplier", "profile", "request", "request_item",
        "quote", "quote_item", "order", "order_item", "material", "place", "address")}
    with engine.begin() as c:
        c.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase IN ('S1','S2','S3A','S3B')"))
        c.execute(text("INSERT INTO suprimentos.sup_fornecedor(id,cnpj,razao,criado_por,atualizado_por) VALUES (:id,'12345678000195','Fornecedor F3','test','test')"),{"id":ids["supplier"]})
        c.execute(text("INSERT INTO suprimentos.sup_fornecedor_unidade(id,unidade_id,fornecedor_id,situacao,criado_por,atualizado_por) VALUES (:id,1,:supplier,'HOMOLOGADO','test','test')"),{"id":ids["profile"],"supplier":ids["supplier"]})
        if with_material:
            c.execute(text("INSERT INTO suprimentos.sup_material(id,codigo,descricao,categoria,un_estoque,dominio,criado_por,atualizado_por) VALUES (:id,'F3-MAT','Abrasivo F3','ABRASIVO',:un,'almoxarifado','test','test')"),{"id":ids["material"],"un":measure})
            c.execute(text("INSERT INTO suprimentos.sup_material_unidade(material_id,unidade_id,criado_por,atualizado_por) VALUES (:id,1,'test','test')"),{"id":ids["material"]})
            c.execute(text("INSERT INTO suprimentos.sup_local(id,unidade_id,tipo,nome,criado_por,atualizado_por) VALUES (:id,1,'almoxarifado','F3','test','test')"),{"id":ids["place"]})
            c.execute(text("INSERT INTO suprimentos.sup_endereco(id,unidade_id,local_id,codigo,criado_por,atualizado_por) VALUES (:id,1,:loc,'F3-A1','test','test')"),{"id":ids["address"],"loc":ids["place"]})
        c.execute(text("""INSERT INTO suprimentos.sup_solicitacao(id,unidade_id,numero,cc_id,solicitante_id,solicitante_nome,origem,status,valor_estimado,sem_preco,criado_por,atualizado_por)
          VALUES (:id,1,'SOL-F3',:cc,'sol','Solicitante F3','web','APROVADA',200,false,'test','test')"""),{"id":ids["request"],"cc":cc})
        c.execute(text("""INSERT INTO suprimentos.sup_solicitacao_item(id,solicitacao_id,unidade_id,material_id,descricao_livre,qtd,un,preco_informado,qtd_comprar,destino,criado_por,atualizado_por)
          VALUES (:id,:request,1,:material,:descricao,2,:un,100,2,'COMPRA','test','test')"""),{"id":ids["request_item"],"request":ids["request"],"material":ids["material"] if with_material else None,"descricao":None if with_material else "Serviço F3","un":measure})
        c.execute(text("INSERT INTO suprimentos.sup_cotacao(id,unidade_id,numero,status,cc_id,criado_por,atualizado_por) VALUES (:id,1,'COT-F3','FECHADA',:cc,'test','test')"),{"id":ids["quote"],"cc":cc})
        c.execute(text("INSERT INTO suprimentos.sup_cotacao_item(id,unidade_id,cotacao_id,solicitacao_item_id,qtd,criado_por,atualizado_por) VALUES (:id,1,:quote,:req,2,'test','test')"),{"id":ids["quote_item"],"quote":ids["quote"],"req":ids["request_item"]})
        c.execute(text("""INSERT INTO suprimentos.sup_pedido(id,unidade_id,numero,cotacao_id,fornecedor_unidade_id,status,valor_total,entrega_prevista,criado_por,atualizado_por)
          VALUES (:id,1,'OC-F3',:quote,:supplier,'ENVIADO',200,current_date+2,'test','test')"""),{"id":ids["order"],"quote":ids["quote"],"supplier":ids["profile"]})
        c.execute(text("""INSERT INTO suprimentos.sup_pedido_item(id,unidade_id,pedido_id,cotacao_item_id,solicitacao_item_id,qtd,preco_unit,custo_posto,criado_por,atualizado_por)
          VALUES (:id,1,:order,:quote_item,:req,2,100,200,'test','test')"""),{"id":ids["order_item"],"order":ids["order"],"quote_item":ids["quote_item"],"req":ids["request_item"]})
    return {k:str(v) for k,v in ids.items()}


def create_and_count(alm, ids, *, nf='F3-01', counted=2, invoiced=2, price=100, freight=0):
    row=ok(alm.post('/recebimentos',json={'pedido_id':ids['order'],'numero_nf':nf,
        'cnpj_nf':'12345678000195','frete_total':freight}),201)
    item=row['itens'][0]
    changed=ok(alm.put(f"/recebimentos/{row['id']}/itens/{item['id']}",json={
        'qtd_nf':invoiced,'qtd_contada':counted,'preco_nf':price,
        'ipi_valor':4,'frete_rateado':2,'endereco_id':ids['address']}))
    assert changed['itens'][0]['qtd_contada']==counted
    return row['id'],item['id']


def test_manual_nf_divergence_inspection_iqf_and_reverse(setup, monkeypatch):
    engine,cc,measure=setup;ids=seed_order(engine,cc,measure)
    alm,buyer,quality=(User(x) for x in ('alm','buyer','quality'))
    rid,item=create_and_count(alm,ids,invoiced=1,price=105,freight=12)
    assert alm.post(f'/compras/pedidos/{ids["order"]}/receber',json={}).status_code==409
    assert quality.get('/recebimentos').status_code==200
    assert User('foreign').get('/recebimentos').status_code==403
    monkeypatch.delenv('SUPRIMENTOS_NF_PROVIDER_KEY',raising=False)
    upload=ok(alm.post(f'/recebimentos/{rid}/nf',files={'arquivo':('nota.pdf',b'%PDF-1.4\n%%EOF','application/pdf')}),201)
    assert upload['status']=='DESLIGADO'
    assert ok(alm.get(f'/recebimentos/{rid}/job'))['status']=='DESLIGADO'
    assert alm.get(f'/recebimentos/{rid}/nf').content.startswith(b'%PDF-')
    assert alm.post(f'/recebimentos/{rid}/conferir',json={}).status_code==422
    pending=ok(alm.post(f'/recebimentos/{rid}/conferir',json={'confirmo_campos_nf':True}))
    assert pending['status']=='PENDENTE_COMPRADOR'
    assert buyer.post(f'/recebimentos/{rid}/resolver',json={'justificativa':'curto'}).status_code==422
    ok(buyer.post(f'/recebimentos/{rid}/resolver',json={'justificativa':'NF divergente aceita após contato com fornecedor'}))
    assert alm.post(f'/recebimentos/{rid}/confirmar',json={}).status_code==409
    ok(quality.post(f'/recebimentos/{rid}/inspecionar',json={'itens':[{'item_id':item,'decisao':'LIBERADO'}]}))
    result=ok(alm.post(f'/recebimentos/{rid}/confirmar',json={}))
    assert result['status']=='CONFIRMADO' and result['pedido_status']=='RECEBIDO'
    detail=ok(alm.get(f'/recebimentos/{rid}'))
    assert detail['itens'][0]['frete_rateado']==12
    assert detail['itens'][0]['custo_unitario']==113
    score=ok(alm.post(f'/recebimentos/{rid}/atendimento',json={'nota':5,
        'comentario':'Atendimento por telefone e confirmação de prazo'}))
    assert score['nota_atendimento']=='5' and score['iqf']
    with engine.connect() as c:
        saldo=c.execute(text('SELECT quantidade FROM suprimentos.sup_saldo WHERE material_id=:id'),{'id':ids['material']}).scalar_one()
        assert saldo==0
        assert c.execute(text('SELECT count(*) FROM suprimentos.sup_movimento WHERE referencia_id=:id'),{'id':item}).scalar_one()==2
        assert c.execute(text('SELECT iqf FROM suprimentos.sup_fornecedor_avaliacao WHERE id=:id'),{'id':result['avaliacao_id']}).scalar_one()>0
    assert alm.post(f'/recebimentos/{rid}/confirmar',json={}).status_code==409
    reversed_row=ok(alm.post(f'/recebimentos/{rid}/estornar',json={'motivo':'Devolução para correção da nota fiscal'}))
    assert reversed_row['versao']==2
    assert ok(alm.get(f'/recebimentos/{reversed_row["nova_versao_id"]}'))['status']=='RASCUNHO'
    with engine.connect() as c:
        assert c.execute(text('SELECT qtd_recebida FROM suprimentos.sup_pedido_item WHERE id=:id'),{'id':ids['order_item']}).scalar_one()==0
        assert c.execute(text('SELECT estornada_em IS NOT NULL FROM suprimentos.sup_fornecedor_avaliacao WHERE id=:id'),{'id':result['avaliacao_id']}).scalar_one()
        assert c.execute(text('SELECT estornado_em IS NOT NULL FROM suprimentos.sup_pedido_entrega WHERE pedido_id=:id'),{'id':ids['order']}).scalar_one()


def test_rejected_receipt_queues_nc(setup):
    engine,cc,measure=setup;ids=seed_order(engine,cc,measure)
    alm,quality=User('alm'),User('quality')
    rid,item=create_and_count(alm,ids)
    ok(alm.post(f'/recebimentos/{rid}/conferir',json={'confirmo_campos_nf':True}))
    inspected=ok(quality.post(f'/recebimentos/{rid}/inspecionar',json={'itens':[{
        'item_id':item,'decisao':'REPROVADO','parecer':'Embalagem danificada e lote ilegível'}]}))
    assert inspected['inspecao_status']=='REPROVADO'
    pending=ok(quality.get('/recebimentos/ncs/pendentes'))['items']
    assert len(pending)==1 and pending[0]['chave_idempotencia'].startswith('recebimento:')
    other_cc=uuid7()
    with engine.begin() as c:
        c.execute(text("INSERT INTO suprimentos.sup_centro_custo(id,unidade_id,codigo,nome,criado_por,atualizado_por) VALUES (:id,1,'F3-OTHER','Outro CC','test','test')"),{'id':other_cc})
        c.execute(text("INSERT INTO suprimentos.sup_usuario_papel(id,iam_user_id,unidade_id,papel,cc_id,criado_por,atualizado_por) VALUES (:id,'quality-other',1,'QUALIDADE',:cc,'test','test')"),{'id':uuid7(),'cc':other_cc})
    assert ok(User('quality-other').get('/recebimentos/ncs/pendentes'))['items']==[]
    assert User('quality-other').post(f'/recebimentos/ncs/{pending[0]["id"]}/vincular',json={'nc_id':'NC-F3-01'}).status_code==403
    assert quality.get('/recebimentos/ncs/pendentes').status_code==200
    assert User('buyer').get('/recebimentos/ncs/pendentes').status_code==403
    assert ok(alm.post(f'/recebimentos/{rid}/confirmar',json={}))['pedido_status']=='PARCIAL'
    with engine.connect() as c:
        assert c.execute(text('SELECT count(*) FROM suprimentos.sup_movimento')).scalar_one()==0


def test_nf_job_survives_database_reconnect(setup,monkeypatch):
    engine,cc,measure=setup;ids=seed_order(engine,cc,measure)
    alm=User('alm');rid,_=create_and_count(alm,ids)
    monkeypatch.setenv('SUPRIMENTOS_NF_PROVIDER_KEY','test-key')
    monkeypatch.setenv('SUPRIMENTOS_NF_PROVIDER_URL','http://127.0.0.1:9/test-provider')
    queued=ok(alm.post(f'/recebimentos/{rid}/nf',files={'arquivo':('nota.pdf',b'%PDF-1.4\n%%EOF','application/pdf')}),201)
    assert queued['status']=='PENDENTE'
    database.cache_clear()
    from suprimentos.nf_worker import run_once
    assert run_once()=='FALHOU'
    assert ok(alm.get(f'/recebimentos/{rid}/job'))['status']=='FALHOU'


def test_epi_ca_must_exist_and_be_valid(setup):
    engine,cc,measure=setup;ids=seed_order(engine,cc,measure)
    with engine.begin() as c:
        c.execute(text("UPDATE suprimentos.sup_material SET categoria='EPI' WHERE id=:id"),{'id':ids['material']})
        c.execute(text("INSERT INTO suprimentos.sup_epi_ca(id,material_id,numero_ca,validade,criado_por,atualizado_por) VALUES (:id,:mid,'CA-F3',current_date-1,'test','test')"),{'id':uuid7(),'mid':ids['material']})
    alm,quality=User('alm'),User('quality')
    rid,item=create_and_count(alm,ids)
    ok(alm.put(f'/recebimentos/{rid}/itens/{item}',json={'numero_ca':'CA-F3',
        'validade':str(date.today()+timedelta(days=365))}))
    ok(alm.post(f'/recebimentos/{rid}/conferir',json={'confirmo_campos_nf':True}))
    payload={'itens':[{'item_id':item,'decisao':'LIBERADO'}]}
    assert quality.post(f'/recebimentos/{rid}/inspecionar',json=payload).status_code==409
    with engine.begin() as c:
        c.execute(text("UPDATE suprimentos.sup_epi_ca SET validade=current_date+365 WHERE material_id=:id"),{'id':ids['material']})
    assert ok(quality.post(f'/recebimentos/{rid}/inspecionar',json=payload))['inspecao_status']=='LIBERADO'

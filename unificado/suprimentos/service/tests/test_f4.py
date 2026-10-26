"""Simulador do contrato Laboratório × Suprimentos em PostgreSQL descartável."""
from __future__ import annotations

import os
import time
from datetime import date, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import text

from test_f1 import User, ok, setup
from test_f3 import seed_order
from suprimentos.ids import uuid7
from suprimentos.integration_auth import decode_service_assertion, sign_service_assertion
from suprimentos.main import app

KEY='laboratorio-servico-teste-2026-abcdef0123456789'


class Lab:
    def __init__(self,unit='campinas'):
        self.unit=unit;self.client=TestClient(app,client=('127.0.0.1',50123))

    def post(self,path,data,assertion=None):
        token=assertion or sign_service_assertion(self.unit,KEY)
        return self.client.post('/api/suprimentos/integracao'+path,json=data,
            headers={'X-Suprimentos-Service-Assertion':token})


def test_signed_suggestion_idempotency_and_flag(setup,monkeypatch):
    engine,cc,measure=setup;ids=seed_order(engine,cc,measure)
    with engine.begin() as c:
        c.execute(text("UPDATE suprimentos.sup_material SET dominio='insumo_usina',categoria='INSUMO_USINA' WHERE id=:id"),{'id':ids['material']})
    lab=Lab();payload={'origem':'estoque_usina','material_id':ids['material'],
        'quantidade':'15.25','data_limite':str(date.today()+timedelta(days=5)),
        'silo_destino':'SILO-C1','chave_idempotencia':'lab-evento-1'}
    monkeypatch.delenv('SUPRIMENTOS_LAB_SERVICE_KEY',raising=False)
    assert lab.post('/sugestoes',payload).status_code==401
    monkeypatch.setenv('SUPRIMENTOS_LAB_SERVICE_KEY',KEY)
    assert lab.post('/sugestoes',payload).status_code==403
    with engine.begin() as c:
        c.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase='S4'"))
    created=ok(lab.post('/sugestoes',payload),201)
    assert created['status']=='SUGERIDA' and not created['repetida']
    repeated=ok(lab.post('/sugestoes',payload),201)
    assert repeated['id']==created['id'] and repeated['repetida']
    assert lab.post('/sugestoes',{**payload,'quantidade':20}).status_code==409
    assert lab.post('/sugestoes',payload,assertion='invalid').status_code==401
    expired=sign_service_assertion('campinas',KEY,now=int(time.time())-40)
    assert lab.post('/sugestoes',payload,assertion=expired).status_code==401
    wrong=sign_service_assertion('pederneiras',KEY)
    assert lab.post('/sugestoes',payload,assertion=wrong).status_code==403
    buyer=User('buyer');sol=User('sol')
    listed=ok(buyer.get('/integracao/sugestoes'))
    assert listed['total']==1 and listed['items'][0]['material_descricao']=='Abrasivo F3'
    assert sol.get('/integracao/sugestoes').status_code==403
    with engine.connect() as c:
        assert c.execute(text("SELECT count(*) FROM suprimentos.sup_sugestao_ressuprimento WHERE origem='estoque_usina' AND chave_origem='lab-evento-1'")).scalar_one()==1


def test_received_callback_updates_order_without_warehouse(setup,monkeypatch):
    engine,cc,measure=setup;ids=seed_order(engine,cc,measure)
    with engine.begin() as c:
        c.execute(text("UPDATE suprimentos.sup_material SET dominio='insumo_usina',categoria='INSUMO_USINA' WHERE id=:id"),{'id':ids['material']})
        c.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase='S4'"))
    monkeypatch.setenv('SUPRIMENTOS_LAB_SERVICE_KEY',KEY)
    lab=Lab();payload={'pedido_item_id':ids['order_item'],'quantidade':2,
        'numero_nf':'NF-LAB-01','documento_ref':'GED-LAB-01',
        'inspecao_status':'LIBERADO','chave_idempotencia':'lab-recebido-1'}
    received=ok(lab.post(f'/pedidos/{ids["order"]}/recebido',payload))
    assert received['status']=='RECEBIDO' and received['pedido_status']=='RECEBIDO'
    repeat=ok(lab.post(f'/pedidos/{ids["order"]}/recebido',payload))
    assert repeat['repetida'] and repeat['id']==received['id']
    assert lab.post(f'/pedidos/{ids["order"]}/recebido',{**payload,'quantidade':1}).status_code==409
    assert lab.post(f'/pedidos/{ids["order"]}/recebido',{**payload,'numero_nf':'OUTRA-NF'}).status_code==409
    with engine.connect() as c:
        assert c.execute(text('SELECT count(*) FROM suprimentos.sup_movimento')).scalar_one()==0
        assert c.execute(text('SELECT qtd_recebida FROM suprimentos.sup_pedido_item WHERE id=:id'),{'id':ids['order_item']}).scalar_one()==2
        assert c.execute(text('SELECT qtd_entregue FROM suprimentos.sup_solicitacao_item WHERE id=:id'),{'id':ids['request_item']}).scalar_one()==2
        assert c.execute(text('SELECT iqf FROM suprimentos.sup_fornecedor_avaliacao WHERE id=:id'),{'id':received['avaliacao_id']}).scalar_one()>0


def test_non_usina_order_rejected(setup,monkeypatch):
    engine,cc,measure=setup;ids=seed_order(engine,cc,measure)
    with engine.begin() as c:
        c.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase='S4'"))
    monkeypatch.setenv('SUPRIMENTOS_LAB_SERVICE_KEY',KEY)
    payload={'pedido_item_id':ids['order_item'],'quantidade':1,
        'chave_idempotencia':'lab-wrong-domain'}
    assert Lab().post(f'/pedidos/{ids["order"]}/recebido',payload).status_code==409


def test_usina_material_follows_regular_purchase_flow(setup):
    engine,cc,measure=setup;material_id=uuid7()
    with engine.begin() as c:
        c.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase IN ('S1','S2','S3A','S4')"))
        c.execute(text("INSERT INTO suprimentos.sup_material(id,codigo,descricao,categoria,un_estoque,dominio,criado_por,atualizado_por) VALUES (:id,'F4-CIMENTO','Cimento do silo','INSUMO_USINA',:un,'insumo_usina','test','test')"),{'id':material_id,'un':measure})
        c.execute(text("INSERT INTO suprimentos.sup_material_unidade(material_id,unidade_id,criado_por,atualizado_por) VALUES (:id,1,'test','test')"),{'id':material_id})
    sol,buyer,aprovador=User('sol'),User('buyer'),User('apr1')
    request=ok(sol.post('/solicitacoes',json={'cc_id':cc,'itens':[
        {'material_id':str(material_id),'qtd':3,'un':measure}]}),201)
    line=request['itens'][0]['id']
    ok(buyer.post(f'/itens/{line}/preco',json={'preco':100}))
    ok(sol.post(f'/solicitacoes/{request["id"]}/enviar',json={}))
    ok(aprovador.post(f'/solicitacoes/{request["id"]}/aprovar',json={}))
    with engine.connect() as c:
        dest=c.execute(text('SELECT destino,qtd_comprar FROM suprimentos.sup_solicitacao_item WHERE id=:id'),{'id':line}).one()
        assert dest[0]=='COMPRA' and dest[1]==3
    quoted=ok(buyer.post('/compras/cotacoes',json={'itens':[line]}),201)
    assert quoted['itens'][0]['qtd']==3

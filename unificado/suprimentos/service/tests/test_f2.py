"""F2: livro, saldo, reserva, CA, inventário e reposição em PostgreSQL descartável."""
from __future__ import annotations
import os, sys, uuid
from pathlib import Path
import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'service'))
from suprimentos.auth import sign_assertion
from suprimentos.db import database
from suprimentos.ids import uuid7
from suprimentos.main import app

ADMIN_URL=os.getenv('SUPRIMENTOS_TEST_ADMIN_URL')
pytestmark=pytest.mark.skipif(not ADMIN_URL,reason='SUPRIMENTOS_TEST_ADMIN_URL ausente')
KEY='suprimentos-f2-test-signing-key-2026-0123456789'

class Actor:
    def __init__(self,name):self.name=name;self.client=TestClient(app,client=('127.0.0.1',50001))
    def call(self,method,path,**kwargs):
        return self.client.request(method,'/api/suprimentos'+path,
            headers={'X-Suprimentos-Assertion':sign_assertion(self.name,self.name,KEY)},**kwargs)
    def get(self,p):return self.call('GET',p)
    def post(self,p,d):return self.call('POST',p,json=d)

def ok(response,code=200):
    assert response.status_code==code,response.text
    return response.json()

@pytest.fixture
def setup(tmp_path):
    db_name='sup_f2_'+uuid.uuid4().hex[:12]
    admin=create_engine(ADMIN_URL,isolation_level='AUTOCOMMIT')
    with admin.connect() as conn:conn.execute(text(f'CREATE DATABASE "{db_name}" ENCODING \'UTF8\' TEMPLATE template0 LC_COLLATE \'C\' LC_CTYPE \'C\''))
    url=ADMIN_URL.rsplit('/',1)[0]+'/'+db_name
    os.environ.update(SUPRIMENTOS_DATABASE_URL=url,SUPRIMENTOS_EXPECTED_DATABASE=db_name,
        SUPRIMENTOS_MIGRATION_DATABASE_URL=url,SUPRIMENTOS_ENVIRONMENT='homolog',
        SUPRIMENTOS_GATEWAY_SIGNING_KEY=KEY,SUPRIMENTOS_UPLOAD_DIR=str(tmp_path))
    cfg=Config(str(ROOT/'migrations'/'alembic.ini'))
    cfg.set_main_option('script_location',str(ROOT/'migrations'))
    command.upgrade(cfg,'head');database.cache_clear();engine,_=database()
    with engine.begin() as conn:
        cc,mid,loc,address=(uuid7() for _ in range(4))
        unit=conn.execute(text("SELECT id FROM suprimentos.sup_unidade_medida WHERE sigla='un'")).scalar_one()
        conn.execute(text("INSERT INTO suprimentos.sup_centro_custo(id,unidade_id,codigo,nome,criado_por,atualizado_por) VALUES (:id,1,'F2','Teste F2','test','test')"),{'id':cc})
        conn.execute(text("INSERT INTO suprimentos.sup_material(id,codigo,descricao,categoria,un_estoque,dominio,criado_por,atualizado_por) VALUES (:id,'F2-TEST','Abrasivo de teste','ABRASIVO',:unit,'almoxarifado','test','test')"),{'id':mid,'unit':unit})
        conn.execute(text("INSERT INTO suprimentos.sup_material_unidade(material_id,unidade_id,lead_time_dias,seguranca_dias,lote_economico,criado_por,atualizado_por) VALUES (:id,1,10,5,5,'test','test')"),{'id':mid})
        conn.execute(text("INSERT INTO suprimentos.sup_local(id,unidade_id,tipo,nome,criado_por,atualizado_por) VALUES (:id,1,'almoxarifado','F2','test','test')"),{'id':loc})
        conn.execute(text("INSERT INTO suprimentos.sup_endereco(id,unidade_id,local_id,codigo,criado_por,atualizado_por) VALUES (:id,1,:loc,'A1','test','test')"),{'id':address,'loc':loc})
        for name,role,level in [('sol','SOLICITANTE',None),('sol2','SOLICITANTE',None),('apr','APROVADOR',1),('alm','ALMOXARIFE',None),('alm2','ALMOXARIFE',None),('buyer','COMPRADOR',None),('foreign','SOLICITANTE',None)]:
            conn.execute(text("INSERT INTO suprimentos.sup_usuario_papel(id,iam_user_id,unidade_id,papel,cc_id,nivel,criado_por,atualizado_por) VALUES (:id,:name,1,:role,:cc,:level,'test','test')"),
                {'id':uuid7(),'name':name,'role':role,'cc':None if name in ('alm','alm2','buyer','foreign') else cc,'level':level})
        conn.execute(text("UPDATE suprimentos.sup_flag SET habilitado=true WHERE unidade_id=1 AND fase IN ('S1','S2','S3A')"))
    try:yield engine,str(cc),str(mid),str(address),str(unit)
    finally:
        database.cache_clear();engine.dispose()
        with admin.connect() as conn:conn.execute(text(f'DROP DATABASE "{db_name}" WITH (FORCE)'))

def seed(alm,mid,address,quantity=10,key='seed'):
    return ok(alm.post('/estoque/movimentos',{'tipo':'ENTRADA','material_id':mid,'endereco_id':address,
        'quantidade':quantity,'custo_unitario':10,'chave_idempotencia':key}))

def test_ledger_idempotency_and_reverse(setup):
    engine,cc,mid,address,unit=setup;alm=Actor('alm')
    first=seed(alm,mid,address)
    again=seed(alm,mid,address)
    assert again['id']==first['id']
    assert alm.post('/estoque/movimentos',{'tipo':'ENTRADA','material_id':mid,'endereco_id':address,
        'quantidade':11,'custo_unitario':10,'chave_idempotencia':'seed'}).status_code==409
    second=ok(alm.post('/estoque/movimentos',{'tipo':'ENTRADA','material_id':mid,'endereco_id':address,
        'quantidade':10,'custo_unitario':20,'chave_idempotencia':'seed2'}))
    balance=ok(alm.get('/estoque/saldos'))['items'][0]
    assert balance['saldo']==20 and balance['custo_medio']==15
    reversed_row=ok(alm.post(f'/estoque/movimentos/{second["id"]}/estornar',{'motivo':'Entrada duplicada'}))
    assert ok(alm.post(f'/estoque/movimentos/{second["id"]}/estornar',{'motivo':'Entrada duplicada'}))['id']==reversed_row['id']
    balance=ok(alm.get('/estoque/saldos'))['items'][0]
    assert balance['saldo']==10 and balance['custo_medio']==10
    with engine.begin() as conn:
        with pytest.raises(Exception):conn.execute(text('UPDATE suprimentos.sup_movimento SET quantidade=999 WHERE id=:id'),{'id':first['id']})

def test_reservation_last_stock_and_scope(setup):
    engine,cc,mid,address,unit=setup;alm=Actor('alm');seed(alm,mid,address,1)
    def request(name,key):
        sol=Actor(name)
        row=ok(sol.post('/solicitacoes',{'cc_id':cc,'client_uuid':str(uuid.uuid4()),
            'itens':[{'material_id':mid,'qtd':1,'un':unit}]}),201)
        ok(sol.post('/solicitacoes/'+row['id']+'/enviar',{}))
        return row['id']
    one=request('sol','one');two=request('sol2','two');apr=Actor('apr')
    ok(apr.post('/solicitacoes/'+one+'/aprovar',{'decisao':'aprovar'}))
    ok(apr.post('/solicitacoes/'+two+'/aprovar',{'decisao':'aprovar'}))
    with engine.connect() as conn:
        rows=conn.execute(text("SELECT destino,qtd_comprar FROM suprimentos.sup_solicitacao_item ORDER BY criado_em,id")).all()
        assert sorted((r[0],str(r[1])) for r in rows)==[('ALMOXARIFADO','0.0000'),('COMPRA','1.0000')]
    assert Actor('foreign').get('/estoque/saldos').status_code==403

def test_epi_expired_block_and_inventory_cut(setup):
    engine,cc,mid,address,unit=setup;alm=Actor('alm');seed(alm,mid,address,5)
    inv=ok(alm.post('/estoque/inventarios',{'endereco_id':address,'tipo':'CICLICO'}))
    sheet=ok(alm.get('/estoque/inventarios/'+inv['id']+'/ficha'))
    assert 'saldo' not in str(sheet)
    ok(alm.post('/estoque/movimentos',{'tipo':'ENTRADA','material_id':mid,'endereco_id':address,
        'quantidade':2,'custo_unitario':10,'chave_idempotencia':'after-cut'}))
    ok(alm.post('/estoque/inventarios/'+inv['id']+'/contagens',{'material_id':mid,'quantidade':4}))
    result=ok(alm.post('/estoque/inventarios/'+inv['id']+'/concluir',{}))
    assert result['status']=='CONCLUIDO'
    assert ok(alm.get('/estoque/saldos'))['items'][0]['saldo']==6

def test_reorder_no_duplicate(setup):
    engine,cc,mid,address,unit=setup;alm=Actor('alm');buyer=Actor('buyer')
    seed(alm,mid,address,30)
    ok(alm.post('/estoque/movimentos',{'tipo':'ENTREGA','material_id':mid,'endereco_id':address,
        'quantidade':25,'motivo':'Consumo de teste','chave_idempotencia':'consumo'}))
    first=ok(buyer.post('/estoque/reposicao/calcular',{}))
    second=ok(buyer.post('/estoque/reposicao/calcular',{}))
    assert len(first['criadas'])==1 and second['criadas']==[]
    suggestion=ok(buyer.get('/estoque/reposicao'))['items'][0]
    assert suggestion['status']=='SUGERIDA' and suggestion['quantidade']>=5
    confirmed=ok(buyer.post('/estoque/reposicao/'+suggestion['id']+'/decidir',
        {'decisao':'CONFIRMADA','cc_id':cc}))
    assert confirmed['solicitacao_id']
    assert ok(buyer.post('/solicitacoes/'+confirmed['solicitacao_id']+'/enviar',{}))['status']=='EM_APROVACAO'
    assert ok(buyer.get('/estoque/reposicao'))['items']==[]
    assert ok(buyer.post('/estoque/reposicao/calcular',{}))['criadas']==[]

def test_epi_ca_expired_and_confirmed(setup):
    engine,cc,mid,address,unit=setup;alm=Actor('alm')
    epi=uuid7();ca=uuid7()
    with engine.begin() as conn:
        conn.execute(text("INSERT INTO suprimentos.sup_material(id,codigo,descricao,categoria,un_estoque,dominio,exige_ca,criado_por,atualizado_por) VALUES (:id,'EPI-TEST','Luva de teste','EPI',:unit,'almoxarifado',true,'test','test')"),{'id':epi,'unit':unit})
        conn.execute(text("INSERT INTO suprimentos.sup_material_unidade(material_id,unidade_id,criado_por,atualizado_por) VALUES (:id,1,'test','test')"),{'id':epi})
        conn.execute(text("INSERT INTO suprimentos.sup_epi_ca(id,material_id,numero_ca,validade,criado_por,atualizado_por) VALUES (:id,:mid,'CA-OLD',current_date-1,'test','test')"),{'id':ca,'mid':epi})
    seed(alm,str(epi),address,2,'epi-stock')
    person=ok(alm.post('/estoque/colaboradores',{'nome':'Maria Teste','matricula':'T-001','setor':'Produção'}))
    payload={'colaborador_id':person['id'],'material_id':str(epi),'endereco_id':address,
             'numero_ca':'CA-OLD','quantidade':1,'chave_idempotencia':'epi-1'}
    assert alm.post('/estoque/epi/entregar',payload).status_code==409
    with engine.begin() as conn:
        conn.execute(text("UPDATE suprimentos.sup_epi_ca SET validade=current_date+365 WHERE id=:id"),{'id':ca})
    record=ok(alm.post('/estoque/epi/entregar',payload))
    assert ok(alm.post('/estoque/epi/'+record['id']+'/confirmar',{}))['status']=='CONFIRMADA'
    assert alm.post('/estoque/epi/'+record['id']+'/confirmar',{}).status_code==409

def test_transfer_and_future_date_rejected(setup):
    engine,cc,mid,address,unit=setup;alm=Actor('alm');seed(alm,mid,address,5)
    second=uuid7()
    with engine.begin() as conn:
        loc=conn.execute(text('SELECT local_id FROM suprimentos.sup_endereco WHERE id=:id'),{'id':address}).scalar_one()
        conn.execute(text("INSERT INTO suprimentos.sup_endereco(id,unidade_id,local_id,codigo,criado_por,atualizado_por) VALUES (:id,1,:loc,'A2','test','test')"),{'id':second,'loc':loc})
    ok(alm.post('/estoque/transferir',{'material_id':mid,'origem_id':address,'destino_id':str(second),
        'quantidade':2,'chave_idempotencia':'transfer-1'}))
    with engine.connect() as conn:
        rows=conn.execute(text('SELECT quantidade FROM suprimentos.sup_saldo WHERE material_id=:id ORDER BY endereco_id'),{'id':mid}).all()
        assert sorted(r[0] for r in rows)==[2,3]
    assert alm.post('/estoque/movimentos',{'tipo':'ENTREGA','material_id':mid,'endereco_id':address,
        'quantidade':10,'motivo':'Sem saldo suficiente','chave_idempotencia':'too-many'}).status_code==409

def test_partial_reservation_quotes_only_shortage_and_cancel_releases(setup):
    engine,cc,mid,address,unit=setup;alm=Actor('alm');seed(alm,mid,address,1)
    sol=Actor('sol');row=ok(sol.post('/solicitacoes',{'cc_id':cc,'client_uuid':str(uuid.uuid4()),
        'itens':[{'material_id':mid,'qtd':2,'un':unit}]}),201)
    ok(sol.post('/solicitacoes/'+row['id']+'/enviar',{}));ok(Actor('apr').post('/solicitacoes/'+row['id']+'/aprovar',{}))
    with engine.connect() as conn:
        item=conn.execute(text('SELECT id,destino,qtd_comprar FROM suprimentos.sup_solicitacao_item WHERE solicitacao_id=:id'),{'id':row['id']}).one()
        assert item[1]=='COMPRA' and item[2]==1
    quote=ok(Actor('buyer').post('/compras/cotacoes',{'itens':[str(item[0])]}),201)
    with engine.connect() as conn:
        quoted=conn.execute(text('SELECT qtd FROM suprimentos.sup_cotacao_item WHERE cotacao_id=:id'),{'id':quote['id']}).scalar_one()
        assert quoted==1
    ok(sol.post('/solicitacoes/'+row['id']+'/cancelar',{}))
    assert ok(alm.get('/estoque/saldos'))['items'][0]['reservado']==0

def test_inventory_large_difference_requires_second_almox(setup):
    engine,cc,mid,address,unit=setup;alm=Actor('alm');other=Actor('alm2');seed(alm,mid,address,30)
    inv=ok(alm.post('/estoque/inventarios',{'endereco_id':address,'tipo':'CICLICO'}))
    count=ok(alm.post('/estoque/inventarios/'+inv['id']+'/contagens',{'material_id':mid,'quantidade':1}))
    pending=ok(alm.post('/estoque/inventarios/'+inv['id']+'/concluir',{}))
    assert pending['status']=='EM_APROVACAO'
    assert alm.post(f'/estoque/inventarios/{inv["id"]}/contagens/{count["id"]}/aprovar',{'parecer':'Conferido no local'}).status_code==403
    ok(other.post(f'/estoque/inventarios/{inv["id"]}/contagens/{count["id"]}/aprovar',{'parecer':'Conferido no local'}))
    assert ok(other.post('/estoque/inventarios/'+inv['id']+'/concluir',{}))['status']=='CONCLUIDO'
    assert ok(alm.get('/estoque/saldos'))['items'][0]['saldo']==1

def test_consumption_by_sector_and_cc(setup):
    engine,cc,mid,address,unit=setup;alm=Actor('alm');seed(alm,mid,address,3)
    sol=Actor('sol');row=ok(sol.post('/solicitacoes',{'cc_id':cc,'client_uuid':str(uuid.uuid4()),
        'itens':[{'material_id':mid,'qtd':2,'un':unit}]}),201)
    ok(sol.post('/solicitacoes/'+row['id']+'/enviar',{}));ok(Actor('apr').post('/solicitacoes/'+row['id']+'/aprovar',{}))
    item=row['itens'][0]['id']
    ok(alm.post('/itens/'+item+'/separar',{}));ok(alm.post('/itens/'+item+'/entregar',{'qtd':2}))
    result=ok(alm.get('/estoque/consumo?dias=30'))
    assert result['items'][0]['centro_codigo']=='F2'
    assert result['items'][0]['quantidade']==2

"""Real PostgreSQL/ASGI tests, exclusively on the own desktop port55421.

This is not evidence of a live18446 deployment. The VPS is never contacted.
"""
import base64,hashlib,hmac,importlib.util,json,os,sys,types,unittest
from datetime import datetime,timezone
from pathlib import Path
from uuid import uuid4
import psycopg
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine,event
from sqlalchemy.orm import sessionmaker

R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'scripts'));from lab210_migration import complete_ddl
DB='laboratorio_visual_homolog_20261118';PORT=55421
def owner():
 c=psycopg.connect(host='127.0.0.1',port=PORT,dbname=DB,user='lab210_local',autocommit=True)
 path=Path(c.execute('SHOW data_directory').fetchone()[0]).resolve()
 if path.name!='data' or path.parent.name!='lab210-local-postgres' or '.codex-tmp' not in path.parts or not path.drive:
  c.close();raise RuntimeError('Refusing to use a database outside the own local Windows test directory')
 return c
fixture=R/'tests/unificado/fixtures/lab210_existing_contract.py';spec=importlib.util.spec_from_file_location('lab210_contract',fixture);contract=importlib.util.module_from_spec(spec);spec.loader.exec_module(contract)
pkg=types.ModuleType('lab210_test_server');pkg.__path__=[str(R/'unificado/laboratorio/service/server')];sys.modules[pkg.__name__]=pkg
sys.modules[pkg.__name__+'.cec_api']=contract;sys.modules[pkg.__name__+'.postes_api']=contract
spec=importlib.util.spec_from_file_location(pkg.__name__+'.cec_units',R/'unificado/laboratorio/service/server/cec_units.py');module=importlib.util.module_from_spec(spec);sys.modules[spec.name]=module;spec.loader.exec_module(module)


class ApiTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  with owner() as c:
   for schema in ['lab_cec_pederneiras','lab_cec_ribeirao']:c.execute('DROP SCHEMA IF EXISTS '+schema+' CASCADE')
   c.execute('''CREATE TABLE IF NOT EXISTS public.laboratorio_cp_moldagem (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,unidade_codigo text NOT NULL,
    massada_id bigint NOT NULL,numero_serie text NOT NULL,traco text NOT NULL,
    data_moldagem date NOT NULL,idade_dias integer NOT NULL,data_ruptura date NOT NULL,
    responsavel_id text NOT NULL,responsavel_nome text NOT NULL,
    cp1_resultado_em timestamptz,cp2_resultado_em timestamptz,criado_em timestamptz DEFAULT now(),
    UNIQUE(unidade_codigo,massada_id,idade_dias))''')
   c.execute('TRUNCATE public.laboratorio_cp_moldagem RESTART IDENTITY')
   for unit in ['campinas','noroeste']:
    c.execute("INSERT INTO public.laboratorio_cp_moldagem(unidade_codigo,massada_id,numero_serie,traco,data_moldagem,idade_dias,data_ruptura,responsavel_id,responsavel_nome) VALUES(%s,1,'TESTE-BASE','REF','2026-11-20',1,'2026-11-21','old','Old')",[unit])
   c.execute(complete_ddl())
   c.execute('GRANT SELECT,INSERT,UPDATE ON public.laboratorio_cp_moldagem TO postes_app')
   c.execute('GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO postes_app')
   for unit in ['pederneiras','ribeirao']:
    for i in [1,2]:c.execute(f"INSERT INTO lab_cec_{unit}.massadas(id,produto,formula,data,hora,numero_serie,source_database,source_payload,test_marker) VALUES (%s,'TESTE-LAB','TRACO','2026-11-20','10:00','TESTE-'||%s,'local-fixture','{{}}','TESTE-LAB')",[i,str(i)])
  cls.engine=create_engine(f'postgresql+psycopg://lab210_local@127.0.0.1:{PORT}/{DB}',pool_size=1,max_overflow=0,pool_timeout=3)
  @event.listens_for(cls.engine,'connect')
  def restrict_role(dbapi,record):
   with dbapi.cursor() as cur:cur.execute('SET ROLE postes_app')
   dbapi.commit()
  cls.factory=sessionmaker(cls.engine,expire_on_commit=False);app=FastAPI();app.state.postes_session=cls.factory
  @app.middleware('http')
  async def local_peer(request,call_next):
   # TestClient in the installed Starlette has no client= argument. This
   # test-only app models the loopback Nginx peer; production code is unchanged.
   request.scope['client']=(request.headers.get('x-test-peer','127.0.0.1'),50000)
   return await call_next(request)
  for unit in module.UNITS:app.include_router(module.router_for(unit))
  cls.client=TestClient(app);cls.secret='local-test-only-'+str(uuid4());cls.previous={k:os.environ.get(k) for k in ['LAB_UNIFIED_COPY','LAB_GATEWAY_SIGNING_KEY']};os.environ['LAB_UNIFIED_COPY']='1';os.environ['LAB_GATEWAY_SIGNING_KEY']=cls.secret
 @classmethod
 def tearDownClass(cls):
  cls.client.close();cls.engine.dispose()
  for k,v in cls.previous.items():
   if v is None:os.environ.pop(k,None)
   else:os.environ[k]=v
 def setUp(self):
  with owner() as c:
   for unit in module.UNITS:c.execute(f'TRUNCATE lab_cec_{unit}.rompimentos_eventos,lab_cec_{unit}.rompimentos RESTART IDENTITY')
   c.execute("DELETE FROM public.laboratorio_cp_moldagem WHERE unidade_codigo IN ('pederneiras','ribeirao')")
 def headers(self,unit,method,operation,actor='alex'):
  raw=json.dumps({'id':actor,'name':'Central '+actor,'role':'admin','cec_unit':unit,'cec_method':method,'cec_operation':operation,'exp':int(datetime.now(timezone.utc).timestamp())+20},separators=(',',':')).encode();value=base64.urlsafe_b64encode(raw).rstrip(b'=').decode();signature=base64.urlsafe_b64encode(hmac.new(self.secret.encode(),value.encode(),hashlib.sha256).digest()).rstrip(b'=').decode();return {'x-lab-assertion':value+'.'+signature}
 def request(self,unit,method,operation,body=None,headers=None):
  return self.client.request(method,f'/{unit}/cec-api/{operation}',json=body,headers=headers or self.headers(unit,method,operation.split('?')[0]))
 def reading(self,unit,cp='1',series='TESTE-1',mpa=10,identity=None,**extra):
  return {'id':identity or str(uuid4()),'qr_raw':f'traco=TRACO|ns={series}|nome=TESTE-LAB|cp={cp}/2|idade=1|mold=20-11-26|hora=10:00|rupt=21-11-26|unidade={unit}','resistencia_mpa':mpa,'queued_by':'alex',**extra}
 def test_signed_actor_and_batches(self):
  for unit in module.UNITS:
   self.assertEqual(self.request(unit,'GET','auth/me').json()['id'],'alex')
   rows=self.request(unit,'GET','massadas').json();self.assertEqual(len(rows),2)
 def test_batch_keeps_quantity_but_canonical_fields_override_source_payload(self):
  with owner() as c:
   c.execute("UPDATE lab_cec_pederneiras.massadas SET source_payload=%s::jsonb WHERE id=1",[json.dumps({'qtd':0.25,'id':999,'numero_serie':'FORGED','formula':'FORGED'})])
  try:
   rows=self.request('pederneiras','GET','massadas').json();row=next(r for r in rows if r['id']==1)
   self.assertEqual((row['qtd'],row['numero_serie'],row['formula']),(0.25,'TESTE-1','TRACO'))
  finally:
   with owner() as c:c.execute("UPDATE lab_cec_pederneiras.massadas SET source_payload='{}' WHERE id=1")
 def test_forged_assertion_and_wrong_unit_method_operation_denied(self):
  for scope in [('ribeirao','GET','auth/me'),('pederneiras','POST','auth/me'),('pederneiras','GET','qrcp')]:
   self.assertEqual(self.request('pederneiras','GET','auth/me',headers=self.headers(*scope)).status_code,403)
  headers=self.headers('pederneiras','GET','auth/me');headers['x-lab-assertion']+='x'
  self.assertEqual(self.request('pederneiras','GET','auth/me',headers=headers).status_code,401)
  headers=self.headers('pederneiras','GET','auth/me');headers['x-test-peer']='198.51.100.5'
  self.assertEqual(self.request('pederneiras','GET','auth/me',headers=headers).status_code,401)
 def test_batch_confirmation_is_idempotent_and_keeps_campinas_noroeste(self):
  with owner() as c:before=c.execute("SELECT json_agg(t ORDER BY id)::text FROM (SELECT * FROM public.laboratorio_cp_moldagem WHERE unidade_codigo IN ('campinas','noroeste'))t").fetchone()[0]
  for unit in module.UNITS:
   body={'massada_id':1,'numero_serie':'TESTE-1','traco':'TRACO','data_moldagem':'2026-11-20','idades':[1,3]}
   r=self.request(unit,'POST','moldagens',body);self.assertEqual(r.status_code,200,r.text);self.assertEqual(r.json()['created'],2)
   self.assertEqual(self.request(unit,'POST','moldagens',body).json()['created'],0)
  with owner() as c:
   after=c.execute("SELECT json_agg(t ORDER BY id)::text FROM (SELECT * FROM public.laboratorio_cp_moldagem WHERE unidade_codigo IN ('campinas','noroeste'))t").fetchone()[0]
   self.assertEqual(before,after);self.assertEqual(c.execute("SELECT count(*) FROM public.laboratorio_cp_moldagem WHERE responsavel_id='alex'").fetchone()[0],4)
 def test_confirm_does_not_accept_another_batch_or_duplicate_ages(self):
  body={'massada_id':999,'numero_serie':'TESTE-1','traco':'TRACO','data_moldagem':'2026-11-20','idades':[1]}
  self.assertEqual(self.request('pederneiras','POST','moldagens',body).status_code,422)
  body.update(massada_id=1,idades=[1,1]);self.assertEqual(self.request('pederneiras','POST','moldagens',body).status_code,422)
 def test_author_is_always_central_and_retry_does_not_duplicate_event(self):
  body=self.reading('pederneiras',responsavel='forged',responsavel_id='forged')
  r=self.request('pederneiras','POST','qrcp',body);self.assertEqual(r.status_code,200,r.text)
  self.assertTrue(self.request('pederneiras','POST','qrcp',body).json()['unchanged'])
  with owner() as c:
   self.assertEqual(c.execute('SELECT responsavel_id,responsavel FROM lab_cec_pederneiras.rompimentos').fetchone(),('alex','Central alex'))
   self.assertEqual(c.execute('SELECT count(*) FROM lab_cec_pederneiras.rompimentos_eventos').fetchone()[0],1)
 def test_cross_unit_qr_and_session_switch_queue_cannot_launch(self):
  self.assertEqual(self.request('pederneiras','POST','qrcp',self.reading('ribeirao')).status_code,422)
  self.assertEqual(self.request('pederneiras','POST','qrcp',self.reading('pederneiras',queued_by='marcelo')).status_code,409)
 def test_units_and_series_do_not_merge_and_single_cp_matches_noroeste(self):
  for unit,values in [('pederneiras',[10.01,10.02]),('ribeirao',[30,40])]:
   for cp,value in enumerate(values,1):
    r=self.request(unit,'POST','qrcp',self.reading(unit,cp=str(cp),mpa=value));self.assertEqual(r.status_code,200,r.text)
   r=self.request(unit,'POST','qrcp',self.reading(unit,series='TESTE-2',mpa=9));self.assertEqual(r.status_code,200,r.text)
  pede=self.request('pederneiras','GET','rompimentos-grupos').json()['rows'];rib=self.request('ribeirao','GET','rompimentos-grupos').json()['rows']
  self.assertEqual(len(pede),2);self.assertEqual(len(rib),2)
  self.assertEqual(next(r for r in pede if r['numero_serie']=='TESTE-1')['media_mpa'],10.02)
  self.assertEqual(next(r for r in rib if r['numero_serie']=='TESTE-1')['media_mpa'],35)
  single=next(r for r in pede if r['numero_serie']=='TESTE-2');self.assertEqual((single['quantidade_cp'],single['media_mpa'],single['status_resultado']),(1,9,'OK'))
 def test_identity_cannot_be_repurposed_for_another_cp(self):
  body=self.reading('pederneiras');r=self.request('pederneiras','POST','qrcp',body);self.assertEqual(r.status_code,200,r.text)
  other=self.reading('pederneiras',cp='2',identity=body['id']);self.assertEqual(self.request('pederneiras','POST','qrcp',other).status_code,409)
 def test_unknown_series_or_conflicting_qr_fields_are_rejected(self):
  for body in [self.reading('pederneiras',series='NOT-A-BATCH'),self.reading('pederneiras',traco='OTHER')]:
   self.assertEqual(self.request('pederneiras','POST','qrcp',body).status_code,422)
 def test_existing_historic_readings_cannot_be_deleted(self):
  r=self.request('pederneiras','DELETE','qrcp/'+str(uuid4()));self.assertEqual(r.status_code,405)
 def test_pool_timeout_is_capacity_not_visual_or_permission_failure(self):
  with self.engine.connect() as held:
   response=self.request('pederneiras','GET','massadas')
   self.assertEqual(response.status_code,503);self.assertEqual(response.headers['x-lab-failure-type'],'capacity')
   self.assertEqual(response.headers['retry-after'],'2')


if __name__=='__main__':unittest.main()

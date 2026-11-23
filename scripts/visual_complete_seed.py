"""Explicitly authorized test records and quick access; homolog databases only."""
import json,subprocess,hashlib,uuid
from pathlib import Path
from datetime import datetime,timezone
H=Path('/opt/concrefer-unificado/homolog-next');S=H/'staging/visual-completo/revisao-completa'
assert Path(__file__).resolve().parent==S
S.mkdir(exist_ok=True);marker=S/'seed-visual-results.json'
if marker.exists():print(marker.read_text());raise SystemExit
dbs=['pcp_visual_homolog_20261118','mapa_visual_homolog_20261118']
B=H/'backups'/('revisao-completa-seed-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));B.mkdir(mode=0o700)
def sql(db,q):
 assert db in dbs
 return subprocess.check_output(['sudo','-u','postgres','psql','-v','ON_ERROR_STOP=1','-d',db,'-At','-c',q],text=True).strip()
dumps={}
for db in dbs:
 p=B/(db+'.dump')
 with p.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=f,check=True)
 assert 'TABLE DATA' in subprocess.check_output(['pg_restore','-l',str(p)],text=True)
 p.chmod(0o600);dumps[db]={'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
pcp,mapa=dbs
product=json.loads(sql(pcp,"SELECT row_to_json(p) FROM (SELECT id,nome,codigo,volume FROM produtos WHERE setor_id=1 AND volume>0 ORDER BY id LIMIT 1)p"))
assert product['id']>0
day='2026-11-18' # User's client date, America/Sao_Paulo; never host UTC rollover.
tag='TESTE-REVISAO-COMPLETA-20261118'
assert sql(pcp,f"SELECT count(*) FROM programacoes WHERE codigo_forma='{tag}'")=='0'
pid=sql(pcp,f"INSERT INTO programacoes(data,setor_id,quantidade_programada,volume_m3_programado,produto_id,codigo_forma) VALUES ('{day}',1,20,{float(product['volume'])*20},{product['id']},'{tag}') RETURNING id")
def lit(v):return "'"+str(v).replace("'","''")+"'"
records=[]
for n in range(1,6):
 record=str(uuid.uuid4());form=f'{tag}-{n}'
 sql(mapa,f"INSERT INTO public.producao(id,data_fabricacao,data_hora,setor,forma,modelo,status,colaborador,codigo_produto) VALUES ('{record}','{day}','{day}T15:00:00-03:00','Setor 1',{lit(form)},{lit(product['nome'])},'LIBERADO',{lit(tag)},{lit(product['codigo'] or '')})")
 records.append(record)
 sql(mapa,f"INSERT INTO public.programacao_pcp(data_fabricacao,setor,forma,modelo,descricao_poste,quantidade) VALUES ('{day}','Setor 1',{lit(form)},{lit(product['nome'])},{lit(tag)},4)")
items=['etiquetas-circular','etiquetas-setor4','armaduras','numeros-serie','programacao-semanal','relatorios-producao','acmp-concretagem','manutencao-formas']
sql(mapa,"BEGIN; INSERT INTO unificado_auth.user_quick_access(user_id,enabled,home,items,revision,updated_by) VALUES ('user-ricardo',true,false,"+lit(json.dumps(items))+"::jsonb,1,'user-ricardo') ON CONFLICT(user_id) DO UPDATE SET enabled=true,home=false,items=excluded.items,revision=user_quick_access.revision+1,updated_by='user-ricardo',updated_at=now(); COMMIT;")
result={'test_date':day,'timezone':'America/Sao_Paulo','tag':tag,'backup':str(B),'dumps':dumps,'pcp_programming_id':pid.splitlines()[0],'mapa_production_ids':records,'planned_added':20,'produced_added':5,'quick_access_account':'user-ricardo','quick_access_items':items,'quick_access_home':False,'permission_changes':0,'origin_validation_changed':False}
marker.write_text(json.dumps(result,indent=2));print(json.dumps(result))

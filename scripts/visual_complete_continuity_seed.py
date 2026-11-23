"""Keep the real test scenario available after the application's midnight rollover."""
import json,subprocess,hashlib,uuid
from pathlib import Path
from datetime import datetime,timezone
H=Path('/opt/concrefer-unificado/homolog-next');S=H/'staging/visual-completo/revisao-completa';assert Path(__file__).resolve().parent==S
marker=S/'seed-continuity-20261119.json'
if marker.exists():print(marker.read_text());raise SystemExit
pcp='pcp_visual_homolog_20261118';mapa='mapa_visual_homolog_20261118';day='2026-11-19';tag='TESTE-REVISAO-COMPLETA-20261119'
def sql(db,q):
 assert db in (pcp,mapa)
 return subprocess.check_output(['sudo','-u','postgres','psql','-v','ON_ERROR_STOP=1','-d',db,'-At','-c',q],text=True).strip()
B=H/'backups'/('revisao-continuidade-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));B.mkdir(mode=0o700);dumps={}
for db in [pcp,mapa]:
 p=B/(db+'.dump')
 with p.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=f,check=True)
 p.chmod(0o600);assert 'TABLE DATA' in subprocess.check_output(['pg_restore','-l',str(p)],text=True)
 dumps[db]={'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
product=json.loads(sql(pcp,"SELECT row_to_json(p) FROM (SELECT id,nome,codigo,volume FROM produtos WHERE setor_id=1 AND volume>0 ORDER BY id LIMIT 1)p"))
assert sql(pcp,f"SELECT count(*) FROM programacoes WHERE codigo_forma='{tag}'")=='0'
pid=sql(pcp,f"INSERT INTO programacoes(data,setor_id,quantidade_programada,volume_m3_programado,produto_id,codigo_forma) VALUES ('{day}',1,20,{float(product['volume'])*20},{product['id']},'{tag}') RETURNING id")
def lit(v):return "'"+str(v).replace("'","''")+"'"
ids=[]
for n in range(1,6):
 id=str(uuid.uuid4());form=tag+'-'+str(n);ids.append(id)
 sql(mapa,f"INSERT INTO public.producao(id,data_fabricacao,data_hora,setor,forma,modelo,status,colaborador,codigo_produto) VALUES ('{id}','{day}','{day}T09:00:00-03:00','Setor 1',{lit(form)},{lit(product['nome'])},'LIBERADO',{lit(tag)},{lit(product['codigo'] or '')})")
 sql(mapa,f"INSERT INTO public.programacao_pcp(data_fabricacao,setor,forma,modelo,descricao_poste,quantidade) VALUES ('{day}','Setor 1',{lit(form)},{lit(product['nome'])},{lit(tag)},4)")
result={'date':day,'tag':tag,'purpose':'Continuity of the requested 18/11 test scenario after application midnight; no simulated responses','backup':str(B),'dumps':dumps,'pcp_programming_id':pid.splitlines()[0],'production_ids':ids,'planned_added':20,'produced_added':5,'quick_access_changes':0,'permission_changes':0,'production_database_connections':0}
marker.write_text(json.dumps(result,indent=2));print(json.dumps(result))

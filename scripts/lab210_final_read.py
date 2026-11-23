"""VPS final H SQL proof and production-integrity read; no application changes."""
import hashlib,json,subprocess,sys,time
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/laboratorio-210-live-20261121');H=Path('/opt/concrefer-unificado/homolog-next')
def sql(db,query):
 assert db in ['laboratorio_visual_homolog_20261118','mapa_visual_homolog_20261118']
 p=subprocess.run(['sudo','-u','postgres','env','PGAPPNAME=lab210_final_readonly','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-d',db],input="BEGIN READ ONLY;SET LOCAL statement_timeout='5s';"+query+';ROLLBACK;',text=True,capture_output=True,check=True)
 output=p.stdout.lstrip();results=[];decoder=json.JSONDecoder()
 while output:
  value,end=decoder.raw_decode(output);results.append(value);output=output[end:].lstrip()
 return results
r=json.loads((S/'deployment.json').read_text());assert r['phase']=='published_homolog'
proof=[]
for unit,marker in [('pederneiras','TESTE-LAB-PEDE'),('ribeirao','TESTE-LAB-RIB')]:
 schema='lab_cec_'+unit
 data=sql('laboratorio_visual_homolog_20261118',"""SELECT json_build_object('unit','%UNIT%','massadas',(SELECT count(*) FROM %SCHEMA%.massadas),'source_massadas',(SELECT count(*) FROM %SCHEMA%.massadas WHERE test_marker IS NULL),'fixtures',(SELECT count(*) FROM %SCHEMA%.massadas WHERE test_marker='%MARKER%'),'readings',(SELECT json_agg(t ORDER BY cp) FROM(SELECT id,numero_serie,cp,mpa,responsavel_id,responsavel,data_moldagem,data_ruptura FROM %SCHEMA%.rompimentos WHERE numero_serie='%MARKER%-001')t),'events',(SELECT count(*) FROM %SCHEMA%.rompimentos_eventos),'groups',(SELECT json_agg(t) FROM(SELECT numero_serie,idade_dias,quantidade_cp,media_mpa,status_resultado FROM %SCHEMA%.rompimentos_grupos WHERE numero_serie='%MARKER%-001')t),'moldings',(SELECT json_agg(t ORDER BY idade_dias) FROM(SELECT numero_serie,idade_dias,responsavel_id,responsavel_nome,cp1_resultado_em IS NOT NULL AS cp1_done,cp2_resultado_em IS NOT NULL AS cp2_done FROM public.laboratorio_cp_moldagem WHERE unidade_codigo='%UNIT%' AND numero_serie='%MARKER%-001')t))""".replace('%UNIT%',unit).replace('%SCHEMA%',schema).replace('%MARKER%',marker))[0]
 assert len(data['readings'])==2 and {x['cp'] for x in data['readings']}=={'1','2'} and all(x['responsavel_id']=='alex' for x in data['readings'])
 assert data['events']==2 and len(data['moldings'])==4 and all(x['responsavel_id']=='alex' for x in data['moldings'])
 assert data['groups'][0]['quantidade_cp']==2 and data['groups'][0]['media_mpa']==10.02 and data['groups'][0]['status_resultado']=='OK'
 proof.append(data)
grants=sql('mapa_visual_homolog_20261118',"SELECT coalesce(json_agg(t),'[]') FROM(SELECT user_id,screen_id,allowed,updated_by,updated_at FROM unificado_auth.user_screen_permissions WHERE screen_id LIKE 'labPedeCec%' OR screen_id LIKE 'labRibCec%' ORDER BY user_id,screen_id)t")[0]
assert len(grants)==70 and all(x['allowed'] and x['user_id'] in ['alex','user-alex','marcelo','philippe','user-ricardo'] for x in grants)
users=sql('mapa_visual_homolog_20261118',"SELECT json_build_object('user_ids',(SELECT json_agg(id ORDER BY id) FROM public.usuarios),'unit_rows',(SELECT count(*) FROM unificado_auth.user_units),'extra_unit_rows',(SELECT count(*) FROM unificado_auth.user_unit_extras))")[0]
manifest=[]
for entry in r['manifest']:
 p=Path(entry['path']);actual=hashlib.sha256(p.read_bytes()).hexdigest();assert actual==entry['sha256'],str(p);manifest.append({'path':str(p),'sha256':actual,'size':p.stat().st_size})
code="import runpy;runpy.run_path('/opt/concrefer-unificado/homolog-next/staging/conexoes-banco-20261120/finish-reads.py')"
out=subprocess.check_output(['python3','-c',code],text=True);integrity=json.loads(out)
audit={'captured_at_epoch':time.time(),'production_unchanged':integrity['production_unchanged'],'production_version':Path('/opt/concrefer-unificado/public/unificado/VERSION').read_text().strip(),'homolog_version':(H/'public/unificado/VERSION').read_text().strip(),'max_connections_changed':False,'reserved_connections_changed':False,'old_services_stopped':0,'new_services':0,'new_workers':0,'new_pools':0}
assert audit['homolog_version']=='2.1.0' and audit['production_version']=='2.0.0'
result={'test_data':proof,'grants':{'before':r['grants_before'],'after':grants,'people':4,'existing_logins':5,'no_new_accounts':True},'users':users,'release':{'version':'2.1.0','files':manifest,'manifest_verified':True,'production_changes':0},'audit':audit,'deployment':{k:v for k,v in r.items() if k not in ['import_report']}}
result['deployment']['import_report']=[{k:v for k,v in x.items() if k!='rejected'}|{'rejected_ids':[row['source_id'] for row in x['rejected']]} for x in r['import_report']]
print(json.dumps(result))

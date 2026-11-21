"""VPS phase driver: H18446 only, private backup, atomic files, explicit rollback."""
import ast,hashlib,json,os,shutil,subprocess,sys,time,urllib.request
from datetime import datetime,timezone
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/laboratorio-210-live-20261121')
H=Path('/opt/concrefer-unificado/homolog-next');G=H/'visual-full';P=H/'public/unificado';INPUT=S/'input'
sys.path.insert(0,str(INPUT/'scripts'))
from lab210_server_patch import central,laboratory
from lab210_migration import complete_ddl
DB='laboratorio_visual_homolog_20261118';IAM='mapa_visual_homolog_20261118'
USERS=['alex','user-alex','marcelo','philippe','user-ricardo']
def sql(db,query,readonly=False):
 assert db in [DB,IAM]
 source=('BEGIN READ ONLY;'+query+';ROLLBACK;') if readonly else query
 p=subprocess.run(['sudo','-u','postgres','env','PGAPPNAME=lab210_homolog_deploy','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-d',db],input=source,text=True,capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr[-1800:])
 output=p.stdout.lstrip();results=[];decoder=json.JSONDecoder()
 while output:
  value,end=decoder.raw_decode(output);results.append(value);output=output[end:].lstrip()
 return results
def write_receipt(record):
 (S/'deployment.json').write_text(json.dumps(record,indent=2))
def record():return json.loads((S/'deployment.json').read_text())
def new_screens():
 return [r for r in json.loads((INPUT/'unificado/mapa/api/screen_catalog.json').read_text()) if r['id'].startswith(('labPedeCec','labRibCec'))]
def targets():
 result={}
 for name in ['VERSION','index.html','login.html','sw.js','shell/shell.js','shell/menu.config.js','shell/icons.js','shell/module-pages.js','shell/module-pages-mobile.js']:
  result[P/name]='public'
 for name in ['app.py','screen_catalog.json','lab_cec_units.py']:result[G/'mapa'/name]='mapa'
 for name in ['app.py','cec_units.py']:result[G/'laboratorio/server'/name]='laboratorio'
 for unit in ['pederneiras','ribeirao']:
  source=INPUT/'unificado/laboratorio/service/server/static'/unit
  for p in source.rglob('*'):
   if p.is_file():result[G/'laboratorio/server/static'/unit/p.relative_to(source)]='laboratorio-static'
 return result
def backup():
 assert not (S/'deployment.json').exists(),'Existing deployment receipt; never overwrite backup'
 assert (P/'VERSION').read_text().strip()=='2.0.0'
 schemas=sql(DB,"SELECT coalesce(json_agg(nspname),'[]') FROM pg_namespace WHERE nspname IN ('lab_cec_pederneiras','lab_cec_ribeirao')",True)[0];assert not schemas
 backup=Path('/opt/concrefer-unificado/backups')/('lab210-H-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));backup.mkdir(mode=0o700)
 r={'backup':str(backup),'started_utc':datetime.now(timezone.utc).isoformat(),'files':[],'units':{},'version_before':'2.0.0','version_candidate':'2.1.0','production_changes':0,'phase':'backup'}
 for target,kind in targets().items():
  assert target.resolve().is_relative_to(H)
  item={'path':str(target),'kind':kind,'existed':target.is_file()}
  if item['existed']:
   dest=backup/'files'/str(target).lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target,dest);item.update(backup=str(dest),before_sha256=hashlib.sha256(target.read_bytes()).hexdigest())
  r['files'].append(item)
 for name in ['mapa','laboratorio']:
  unit='unificado-visual-homolog-'+name+'.service';state=dict(x.split('=',1) for x in subprocess.check_output(['systemctl','show',unit,'-p','FragmentPath','-p','DropInPaths','-p','MainPID'],text=True).splitlines());r['units'][name]=state
  for path in [Path(state['FragmentPath'])]+[Path(x) for x in state['DropInPaths'].split()]+[Path('/etc/concrefer-unificado/homolog/visual-'+name+'.env')]:
   if path.is_file():
    dest=backup/'config'/str(path).lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,dest)
 for db,filename in [(DB,'laboratorio.dump'),(IAM,'iam.dump')]:
  dump=backup/filename
  with dump.open('wb') as fp:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=fp,check=True)
  subprocess.run(['pg_restore','-l',str(dump)],check=True,stdout=subprocess.DEVNULL)
  with dump.open('rb') as fp:digest=hashlib.file_digest(fp,'sha256').hexdigest()
  receipt={'database':db,'dump':str(dump),'sha256':digest,'size':dump.stat().st_size};(backup/('lab-backup.json' if db==DB else 'iam-backup.json')).write_text(json.dumps(receipt,indent=2));r.setdefault('database_backups',[]).append(receipt)
 r['grants_before']=sql(IAM,"SELECT coalesce(json_agg(t),'[]') FROM(SELECT * FROM unificado_auth.user_screen_permissions WHERE user_id IN ('alex','user-alex','marcelo','philippe','user-ricardo') AND (screen_id LIKE 'labPedeCec%' OR screen_id LIKE 'labRibCec%'))t",True)[0]
 r['phase']='backed_up';write_receipt(r);print(json.dumps({'phase':r['phase'],'backup':r['backup'],'files':len(r['files']),'database_backups':[{k:x[k] for k in ['database','size','sha256']} for x in r['database_backups']]}))
def atomic(target,data):
 assert target.resolve().is_relative_to(H);target.parent.mkdir(parents=True,exist_ok=True);temp=target.with_name(target.name+'.lab210-tmp');temp.write_bytes(data)
 if target.exists():shutil.copystat(target,temp)
 else:temp.chmod(0o644)
 os.replace(temp,target)
def prepare():
 r=record();assert r['phase'] in ['backed_up','rolled_back']
 candidates={};candidates[G/'mapa/app.py']=central((G/'mapa/app.py').read_text()).encode();candidates[G/'laboratorio/server/app.py']=laboratory((G/'laboratorio/server/app.py').read_text()).encode()
 assert hashlib.sha256((G/'mapa/app.py').read_bytes()).hexdigest()=='d64e3a9ce12efddd4e2ad023ae85e7cc88dd4d35f74693ebe7a561c1b82d4037'
 assert hashlib.sha256((G/'laboratorio/server/app.py').read_bytes()).hexdigest()=='e7308f565928151c354354c282e07ea8e5e8f80a17af04c9f59be051a0f8273e'
 for filename in ['VERSION','index.html','login.html','sw.js','shell/shell.js']:
  candidates[P/filename]=(P/filename).read_text().replace('2.0.0','2.1.0').encode()
 candidate_menu=(INPUT/'unificado/shell/menu.config.js').read_text();start=candidate_menu.index('MENU_CONFIG.laboratorio.groups.push(...');end=candidate_menu.index('// Keep test definitions',start);block=candidate_menu[start:end]
 old=(P/'shell/menu.config.js').read_text();assert 'labPedeCec' not in old;marker='// Keep test definitions in source, but exclude them from the production catalogue.';assert old.count(marker)==1
 old=old.replace("const UNIFICADO_AMBIENTE = 'producao';","const UNIFICADO_AMBIENTE = 'homolog';")
 candidates[P/'shell/menu.config.js']=old.replace(marker,block+marker).encode()
 # Preserve all current frozen-release edits and add only the new descriptions.
 descriptions=(INPUT/'unificado/shell/icons.js').read_text().split('\nObject.assign(window.UnificadoPresentation.descriptions,')[-1];assert 'labPedeCec' in descriptions
 candidates[P/'shell/icons.js']=((P/'shell/icons.js').read_text()+'\nObject.assign(window.UnificadoPresentation.descriptions,'+descriptions).encode()
 candidates[P/'shell/module-pages.js']=(INPUT/'unificado/shell/module-pages.js').read_bytes()
 candidates[P/'shell/module-pages-mobile.js']=(INPUT/'unificado/shell/module-pages-mobile.js').read_bytes()
 old_catalog=json.loads((G/'mapa/screen_catalog.json').read_text());new_catalog=json.loads((INPUT/'unificado/mapa/api/screen_catalog.json').read_text());assert [x for x in new_catalog if not x['id'].startswith(('labPedeCec','labRibCec'))]==old_catalog
 candidates[G/'mapa/screen_catalog.json']=json.dumps(new_catalog,ensure_ascii=False,indent=2).encode()
 candidates[G/'mapa/lab_cec_units.py']=(INPUT/'unificado/mapa/api/lab_cec_units.py').read_bytes();candidates[G/'laboratorio/server/cec_units.py']=(INPUT/'unificado/laboratorio/service/server/cec_units.py').read_bytes()
 for target,kind in targets().items():
  if kind=='laboratorio-static':candidates[target]=(INPUT/'unificado/laboratorio/service/server/static'/target.relative_to(G/'laboratorio/server/static')).read_bytes()
 manifest=[]
 for target,data in candidates.items():
  relative=target.relative_to(H);saved=S/'candidate'/relative;saved.parent.mkdir(parents=True,exist_ok=True);saved.write_bytes(data)
  if target.suffix=='.py':ast.parse(data.decode())
  if target.suffix=='.js':subprocess.run(['node','--check',str(saved)],check=True,capture_output=True)
  manifest.append({'path':str(target),'candidate':str(saved),'sha256':hashlib.sha256(data).hexdigest()})
 r['manifest']=manifest;r['phase']='prepared';write_receipt(r);print(json.dumps({'phase':r['phase'],'files':len(manifest),'backup':r['backup']}))
def install():
 r=record();assert r['phase']=='prepared';backup=Path(r['backup'])
 import importlib.util
 if importlib.util.find_spec('psycopg') is None:
  raise RuntimeError('Use /opt/concrefer-unificado/homolog-next/visual-full/mapa/.venv/bin/python; no package installation is needed')
 if not r.get('schema_migration_applied'):
  sql(DB,complete_ddl());r['schema_migration_applied']=True;write_receipt(r)
 else:
  versions=sql(DB,"SELECT json_build_array((SELECT version FROM lab_cec_pederneiras.release_metadata),(SELECT version FROM lab_cec_ribeirao.release_metadata))",True)[0];assert versions==['2.1.0','2.1.0']
 # Snapshot helper talks to ERP only in READ ONLY transactions.
 from lab210_snapshot import extract,apply_homolog
 snapshot=backup/'source-snapshot.json'
 if snapshot.exists():source=json.loads(snapshot.read_text())
 else:source=extract();snapshot.write_text(json.dumps(source,ensure_ascii=False));os.chmod(snapshot,0o600)
 imported=apply_homolog(source,str(backup/'lab-backup.json'));r['import_report']=imported
 from lab210_fixtures import apply as create_fixtures
 r['fixtures']=create_fixtures(str(backup/'lab-backup.json'));write_receipt(r)
 statements=['BEGIN;']
 for user in USERS:
  assert user in USERS
  for screen in new_screens():statements.append("INSERT INTO unificado_auth.user_screen_permissions(user_id,screen_id,allowed,updated_by,updated_at) VALUES('"+user+"','"+screen['id']+"',true,'codex-lab210-user-approved',now()) ON CONFLICT(user_id,screen_id) DO UPDATE SET allowed=excluded.allowed,updated_by=excluded.updated_by,updated_at=excluded.updated_at;")
 statements.append('COMMIT;');sql(IAM,'\n'.join(statements));r['grants_applied']=True
 # Install backend/static first; the shell version becomes visible in publish().
 r['backend_files_touched']=True;write_receipt(r)
 for row in r['manifest']:
  if Path(row['path']).is_relative_to(G):atomic(Path(row['path']),Path(row['candidate']).read_bytes())
 r['phase']='backend_files_installed';write_receipt(r)
 r['service_http_checks']=[]
 for name,port,health in [('laboratorio',14164,'health'),('mapa',14152,'health')]:
  unit='unificado-visual-homolog-'+name+'.service';subprocess.run(['systemctl','restart',unit],check=True)
  for i in range(25):
   try:
    assert subprocess.check_output(['systemctl','is-active',unit],text=True).strip()=='active'
    with urllib.request.urlopen('http://127.0.0.1:'+str(port)+'/'+health,timeout=5) as response:assert response.status==200
    break
   except Exception:
    if i==24:raise
    time.sleep(1)
  collector=Path('/opt/concrefer-unificado/homolog-next/staging/conexoes-banco-20261120/collector.py');ns={'__file__':str(collector)};exec(collector.read_text().split('started=time.time();')[0],ns);snap=ns['snapshot'](ns['docker_map']())
  r['service_http_checks'].append({'service':unit,'status':200,'activity_after_restart':snap['total_activity'],'connections_after_restart':snap['by_service'].get(unit,0)});write_receipt(r)
 r['phase']='backend_ready';write_receipt(r);print(json.dumps({'phase':r['phase'],'imported':[{k:x[k] for k in ['unit','source_count','imported_count']}|{'rejected':len(x['rejected'])} for x in imported],'fixtures':r['fixtures'],'http':r['service_http_checks']}))
def publish():
 r=record();assert r['phase']=='backend_ready'
 for row in r['manifest']:
  if Path(row['path']).is_relative_to(P) and Path(row['path']).name!='VERSION':atomic(Path(row['path']),Path(row['candidate']).read_bytes())
 atomic(P/'VERSION',b'2.1.0\n');r['phase']='published_homolog';r['published_utc']=datetime.now(timezone.utc).isoformat();write_receipt(r);print(json.dumps({'phase':r['phase'],'version':(P/'VERSION').read_text().strip(),'backup':r['backup']}))
def fix_menu_environment():
 r=record();assert r['phase']=='published_homolog' and (P/'VERSION').read_text().strip()=='2.1.0'
 target=P/'shell/menu.config.js';source=target.read_text();before=hashlib.sha256(target.read_bytes()).hexdigest();assert source.count("const UNIFICADO_AMBIENTE = 'producao';")==1
 data=source.replace("const UNIFICADO_AMBIENTE = 'producao';","const UNIFICADO_AMBIENTE = 'homolog';").encode()
 item=next(row for row in r['manifest'] if row['path']==str(target));Path(item['candidate']).write_bytes(data);subprocess.run(['node','--check',item['candidate']],check=True,capture_output=True);atomic(target,data);item['sha256']=hashlib.sha256(data).hexdigest();r['frontend_fixes']=[{'file':str(target),'reason':'frozen2.0 menu forced production and filtered the new H-only screens','before_sha256':before,'after_sha256':item['sha256']}];write_receipt(r);print(json.dumps({'fixed':'H menu environment','version':'2.1.0','production_changes':0}))
def rollback():
 r=record()
 for item in r['files']:
  target=Path(item['path']);assert target.resolve().is_relative_to(H)
  if item['existed']:
   original=Path(item['backup']).read_bytes()
   if not target.exists() or target.read_bytes()!=original:atomic(target,original)
  elif target.is_file():target.unlink()
 if r.get('grants_applied'):
  commands=['BEGIN;']
  for user in USERS:commands.append("DELETE FROM unificado_auth.user_screen_permissions WHERE user_id='"+user+"' AND (screen_id LIKE 'labPedeCec%' OR screen_id LIKE 'labRibCec%');")
  for row in r['grants_before']:
   # All IDs are fixed allowlisted release IDs; timestamps omitted on rollback.
   assert row['user_id'] in USERS and row['screen_id'] in {s['id'] for s in new_screens()}
   commands.append("INSERT INTO unificado_auth.user_screen_permissions(user_id,screen_id,allowed,updated_by) VALUES('"+row['user_id']+"','"+row['screen_id']+"',"+str(row['allowed']).lower()+",'codex-lab210-rollback');")
  commands.append('COMMIT;');sql(IAM,'\n'.join(commands))
 if r.get('backend_files_touched'):
  for name in ['laboratorio','mapa']:subprocess.run(['systemctl','restart','unificado-visual-homolog-'+name+'.service'],check=True)
 r['phase']='rolled_back';r['new_unit_data_preserved']=True;r['grants_applied']=False;r['backend_files_touched']=False;write_receipt(r);print(json.dumps({'phase':r['phase'],'backup':r['backup'],'new_unit_data_preserved':True}))
if __name__=='__main__':
 action=sys.argv[1];assert action in ['backup','prepare','install','publish','rollback','fix_menu_environment'];globals()[action]()

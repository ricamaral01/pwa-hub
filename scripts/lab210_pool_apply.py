"""Run on VPS: exactly two approved pool changes, one service per invocation."""
import ast,hashlib,json,os,re,shutil,subprocess,sys,time,urllib.request
from datetime import datetime,timezone
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next/visual-full')
O=Path('/opt/concrefer-unificado/homolog-next/staging/laboratorio-210-live-20261121')
CONFIG={
 'armacao':('armacao/armacao/db.py',5,10,14168,'5d022f5ec009dcaca7a8c3ec4039331943786e6baa271aee0db931befcf2f4bc'),
 'pcp':('pcp/app/core/database.py',2,1,14154,'418b73329088c2239bfbb9c05d8e8b76e40e9cd08adade4a83901ae96214a83c')}
def run(args):return subprocess.check_output(args,text=True)
def snapshot():
 p=Path('/opt/concrefer-unificado/homolog-next/staging/conexoes-banco-20261120/collector.py');ns={'__file__':str(p)}
 exec(p.read_text().split('started=time.time();')[0],ns);return ns['snapshot'](ns['docker_map']())
def persist(record):
 (O/('pool-'+record['name']+'.json')).write_text(json.dumps(record,indent=2))
def restore(record):
 for f in record['files']:shutil.copy2(f['backup'],f['path'])
 subprocess.run(['systemctl','restart',record['unit']],check=True)
 record['rolled_back']=True;record['after_rollback']=snapshot();persist(record)
def apply(name):
 rel,size,overflow,port,expected=CONFIG[name];unit='unificado-visual-homolog-'+name+'.service';target=H/rel
 assert target.resolve().is_relative_to(H)
 state=dict(x.split('=',1) for x in run(['systemctl','show',unit,'-p','MainPID','-p','WorkingDirectory','-p','FragmentPath','-p','DropInPaths']).splitlines())
 assert Path(state['WorkingDirectory']).resolve().is_relative_to(H)
 original=target.read_bytes();assert hashlib.sha256(original).hexdigest()==expected,'Source changed, refusing mutation'
 record={'name':name,'unit':unit,'before':snapshot(),'files':[],'source_sha_before':expected,'started_utc':datetime.now(timezone.utc).isoformat(),'rolled_back':False}
 backup=Path('/opt/concrefer-unificado/backups')/('lab210-pools-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+name);backup.mkdir(mode=0o700)
 paths=[target,Path(state['FragmentPath'])]+[Path(x) for x in state['DropInPaths'].split()]
 envfile=Path('/etc/concrefer-unificado/homolog/visual-'+name+'.env')
 if envfile.exists():paths.append(envfile)
 for path in paths:
  saved=backup/str(path).lstrip('/');saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,saved)
  if path==target:record['files'].append({'path':str(path),'backup':str(saved)})
 record['backup']=str(backup);record['unit_backup']=str(backup/str(Path(state['FragmentPath'])).lstrip('/'))
 source=original.decode();tree=ast.parse(source);calls=[n for n in ast.walk(tree) if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='create_engine'];assert len(calls)==1
 kws={k.arg:k.value for k in calls[0].keywords};assert ast.literal_eval(kws['pool_size'])==size and ast.literal_eval(kws['max_overflow'])==overflow
 # Only pool_size/max_overflow change. Existing timeouts/recycle stay intact.
 offsets=[0]
 for line in source.splitlines(keepends=True):offsets.append(offsets[-1]+len(line.encode()))
 edits=[(offsets[kws[k].lineno-1]+kws[k].col_offset,offsets[kws[k].end_lineno-1]+kws[k].end_col_offset,b'1') for k in ['pool_size','max_overflow']]
 candidate=original
 for start,end,value in sorted(edits,reverse=True):candidate=candidate[:start]+value+candidate[end:]
 ast.parse(candidate.decode());record['source_sha_after']=hashlib.sha256(candidate).hexdigest();persist(record)
 try:
  temp=target.with_name(target.name+'.lab210-tmp');temp.write_bytes(candidate);shutil.copystat(target,temp);os.replace(temp,target)
  subprocess.run(['systemctl','restart',unit],check=True)
  for attempt in range(20):
   try:
    assert run(['systemctl','is-active',unit]).strip()=='active'
    with urllib.request.urlopen('http://127.0.0.1:'+str(port)+'/openapi.json',timeout=5) as response:assert response.status==200
    break
   except Exception:
    if attempt==19:raise
    time.sleep(1)
  record['http_openapi_status']=200;record['after_restart']=snapshot();record['pool_before']={'size':size,'overflow':overflow};record['pool_after']={'size':1,'overflow':1};record['browser_validation']='pending';persist(record)
 except Exception as error:
  record['error_type']=type(error).__name__;restore(record);raise
 print(json.dumps({k:v for k,v in record.items() if k not in ['before','after_restart','after_rollback']}))
if __name__=='__main__':
 O.mkdir(mode=0o700,exist_ok=True);action,name=sys.argv[1:3];assert name in CONFIG
 if action=='apply':apply(name)
 elif action=='rollback':
  record=json.loads((O/('pool-'+name+'.json')).read_text());restore(record);print(json.dumps({'rolled_back':True,'unit':record['unit']}))
 else:raise SystemExit('apply or rollback only')

"""Read-only production/IAM fingerprint and isolated static baseline."""
import hashlib,json,os,subprocess,sys,tarfile
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next')
O=H/'staging/modulos-colunas-20261120';O.mkdir(parents=True,exist_ok=True)
mode=sys.argv[1];assert mode in ('before','after','count')
def query(sql,db='postgres'):
 return subprocess.check_output(['sudo','-u','postgres','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-d',db,'-c','BEGIN READ ONLY;'+sql+';ROLLBACK;'],text=True).strip()
counts=json.loads(query("SELECT json_build_object('total',count(*),'clients',count(*) FILTER (WHERE backend_type='client backend'),'idle',count(*) FILTER (WHERE state='idle'),'idle_in_transaction',count(*) FILTER (WHERE state='idle in transaction')) FROM pg_stat_activity"))
if mode=='count':print(json.dumps(counts));sys.exit()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
files={}
skip={'homolog-next','homolog','staging','backups','node_modules','.venv','venv','.git','__pycache__','uploads','storage','logs','data','private'}
for base,dirs,names in os.walk('/opt/concrefer-unificado'):
 dirs[:]=[d for d in dirs if d not in skip]
 for name in names:
  p=Path(base)/name
  if p.suffix.lower() in {'.html','.js','.css','.py','.json','.conf','.woff2','.png','.svg','.webmanifest'} and not any(x in name for x in ('.bak','.before','.env')):files[str(p)]=sha(p)
for folder in ['/etc/nginx/sites-enabled','/etc/nginx/snippets','/etc/systemd/system']:
 for p in Path(folder).glob('*'):
  if p.is_file() and (folder!='/etc/systemd/system' or p.suffix=='.service'):files[str(p)]=sha(p)
units=subprocess.check_output(['systemctl','list-units','--type=service','--all','--no-legend','--plain'],text=True)
names=[l.split()[0] for l in units.splitlines() if l and any(s in l.split()[0] for s in ['unificado','concrefer','laboratorio','qualidade','suprimentos'])]
services=subprocess.check_output(['systemctl','show',*names,'-p','Id','-p','MainPID','-p','ExecMainStartTimestamp','-p','ActiveState'],text=True)
iam={}
for db in ['mapa_visual_homolog_20261118','pcp_visual_homolog_20261118']:
 tables=['public.usuarios']+(['unificado_auth.'+t for t in ['user_screen_permissions','user_action_permissions','identity_links']] if db.startswith('mapa_') else [])
 for table in tables:iam[db+':'+table]=hashlib.sha256(query(f'COPY (SELECT row_to_json(t)::text AS row FROM {table} t ORDER BY row_to_json(t)::text) TO STDOUT',db).encode()).hexdigest()
result={'production_files':files,'services':services,'iam_homolog':iam,'counts':counts,'database_writes':0}
if mode=='before':
 assert not (O/'before.json').exists(),'baseline already exists; do not overwrite'
 public=H/'public/unificado'
 with tarfile.open(O/'public-before.tgz','w:gz') as t:
  for p in public.rglob('*'):
   if p.is_file() and p.suffix in {'.html','.js','.css','.json','.webmanifest'} or p.is_file() and p.name=='VERSION':t.add(p,arcname=p.relative_to(public))
else:
 before=json.loads((O/'before.json').read_text());old=before['production_files']
 differences=[p for p in sorted(set(old)|set(files)) if old.get(p)!=files.get(p)]
 result['production_differences']=differences
 def service_map(value):return {next(line[3:] for line in block.splitlines() if line.startswith('Id=')):block for block in value.split('\n\n') if 'Id=' in block and 'Id=unificado-visual-homolog-' not in block}
 previous=service_map(before['services']);current=service_map(services);timer_activity=[];unexpected=[]
 for name in sorted(set(previous)|set(current)):
  if previous.get(name)==current.get(name):continue
  props=subprocess.check_output(['systemctl','show',name,'-p','Type','-p','TriggeredBy'],text=True)
  observation={'unit':name,'properties':props,'before':previous.get(name),'after':current.get(name)}
  if 'Type=oneshot\n' in props and '.timer' in props:timer_activity.append(observation)
  else:unexpected.append(observation)
 result['services_raw_identical']=previous==current
 result['automatic_timer_activity']=timer_activity
 result['unexpected_service_changes']=unexpected
 result['services_unchanged']=not unexpected
 result['homolog_services_changed']=before['services']!=services
 result['iam_unchanged']=before['iam_homolog']==iam
 result['ok']=not differences and result['services_unchanged'] and result['iam_unchanged']
(O/(mode+'.json')).write_text(json.dumps(result,indent=2))
print(json.dumps({'mode':mode,'production_files':len(files),'counts':counts,'ok':result.get('ok'),'differences':result.get('production_differences',[])}))

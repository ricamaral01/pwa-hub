"""Production inventory. Filesystem reads and PostgreSQL READ ONLY transactions."""
import ast,hashlib,json,os,re,shlex,subprocess
from pathlib import Path
from urllib.parse import urlsplit
R=Path('/opt/concrefer-unificado');H=R/'homolog-next';S=H/'staging/producao-fase0-20261120'
def run(args):return subprocess.check_output(args,text=True,stderr=subprocess.PIPE)
def sql(db,query,container=None):
 command=['sudo','-u','postgres','psql','-d',db,'-X','-qAt','-v','ON_ERROR_STOP=1'] if not container else ['docker','exec','-i',container,'sh','-c','exec psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -X -qAt -v ON_ERROR_STOP=1']
 p=subprocess.run(command,input='BEGIN READ ONLY; SET LOCAL statement_timeout=20000; '+query+'; ROLLBACK;',text=True,capture_output=True)
 assert p.returncode==0,(db,p.stderr[:1500]);return json.loads(p.stdout)
def digest(p):return {'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
def files(root):
 result={}
 if not root.exists():return result
 for base,dirs,names in os.walk(root,followlinks=False):
  dirs[:]=[x for x in dirs if x not in ['.venv','.venv-py310','venv','node_modules','__pycache__','.git','python-runtimes']]
  for name in names:
   p=Path(base)/name
   if p.is_file():result[str(p)]=digest(p)
 return result
result={'version':(R/'public/unificado/VERSION').read_text().strip(),'read_only':True,'production_mutations':0,'files':{},'services':[],'nginx':{},'databases':{},'master_policy':{}}
roots=['public/unificado','mapa-api','logistica-api','pcp-api','laboratorio/service','dosagem-native','armacao-api','suprimentos/service','cq','/opt/qualidade/service','homolog/laboratorio/service/server/static/carta-traco']
for path in roots:result['files'][str(R/path)]=files(R/path)
for p in Path('/etc/nginx').rglob('*'):
 if not p.is_file():continue
 data=p.read_text(errors='replace');result['nginx'][str(p)]={**digest(p),'routes':[l.strip() for l in data.splitlines() if re.match(r'\s*(listen |server_name |root |alias |include |location |proxy_pass )',l) and not any(x in l.lower() for x in ['secret','password','token','credential'])]}
units=run(['systemctl','list-units','--type=service','--all','--no-legend','--plain'])
for line in units.splitlines():
 unit=line.split()[0]
 if not re.search('unificado|concrefer|suprimentos|laboratorio|qualidade|ged|usinas',unit):continue
 try:cfg=run(['systemctl','cat',unit])
 except subprocess.CalledProcessError:continue
 entry={'unit':unit,'homolog':bool(re.search('homolog',unit)),'working_directories':re.findall(r'^WorkingDirectory=(.*)$',cfg,re.M),'connections':[],'pool_options':[],'config_files':{},'runtime':run(['systemctl','show',unit,'-p','MainPID','-p','ActiveState','-p','FragmentPath','-p','DropInPaths','-p','ControlGroup'])}
 for name in re.findall(r'^# (/.*)$',cfg,re.M)+re.findall(r'^EnvironmentFile=-?(.*)$',cfg,re.M):
  p=Path(name.strip())
  if p.is_file():entry['config_files'][str(p)]=digest(p)
 for filename in re.findall(r'^EnvironmentFile=-?(.*)$',cfg,re.M):
  p=Path(filename.strip())
  if not p.is_file():continue
  for ln in p.read_text().splitlines():
   try:parts=shlex.split(ln)
   except ValueError:continue
   if len(parts)!=1 or '=' not in parts[0]:continue
   key,val=parts[0].split('=',1)
   if re.search('POOL|MAX_CONNECTION|WORKER',key):entry['pool_options'].append({'key':key,'value':val if re.fullmatch(r'[\d .,-]+',val) else '[non numeric]'})
   if re.search('DATABASE|DSN|DB_URL',key):
    try:u=urlsplit(val.replace('postgresql+psycopg://','postgresql://'))
    except ValueError:continue
    if u.scheme.startswith('postgres'):entry['connections'].append({'key':key,'host':u.hostname,'port':u.port or 5432,'database':u.path.lstrip('/'),'user':u.username})
 result['services'].append(entry)
cluster_query="""SELECT json_build_object('captured_at',clock_timestamp(),'max_connections',current_setting('max_connections')::int,'superuser_reserved_connections',current_setting('superuser_reserved_connections')::int,'reserved_connections',coalesce(current_setting('reserved_connections',true),'0')::int,'data_directory',current_setting('data_directory'),'databases',(SELECT json_agg(datname) FROM pg_database WHERE datallowconn AND NOT datistemplate),'sessions',(SELECT json_agg(t) FROM (SELECT datname,usename,application_name,state,pid,client_addr,client_port,backend_type,backend_start,xact_start,state_change FROM pg_stat_activity) t))"""
result['cluster']=sql('postgres',cluster_query)
sockets=run(['ss','-ntpH']);port_pids={}
for line in sockets.splitlines():
 parts=line.split()
 if len(parts)<5:continue
 local,peer=parts[3:5]
 if peer.endswith(':5432'):
  match=re.search(r'pid=(\d+)',line)
  if match:port_pids[int(local.rsplit(':',1)[1])]=int(match.group(1))
for row in result['cluster']['sessions']:
 pid=port_pids.get(row['client_port']);row['client_pid']=pid
 if pid:
  try:row['client_cgroup']=Path(f'/proc/{pid}/cgroup').read_text().strip()
  except FileNotFoundError:row['client_cgroup']='process ended during snapshot'
clients=sum(s['backend_type']=='client backend' for s in result['cluster']['sessions']);c=result['cluster'];c['client_backends']=clients;c['common_headroom']=c['max_connections']-c['superuser_reserved_connections']-c['reserved_connections']-clients
catalog_query="""SELECT json_build_object('tables',(SELECT coalesce(json_agg(t),'[]') FROM (SELECT n.nspname AS schema,c.relname AS name,c.relkind,pg_get_userbyid(c.relowner) AS owner,c.relacl::text AS acl FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','p','v','m','S') ORDER BY 1,2)t),'columns',(SELECT coalesce(json_agg(t),'[]') FROM (SELECT n.nspname AS schema,c.relname AS table_name,a.attname AS name,format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull AS not_null,a.attidentity AS identity,pg_get_expr(d.adbin,d.adrelid) AS default_expr FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE a.attnum>0 AND NOT a.attisdropped AND c.relkind IN ('r','p') AND n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' ORDER BY 1,2,a.attnum)t),'constraints',(SELECT coalesce(json_agg(t),'[]') FROM (SELECT n.nspname AS schema,c.relname AS table_name,k.conname AS name,k.contype AS kind,pg_get_constraintdef(k.oid,true) AS definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,3)t),'indexes',(SELECT coalesce(json_agg(t),'[]') FROM (SELECT schemaname AS schema,tablename AS table_name,indexname AS name,indexdef AS definition FROM pg_indexes WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,3)t))"""
dbnames=['mapa_unificado_teste','pcp_unificado_teste','concretrack_postes','suprimentos_prod','qualidade']
for db in dbnames:
 assert db in c['databases'],db
 cat=sql(db,catalog_query);cat['selected_rows']={};result['databases'][db]=cat
 for table in cat['tables']:
  schema,name=table['schema'],table['name'];full=schema+'.'+name
  if not re.search(r'alembic_version|schema_migration|migration_history|^user_units$|^unidades$|^ged_identity_links$|^sup_usuario_papel$|^sup_papel$|^sup_usuario$|^usuarios$|^users$|^user_screen_access$|^user_roles$|^usuario_modulo',name):continue
  cols=[col['name'] for col in cat['columns'] if col['schema']==schema and col['table_name']==name and not re.search('password|senha|secret|token|salt|credential|reset',col['name'],re.I)]
  if not cols:continue
  quoted=lambda s:'"'+s.replace('"','""')+'"'
  query='SELECT coalesce(json_agg(t),\'[]\') FROM (SELECT '+','.join(map(quoted,cols))+' FROM '+quoted(schema)+'.'+quoted(name)+' LIMIT 2000) t'
  cat['selected_rows'][full]=sql(db,query)
result['databases']['ged_postgres']=sql(None,catalog_query,'ged_postgres')
g=result['databases']['ged_postgres'];g['selected_rows']={}
for t in g['tables']:
 if re.search('user|identity|role|permission|company',t['name'],re.I) and t['relkind'] in ['r','p']:
  sch,name=t['schema'],t['name'];cols=[x['name'] for x in g['columns'] if x['schema']==sch and x['table_name']==name and not re.search('password|senha|secret|token|salt|credential|reset',x['name'],re.I)]
  q=lambda s:'"'+s.replace('"','""')+'"'
  g['selected_rows'][sch+'.'+name]=sql(None,'SELECT coalesce(json_agg(t),\'[]\') FROM (SELECT '+','.join(map(q,cols))+' FROM '+q(sch)+'.'+q(name)+' LIMIT 2000) t','ged_postgres')
namespace={};exec((S/'candidate/backend/master_policy.py').read_text(),namespace)
for file,var in [('mapa-api/screen_access.py','MASTER_USER_IDS'),('mapa-api/logistica_access.py','MASTERS'),('logistica-api/logistica/core.py','MASTERS')]:
 p=R/file;src=p.read_text();patched,meta=namespace['patch_master'](src,var);result['master_policy'][str(p)]=meta
result['disk']=run(['df','-B1','/opt/concrefer-unificado'])
print(json.dumps(result,ensure_ascii=True))

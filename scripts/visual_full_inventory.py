"""Inventory published code/configuration without opening a production database."""
import ast,hashlib,json,os,re,shlex,subprocess
from pathlib import Path
from urllib.parse import urlsplit
R=Path('/opt/concrefer-unificado');H=R/'homolog-next';O=H/'staging/visual-completo';O.mkdir(parents=True,exist_ok=True)
def files(root,suffix=None):
 out=[]
 if not root.exists():return out
 for base,dirs,names in os.walk(root):
  dirs[:]=[d for d in dirs if not any(x in d.lower() for x in ('venv','node_modules','__pycache__','backup','.git','uploads','storage','private'))]
  for n in names:
   p=Path(base)/n
   if n.startswith('.env') or n.endswith(('.env','.dump','.tgz','.zip')) or '.bak' in n or '.before-' in n:continue
   if suffix is None or p.suffix==suffix:out.append(p)
 return out
def routes(root):
 out=[]
 for p in files(root,'.py'):
  try:t=ast.parse(p.read_text())
  except Exception:continue
  for n in ast.walk(t):
   if not isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)):continue
   for d in n.decorator_list:
    if isinstance(d,ast.Call) and isinstance(d.func,ast.Attribute) and d.func.attr in ('route','get','post','put','delete','patch') and d.args and isinstance(d.args[0],ast.Constant):out.append({'file':str(p.relative_to(root)),'method':d.func.attr,'path':str(d.args[0].value),'function':n.name})
 return out
names=['mapa-api','pcp-api','armacao-api','logistica-api','hub-api','suprimentos','cq','dosagem-native','laboratorio','painel-tv-api']
mods=[]
for name in names:
 p=R/name;h=H/name;pr=routes(p);hr=routes(h);present={(x['method'],x['path']) for x in hr}
 mods.append({'module':name,'published_path':str(p),'homolog_candidate':str(h),'production_routes':pr,'homolog_routes':hr,'missing_routes':[x for x in pr if (x['method'],x['path']) not in present]})
services=subprocess.check_output(['systemctl','list-unit-files','--type=service','--no-legend'],text=True)
units=[line.split()[0] for line in services.splitlines() if re.search(r'(unificado|concrefer|suprimentos|laboratorio|qualidade|ged|usinas)',line) and not re.search(r'(backup|notify|notify|timer|notify)',line)]
configs=[]
for unit in units:
 raw=subprocess.check_output(['systemctl','cat',unit],text=True,stderr=subprocess.DEVNULL)
 entry={'service':unit,'working_directories':re.findall(r'^WorkingDirectory=(.*)$',raw,re.M),'environment_files':[]}
 for v in re.findall(r'^EnvironmentFile=-?(.*)$',raw,re.M):
  p=Path(v.strip());item={'path':str(p),'connections':[],'external_writing_keys_present':[]}
  if p.is_file():
   for line in p.read_text().splitlines():
    try:a=shlex.split(line)
    except Exception:continue
    if len(a)!=1 or '=' not in a[0]:continue
    k,val=a[0].split('=',1)
    if not val:continue
    if re.search(r'(DATABASE_URL|_DSN|_URL)$',k):
     u=urlsplit(val)
     if u.scheme:item['connections'].append({'key':k,'scheme':u.scheme,'host':u.hostname,'port':u.port,'database':u.path.lstrip('/') if u.scheme.startswith(('postgres','mysql')) else None})
    if re.search(r'(SMTP|MAIL|GOOGLE|SPREADSHEET|WEBHOOK|PUSH|OUTBOX)',k):item['external_writing_keys_present'].append(k)
  entry['environment_files'].append(item)
 configs.append(entry)
nginx={}
for key,filename in [('production','concrefer.concretrack.com.br'),('homolog','unificado-homolog.conf')]:
 p=Path('/etc/nginx/sites-enabled')/filename
 included=[p]+[Path(x) for x in re.findall(r'^\s*include (/etc/nginx/snippets/[^;]+);',p.read_text(),re.M)]
 nginx[key]=[{'file':str(f),'routing':[line.strip() for line in f.read_text().splitlines() if re.match(r'\s*(location|proxy_pass|root |alias |auth_request )',line)]} for f in included if f.is_file()]
pub=R/'public/unificado'
hashes={str(p.relative_to(pub)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files(pub)}
result={'modules':mods,'services':configs,'nginx':nginx,'production_public_hashes':hashes,'production_database_connections':0}
(O/'inventory.json').write_text(json.dumps(result,indent=2))
print(json.dumps({'modules':[{'module':m['module'],'published_routes':len(m['production_routes']),'missing_candidates':len(m['missing_routes'])} for m in mods],'services':len(configs),'published_static_files':len(hashes),'production_database_connections':0}))

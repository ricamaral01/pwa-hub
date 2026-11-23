"""Back up existing homolog DBs/files before functional parity changes."""
import hashlib,json,re,shutil,subprocess
from datetime import datetime,timezone
from pathlib import Path
R=Path('/opt/concrefer-unificado');H=R/'homolog-next';S=H/'staging/visual-completo'
dbs=['mapa_unificado_homolog_20261016','pcp_unificado_homolog_20261016','qualidade_homolog_20261016','concretrack_postes_homolog','suprimentos_homolog_20261025']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
marker=S/'backup-ready.json'
if marker.exists():print(marker.read_text());raise SystemExit
stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ');B=H/'backups'/('paridade-completa-'+stamp);B.mkdir(mode=0o700)
states={}
inv=json.loads((S/'inventory.json').read_text())
for unit in inv['services']:
 name=unit['service']
 if 'homolog' in name or 'staging' in name or 'backup' in name or 'suprimentos-' in name and not 'prod' in name:continue
 states[name]=subprocess.check_output(['systemctl','show',name,'-p','MainPID','-p','ExecMainStartTimestamp','-p','ActiveState'],text=True)
manifest=json.loads((S/'published-source-manifest.json').read_text())
prod={item['source']:sha(Path(item['source'])) for item in manifest.values()}
prod.update({str(p):sha(p) for p in (R/'public/unificado').rglob('*') if p.is_file()})
prod['/etc/nginx/sites-enabled/concrefer.concretrack.com.br']=sha(Path('/etc/nginx/sites-enabled/concrefer.concretrack.com.br'))
(B/'production-before.json').write_text(json.dumps({'files':prod,'services':states},indent=2))
result={'backup':str(B),'dumps':{},'homolog_files':{}}
for db in dbs:
 assert '_homolog' in db
 p=B/(db+'.dump')
 with p.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=f,check=True)
 p.chmod(0o600);assert 'TABLE DATA' in subprocess.check_output(['pg_restore','-l',str(p)],text=True)
 result['dumps'][db]={'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p)}
paths={Path(item['destination']) for item in manifest.values()}
paths.update(Path('/etc/concrefer-unificado/homolog').glob('*.env'))
paths.update(Path('/etc/nginx/snippets').glob('*homolog*'))
paths.add(Path('/etc/nginx/sites-enabled/unificado-homolog.conf'))
for p in paths:
 if not p.is_file():continue
 assert str(p).startswith(('/opt/concrefer-unificado/homolog','/etc/concrefer-unificado/homolog','/etc/nginx/'))
 dest=B/'files'/str(p).lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest);result['homolog_files'][str(p)]=sha(p)
marker.write_text(json.dumps(result,indent=2));print(json.dumps({'backup':str(B),'verified_dumps':{k:v['bytes'] for k,v in result['dumps'].items()},'homolog_files':len(result['homolog_files'])}))

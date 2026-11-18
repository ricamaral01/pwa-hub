"""Published endpoint alignment; all connections/writes limited to homologation."""
import hashlib,json,os,shlex,shutil,subprocess,tarfile,time
from pathlib import Path
from datetime import datetime,timezone
from urllib.parse import urlsplit
import psycopg

ROOT=Path('/opt/concrefer-unificado');HOM=ROOT/'homolog-next'
STAGE=HOM/'staging/visual-endpoints'
assert Path(__file__).resolve().parent==STAGE
def run(args,**kw):return subprocess.run(args,check=True,**kw)
def env(path):
 out={}
 for line in Path(path).read_text().splitlines():
  a=shlex.split(line)
  if len(a)==1 and '=' in a[0]:k,v=a[0].split('=',1);out[k]=v
 return out
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def prod():
 out={}
 for directory in [ROOT/'public/unificado',ROOT/'mapa-api',ROOT/'armacao-api']:
  for p in directory.rglob('*'):
   if p.is_file() and not any(x in p.parts for x in ['.venv','__pycache__']) and not p.name.endswith('.env'):
    out[str(p.relative_to(ROOT))]=sha(p)
 out['nginx']=sha(Path('/etc/nginx/sites-enabled/concrefer.concretrack.com.br'))
 out['services']=subprocess.check_output(['systemctl','show','concrefer-armacao.service','mapa-unificado-auth.service','pcp-unificado-test.service','-p','MainPID','-p','ExecMainStartTimestamp'],text=True)
 return out
pcp=env('/etc/concrefer-unificado/homolog/pcp.env');mapa=env('/etc/concrefer-unificado/homolog/mapa-auth.env')
dsns={'pcp':pcp['DATABASE_URL'],'mapa':mapa['MAPA_AUTH_DATABASE_URL']}
for k,dsn in dsns.items():
 u=urlsplit(dsn);assert u.hostname in ('localhost','127.0.0.1') and u.path==f'/{k}_unificado_homolog_20261016'
before=prod();stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
backup=HOM/'backups'/('visual-endpoints-'+stamp);backup.mkdir(mode=0o700)
(backup/'production-before.json').write_text(json.dumps(before))
grants={}
for k,dsn in dsns.items():
 with psycopg.connect(dsn) as db:
  if k=='mapa':
   for t in ['user_screen_permissions','user_action_permissions','identity_links']:
    grants[t]=sorted([repr(r) for r in db.execute('SELECT * FROM unificado_auth.'+t)])
 dump=backup/(k+'.dump')
 with dump.open('wb') as f:run(['sudo','-u','postgres','pg_dump','-Fc','-d',urlsplit(dsn).path[1:]],stdout=f)
 dump.chmod(0o600);assert 'TABLE DATA' in subprocess.check_output(['pg_restore','-l',str(dump)],text=True)
nginx=Path('/etc/nginx/sites-enabled/unificado-homolog.conf');shutil.copy2(nginx,backup/'nginx-homolog.conf')
app=HOM/'mapa-api/app.py';shutil.copy2(app,backup/'mapa-app.py')
# Copy only published source files, not production environment files or data.
target=HOM/'armacao-api';assert not target.exists();target.mkdir()
with tarfile.open(STAGE/'published.tgz') as a:
 for m in a.getmembers():assert '..' not in Path(m.name).parts and not m.issym()
 a.extractall(STAGE/'source')
shutil.copytree(STAGE/'source/armacao-api',target,dirs_exist_ok=True)
shutil.copy2(STAGE/'source/mapa-api/quick_access.py',HOM/'mapa-api/quick_access.py')
# Exact published registration, against the existing isolated app helpers.
registration='from quick_access import register as register_quick_access\nregister_quick_access(app, connect, authenticated_user, screen_access_state, unified_user_admin, MASTER_USER_IDS)\n'
assert registration in (ROOT/'mapa-api/app.py').read_text()
assert 'register_quick_access' not in app.read_text()
app.write_text(app.read_text()+'\n'+registration)
# Keep the published schema DDL, exclude production personal data and permissions.
sql=(ROOT/'staging/acesso-rapido-osmar-20261111/migration.sql').read_text()
ddl=sql[:sql.index('DO $$ BEGIN')]+'COMMIT;\n'
run(['sudo','-u','postgres','psql','-v','ON_ERROR_STOP=1','-d','mapa_unificado_homolog_20261016'],input=ddl,text=True,stdout=subprocess.DEVNULL)
(STAGE/'quick-access-schema-only.sql').write_text(ddl)
# Dedicated Python environment, same installed bytes as the published service.
run(['/usr/bin/python3.12','-m','venv',str(target/'.venv')])
shutil.copytree(ROOT/'armacao-api/.venv/lib/python3.12/site-packages',target/'.venv/lib/python3.12/site-packages',dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__'))
run([str(target/'.venv/bin/python'),'-m','pip','check'])
settings={'ARMACAO_DATABASE_URL':dsns['pcp'].replace('postgresql://','postgresql+psycopg://',1),'ARMACAO_IAM_DATABASE_URL':dsns['mapa'].replace('postgresql://','postgresql+psycopg://',1),'ARMACAO_MAPA_SIGNING_KEY':mapa['MAPA_AUTH_SIGNING_KEY'],'ARMACAO_ORIGIN':'https://concrefer.concretrack.com.br:18446','ARMACAO_PRIVATE_STORAGE':str(HOM/'armacao-storage')}
ef=Path('/etc/concrefer-unificado/homolog/armacao.env');assert not ef.exists()
ef.write_text(''.join(k+'='+shlex.quote(v)+'\n' for k,v in settings.items()));ef.chmod(0o600)
menv={**os.environ,**settings,'ARMACAO_MIGRATION_DATABASE_URL':settings['ARMACAO_DATABASE_URL']}
run([str(target/'.venv/bin/python'),'-m','alembic','upgrade','head'],cwd=target,env=menv)
storage=HOM/'armacao-storage';storage.mkdir(mode=0o700)
unit=Path('/etc/systemd/system/unificado-homolog-armacao.service');assert not unit.exists()
unit.write_text('[Unit]\nDescription=Unificado homolog Armacao isolated API\nAfter=postgresql.service\n[Service]\nWorkingDirectory='+str(target)+'\nEnvironmentFile='+str(ef)+'\nExecStart='+str(target/'.venv/bin/python')+' -m uvicorn armacao.main:app --host 127.0.0.1 --port 13168\nRestart=on-failure\nNoNewPrivileges=true\nPrivateTmp=true\nProtectSystem=strict\nReadWritePaths='+str(storage)+' /tmp\nIPAddressDeny=any\nIPAddressAllow=localhost\n[Install]\nWantedBy=multi-user.target\n')
snippet=Path('/etc/nginx/snippets/armacao-unificado-homolog.conf');assert not snippet.exists()
snippet.write_text('location ^~ /unificado/armacao/api/ {\n proxy_pass http://127.0.0.1:13168/api/;\n proxy_set_header Host $host;\n proxy_set_header X-Forwarded-Proto $scheme;\n proxy_set_header Cookie "mapa_unificado_session=$cookie_mapa_unificado_homolog_session";\n add_header Cache-Control "no-store" always;\n}\n')
text=nginx.read_text();anchor='    index index.html;';assert text.count(anchor)==1
nginx.write_text(text.replace(anchor,'    include '+str(snippet)+';\n'+anchor))
try:run(['nginx','-t'])
except Exception:
 shutil.copy2(backup/'nginx-homolog.conf',nginx);raise
run(['systemctl','daemon-reload']);run(['systemctl','enable','--now','unificado-homolog-armacao.service'])
run(['systemctl','restart','unificado-homolog-mapa.service']);run(['systemctl','reload','nginx'])
time.sleep(3)
with psycopg.connect(dsns['mapa']) as db:
 for t,v in grants.items():assert sorted(repr(r) for r in db.execute('SELECT * FROM unificado_auth.'+t))==v,t
assert before==prod(),'Production changed'
result={'backup':str(backup),'published_armacao_migrations':['a1_20261029','a6_20261029','a6b_20261029','a6c_20261030'],'mapa_migration':'published quick-access DDL only; personal seed and screen grants excluded','production_files_services_nginx_unchanged':True,'business_grants_unchanged':True,'homolog_service':'13168','databases':{k:urlsplit(v).path[1:] for k,v in dsns.items()},'dumps':{p.name:{'sha256':sha(p),'bytes':p.stat().st_size} for p in backup.glob('*.dump')}}
(STAGE/'results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))

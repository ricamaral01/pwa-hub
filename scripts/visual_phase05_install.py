"""Functional baseline sync. All writes and DB connections are homolog-only."""
import hashlib,importlib.metadata,json,os,re,shlex,shutil,subprocess,tarfile,time
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import psycopg
from psycopg import sql

ROOT=Path('/opt/concrefer-unificado')
HOM=ROOT/'homolog-next'
STAGE=HOM/'staging/padrao-visual-fase-0.5'
assert Path(__file__).resolve().parent==STAGE
DBS={'pcp':'pcp_unificado_homolog_20261016','mapa':'mapa_unificado_homolog_20261016'}
SERVICES=['unificado-homolog-pcp.service','unificado-homolog-mapa.service']
def run(args,**kwargs):return subprocess.run(args,check=True,**kwargs)
def env(path):
    result={}
    for line in Path(path).read_text().splitlines():
        parts=shlex.split(line)
        if parts and parts[0]=='export':parts=parts[1:]
        if len(parts)==1 and '=' in parts[0]:key,value=parts[0].split('=',1);result[key]=value
    return result
pcp=env('/etc/concrefer-unificado/homolog/pcp.env')
mapa=env('/etc/concrefer-unificado/homolog/mapa-auth.env')
for dsn,dbname in [(pcp['DATABASE_URL'],DBS['pcp']),(mapa['MAPA_AUTH_DATABASE_URL'],DBS['mapa'])]:
    u=urlsplit(dsn);assert u.hostname in ('127.0.0.1','localhost') and u.path=='/'+dbname
source=urlsplit(pcp['SUPABASE_URL']);assert source.hostname=='127.0.0.1' and source.port==13153
for key in ['GOOGLE_CREDENTIALS','SPREADSHEET_ID','SPREADSHEET_ID_09','SPREADSHEET_ID_10']:
    assert not pcp.get(key),('External integration configured',key)
with psycopg.connect(pcp['DATABASE_URL']) as db:
    assert db.execute('SELECT current_database()').fetchone()[0]==DBS['pcp']
    role=db.execute('SELECT current_user').fetchone()[0]
    old_relations=db.execute("SELECT schemaname,tablename FROM pg_tables WHERE schemaname IN ('public','producao')").fetchall()
assert re.fullmatch(r'[a-zA-Z_][a-zA-Z0-9_]*',role)

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def production_state():
    paths=[ROOT/'public/unificado',ROOT/'pcp-api/app',ROOT/'pcp-api/alembic',ROOT/'mapa-api']
    result={}
    for directory in paths:
        for p in sorted(directory.rglob('*')):
            if not p.is_file() or '__pycache__' in p.parts or p.name.startswith('.env'):continue
            if directory.name=='mapa-api' and (p.parent!=directory or p.suffix not in ('.py','.json')):continue
            result[str(p.relative_to(ROOT))]=sha(p)
    result['service_state']=subprocess.check_output(['systemctl','show','pcp-unificado-test.service','mapa-unificado-auth.service','-p','MainPID','-p','ExecMainStartTimestamp'],text=True)
    return result
before_prod=production_state()
with tarfile.open(STAGE/'release.tgz') as archive:
    for item in archive.getmembers():assert item.isfile() and item.name.startswith('release/') and '..' not in Path(item.name).parts
    archive.extractall(STAGE)
manifest=json.loads((STAGE/'release-manifest.json').read_text())
for relative,digest in manifest.items():
    assert relative.startswith(('public/unificado/','pcp-api/','mapa-api/'))
    assert sha(STAGE/'release'/relative)==digest,relative
    assert (HOM/relative).resolve().is_relative_to(HOM)
stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
backup=HOM/'backups'/('padrao-visual-fase-0.5-'+stamp);backup.mkdir(mode=0o700)
(backup/'production-before.json').write_text(json.dumps(before_prod,indent=2))
previous={}
for relative in manifest:
    target=HOM/relative;previous[relative]=sha(target) if target.is_file() else None
    if target.is_file():
        saved=backup/'files'/relative;saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target,saved)
(backup/'files-before.json').write_text(json.dumps(previous,indent=2))
for name,dbname in DBS.items():
    dump=backup/(name+'.dump')
    with dump.open('wb') as output:run(['sudo','-u','postgres','pg_dump','-Fc','-d',dbname],stdout=output)
    dump.chmod(0o600)
    listing=subprocess.check_output(['pg_restore','-l',str(dump)],text=True)
    assert 'TABLE DATA' in listing and dump.stat().st_size>1000
print(json.dumps({'backups_verified':str(backup),'databases':list(DBS.values())}),flush=True)

# Copy the exact seven missing library distributions, including their native
# libraries, from the published Python environment. Never execute its code.
prod_site=ROOT/'pcp-api/.venv-py310/lib/python3.10/site-packages'
hom_site=HOM/'pcp-api/.venv-py310/lib/python3.10/site-packages'
dependencies=json.loads((STAGE/'dependencies.json').read_text())
distributions={d.metadata['Name'].lower():d for d in importlib.metadata.distributions(path=[str(prod_site)])}
for name,version in dependencies['changes'].items():
    dist=distributions[name];assert dist.version==version
    for relative in dist.files or []:
        src=(prod_site/relative).resolve()
        if not src.is_relative_to(prod_site) or not src.is_file():continue
        dest=hom_site/src.relative_to(prod_site)
        if dest.exists():assert sha(src)==sha(dest),('Dependency collision',str(dest))
        else:dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
venv=HOM/'pcp-api/.venv-py310/bin/python'
run([str(venv),'-m','pip','check'])

def healthy(port,path):
    for _ in range(50):
        try:
            with urlopen(Request(f'http://127.0.0.1:{port}{path}',headers={'Host':'localhost'}),timeout=2) as response:
                if response.status==200:return
        except HTTPError as error:
            if port==13154 and error.code in (401,403):return
        except OSError:pass
        time.sleep(.4)
    raise RuntimeError(f'Homolog service {port} did not become ready')

stopped=False;migrated=False;attempted=False
try:
    run(['systemctl','stop',*SERVICES]);stopped=True
    migration_env={**os.environ,'DATABASE_URL':pcp['DATABASE_URL'],'HOMOLOG_RUNTIME_ROLE':role}
    attempted=True
    run([str(venv),str(STAGE/'visual_phase05_migrate.py')],cwd=STAGE,env=migration_env)
    migrated=True
    with psycopg.connect(pcp['DATABASE_URL']) as db:
        assert db.execute('SELECT current_database()').fetchone()[0]==DBS['pcp']
        assert db.execute('SELECT version_num FROM public.alembic_version').fetchone()[0]=='20261111_04'
    for relative in manifest:
        dest=HOM/relative;dest.parent.mkdir(parents=True,exist_ok=True);temp=dest.with_name(dest.name+'.phase05-next')
        shutil.copy2(STAGE/'release'/relative,temp);temp.chmod(0o644);os.replace(temp,dest)
    run(['python3',str(STAGE/'mark_unificado_homolog.py'),'--root',str(HOM/'public/unificado')])
    run(['systemctl','start',*SERVICES]);stopped=False
    healthy(13154,'/api/dashboard');healthy(13152,'/health')
    assert production_state()==before_prod,'Production files or service PIDs changed'
except BaseException:
    run(['systemctl','stop',*SERVICES]);stopped=True
    for relative,digest in previous.items():
        target=HOM/relative
        if digest is None:
            if target.is_file():target.unlink()
        else:shutil.copy2(backup/'files'/relative,target)
    if attempted:
        # This explicitly guarded rollback restores only the backed-up PCP
        # homologation DB. No production DSN is read or passed to a client.
        run(['sudo','-u','postgres','psql','-X','-v','ON_ERROR_STOP=1','-d',DBS['pcp'],'-c','DROP SCHEMA IF EXISTS producao CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public AUTHORIZATION pg_database_owner;'])
        run(['sudo','-u','postgres','pg_restore','--single-transaction','-d',DBS['pcp']],stdin=(backup/'pcp.dump').open('rb'))
    run(['systemctl','start',*SERVICES]);stopped=False
    raise
result={'status':'ok','backup':str(backup),'source_shell_version':'1.4.6','revision':'20261111_04','files':len(manifest),'databases':DBS,'nginx_changed':False,'production_unchanged':True,'phase1_started':False}
(STAGE/'deployment-results.json').write_text(json.dumps(result,indent=2));(backup/'deployment-results.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result),flush=True)

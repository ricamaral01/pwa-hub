"""Finish isolated dependencies found by the complete runtime screen matrix."""
import json, re, secrets, shlex, shutil, subprocess
from pathlib import Path
H = Path('/opt/concrefer-unificado/homolog-next')
G = H / 'visual-full'
S = H / 'staging/visual-completo'
E = Path('/etc/concrefer-unificado/homolog')
B = Path(json.loads((S / 'backup-ready.json').read_text())['backup'])
DB = 'dosagem_visual_homolog_20261118'

def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)

def sql(db, body):
    assert db in ('postgres', DB)
    return subprocess.check_output(['sudo','-u','postgres','psql','-XAt','-v','ON_ERROR_STOP=1','-d',db],input=body,text=True)

def env(name):
    values = {}
    for line in (E / ('visual-' + name + '.env')).read_text().splitlines():
        parts = shlex.split(line)
        if len(parts)==1 and '=' in parts[0]:
            k,v = parts[0].split('=',1)
            values[k]=v
    return values

def save(name, values):
    p=E/('visual-'+name+'.env')
    if p.exists() and not (B / ('before-phase7-'+p.name)).exists():
        shutil.copy2(p,B/('before-phase7-'+p.name))
    p.write_text(''.join(k+'='+shlex.quote(v)+'\n' for k,v in values.items()))
    p.chmod(0o600)

if sql('postgres',f"SELECT count(*) FROM pg_database WHERE datname='{DB}';").strip()=='0':
    run(['sudo','-u','postgres','createdb',DB])
    with (B/(DB+'-before-restore.dump')).open('wb') as output:
        run(['sudo','-u','postgres','pg_dump','-Fc',DB],stdout=output)
if sql(DB,"SELECT count(*) FROM information_schema.tables WHERE table_schema='public';").strip()=='0':
    with Path('/root/dosagem-native-source.dump').open('rb') as source:
        run(['sudo','-u','postgres','pg_restore','--no-owner','--no-acl','--single-transaction','--exit-on-error','-d',DB],stdin=source)
if not (S/'phase7-dosagem-database.json').exists():
    role='visual_dosagem_homolog_app'
    password=secrets.token_urlsafe(36)
    sql('postgres',f"CREATE ROLE {role} LOGIN PASSWORD '{password}';")
    sql(DB,f'GRANT CONNECT ON DATABASE {DB} TO {role}; GRANT USAGE ON SCHEMA public TO {role}; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO {role}; GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO {role};')
    conf=env('dosagem')
    conf['DATABASE_URL']=f'postgresql+psycopg://{role}:{password}@127.0.0.1:5432/{DB}'
    conf['DATABASE_SCHEMA']=''  # The published offline native source uses public.
    save('dosagem',conf)
    (S/'phase7-dosagem-database.json').write_text(json.dumps({'database':DB,'offline_source':'/root/dosagem-native-source.dump','snapshot':'2026-10-22','schema':'public','application_permissions_changed':False}))
run(['systemctl','restart','unificado-visual-homolog-dosagem.service'])

monitor=G/'monitor'
monitor.mkdir(exist_ok=True)
if not (S/'phase7-monitor-snapshot.json').exists():
    # File snapshot only: no production API, process or SQL database is opened.
    source=Path('/opt/monitor_concreto/data')
    target=monitor/'data'
    for name in ('config','readings'):
        if (source/name).exists():shutil.copytree(source/name,target/name,dirs_exist_ok=True)
    (S/'phase7-monitor-snapshot.json').write_text(json.dumps({'source':str(source),'target':str(target),'files':sum(p.is_file() for p in target.rglob('*')),'device_ingest_published':False,'source_files_modified':False}))
lab=env('laboratorio')
if not (E/'visual-monitor.env').exists():
    lab['ADMIN_API_KEY']=secrets.token_urlsafe(48)
    lab['DATA_DIR']=str(monitor/'data')
    save('laboratorio',lab)
    save('monitor',{'LAB_UNIFIED_COPY':'0','DATA_DIR':str(monitor/'data'),
        'ADMIN_API_KEY':lab['ADMIN_API_KEY'],'DEVICE_API_KEY':secrets.token_urlsafe(48),'DATABASE_URL':''})
p=G/'laboratorio/server/app.py'
source=p.read_text()
if "'http://127.0.0.1:8088' + path" in source:
    shutil.copy2(p,B/'laboratorio-app-before-phase7-monitor.py')
    p.write_text(source.replace("'http://127.0.0.1:8088' + path","'http://127.0.0.1:14190' + path"))
unit=Path('/etc/systemd/system/unificado-visual-homolog-monitor.service')
unit.write_text('[Unit]\nDescription=Isolated offline temperature monitor\n[Service]\nWorkingDirectory='+str(G/'laboratorio')+
    '\nEnvironmentFile='+str(E/'visual-monitor.env')+'\nExecStart='+str(G/'laboratorio/.venv/bin/python')+
    ' -m uvicorn server.app:app --host 127.0.0.1 --port 14190\nRestart=on-failure\nNoNewPrivileges=true\nPrivateTmp=true\nProtectHome=true\nProtectSystem=strict\nReadWritePaths='+str(monitor)+
    '\nIPAddressDeny=any\nIPAddressAllow=localhost\n')
run(['systemctl','daemon-reload'])
run(['systemctl','restart',unit.name])
run(['systemctl','restart','unificado-visual-homolog-laboratorio.service'])

p=Path('/etc/nginx/snippets/visual-full-unificado-screen-access-homolog.conf')
old=p.read_text()
if 'location = /unificado/pcp/fechamento-diario/data.json' not in old:
    shutil.copy2(p,B/'screen-access-before-phase7-pcp-closing.conf')
    p.write_text(old+'''
    location = /unificado/pcp/fechamento-diario/data.json {
        auth_request /unificado/screen-authorize;
        error_page 401 403 = @unificado_api_denied;
        limit_except GET HEAD { deny all; }
        proxy_pass http://127.0.0.1:14189/api/relatorios/fechamento-diario;
        proxy_set_header Host $host;
        proxy_set_header Cookie "";
        add_header Cache-Control "no-store" always;
    }
''')
    try:
        run(['nginx','-t'],capture_output=True)
        run(['systemctl','reload','nginx'])
    except Exception:
        p.write_text(old)
        raise
result={'dosagem_database':DB,'monitor_loopback_port':14190,'monitor_snapshot':'filesystem copy; no live device collection',
        'pcp_closing_report':'same published ERP implementation; isolated 14189',
        'production_database_connections':0,'production_service_changes':False,'application_permissions_changed':False}
(S/'phase7-services.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))

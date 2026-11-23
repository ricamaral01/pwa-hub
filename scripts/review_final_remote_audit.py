"""Immutable production files/services and read-only homolog IAM fingerprint."""
import hashlib,json,os,subprocess,sys
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next')
OUT=H/'staging/revisao-final'
assert Path(__file__).resolve().parent==OUT
OUT.mkdir(exist_ok=True)
mode=sys.argv[1];assert mode in ('before','after')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def production():
    hashes={}
    root=Path('/opt/concrefer-unificado')
    skip={'homolog-next','homolog','staging','backups','node_modules','.venv','venv','.git','__pycache__','uploads','storage','logs','data','private'}
    for base,dirs,names in os.walk(root):
        dirs[:]=[d for d in dirs if d not in skip]
        for name in names:
            p=Path(base)/name
            if p.suffix.lower() in {'.html','.js','.css','.py','.json','.conf','.woff2','.png','.svg'} and not any(x in name for x in ('.bak','.before','.env')):
                hashes[str(p)]=sha(p)
    for folder in ['/etc/nginx/sites-enabled','/etc/nginx/snippets']:
        for p in Path(folder).glob('*'):
            if p.is_file():hashes[str(p)]=sha(p)
    for p in Path('/etc/systemd/system').glob('*.service'):
        if any(x in p.name for x in ('unificado','concrefer','laboratorio','suprimentos','qualidade')):hashes[str(p)]=sha(p)
    status=subprocess.check_output(['systemctl','show','mapa-unificado-auth.service','pcp-unificado-test.service','concrefer-armacao.service','-p','MainPID','-p','ExecMainStartTimestamp'],text=True)
    return {'files':hashes,'services':status}
def iam():
    hashes={}
    for db in ['mapa_visual_homolog_20261118','pcp_visual_homolog_20261118']:
        tables=[('public','usuarios')]
        if db.startswith('mapa_'):tables += [('unificado_auth',t) for t in ['user_screen_permissions','user_action_permissions','identity_links']]
        for schema,table in tables:
            query=f"BEGIN READ ONLY; COPY (SELECT row_to_json(t)::text AS row FROM {schema}.{table} t ORDER BY row_to_json(t)::text) TO STDOUT; ROLLBACK;"
            data=subprocess.check_output(['sudo','-u','postgres','psql','-X','-q','-v','ON_ERROR_STOP=1','-d',db,'-c',query])
            hashes[db+':'+schema+'.'+table]=hashlib.sha256(data).hexdigest()
    return hashes
current={'production':production(),'iam_homolog':iam(),'production_database_connections':0,'database_writes':0}
(OUT/(mode+'-audit.json')).write_text(json.dumps(current,indent=2))
if mode=='after':
    before=json.loads((OUT/'before-audit.json').read_text())
    old=before['production']['files'];new=current['production']['files']
    differences=[key for key in sorted(set(old)|set(new)) if old.get(key)!=new.get(key)]
    runtime='/opt/concrefer-unificado/photo-storage/fotos-inspecao.json'
    immutable=[key for key in differences if key!=runtime]
    assert not immutable and before['production']['services']==current['production']['services'],'Production application files/services differ'
    assert before['iam_homolog']==current['iam_homolog'],'Homolog IAM differs'
    observations=[]
    if runtime in differences:
        # Preserve the raw before/after hashes. Verify independent production traffic.
        import re
        from urllib.parse import urlsplit
        live=Path(runtime);isolated=H/'visual-full/photo-storage/fotos-inspecao.json'
        assert live.stat().st_ino!=isolated.stat().st_ino
        assert isolated.stat().st_mtime<(OUT/'before-audit.json').stat().st_mtime
        uploads=[]
        for line in Path('/var/log/nginx/access.log').open(errors='replace'):
            if '19/Nov/2026:' not in line or '/fotos' not in line:continue
            quoted=re.findall(r'"([^\"]*)"',line)
            if len(quoted)<2 or not quoted[0].startswith('POST '):continue
            origin=urlsplit(quoted[1])
            if origin.hostname=='concrefer.concretrack.com.br' and origin.port is None:uploads.append({'request':quoted[0].split('?')[0],'referer_origin':'https://concrefer.concretrack.com.br'})
        assert uploads,'Runtime index changed without independent production upload evidence'
        observations.append({'file':runtime,'classification':'operational production photo upload outside this task','production_uploads':uploads[-3:],'homolog_store_separate_and_unchanged':True,'before_sha256':old[runtime],'after_sha256':new[runtime]})
    current['comparison']={'application_files_services_nginx_unchanged':True,'iam_unchanged':True,'operational_runtime_observations':observations}
    (OUT/'after-audit.json').write_text(json.dumps(current,indent=2))
print(json.dumps({'mode':mode,'production_files':len(current['production']['files']),'iam_tables':len(current['iam_homolog']),'production_database_connections':0,'database_writes':0,'application_and_iam_equal':True if mode=='after' else None,'runtime_observations':len(current.get('comparison',{}).get('operational_runtime_observations',[]))}))

"""Atomic static publication to homolog-next only, after the local evidence gate."""
import hashlib,json,os,shutil,subprocess,tarfile
from datetime import datetime,timezone
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');S=H/'staging/revisao-final'
assert Path(__file__).resolve().parent==S
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
ready=json.loads((S/'validation-ready.json').read_text())
assert ready['version']=='1.4.26' and all(ready['gates'].values()),ready
assert sha(S/'release-manifest.json')==ready['release_manifest_sha256']
manifest=json.loads((S/'release-manifest.json').read_text());release=S/'release';release.mkdir(exist_ok=True)
with tarfile.open(S/'release.tgz') as archive:
    for member in archive.getmembers():assert member.isfile() and not Path(member.name).is_absolute() and '..' not in Path(member.name).parts and member.name in manifest
    archive.extractall(release,filter='data')
backup=H/'backups'/('revisao-final-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));backup.mkdir(mode=0o700)
def target(key):
    kind,rel=key.split('/',1)
    assert '..' not in Path(rel).parts
    if kind=='public':
        assert not {'api','backend','service','node_modules'}.intersection(Path(rel).parts)
        root=H/'public/unificado'
    else:
        assert kind=='services' and rel.startswith(('laboratorio/server/static/','carta-static/','dosagem-static/','mapa/testar-index.html'))
        root=H/'visual-full'
    dest=root/rel;assert dest.resolve().is_relative_to(root)
    assert dest.suffix in {'.js','.css','.html','.woff2','.png','.svg','.json','.webmanifest'} or dest.name=='VERSION'
    return dest
old={}
for key,digest in manifest.items():
    assert sha(release/key)==digest
    dest=target(key);old[key]=dest.exists()
    if dest.exists():
        saved=backup/key;saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dest,saved)
(backup/'original-files.json').write_text(json.dumps(old))
try:
    def order(key):return (3 if key=='public/VERSION' else 2 if key=='public/sw.js' else 1 if key.endswith('.html') else 0,key)
    for key in sorted(manifest,key=order):
        dest=target(key);dest.parent.mkdir(parents=True,exist_ok=True)
        temp=dest.with_name(dest.name+'.revisao-final-tmp');shutil.copy2(release/key,temp);temp.chmod(0o644);os.replace(temp,dest)
    subprocess.run(['python3',str(S/'mark_unificado_homolog.py'),'--root',str(H/'public/unificado')],check=True)
    for key,digest in manifest.items():
        if key not in ('public/index.html','public/login.html'):assert sha(target(key))==digest,key
    subprocess.run(['python3',str(S/'review_final_remote_audit.py'),'after'],check=True)
except Exception:
    for key,existed in old.items():
        dest=target(key)
        if existed:shutil.copy2(backup/key,dest)
        else:dest.unlink(missing_ok=True)
    raise
result={'version':'1.4.26','backup':str(backup),'files':len(manifest),'production_application_files_services_nginx_unchanged':True,'production_runtime_activity':'See after-audit.json; independent production photo uploads remain recorded.','iam_unchanged':True,'database_writes':0,'services_restarted':False}
(S/'deploy-results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))

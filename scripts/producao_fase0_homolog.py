"""Test the production artefact on 18446; do not touch production or databases."""
import hashlib,json,os,shutil,subprocess,tarfile
from datetime import datetime,timezone
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');S=H/'staging/producao-fase0-20261120';D=S/'candidate';D.mkdir(exist_ok=True)
manifest=json.loads((S/'candidate-manifest.json').read_text());baseline=json.loads((S/'source-manifest.json').read_text())
count=int(subprocess.check_output(['sudo','-u','postgres','psql','-X','-qAt','-c','BEGIN READ ONLY; SELECT count(*) FROM pg_stat_activity; ROLLBACK;'],text=True).strip());assert count<=80,('CAPACITY_STOP',count)
with tarfile.open(S/'candidate.tgz') as a:
 for m in a.getmembers():assert m.isfile() and m.name in manifest and not Path(m.name).is_absolute() and '..' not in Path(m.name).parts
 a.extractall(D,filter='data')
def target(key):
 kind,rel=key.split('/',1);assert kind in ['public','services']
 root=H/('public/unificado' if kind=='public' else 'visual-full');p=root/rel;assert p.resolve().is_relative_to(root);return p
def expected(key):
 raw=(D/key).read_bytes();assert hashlib.sha256(raw).hexdigest()==manifest[key]['sha256']
 if key in ['public/index.html','public/login.html']:
  s=raw.decode('utf-8');style='<style>.test-environment-bar{position:relative;z-index:9999;padding:6px 12px;background:#fff3cd;color:#664d03;text-align:center;font:600 12px sans-serif}body{padding-top:31px}</style>';return s.replace('</head>',style+'</head>').replace('<body>','<body><div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>').encode('utf-8')
 return raw
files=[k for k in manifest if k.startswith(('public/','services/'))];B=H/'backups'/('freeze-production-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));B.mkdir(mode=0o700)
for key in files:
 p=target(key);assert p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest()==baseline[key]['sha256'],('concurrent homolog change',key)
 dest=B/key;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
(B/'original-files.json').write_text(json.dumps({k:True for k in files},indent=2))
try:
 for key in sorted(files,key=lambda k:(3 if k=='public/VERSION' else 2 if k=='public/sw.js' else 1 if k.endswith('.html') else 0,k)):
  p=target(key);tmp=p.with_name(p.name+'.freeze-tmp');tmp.write_bytes(expected(key));tmp.chmod(0o644);os.replace(tmp,p)
 for key in files:assert hashlib.sha256(target(key).read_bytes()).hexdigest()==hashlib.sha256(expected(key)).hexdigest()
except Exception:
 for key in files:shutil.copy2(B/key,target(key))
 raise
receipt={'version':'1.4.30','backup':str(B),'static_files':len(files),'test_files_deleted':False,'homolog_banner_outside_production_artefact':True,'production_changes':0,'database_changes':0,'service_restarts':0,'cluster_total':count}
(S/'homolog-deployment.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))

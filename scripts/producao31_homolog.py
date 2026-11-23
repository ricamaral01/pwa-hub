"""Publish/rehearse static files on 18446 only. Never writes production or SQL."""
import hashlib,json,os,shutil,subprocess,sys,tarfile,time
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');S=H/'staging/producao-1.4.31';D=S/'candidate';mode=sys.argv[1] if len(sys.argv)>1 else 'publish';assert mode in ['publish','previous','candidate']
n=int(subprocess.check_output(['sudo','-u','postgres','psql','-X','-qAt','-c','BEGIN READ ONLY;SELECT count(*) FROM pg_stat_activity;ROLLBACK;'],text=True).strip());assert n<=80,('CAPACITY_STOP',n)
m=json.loads((S/'candidate-manifest.json').read_text());keys=[k for k in m if k.startswith(('public/','services/'))];assert len(keys)==348
def target(k):
 kind,rel=k.split('/',1);root=H/('public/unificado' if kind=='public' else 'visual-full');p=root/rel;assert p.resolve().is_relative_to(root);return p
def raw_hash(p):
 data=p.read_bytes()
 if p.name in ['index.html','login.html'] and p.parent==H/'public/unificado':
  import re
  text=data.decode();text=re.sub(r'<style>\.test-environment-bar\{position:relative;.*?</style>','',text,flags=re.S);text=re.sub(r'<div class="test-environment-bar">.*?</div>','',text,flags=re.S);data=text.encode()
 return hashlib.sha256(data).hexdigest()
def expected(k):
 data=(D/k).read_bytes();assert hashlib.sha256(data).hexdigest()==m[k]['sha256'],k
 if k in ['public/index.html','public/login.html']:
  style='<style>.test-environment-bar{position:relative;z-index:9999;padding:6px 12px;background:#fff3cd;color:#664d03;text-align:center;font:600 12px sans-serif}body{padding-top:31px}</style>';data=data.decode().replace('</head>',style+'</head>').replace('<body>','<body><div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>').encode()
 return data
def put(k,data):
 p=target(k);tmp=p.with_name(p.name+'.release31-tmp');tmp.write_bytes(data);tmp.chmod(0o644);os.replace(tmp,p)
if mode=='publish':
 D.mkdir(exist_ok=True)
 with tarfile.open(S/'candidate.tgz') as tar:
  for member in tar.getmembers():assert member.isfile() and member.name in m and '..' not in Path(member.name).parts
  tar.extractall(D,filter='data')
 previous=json.loads((S/('published-manifest.json' if (S/'published-manifest.json').exists() else 'old-manifest.json')).read_text())
 for k in keys:assert raw_hash(target(k))==previous[k]['sha256'],('Concurrent homolog change',k)
 B=H/'backups'/('candidata-1.4.31-'+str(int(time.time())));B.mkdir(mode=0o700)
 for k in keys:
  p=B/k;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target(k),p)
 if not (S/'original-30-backup.txt').exists():(S/'original-30-backup.txt').write_text(str(B))
 try:
  for k in sorted(keys,key=lambda k:(k=='public/VERSION',k)):put(k,expected(k))
  for k in keys:assert raw_hash(target(k))==m[k]['sha256'],k
 except Exception:
  for k in keys:shutil.copy2(B/k,target(k))
  raise
 shutil.copy2(S/'candidate-manifest.json',S/'published-manifest.json');receipt={'version':'1.4.31','backup':str(B),'static_files':len(keys),'connections':n,'production_changes':0,'database_changes':0,'restarts':0};(S/'homolog-receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))
elif mode=='previous':
 B=Path((S/'original-30-backup.txt').read_text());assert B.parent==H/'backups'
 for k in sorted(keys,key=lambda k:(k=='public/VERSION',k)):put(k,(B/k).read_bytes())
 assert (H/'public/unificado/VERSION').read_text().strip()=='1.4.30';print(json.dumps({'version':'1.4.30','production_changes':0}))
else:
 for k in sorted(keys,key=lambda k:(k=='public/VERSION',k)):put(k,expected(k))
 for k in keys:assert raw_hash(target(k))==m[k]['sha256'],k
 print(json.dumps({'version':'1.4.31','static_hashes_verified':348,'production_changes':0}))

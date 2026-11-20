"""Build 1.4.31 from immutable 1.4.30, overlaying only the authorized search fix."""
import hashlib,json,re,subprocess,tarfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];P=R/'docs/revisao-visual-unificado/producao-20261120';O=P/'retomada-2';B=R/'.codex-tmp/producao-1.4.31';D=B/'candidate';OLD=R/'.codex-tmp/producao-20261120/candidate'
O.mkdir(exist_ok=True);assert not (O/'frozen.json').exists(),'Candidate already frozen';D.mkdir(parents=True,exist_ok=True)
old_manifest=json.loads((P/'candidate-manifest.json').read_bytes());manifest={};changed=[]
for key,old in old_manifest.items():
 raw=(OLD/key).read_bytes();assert hashlib.sha256(raw).hexdigest()==old['sha256'],key;new=raw
 if key in ['public/shell/busca.js','public/shell/navigation.js']:
  text=(R/'unificado'/key[7:]).read_text(encoding='utf-8').replace('\r\n','\n')
  if key.endswith('busca.js'):
   needle="if(!route||!allowed(route)||(!homolog&&(item.ambiente==='homolog'||route.ambiente==='homolog'||item.id==='testeProgramacao')))continue;";assert needle in text
   text=text.replace(needle,"if(!route||!allowed(route)||(!homolog&&((item.ambiente&&item.ambiente!=='producao')||(route.ambiente&&route.ambiente!=='producao'))))continue;").replace("homolog=location.port==='18446'",'homolog=false').replace('homolog','allowOtherEnvironment')
  new=text.encode()
 if Path(key).suffix in ['.html','.js','.css','.json','.webmanifest','.py','.sql'] or key=='public/VERSION':new=new.decode('utf-8').replace('1.4.30','1.4.31').encode('utf-8')
 if key=='policy/production-policy.json':
  policy=json.loads(new);policy.update(armacao='preserve production enabled:true; no UPDATE',fck='preserve production value and DEFAULT 25',backend_targets={},frontend_only=True);new=json.dumps(policy,ensure_ascii=False,indent=2).encode()
 if key.startswith(('public/','services/')) and Path(key).suffix in ['.html','.js','.css','.json']:
  text=new.decode();assert not any(s in text.lower() for s in ['18446','visual_homolog','_homolog_','ambiente de teste','teste-revisao-completa','user-alex','testeprogramacao','teste-programacao']),key
 dest=D/key;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(new);manifest[key]={'bytes':len(new),'sha256':hashlib.sha256(new).hexdigest()}
 if raw!=new:changed.append({'file':key,'before_sha256':old['sha256'],'after_sha256':manifest[key]['sha256']})
assert (D/'public/VERSION').read_text().strip()=='1.4.31'
for key in manifest:
 if key.startswith('public/') and key.endswith('.js'):
  raw=(D/key).read_bytes();module=bool(re.search(rb'^\s*(?:export|import)\s+(?!\()',raw,re.M));p=subprocess.run(['node','--check',*(['--input-type=module'] if module else [])],input=raw,capture_output=True);assert p.returncode==0,(key,p.stderr.decode())
(O/'candidate-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8');(O/'changes-from-1.4.30.json').write_text(json.dumps(changed,indent=2),encoding='utf-8')
with tarfile.open(O/'candidate.tgz','w:gz') as tar:
 for key in sorted(manifest):tar.add(D/key,arcname=key)
print(json.dumps({'version':'1.4.31','files':len(manifest),'static_files':sum(k.startswith(('public/','services/')) for k in manifest),'changed_from_30':len(changed),'archive_sha256':hashlib.sha256((O/'candidate.tgz').read_bytes()).hexdigest()}))

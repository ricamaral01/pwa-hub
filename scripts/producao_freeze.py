"""Record immutable candidate after checking the tested staging bytes."""
import hashlib,json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/producao-20261120'
assert not (O/'frozen.json').exists()
remote=r'''import hashlib,json
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');S=H/'staging/producao-fase0-20261120'
m=json.loads((S/'candidate-manifest.json').read_text());checked=[]
for key,meta in m.items():
 if not key.startswith(('public/','services/')):continue
 kind,rel=key.split('/',1);p=H/('public/unificado' if kind=='public' else 'visual-full')/rel;raw=p.read_bytes()
 if key in ['public/index.html','public/login.html']:
  import re
  text=raw.decode();text=re.sub(r'<style>\.test-environment-bar\{position:relative;.*?</style>','',text,flags=re.S);text=re.sub(r'<div class="test-environment-bar">.*?</div>','',text,flags=re.S);raw=text.encode()
 assert len(raw)==meta['bytes'] and hashlib.sha256(raw).hexdigest()==meta['sha256'],key
 checked.append(key)
print(json.dumps({'static_files_verified':len(checked),'manifest_files':len(m),'archive_sha256':hashlib.sha256((S/'candidate.tgz').read_bytes()).hexdigest()}))
'''
p=subprocess.run(['ssh','vps-concrefer','python3','-'],input=remote.encode(),capture_output=True);assert p.returncode==0,p.stderr.decode()
verified=json.loads(p.stdout);assert verified['static_files_verified']==348
assert json.loads((O/'phase0-validation.json').read_text())['ok']
assert verified['archive_sha256']==hashlib.sha256((O/'candidate.tgz').read_bytes()).hexdigest()
frozen={'version':'1.4.30','tag':'candidata-producao-1.4.30','archive':'candidate.tgz','archive_bytes':(O/'candidate.tgz').stat().st_size,'archive_sha256':verified['archive_sha256'],'manifest_sha256':hashlib.sha256((O/'candidate-manifest.json').read_bytes()).hexdigest(),'verification':verified,'source':'live 18446 source capture, explicit production exclusions tested on 18446','no_further_candidate_changes':True}
(O/'frozen.json').write_text(json.dumps(frozen,indent=2),encoding='utf-8')
status=json.loads((O/'STATUS.json').read_text());status.update(phase='1: production read-only inventory',candidate_frozen=True,completed_phases=[0],next='Read-only production inventory; verified backups and staging rollback rehearsal; stop if any checkpoint fails before production changes.')
(O/'STATUS.json').write_text(json.dumps(status,indent=2),encoding='utf-8')
# Stage just the PCP decision, retaining other unrelated worktree changes.
head=subprocess.check_output(['git','show','HEAD:unificado/shell/shell.js'])
needle=b"  if (route.ambiente === 'homolog' && location.port !== '18446') return false;\n"
assert head.count(needle)==1
staged=head.replace(needle,needle+b"  if (route.id === 'indicadorGeralProducao' && pcpUser?.nivel_acesso === 'PCP') return false;\n")
blob=subprocess.check_output(['git','hash-object','-w','--stdin'],input=staged).decode().strip()
subprocess.run(['git','update-index','--cacheinfo','100644',blob,'unificado/shell/shell.js'],check=True)
print(json.dumps(frozen))

"""Freeze only after staging proofs and production read-only preflight pass."""
import hashlib,json,subprocess
from producao31_common import R,P,O,B,D,S,remote,save
assert not (O/'frozen.json').exists()
for name in ['dynamic-validation.json','matrix-homolog.json','rollback-rehearsal.json','preflight.json','cq-lab-frontend-audit.json','cq-production-before.json']:assert json.loads((O/name).read_bytes())['ok'],name
assert len(json.loads((O/'queries-homolog.json').read_bytes()))>=52
m=json.loads((O/'candidate-manifest.json').read_bytes())
code="import json,hashlib,re\nfrom pathlib import Path\nH=Path('/opt/concrefer-unificado/homolog-next');m="+repr(m)+'''\nn=0
for key,meta in m.items():
 if not key.startswith(('public/','services/')):continue
 kind,rel=key.split('/',1);p=H/('public/unificado' if kind=='public' else 'visual-full')/rel;data=p.read_bytes()
 if key in ['public/index.html','public/login.html']:
  text=data.decode();text=re.sub(r'<style>\.test-environment-bar\{position:relative;.*?</style>','',text,flags=re.S);text=re.sub(r'<div class="test-environment-bar">.*?</div>','',text,flags=re.S);data=text.encode()
 assert len(data)==meta['bytes'] and hashlib.sha256(data).hexdigest()==meta['sha256'],key
 n+=1
print(json.dumps({'static_files':n,'all_hashes_verified':True}))'''
verified=remote(code);assert verified['static_files']==348
frozen={'version':'1.4.31','tag':'candidata-producao-1.4.31','archive':'candidate.tgz','archive_bytes':(O/'candidate.tgz').stat().st_size,'archive_sha256':hashlib.sha256((O/'candidate.tgz').read_bytes()).hexdigest(),'manifest_sha256':hashlib.sha256((O/'candidate-manifest.json').read_bytes()).hexdigest(),'manifest_files':len(m),'verification':verified,'source':'immutable 1.4.30 plus authorized frontend-only dynamic menu/search correction and version stamps','no_more_frontend_changes':True};save('frozen.json',frozen)
head=subprocess.check_output(['git','show','HEAD:unificado/shell/shell.js']);assert b'1.4.30' in head;blob=subprocess.check_output(['git','hash-object','-w','--stdin'],input=head.replace(b'1.4.30',b'1.4.31')).decode().strip();subprocess.run(['git','update-index','--cacheinfo','100644',blob,'unificado/shell/shell.js'],check=True)
status=json.loads((O/'STATUS.json').read_bytes());status.update(phase='candidate frozen; prepare recovery metadata and final checkpoint',candidate_frozen=True,next='Update existing backup recovery plan for 1.4.31, verify final checkpoint, then publish without additional approval.');save('STATUS.json',status)
main=json.loads((P/'STATUS.json').read_bytes());main.update(version='1.4.31',phase=status['phase'],latest_report='retomada-2/RELATORIO.html',next=status['next']);(P/'STATUS.json').write_text(json.dumps(main,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(frozen))

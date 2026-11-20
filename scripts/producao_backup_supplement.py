"""Preserve initial backup evidence and add the completed checkpoint audit."""
import hashlib,json,os,shutil,subprocess
from pathlib import Path
R=Path('/opt/concrefer-unificado');S=R/'homolog-next/staging/producao-fase0-20261120';initial=json.loads((S/'backup-final.json').read_text());B=Path(initial['directory']);assert B.parent==R/'backups' and B.name.startswith('producao-');os.umask(0o077)
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for data in iter(lambda:f.read(4194304),b''):h.update(data)
 return h.hexdigest()
assert sha(Path(initial['bundle']))==initial['sha256'],'Original bundle changed'
meta=json.loads((B/'backup-manifest.json').read_text());history=B/'audit-history';history.mkdir(mode=0o700)
names=['migration-audit.json','checkpoint.json','deployment-plan.json']
for name in names:
 shutil.copy2(B/name,history/name);shutil.copy2(S/name,B/name)
for name in ['checkpoint-live-evidence.json','runtime-configuration-discrepancies.json']:shutil.copy2(S/name,B/name)
meta['checkpoint']=json.loads((B/'checkpoint.json').read_text());meta['audit_supplement_note']='Final audit adds Armação flags and CQ FCK/default mismatch. Original audit files and original compressed bundle retained. Original application/config backups and all six database dumps unchanged.'
for name in names+['checkpoint-live-evidence.json','runtime-configuration-discrepancies.json']:
 p=B/name;meta['files'][name]={'bytes':p.stat().st_size,'sha256':sha(p)}
(B/'backup-manifest.json').write_text(json.dumps(meta,indent=2))
for name,expected in meta['files'].items():
 p=B/name;assert p.stat().st_size==expected['bytes'] and sha(p)==expected['sha256'],name
bundle=B.parent/(B.name+'-revisado.tar.gz');assert not bundle.exists()
subprocess.run(['tar','--use-compress-program=gzip -1','-cf',str(bundle),'-C',str(B.parent),B.name],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE);bundle.chmod(0o600)
subprocess.run(['tar','-tzf',str(bundle)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
result={**initial,'bundle':str(bundle),'bytes':bundle.stat().st_size,'sha256':sha(bundle),'includes_completed_checkpoint':True,'initial_bundle_retained':initial['bundle']};(S/'backup-final-revised.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))

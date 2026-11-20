"""Finalize the private recovery bundle; do not publish the blocked candidate."""
import hashlib,json,os,shutil,subprocess
from pathlib import Path
R=Path('/opt/concrefer-unificado');S=R/'homolog-next/staging/producao-fase0-20261120';receipt=json.loads((S/'backup-receipt.json').read_text());B=Path(receipt['directory']);assert B.parent==R/'backups' and B.name.startswith('producao-');os.umask(0o077)
def hashfile(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for chunk in iter(lambda:f.read(4*1024*1024),b''):h.update(chunk)
 return h.hexdigest()
for name,meta in receipt['files'].items():
 p=B/name;assert p.stat().st_size==meta['bytes'] and hashfile(p)==meta['sha256'],name
 if name.endswith('.tar.gz'):subprocess.run(['tar','-tzf',str(p)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
for name in ['rollback-rehearsal.json','checkpoint.json','identity-and-data-evidence.json']:
 shutil.copy2(S/name,B/name)
shutil.copy2(S/'producao_rollback.py',B/'rollback.py')
(B/'rollback.sh').write_text('#!/bin/sh\nset -eu\nB=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nif [ "${1:-}" = "--verify-only" ]; then exec python3 "$B/rollback.py"; fi\nexec python3 "$B/rollback.py" --apply\n')
(B/'rollback.sh').chmod(0o700);(B/'rollback.py').chmod(0o600)
dry=subprocess.run([str(B/'rollback.sh'),'--verify-only'],check=True,capture_output=True,text=True);receipt['rollback_dry_run']=json.loads(dry.stdout)
receipt['rollback_rehearsal']=json.loads((B/'rollback-rehearsal.json').read_text());receipt['checkpoint']=json.loads((B/'checkpoint.json').read_text())
for name in ['rollback.sh','rollback.py','rollback-rehearsal.json','checkpoint.json','identity-and-data-evidence.json']:
 p=B/name;receipt['files'][name]={'bytes':p.stat().st_size,'sha256':hashfile(p)}
(B/'backup-manifest.json').write_text(json.dumps(receipt,indent=2))
bundle=B.with_suffix('.tar.gz');assert not bundle.exists();subprocess.run(['tar','--use-compress-program=gzip -1','-cf',str(bundle),'-C',str(B.parent),B.name],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE);bundle.chmod(0o600)
subprocess.run(['tar','-tzf',str(bundle)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
result={'directory':str(B),'bundle':str(bundle),'bytes':bundle.stat().st_size,'sha256':hashfile(bundle),'directory_mode':oct(B.stat().st_mode&0o777),'bundle_mode':oct(bundle.stat().st_mode&0o777),'retain_until':receipt['retain_until'],'dumps_verified':len(receipt['dumps']),'rollback_verify_only':receipt['rollback_dry_run'],'production_application_mutations':0,'production_database_mutations':0}
(S/'backup-final.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))

"""Static files only, isolated root, approved synonyms, no service restart."""
import hashlib,json,os,shutil,subprocess,tarfile
from datetime import datetime,timezone
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');O=H/'staging/modulos-colunas-20261120';P=H/'public/unificado';D=O/'release';D.mkdir(exist_ok=True)
approval=json.loads((O/'synonyms-approval.json').read_text());assert approval['approved'] and not approval['production_authorized']
proof=json.loads((O/'candidate-permissions.json').read_text());assert proof['ok'] and proof['permission_leaks']==0
performance=json.loads((O/'busca-integrada-candidata/performance.json').read_text());assert performance['engine_max_ms']<50 and performance['ui_max_ms']<50 and not performance['search_fetch_calls']
assert (P/'VERSION').read_text().strip()=='1.4.29','Unexpected version: do not overwrite another release'
n=int(subprocess.check_output(['sudo','-u','postgres','psql','-X','-qAt','-c','BEGIN READ ONLY; SELECT count(*) FROM pg_stat_activity; ROLLBACK;'],text=True).strip());assert n<=80,('CAPACITY_STOP',n)
assert proof['module_cases']==72
manifest=json.loads((O/'release-manifest.json').read_text());before=json.loads((O/'baseline-hashes.json').read_text())
for rel,digest in before.items():assert hashlib.sha256((P/rel).read_bytes()).hexdigest()==digest,('Concurrent homolog change',rel)
with tarfile.open(O/'release.tgz') as archive:
 for member in archive.getmembers():assert member.isfile() and member.name in manifest and not Path(member.name).is_absolute() and '..' not in Path(member.name).parts
 archive.extractall(D,filter='data')
B=H/'backups'/('modulos-colunas-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));B.mkdir(mode=0o700);existing={}
for rel,digest in manifest.items():
 dest=P/rel;assert rel in before or not dest.exists(),('new file already exists',rel)
 assert dest.resolve().is_relative_to(P) and not {'api','backend','service','armacao'}.intersection(Path(rel).parts)
 assert hashlib.sha256((D/rel).read_bytes()).hexdigest()==digest;existing[rel]=dest.exists()
 if dest.exists():saved=B/rel;saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dest,saved)
(B/'original-files.json').write_text(json.dumps(existing,indent=2))
try:
 for rel in sorted(manifest,key=lambda p:(3 if p=='VERSION' else 2 if p=='sw.js' else 1 if p.endswith('.html') else 0,p)):
  dest=P/rel;dest.parent.mkdir(parents=True,exist_ok=True);temp=dest.with_name(dest.name+'.busca-tmp');shutil.copy2(D/rel,temp);temp.chmod(0o644);os.replace(temp,dest)
 for rel,digest in manifest.items():assert hashlib.sha256((P/rel).read_bytes()).hexdigest()==digest
except Exception:
 for rel,existed in existing.items():
  if existed:shutil.copy2(B/rel,P/rel)
  else:(P/rel).unlink(missing_ok=True)
 raise
result={'version':'1.4.30','previous_version':'1.4.29','search_commit':'964e4281','backup':str(B),'files':len(manifest),'connections_before':n,'services_restarted':False,'database_writes':0,'production_changed':False,'rollback':'python3 '+str(O/'modulos_colunas_rollback.py')+' '+str(B)}
(O/'deployment.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))

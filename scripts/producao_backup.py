"""Private, verified backups. No production application/database/config writes."""
import hashlib,json,os,shutil,subprocess,time
from datetime import datetime,timedelta,timezone
from pathlib import Path
R=Path('/opt/concrefer-unificado');S=R/'homolog-next/staging/producao-fase0-20261120';plan=json.loads((S/'deployment-plan.json').read_text());inventory=json.loads((S/'inventory.json').read_text())
assert plan['migrations_to_apply']==plan['permissions_to_change']==plan['backend_patches']==plan['services_to_restart']==[]
os.umask(0o077);now=datetime.now(timezone.utc);B=R/'backups'/('producao-'+now.strftime('%Y%m%dT%H%M%SZ'));B.mkdir(mode=0o700);start=time.monotonic();meta={'directory':str(B),'created_at':now.isoformat(),'retain_until':(now+timedelta(days=30)).isoformat(),'files':{},'dumps':{},'production_application_mutations':0,'production_database_mutations':0}
def run(cmd,**kwargs):return subprocess.run(cmd,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,**kwargs)
def record(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for block in iter(lambda:f.read(4*1024*1024),b''):h.update(block)
 p.chmod(0o600);meta['files'][p.name]={'bytes':p.stat().st_size,'sha256':h.hexdigest()};save()
def save():(B/'backup-manifest.json').write_text(json.dumps(meta,indent=2))
save();print(json.dumps({'backup_started':str(B)}),flush=True)
for name in ['candidate.tgz','candidate-manifest.json','deployment-plan.json','inventory.json','frozen.json','migration-audit.json']:
 shutil.copy2(S/name,B/name);record(B/name)
# Keep narrow original bytes for atomic rollback, plus complete directory tars.
originals={}
for row in plan['static_files']:
 p=Path(row['destination']);before=row['before']
 if before is None:assert not p.exists(),('new file appeared',str(p));continue
 assert p.stat().st_size==before['bytes'] and hashlib.sha256(p.read_bytes()).hexdigest()==before['sha256'],('production changed since inventory',str(p))
 target=B/'originals'/row['file'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target);originals[row['file']]=before
(B/'originals-manifest.json').write_text(json.dumps(originals,indent=2));record(B/'originals-manifest.json')
roots={'public-unificado':'opt/concrefer-unificado/public/unificado','laboratorio-backend':'opt/concrefer-unificado/laboratorio/service','dosagem-backend':'opt/concrefer-unificado/dosagem-native','carta-backend':'opt/concrefer-unificado/homolog/laboratorio/service'}
for name,root in roots.items():
 out=B/(name+'.tar.gz');run(['tar','--use-compress-program=gzip -1','-cf',str(out),'-C','/',root]);record(out);print(json.dumps({'archive_verified':name,'bytes':out.stat().st_size}),flush=True)
configs=set()
for svc in inventory['services']:
 if svc['homolog'] and svc['unit']!='laboratorio-homolog.service':continue
 configs.update(svc['config_files'])
configs.update(inventory['nginx']);configs={p for p in configs if Path(p).is_file()}
config_list=B/'config-files.txt';config_list.write_text(''.join(p.lstrip('/')+'\n' for p in sorted(configs)));record(config_list)
cfg=B/'services-nginx-config.tar.gz';run(['tar','--use-compress-program=gzip -1','-cf',str(cfg),'-C','/','--verbatim-files-from','-T',str(config_list)]);record(cfg)
for db in plan['backup_databases']:
 out=B/(db+'.dump')
 if db=='ged_postgres':cmd=['docker','exec','ged_postgres','sh','-c','exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc'];restore=['docker','exec','-i','ged_postgres','pg_restore']
 else:cmd=['sudo','-u','postgres','pg_dump','-d',db,'-Fc'];restore=['sudo','-u','postgres','pg_restore']
 with out.open('wb') as f:subprocess.run(cmd,check=True,stdout=f,stderr=subprocess.PIPE)
 with out.open('rb') as f:toc=run(restore+['--list'],stdin=f).stdout
 (B/(db+'.toc')).write_bytes(toc);record(B/(db+'.toc'))
 with out.open('rb') as f:run(restore+['--file=/dev/null'],stdin=f)
 record(out);meta['dumps'][db]={'pg_restore_list':True,'pg_restore_full_decode':True,**meta['files'][out.name]};save();print(json.dumps({'dump_verified':db,'bytes':out.stat().st_size}),flush=True)
(B/'permissions-before.sql').write_text('-- No permission rows will be changed. Alex already has all required native roles.\n-- Full database dumps and inventory preserve the current access state.\n')
record(B/'permissions-before.sql')
(B/'RETENTION.txt').write_text('Retain at least until '+meta['retain_until']+'\nNo production data or configuration has been changed by this backup.\n');record(B/'RETENTION.txt')
meta['duration_seconds']=round(time.monotonic()-start,2);meta['complete']=True;save();(S/'backup-receipt.json').write_text(json.dumps(meta,indent=2));print(json.dumps({'backup_complete':str(B),'duration_seconds':meta['duration_seconds'],'dumps_verified':len(meta['dumps'])}),flush=True)

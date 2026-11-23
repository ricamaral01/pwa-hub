"""Observe real production for 30 minutes; rollback only on specified regressions."""
import hashlib,json,re,subprocess,time,traceback
from datetime import datetime,timezone
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/producao-1.4.31');config=json.loads((S/'observer-config.json').read_text());B=Path(config['backup']);started=config['release_epoch'];deadline=started+1800;units=config['units'];events=[];samples=[];seen=set();last=started;rolled_back=False;journal_scanned=0;docker_scanned=0
def run(args):return subprocess.run(args,capture_output=True,text=True)
def persist(complete=False):
 status={'version':'1.4.31','started_epoch':started,'elapsed_seconds':round(time.time()-started,1),'required_seconds':1800,'complete':complete,'rolled_back':rolled_back,'latest_sample':samples[-1] if samples else None,'samples':samples,'events':events,'critical_events':sum(e['critical'] for e in events),'journal_messages_examined':journal_scanned,'docker_log_lines_examined':docker_scanned};temp=S/'observation.tmp.json';temp.write_text(json.dumps(status,indent=2));temp.replace(S/'observation.json');return status
def rollback(reason):
 global rolled_back
 if rolled_back:return
 result=run([str(B/'rollback.sh')]);rolled_back=result.returncode==0;(S/'automatic-rollback.json').write_text(json.dumps({'reason':reason,'returncode':result.returncode,'stdout':result.stdout,'stderr':result.stderr,'at_epoch':time.time(),'restored':rolled_back},indent=2));persist(True)
try:
 while time.time()<deadline:
  if (S/'observation-stop.json').exists():break
  query="BEGIN READ ONLY;SELECT json_build_object('total',(SELECT count(*) FROM pg_stat_activity),'clients',(SELECT count(*) FROM pg_stat_activity WHERE backend_type='client backend'),'max',current_setting('max_connections')::int,'super_reserved',current_setting('superuser_reserved_connections')::int,'reserved',coalesce(current_setting('reserved_connections',true),'0')::int,'idle_in_transaction',(SELECT count(*) FROM pg_stat_activity WHERE state='idle in transaction'));ROLLBACK;"
  p=run(['sudo','-u','postgres','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-c',query]);assert p.returncode==0,p.stderr;sample=json.loads(p.stdout);sample['at_epoch']=time.time();sample['common_headroom']=sample['max']-sample['super_reserved']-sample['reserved']-sample['clients'];samples.append(sample)
  if sample['common_headroom']<15:rollback('PostgreSQL common headroom below 15');break
  cmd=['journalctl','--since','@'+str(last),'--no-pager','-o','json']
  for unit in units:cmd.extend(['-u',unit])
  logs=run(cmd);now=time.time()
  for line in logs.stdout.splitlines():
   try:row=json.loads(line)
   except json.JSONDecodeError:continue
   stamp=row.get('__REALTIME_TIMESTAMP','');message=row.get('MESSAGE','');unit=row.get('_SYSTEMD_UNIT','');key=(stamp,unit,message)
   if key in seen:continue
   seen.add(key);journal_scanned+=1;match=re.search(r'"(?:GET|POST|PUT|PATCH|DELETE|HEAD) ([^ ?]+)[^"\n]*HTTP/[\d.]+"\s+(\d{3})',message)
   priority=int(row.get('PRIORITY',6));code=int(match[2]) if match else None;path=match[1] if match else None
   critical=code in [500,502,504] or code==503 and unit=='cq-laboratorio.service' and path in config['cq_successful_paths']
   if critical or priority<=3 or code and code>=500:
    event={'at_epoch':int(stamp)/1000000 if stamp else now,'unit':unit,'http_status':code,'path':path,'journal_priority':priority,'critical':bool(critical)};events.append(event)
    if critical:rollback('Production HTTP regression: '+unit+' '+str(code)+' '+str(path));break
  if rolled_back:break
  for container in config.get('docker_containers',[]):
   data=run(['docker','logs','--since',datetime.fromtimestamp(last,timezone.utc).isoformat(),container])
   for line in (data.stdout+'\n'+data.stderr).splitlines():
    docker_scanned+=1
    if re.search(r'"statusCode"\s*:\s*(500|502|504)\b',line):
     event={'at_epoch':now,'unit':'docker:'+container,'http_status':int(re.search(r'"statusCode"\s*:\s*(\d+)',line)[1]),'path':None,'critical':True};events.append(event);rollback('Production GED HTTP error');break
   if rolled_back:break
  if rolled_back:break
  last=now-0.1;persist();time.sleep(min(10,max(0,deadline-time.time())))
 if not rolled_back:persist(time.time()>=deadline)
except Exception as error:
 (S/'observation-error.json').write_text(json.dumps({'error_type':type(error).__name__,'message':str(error)[:1000],'at_epoch':time.time()},indent=2));persist(False);raise

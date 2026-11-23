"""Read the complete first 30-minute window and check log-reader return codes."""
import json
from producao31_common import remote,save,S
code=r'''
import collections,datetime,json,re,subprocess,time
from pathlib import Path
s=Path(STAGING);c=json.loads((s/'observer-config.json').read_text());start=c['release_epoch'];end=start+1800;assert time.time()>=end
args=['journalctl','--since','@'+str(start),'--until','@'+str(end),'--no-pager','-o','json']
for unit in c['units']:args.extend(['-u',unit])
p=subprocess.run(args,capture_output=True,text=True);assert p.returncode==0,p.stderr;units=collections.Counter();statuses=collections.Counter();critical=[];priority_errors=[];total=0
for line in p.stdout.splitlines():
 row=json.loads(line);total+=1;unit=row.get('_SYSTEMD_UNIT','');units[unit]+=1;message=row.get('MESSAGE','');match=re.search(r'"(?:GET|POST|PUT|PATCH|DELETE|HEAD) ([^ ?]+)[^"\n]*HTTP/[\d.]+"\s+(\d{3})',message);code=int(match[2]) if match else None;path=match[1] if match else None
 if code:statuses[str(code)]+=1
 event={'unit':unit,'http_status':code,'path':path,'priority':int(row.get('PRIORITY',6))}
 if code in [500,502,504] or code==503 and unit=='cq-laboratorio.service' and path in c['cq_successful_paths']:critical.append(event)
 if event['priority']<=3:priority_errors.append(event)
docker=[]
for name in c.get('docker_containers',[]):
 fmt=lambda stamp:datetime.datetime.fromtimestamp(stamp,datetime.timezone.utc).isoformat()
 d=subprocess.run(['docker','logs','--since',fmt(start),'--until',fmt(end),name],capture_output=True,text=True);assert d.returncode==0;lines=(d.stdout+'\n'+d.stderr).splitlines();errors=sum(bool(re.search(r'"statusCode"\s*:\s*(500|502|504)\b',line)) for line in lines);docker.append({'container':name,'lines':len(lines),'critical_http_errors':errors,'reader_returncode':d.returncode})
result={'start_epoch':start,'end_epoch':end,'seconds':1800,'journal_reader_returncode':p.returncode,'journal_messages':total,'messages_by_unit':dict(units),'http_status_counts':dict(statuses),'critical_events':critical,'priority_error_metadata':priority_errors,'docker':docker,'raw_log_messages_exported':False,'ok':not critical and not any(d['critical_http_errors'] for d in docker)};print(json.dumps(result))
'''.replace('STAGING',repr(S))
data=remote(code);save('logs-first-30-minutes.json',data);print(json.dumps(data));assert data['ok'],data

"""Display-string patches only, isolated service roots, backup and one restart at a time."""
import ast,difflib,hashlib,json,re,shutil,subprocess,sys,time,urllib.error,urllib.request
from datetime import datetime,timezone
from pathlib import Path
H=Path('/opt/concrefer-unificado/homolog-next');O=H/'staging/login-uni-20261120';V=H/'visual-full'
groups={
 'mapa':(['mapa/production_labels.py','mapa/usina_iqt.py','mapa/manutencao_usina.py','mapa/usinas_reporting.py','mapa/usina_integration.py','mapa/usinas_legacy_read.py'],14152),
 'laboratorio':(['laboratorio/server/cec_api.py','laboratorio/cronoanalise/api.py'],14164),
 'qualidade':(['qualidade/quality/outbox.py','qualidade/quality/tasks.py'],14166),
 'suprimentos':(['suprimentos/suprimentos/main.py'],14167),
 'dosagem':(['dosagem/app/unified_gateway.py'],14169),
 'reporting':(['reporting/reporting_service/legacy_reports.py'],14187),
 'logistica':(['logistica/logistica/auth.py'],14179),
 'cq':(['cq/app.py'],14175),
}
name=sys.argv[1];assert name in groups;files,port=groups[name];unit='unificado-visual-homolog-'+name+'.service'
def count():return int(subprocess.check_output(['sudo','-u','postgres','psql','-X','-qAt','-c','BEGIN READ ONLY; SELECT count(*) FROM pg_stat_activity; ROLLBACK;'],text=True).strip())
initial=count();assert initial<=80,('CAPACITY_STOP',initial)
B=H/'backups'/('login-uni-labels-'+name+'-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));B.mkdir(mode=0o700)
shutil.copy2(Path('/etc/systemd/system')/unit,B/unit)
changes=[]
for rel in files:
 p=V/rel;assert p.resolve().is_relative_to(V);old=p.read_text()
 # Leave docstrings/comments and every identifier untouched. Only these public phrases.
 new=old
 for phrase in ['Entre no Unificado','Sessão expirada no Unificado','Entre novamente no Unificado','Mapa Unificado','PCP Unificado','Sessão do Unificado inválida','no Unificado.','Use uma rota interna do Unificado','Suprimentos · Unificado','Suprimentos | Unificado','Suprimentos Unificado','Suprimentos — Unificado','Acesso somente pelo Unificado']:
  new=new.replace(phrase,phrase.replace('Unificado','Uni'))
 if new==old:continue
 a=ast.parse(old);b=ast.parse(new)
 def scrub(node):
  for part in ast.walk(node):
   if isinstance(part,ast.Constant) and isinstance(part.value,str):part.value=part.value.replace('Unificado','Uni')
  return ast.dump(node,include_attributes=False)
 assert scrub(a)==scrub(b),('non-label behavior change',rel)
 saved=B/rel;saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,saved)
 p.write_text(new);p.chmod(0o644)
 changes.append({'file':rel,'before_sha256':hashlib.sha256(old.encode()).hexdigest(),'after_sha256':hashlib.sha256(new.encode()).hexdigest(),'patch':''.join(difflib.unified_diff(old.splitlines(True),new.splitlines(True),fromfile=rel,tofile=rel))})
if changes:
 try:
  subprocess.run(['systemctl','restart',unit],check=True)
  deadline=time.monotonic()+30
  while True:
   try:urllib.request.urlopen('http://127.0.0.1:'+str(port)+'/',timeout=3);break
   except urllib.error.HTTPError:break
   except (urllib.error.URLError,TimeoutError):
    if time.monotonic()>deadline:raise
    time.sleep(.5)
  subprocess.run(['systemctl','is-active','--quiet',unit],check=True)
 except Exception:
  for row in changes:shutil.copy2(B/row['file'],V/row['file'])
  subprocess.run(['systemctl','restart',unit],check=True);raise
result={'unit':unit,'backup':str(B),'changes':changes,'changed_files':len(changes),'restarted':bool(changes),'responds':True,'connections_before':initial,'connections_after':count(),'database_writes':0,'business_logic_unchanged_ast':True,'rollback':{'copy_each_file_from':str(B),'copy_to':str(V),'restart_only':unit}}
output=O/('backend-'+name+'.json')
if output.exists():
 previous=json.loads(output.read_text());history=previous.pop('previous_changes',[])
 if previous['changed_files']:history.append(previous)
 result['previous_changes']=history
output.write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in result.items() if k not in ['changes','previous_changes']}))

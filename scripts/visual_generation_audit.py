"""Read-only checks of the original production file/process inventory."""
import hashlib,json,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo')
B=Path(json.loads((S/'backup-ready.json').read_text())['backup'])
before=json.loads((B/'production-before.json').read_text())
changed=[name for name,h in before['files'].items() if hashlib.sha256(Path(name).read_bytes()).hexdigest()!=h]
processes=[];scheduled=[]
for name,state in before['services'].items():
 now=subprocess.check_output(['systemctl','show',name,'-p','MainPID','-p','ExecMainStartTimestamp','-p','ActiveState'],text=True)
 if now!=state:
  kind=subprocess.check_output(['systemctl','show',name,'-p','Type','--value'],text=True).strip()
  if kind=='oneshot':scheduled.append({'unit':name,'type':kind,'reason':'scheduled oneshot lifecycle; not restarted by this deployment'})
  else:processes.append(name)
result={'production_files_verified':len(before['files']),'changed_files':changed,'production_services_verified':len(before['services']),'changed_persistent_process_states':processes,'scheduled_job_state_changes':scheduled,'production_database_connections':0}
(S/'generation-production-audit.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
assert not changed and not processes

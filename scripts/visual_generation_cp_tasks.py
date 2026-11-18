"""Apply the published CP molding migration only in the new Lab test DB."""
import hashlib,json,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo');G=S.parents[1]/'visual-full'
B=Path(json.loads((S/'backup-ready.json').read_text())['backup'])
db='laboratorio_visual_homolog_20261118';marker=S/'generation-lab-cp-moldagem.json'
if marker.exists():print(marker.read_text());raise SystemExit
source=Path('/tmp/20261109_cp_moldagem_tarefas.sql')
backup=B/(db+'-before-cp-moldagem.dump')
if not backup.exists():
 with backup.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=f,check=True)
backup.chmod(0o600);subprocess.run(['pg_restore','-l',str(backup)],stdout=subprocess.DEVNULL,check=True)
ddl=source.read_text();assert 'DROP ' not in ddl
assert hashlib.sha256(source.read_bytes()).hexdigest()=='74da5831198220700fc9b307f1beea5f17d3f5031b64278995b75c6ecb2626bf'
subprocess.run(['sudo','-u','postgres','psql','-X','-v','ON_ERROR_STOP=1','-d',db],input=ddl,text=True,capture_output=True,check=True)
result={'database':db,'migration_source':str(source),'migration_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'before_dump':str(backup),'before_sha256':hashlib.sha256(backup.read_bytes()).hexdigest(),'production_changes':False}
marker.write_text(json.dumps(result,indent=2));print(json.dumps(result))

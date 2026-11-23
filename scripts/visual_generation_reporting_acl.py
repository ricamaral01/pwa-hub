"""Restore read-only access of the test Carta reporting connection, new Mapa DB only."""
import hashlib,json,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo')
B=Path(json.loads((S/'backup-ready.json').read_text())['backup']);db='mapa_visual_homolog_20261118'
marker=S/'generation-carta-reporting-access.json'
if marker.exists() and json.loads(marker.read_text()).get('schemas')==['usinas','usinas_reporting']:print(marker.read_text());raise SystemExit
results=[]
for db in ['mapa_visual_homolog_20261118','carta_traco_visual_homolog_20261118']:
 dump=B/(db+'-before-carta-reporting-expanded-acl.dump')
 if not dump.exists():
  with dump.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=f,check=True)
 dump.chmod(0o600);subprocess.run(['pg_restore','-l',str(dump)],stdout=subprocess.DEVNULL,check=True)
 schemas='usinas,usinas_reporting' if db.startswith('mapa_') else 'usinas'
 sql='BEGIN; GRANT USAGE ON SCHEMA '+schemas+' TO mapa_api_writer; GRANT SELECT ON ALL TABLES IN SCHEMA '+schemas+' TO mapa_api_writer; COMMIT;'
 subprocess.run(['sudo','-u','postgres','psql','-X','-v','ON_ERROR_STOP=1','-d',db],input=sql,text=True,capture_output=True,check=True)
 results.append({'database':db,'schema':'usinas','technical_role':'mapa_api_writer','access':'USAGE schema, SELECT existing tables only','writes_granted':False,'business_user_permission_rows_changed':False,'before_dump':str(dump),'before_sha256':hashlib.sha256(dump.read_bytes()).hexdigest(),'production_changes':False})
result={'databases':results,'schemas':['usinas','usinas_reporting']}
marker.write_text(json.dumps(result,indent=2));print(json.dumps(result))

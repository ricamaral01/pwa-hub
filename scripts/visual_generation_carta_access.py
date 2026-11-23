"""Give the isolated Carta service its existing test writer role, local DB only."""
import hashlib,json,shlex,shutil,subprocess
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo');E=Path('/etc/concrefer-unificado/homolog')
B=Path(json.loads((S/'backup-ready.json').read_text())['backup']);db='carta_traco_visual_homolog_20261118'
marker=S/'generation-carta-access.json'
if marker.exists():print(marker.read_text());raise SystemExit
def env(path):
 out={}
 for line in path.read_text().splitlines():
  a=shlex.split(line)
  if len(a)==1 and '=' in a[0]:k,v=a[0].split('=',1);out[k]=v
 return out
mapa=env(E/'visual-mapa.env');file=E/'visual-carta.env';carta=env(file)
u=urlsplit(mapa['MAPA_WRITER_DATABASE_URL']);assert u.hostname=='127.0.0.1' and u.path=='/mapa_visual_homolog_20261118' and u.username=='mapa_api_writer'
backup=B/(db+'-before-service-acl.dump')
if not backup.exists():
 with backup.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=f,check=True)
backup.chmod(0o600);subprocess.run(['pg_restore','-l',str(backup)],stdout=subprocess.DEVNULL,check=True)
role='"'+u.username+'"';ddl='BEGIN;\n'
for schema in ['carta_traco','insumos','estoque']:
 ddl+='GRANT USAGE ON SCHEMA '+schema+' TO '+role+';\nGRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA '+schema+' TO '+role+';\nGRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA '+schema+' TO '+role+';\n'
ddl+='COMMIT;'
subprocess.run(['sudo','-u','postgres','psql','-X','-v','ON_ERROR_STOP=1','-d',db],input=ddl,text=True,capture_output=True,check=True)
shutil.copy2(file,B/'visual-carta-before-service-acl.env')
carta['CARTA_TRACO_DATABASE_URL']=urlunsplit((u.scheme,u.netloc,'/'+db,u.query,u.fragment))
file.write_text(''.join(k+'='+shlex.quote(v)+'\n' for k,v in carta.items()));file.chmod(0o600)
subprocess.run(['systemctl','restart','unificado-visual-homolog-carta'],check=True)
result={'database':db,'technical_service_role':u.username,'schemas':['carta_traco','insumos','estoque'],'before_dump':str(backup),'before_sha256':hashlib.sha256(backup.read_bytes()).hexdigest(),'business_user_permission_rows_changed':False,'production_changes':False}
marker.write_text(json.dumps(result,indent=2));print(json.dumps(result))

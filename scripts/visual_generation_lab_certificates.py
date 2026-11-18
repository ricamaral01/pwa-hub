"""Apply the published additive certificate migration only in the new Lab test DB."""
import hashlib,json,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo');G=S.parents[1]/'visual-full'
B=Path(json.loads((S/'backup-ready.json').read_text())['backup'])
db='laboratorio_visual_homolog_20261118';marker=S/'generation-lab-certificates.json'
if marker.exists():print(marker.read_text());raise SystemExit
source=Path('/opt/concrefer-unificado/laboratorio/service/migrations/20261024_certificados_postes.sql')
backup=B/(db+'-before-certificates.dump')
if not backup.exists():
 with backup.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=f,check=True)
backup.chmod(0o600);subprocess.run(['pg_restore','-l',str(backup)],stdout=subprocess.DEVNULL,check=True)
ddl=source.read_text();assert 'DROP ' not in ddl
subprocess.run(['sudo','-u','postgres','psql','-X','-v','ON_ERROR_STOP=1','-d',db],input='BEGIN;\n'+ddl+'\nCOMMIT;',text=True,capture_output=True,check=True)
# Nginx reads only public static assets, never application storage or credentials.
changed=[]
for name in ['carta-static','dosagem-static']:
 root=G/name;assert root.is_relative_to(Path('/opt/concrefer-unificado/homolog-next/visual-full'))
 for p in [root,*root.rglob('*')]:
  if p.is_dir():p.chmod(0o755)
  elif p.is_file():p.chmod(0o644)
 changed.append(name)
result={'database':db,'migration_source':str(source),'migration_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'before_dump':str(backup),'before_sha256':hashlib.sha256(backup.read_bytes()).hexdigest(),'public_asset_directories_readable_by_nginx':changed,'production_changes':False}
marker.write_text(json.dumps(result,indent=2));print(json.dumps(result))

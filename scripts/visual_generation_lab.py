"""Restore missing published lab tables from an existing offline backup, test only."""
import hashlib,json,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo')
B=Path(json.loads((S/'backup-ready.json').read_text())['backup'])
db='laboratorio_visual_homolog_20261118'
source=Path('/opt/concrefer-unificado/backups/before-1.2.0-20261109T224452Z/concretrack_postes.dump')
marker=S/'generation-lab-tables.json'
if marker.exists():print(marker.read_text());raise SystemExit
backup=B/(db+'-before-lab-tables.dump')
if not backup.exists():
 with backup.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=f,check=True)
backup.chmod(0o600)
subprocess.run(['pg_restore','-l',str(backup)],stdout=subprocess.DEVNULL,check=True)
base=['sudo','-u','postgres','psql','-XAt','-v','ON_ERROR_STOP=1','-d',db]
args=[];tables=[]
for table in ['slump_registro','flow_planilha_registro','umidade_areia_registro']:
 name='ensaio_postes.'+table
 found=subprocess.check_output(base+['-c',"SELECT to_regclass('"+name+"');"],text=True).strip()
 if not found:args+=['-t',name];tables.append(name)
if args:
 toc=subprocess.check_output(['pg_restore','-l',str(source)],text=True)
 selected='\n'.join(l for l in toc.splitlines() if any(' '+t.split('.')[1]+' ' in l or ' '+t.split('.')[1]+'_' in l for t in tables))+'\n'
 listing=Path('/tmp/visual-lab-table-list.txt');listing.write_text(selected);listing.chmod(0o644)
 with source.open('rb') as f:
  subprocess.run(['sudo','-u','postgres','pg_restore','--single-transaction','--exit-on-error','--no-acl','-L',str(listing),'-d',db],stdin=f,check=True)
result={'database':db,'restored_tables':tables,'offline_source':str(source),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'before_dump':str(backup),'before_sha256':hashlib.sha256(backup.read_bytes()).hexdigest(),'production_connections':0,'old_homolog_tables_untouched':True}
marker.write_text(json.dumps(result,indent=2));print(json.dumps(result))

"""Create independent homolog DBs from verified HOMOLOG backups, never production."""
import json,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo')
backup=json.loads((S/'backup-ready.json').read_text())
copies={'mapa_visual_homolog_20261118':'mapa_unificado_homolog_20261016','pcp_visual_homolog_20261118':'pcp_unificado_homolog_20261016','qualidade_visual_homolog_20261118':'qualidade_homolog_20261016','laboratorio_visual_homolog_20261118':'concretrack_postes_homolog','suprimentos_visual_homolog_20261118':'suprimentos_homolog_20261025','carta_traco_visual_homolog_20261118':'mapa_unificado_homolog_20261016'}
def q(db,sql):
 assert db in copies or db=='postgres'
 return subprocess.check_output(['sudo','-u','postgres','psql','-XAt','-v','ON_ERROR_STOP=1','-d',db,'-c',sql],text=True)
results=[]
for dst,src in copies.items():
 marker=S/(dst+'-clone.json')
 if marker.exists():results.append(json.loads(marker.read_text()));continue
 assert src in backup['dumps'] and '_homolog' in src and dst.endswith('_visual_homolog_20261118')
 assert not q('postgres',"SELECT 1 FROM pg_database WHERE datname='"+dst+"'").strip(),dst
 subprocess.run(['sudo','-u','postgres','createdb',dst],check=True)
 dump=Path(backup['dumps'][src]['path']);assert dump.is_relative_to(Path(backup['backup']))
 with dump.open('rb') as f:r=subprocess.run(['sudo','-u','postgres','pg_restore','--exit-on-error','--single-transaction','-d',dst],stdin=f,capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr.decode()[-4000:])
 assert q(dst,'SELECT count(*) FROM pg_foreign_server;').strip()=='0',(dst,'Unexpected foreign source')
 info={'database':dst,'source_homolog_database':src,'source_homolog_dump_sha256':backup['dumps'][src]['sha256'],'production_database_connections':0,'original_database_modified':False}
 if dst.startswith('mapa_visual_'):
  q(dst,'ALTER SCHEMA estoque RENAME TO estoque_carta_arquivo;')
  info['archived_schema']='estoque_carta_arquivo'
 marker.write_text(json.dumps(info,indent=2));results.append(info)
 print(json.dumps(info),flush=True)
(S/'generation-clones.json').write_text(json.dumps(results,indent=2))

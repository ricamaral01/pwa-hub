"""Correct only this task's test sector labels to the published Setor 1 contract."""
import json,subprocess,hashlib,uuid
from pathlib import Path
from datetime import datetime,timezone
H=Path('/opt/concrefer-unificado/homolog-next');S=H/'staging/visual-completo/revisao-completa';assert Path(__file__).resolve().parent==S
out=S/'seed-normalized.json'
if out.exists():print(out.read_text());raise SystemExit
backup=H/'backups'/('revisao-setores-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));backup.mkdir(mode=0o700);results=[]
for filename,db in [('seed-results.json','mapa_unificado_homolog_20261016'),('seed-visual-results.json','mapa_visual_homolog_20261118')]:
 marker=S/filename
 if not marker.exists():continue
 data=json.loads(marker.read_text());ids=[str(uuid.UUID(x)) for x in data['mapa_production_ids']];tag=data['tag'];assert tag=='TESTE-REVISAO-COMPLETA-20261118'
 path=backup/(db+'.dump')
 with path.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=f,check=True)
 path.chmod(0o600);assert 'TABLE DATA' in subprocess.check_output(['pg_restore','-l',str(path)],text=True)
 quoted=','.join("'"+v+"'" for v in ids)
 sql=f"BEGIN; UPDATE public.producao SET setor='Setor 1' WHERE id IN ({quoted}) AND colaborador='{tag}'; UPDATE public.programacao_pcp SET setor='Setor 1' WHERE descricao_poste='{tag}' AND forma LIKE '{tag}-%'; COMMIT;"
 response=subprocess.check_output(['sudo','-u','postgres','psql','-v','ON_ERROR_STOP=1','-d',db,'-At','-c',sql],text=True)
 results.append({'database':db,'backup':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'result':response,'only_tagged_test_records':True})
out.write_text(json.dumps(results,indent=2));print(json.dumps(results))

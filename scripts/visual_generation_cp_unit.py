"""Add the unit field/index required by the published CEC queries, new Lab only."""
import hashlib,json,subprocess
from pathlib import Path
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo');db='laboratorio_visual_homolog_20261118'
B=Path(json.loads((S/'backup-ready.json').read_text())['backup']);marker=S/'generation-lab-cp-unit.json'
if marker.exists():print(marker.read_text());raise SystemExit
source=Path('/opt/concrefer-unificado/laboratorio/service/server/cec_api.py');code=source.read_text()
assert 'ON CONFLICT (unidade_codigo, massada_id, idade_dias)' in code
assert "return 'noroeste' if" in code and "else 'campinas'" in code
dump=B/(db+'-before-cp-unit.dump')
if not dump.exists():
 with dump.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=f,check=True)
dump.chmod(0o600);subprocess.run(['pg_restore','-l',str(dump)],stdout=subprocess.DEVNULL,check=True)
# Additive compatibility DDL inferred from existing published SQL and unit_of().
# No existing constraint is removed and no user permission row is touched.
ddl="""BEGIN;
ALTER TABLE public.laboratorio_cp_moldagem ADD COLUMN IF NOT EXISTS unidade_codigo text NOT NULL DEFAULT 'campinas';
CREATE UNIQUE INDEX IF NOT EXISTS laboratorio_cp_moldagem_unidade_massada_idade_idx ON public.laboratorio_cp_moldagem(unidade_codigo,massada_id,idade_dias);
COMMIT;"""
subprocess.run(['sudo','-u','postgres','psql','-X','-v','ON_ERROR_STOP=1','-d',db],input=ddl,text=True,capture_output=True,check=True)
(S/'lab-cp-unit-additive.sql').write_text(ddl)
result={'database':db,'ddl_basis':'inferred from existing published CEC INSERT/UPDATE and unit_of; no new endpoint or rule','published_source':str(source),'published_source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'before_dump':str(dump),'before_sha256':hashlib.sha256(dump.read_bytes()).hexdigest(),'existing_constraints_preserved':True,'production_changes':False}
marker.write_text(json.dumps(result,indent=2));print(json.dumps(result))

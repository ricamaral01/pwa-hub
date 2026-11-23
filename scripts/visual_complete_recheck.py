"""Reopen failed/changed screens; retain successful unaffected captures with version provenance."""
import json,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/revisao-completa'
critical={'shell-inicio','shell-login','shell-atualizar','shell-testar','module-planejamento','module-laboratorio','module-suprimentos','module-producao','module-qualidade','module-usinas','mobile-conta','mobile-recentes','labCertificados','cronoanalise.metodologia','cronoanalise.inicio','logisticaInicio','pdrProdutos','rbrProdutos','fechamentoDiario','dashboard','comparacao','postesNumerosSerie'}
for role in sys.argv[1:]:
 p=O/('matrix-'+role.lower()+'.json');rows=json.loads(p.read_text(encoding='utf-8')) if p.exists() else []
 if role in ['SUPRIMENTOS','CONSULTA','QUALIDADE','PRODUCAO']:
  selected=sorted({r['screen'] for r in rows}|critical)
 else:selected=sorted({r['screen'] for r in rows if not r.get('ok') or r.get('standard_issues')}|critical)
 cmd=[sys.executable,'tests/unificado/review_complete_matrix.py','--role',role,'--concurrency','1','--only',*selected]
 p=subprocess.run(cmd,cwd=R);print('REOPEN',role,p.returncode,flush=True)
 # Continue the other personas; the final audit separately rejects any unresolved case.

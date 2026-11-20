"""Apply reviewed short descriptions; keep the original descriptions intact."""
import json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/modulos-colunas-20261120'
proposed=json.loads((O/'new-descriptions-proposal.json').read_text(encoding='utf-8'));review=json.loads((O/'screen-review.json').read_text(encoding='utf-8'))
assert set(proposed)<={r['id'] for r in review},'Every new description needs its route opened first'
assert all(v and len(v)<=45 and not v.endswith('.') for v in proposed.values())
p=R/'unificado/shell/icons.js';s=p.read_text(encoding='utf-8');marker='  // Module descriptions reviewed on homolog; see the delivery table.\n'
if marker in s:s=s[:s.index(marker)]+'})();\n'
assert s.rstrip().endswith('})();');s=s.rstrip()[:-5]+marker+'  Object.assign(window.UnificadoPresentation.descriptions, '+json.dumps(proposed,ensure_ascii=False,indent=2)+');\n})();\n';p.write_text(s,encoding='utf-8')
catalog=json.loads((O/'catalogue-before.json').read_text(encoding='utf-8'));rows=[]
for entry in catalog['entries']:
 if entry['id'] in proposed:rows.append({'module':entry['module'],'group':entry['group'],'screen':entry['name'],'id':entry['id'],'description':proposed[entry['id']]})
for key,label in [('ged-dashboard','Painel'),('ged-documents','Documentos'),('ged-approvals','Aprovações'),('ged-calibrations','Calibrações')]:rows.append({'module':'GED','group':'Gestão documental','screen':label,'id':key,'description':proposed[key]})
(O/'new-descriptions.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'new_ids':len(proposed),'table_rows':len(rows)}))

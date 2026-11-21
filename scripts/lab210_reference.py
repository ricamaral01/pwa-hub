"""Extend the existing search golden set, preserving every earlier query."""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1];p=R/'tests/unificado/busca-referencia.json';rows=json.loads(p.read_text(encoding='utf-8'));before=len(rows)
for unit,prefix in [('pederneiras','labPedeCec'),('ribeirao preto','labRibCec')]:
 for term,suffix in [('visao geral',''),('etiquetas qr','Etiquetas'),('leitura cp','Leitura'),('resultados corpos prova','Resultados'),('rompimentos mes','RompimentosMes'),('analise estatistica','Analise'),('relatorio cec','Relatorio')]:
  row=[term+' '+unit,prefix+suffix]
  if row not in rows:
   assert not any(r[0]==row[0] for r in rows);rows.append(row)
p.write_text(json.dumps(rows,ensure_ascii=False,indent=1)+'\n',encoding='utf-8');print(json.dumps({'before':before,'after':len(rows),'new_queries':len(rows)-before}))

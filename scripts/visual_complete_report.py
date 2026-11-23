"""Consolidate actual browser evidence and build a filterable local gallery."""
import collections,html,json
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/revisao-completa'
inventory=json.loads((O/'inventario.json').read_text(encoding='utf-8'));by_id={r['id']:r for r in inventory}
rows=[];profiles=[]
for p in sorted(O.glob('matrix-*.json')):
 data=json.loads(p.read_text(encoding='utf-8'));assert all(r['ok'] for r in data),(p.name,[r['screen'] for r in data if not r['ok']])
 for row in data:
  assert not row.get('standard_issues'),(row['screen'],row.get('standard_issues'))
  definition=by_id[row['screen']];row['module']=definition['module'];row['label']=definition.get('label',row['screen'])
  row['case_kind']='disabled_unit_denial' if definition.get('expected_denial') else 'native_module_denial' if row.get('authorization_expectation')=='native module denies access' else 'allowed'
  if definition.get('expected_denial'):row['authorization_expectation']='unit remains disabled in the existing configuration'
  rows.append(row)
 profiles.append({'profile':data[0]['profile'],'cases':len(data),'allowed':sum(r['case_kind']=='allowed' for r in data),'negative':sum(r['case_kind']!='allowed' for r in data),'viewports':sum(len(r['layout']) for r in data),'unexpected_failures':0,'style_issues':0})
summary={'release_version':(R/'unificado/VERSION').read_text().strip(),'status':'visual_checks_passed_integration_decision_pending','catalog_entries':139,'inventory_entries':len(inventory),'inventory_screen_ids':len(by_id),'profiles':profiles,'total_cases':len(rows),'allowed_cases':sum(r['case_kind']=='allowed' for r in rows),'negative_cases':sum(r['case_kind']!='allowed' for r in rows),'viewports':sum(len(r['layout']) for r in rows),'frames_audited':sum(len(m['frames']) for r in rows for m in r['layout']),'unexpected_loading_or_layout_failures':0,'open_visual_issues':0,'capture_versions':dict(collections.Counter(r.get('review_version','1.4.24') for r in rows)),'integration_pending':'LABORATORIO: central catalog includes Supplies; native authority /api/suprimentos/me returns 403. No permissions or APIs changed.'}
(O/'matriz.json').write_text(json.dumps({'summary':summary,'cases':rows},ensure_ascii=False,indent=2),encoding='utf-8');(O/'resumo-matriz.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
historical=set();problem_types=collections.defaultdict(set)
for folder in ['primeira-rodada','antes-reabertura-final']:
 for p in (O/folder).glob('matrix-*.json'):
  for row in json.loads(p.read_text(encoding='utf-8')):
   key=(row['profile'],row['screen'])
   if not row.get('ok') or row.get('standard_issues'):historical.add(key)
   if row.get('error') or row.get('http_errors'):problem_types[key].add('Carregamento/sessão')
   if row.get('js_errors'):problem_types[key].add('JavaScript')
   for metric in row.get('layout',[]):
    for frame in metric.get('frames',[]):
     if frame.get('overflow'):problem_types[key].add('Rolagem do corpo')
     for issue in frame.get('audit',{}).get('issues',[]):problem_types[key].add(issue['type'])
parts=['''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Revisão completa · Unificado</title><style>body{font:14px/1.5 system-ui;color:#0b1730;background:#f4f5f7;margin:24px}h1{font-size:24px;margin:0}a{color:#15416f}nav{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}input,select{padding:9px;border:1px solid #e1e5eb;border-radius:4px;background:white}table{border-collapse:collapse;width:100%;background:white}td,th{text-align:left;padding:10px 12px;border-bottom:1px solid #e1e5eb}small{color:#5b6779}.negative{color:#a15c00}@media(max-width:700px){body{margin:16px}.frame{overflow:auto}td,th{padding:8px}}</style><h1>Revisão completa · 1.4.25</h1><p><a href="RELATORIO.md">Relatório e roteiro</a> · <a href="matriz.json">Matriz completa</a> · <a href="https://concrefer.concretrack.com.br:18446/unificado/">Abrir homologação</a></p><p>Uma captura por entrada, perfil e largura. Todas as capturas finais foram refeitas na 1.4.25, com abertura nova em cada largura. Os problemas anteriores aparecem apenas como histórico de diagnóstico. Recusas previstas e unidades desativadas aparecem como testes negativos, separados dos acessos permitidos.</p><nav><input id="search" placeholder="Buscar tela ou problema"><select id="module"><option value="">Todos os módulos</option>''']
for module in sorted({r['module'] for r in rows}):parts.append(f'<option>{html.escape(module)}</option>')
parts.append('</select><select id="profile"><option value="">Todos os perfis</option>')
for profile in profiles:parts.append(f'<option>{profile["profile"]}</option>')
parts.append('</select><select id="problem"><option value="">Todos os problemas/resultados</option><option>Aprovado</option><option>Corrigido</option><option>Limite de acesso</option>')
for problem in sorted(set().union(*problem_types.values())):parts.append(f'<option>{html.escape(problem)}</option>')
parts.append('</select></nav><div class="frame"><table><thead><tr><th>Módulo</th><th>Tela</th><th>Perfil</th><th>Resultado</th><th>Capturas</th></tr></thead><tbody>')
for row in sorted(rows,key=lambda r:(r['module'],r['screen'],r['profile'])):
 status='Limite de acesso' if row['case_kind']!='allowed' else 'Corrigido' if (row['profile'],row['screen']) in historical else 'Aprovado'
 links=[]
 for metric in row['layout']:
  width=metric['width'];path=f'capturas/{row["profile"].lower()}/{row["screen"]}-{width}.png';assert (O/path).is_file(),path
  links.append(f'<a target="_blank" href="{html.escape(path)}">{width}px</a>')
 problems=sorted(problem_types[(row['profile'],row['screen'])]);tags='|'.join([status,*problems])
 parts.append(f'<tr data-module="{row["module"]}" data-profile="{row["profile"]}" data-problem="{html.escape(tags)}"><td>{row["module"]}</td><td>{html.escape(row["label"])}<br><small>{html.escape(row["screen"])} · {row.get("review_version","1.4.24")}</small></td><td>{row["profile"]}</td><td>{status}<br><small>{html.escape(", ".join(problems))}</small></td><td>{" · ".join(links)}</td></tr>')
parts.append('''</tbody></table></div><script>function filter(){const q=document.getElementById('search').value.toLocaleLowerCase('pt-BR');document.querySelectorAll('tbody tr').forEach(r=>r.hidden=!r.textContent.toLocaleLowerCase('pt-BR').includes(q)||['module','profile','problem'].some(id=>document.getElementById(id).value&&!(id==='problem'?r.dataset[id].split('|').includes(document.getElementById(id).value):document.getElementById(id).value===r.dataset[id])))}document.querySelectorAll('input,select').forEach(e=>e.addEventListener('input',filter));</script></html>''')
(O/'galeria.html').write_text(''.join(parts),encoding='utf-8')
descriptions=json.loads((O/'descricoes.json').read_text(encoding='utf-8'));assert all(len(s)<=50 for s in descriptions.values())
(O/'textos-escritos.md').write_text('# Descrições definidas na revisão\n\nTextos de até 50 caracteres. Só aparecem quando o identificador existe no menu e a conta possui acesso; os demais destinos ficam sem descrição.\n\n| Identificador | Texto | Caracteres |\n| --- | --- | ---: |\n'+'\n'.join(f'| `{key}` | {text} | {len(text)} |' for key,text in descriptions.items())+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=True))

import pathlib,re
ls=pathlib.Path('mapa-concretagem/app.js').read_text(encoding='utf-8').splitlines()
def label(i):
 for a,b,s in [(1,799,'Manutenção/liberação'),(800,1659,'Infra/API'),(1660,1919,'Ações Mapa/usuários'),(3200,3699,'Programação/liberação'),(4100,4399,'Programação S3/montagem'),(4900,5599,'Montagem/inspeção'),(6000,7099,'Dashboards/acompanhamento'),(7600,8099,'Mandril'),(8100,8299,'Relatório setor'),(10100,10499,'Fila offline/realtime'),(13200,13799,'Exportação'),(14000,14599,'Montagem/checklist'),(14600,14799,'Sequência S3'),(14800,15000,'ODIN')]:
  if a<=i<=b:return s
 return 'Mapa'
def methods(seg):
 x=[]
 for m in re.finditer(r'\.(select|insert|upsert|update|delete|eq|in|gte|lte|gt|lt|order|range|limit|or|neq|is|maybeSingle|single)\s*\(([^)]{0,150})\)',seg):
  x.append((m.group(1),m.group(2).replace('|','/')))
 return x
rows=[]
for i,line in enumerate(ls,1):
 if not re.search(r'\.from\s*\(',line) or re.search(r'Array\.from|html2pdf.*\.from',line):continue
 seg=' '.join(x.strip() for x in ls[i-1:min(i+10,len(ls))])
 nextfrom=re.search(r'\.from\s*\(',seg[seg.find('.from(')+6:])
 if nextfrom:seg=seg[:seg.find('.from(')+6+nextfrom.start()]
 semi=seg.find(';')
 if semi>=0:seg=seg[:semi+1]
 t=re.search(r'\.from\s*\(([^)]*)\)',line)
 table=t.group(1).replace('|','/') if t else '?'
 m=methods(seg)
 action=next((a.upper() for a,b in m if a in ('select','insert','upsert','update','delete')),'?')
 filt=', '.join(a+'('+b+')' for a,b in m if a in ('eq','in','gte','lte','gt','lt','or','neq','is'))
 order=', '.join(a+'('+b+')' for a,b in m if a in ('order','range','limit'))
 fields=next((b for a,b in m if a=='select'),'-')
 conflict=re.search(r'onConflict\s*:\s*([^,}]+)',seg)
 if i in (1753,1773,5241,6857,8174,8184,8185):filt+=('; condicionais' if filt else 'condicionais')
 if i in (1526,13440):filt='applyFilters dinâmico' if i==1526 else filt
 rows.append(f'| [app.js:{i}](../../../mapa-concretagem/app.js#L{i}) | {label(i)} | {table} | {action} | {filt or "-"} | {order or "-"} | {conflict.group(1) if conflict else "-"} | {fields} | dinâmico* |')
print('COUNT',len(rows))
print('| Arquivo:linha | Tela/fluxo | Tabela | Método | Filtros | Ordem/página | on_conflict | Retorno | Perfil |')
print('|---|---|---|---|---|---|---|---|---|')
print('\n'.join(rows))


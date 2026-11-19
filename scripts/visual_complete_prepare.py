"""Frontend-only follow-up to the approved f2 examples; preserve print and narrow login."""
from pathlib import Path
import re,json,shutil
R=Path(__file__).resolve().parents[1];U=R/'unificado'
O=R/'docs/revisao-visual-unificado/homolog/revisao-completa';O.mkdir(parents=True,exist_ok=True)
def edit(name,fn):
 p=U/name;s=p.read_text(encoding='utf-8');t=fn(s)
 if s!=t:p.write_text(t,encoding='utf-8',newline='\n')
def nav(s):
 a=s.index('    const view=new URLSearchParams(location.search).get(\'view\');',s.index('  function activeEntry()'))
 b=s.index('\n  function getTree',a)
 s=s[:a]+'''    const view=new URLSearchParams(location.search).get('view');
    return window.UnificadoPresentation.resolveEntry(allItems(),view,window.UnificadoActiveItem,viewOf);
  }'''+s[b:]
 s=s.replace("mobileTitle.textContent=active?.item.label||landingTitle||'Início';","const trail=document.querySelector('.breadcrumb > :last-child')?.textContent;\n    mobileTitle.textContent=active?.item.label||landingTitle||(new URLSearchParams(location.search).has('view') ? trail||document.title : 'Início');")
 s=s.replace("tree.append(footerLinks());", """const help=el('div','nav-account-links');
    for(const [label,url] of [['Como funciona','/unificado/como-funciona/'],['Relatar problema','/unificado/relatar-problema/']]){
      const link=el('a','nav-account-link',label);link.href=url;help.append(link);
    }
    tree.append(help);""")
 # Reuse the actual existing help destinations, not invented routes.
 m=re.search(r"helpLink\([^\n]+",s)
 s=s.replace("window.UnificadoIcons.node('documento'", "window.UnificadoIcons.node(window.UnificadoIcons.forScreen(entry.item)")
 return s
edit('shell/navigation.js',nav)
edit('shell/router.js',lambda s:s.replace("window.UnificadoSidebarActivePath = root", "window.UnificadoActiveItem = activeItem || null;\n    window.UnificadoSidebarActivePath = root"))
desc={'dashboard':'Programado e realizado por período','comparacao':'PCP contra apontamentos do Mapa','programacao12':'Programar a produção diária','programacaoSemanal12':'Distribuir a semana nas formas','programacao34':'Programar os setores 3 e 4','circular3':'Sequenciar formas circulares','dt4':'Programar postes duplo T','programacaoFinal':'Consolidar a programação para publicar','postesNumerosSerie':'Consultar séries e emitir PDF','armadurasProgramacao':'Programar armaduras por dia','armadurasRelatorio':'Emitir relatório de armaduras','relatorio12':'Emitir PDF dos setores 1 e 2','relatorio3':'Emitir PDF do setor 3','relatorio4':'Emitir PDF do setor 4','labCartaTraco':'Cadastrar e revisar cartas de traço','labLeitura':'Registrar a ruptura de corpos de prova','labResultados':'Consultar resultados dos ensaios','suprimentosPainel':'Aprovar e acompanhar solicitações','suprimentosSolicitacoes':'Consultar e filtrar solicitações','suprimentosNova':'Solicitar materiais e serviços','suprimentosAlmoxarifado':'Consultar saldos e movimentações','suprimentosInventario':'Conferir o estoque físico','suprimentosCotacoes':'Comparar propostas de fornecedores'}
(O/'descricoes.json').write_text(json.dumps(desc,ensure_ascii=False,indent=2),encoding='utf-8')
for filename in ['shell/module-pages.js','shell/module-pages-mobile.js']:
 def modules(s):
  s=re.sub(r"  const descriptions = \{.*?\n  \};","  const descriptions = {};",s,flags=re.S)
  s=s.replace('page.append(back, heading);','page.append(heading);')
  s=s.replace("quick.append(quickTitle);",'')
  s=s.replace("const top = document.createElement('h3'); top.textContent = 'Acesso rápido'; quick.append(top);",'')
  if filename.endswith('module-pages.js'):
   s=s.replace("description = ''", "description = '', item = null")
   s=s.replace("window.UnificadoIcons.node('documento')","window.UnificadoIcons.node(window.UnificadoIcons.forScreen(item || {label}))")
   s=s.replace('desc.textContent = description;',"desc.textContent = window.UnificadoPresentation.descriptions[item?.id] || description;")
   s=s.replace("window.UnificadoRouter.open(route.url, item.id);\n          });","window.UnificadoRouter.open(route.url, item.id);\n          }, '', item);")
   s=s.replace("chip.textContent = item.label;","const group=groups.find(g=>g.items.includes(item));\n      chip.textContent = window.UnificadoPresentation.shortcutLabel(group?.label,item.label);")
  else:
   s=s.replace("window.UnificadoIcons.node('documento')","window.UnificadoIcons.node(window.UnificadoIcons.forScreen(item || {label}))")
   s=s.replace("detail.textContent = itemDescriptions[item?.id] || '';","detail.textContent = window.UnificadoPresentation.descriptions[item?.id] || '';")
   s=s.replace('title.textContent = item.label;',"title.textContent = window.UnificadoPresentation.shortcutLabel(group.label,item.label);")
  s=s.replace("description.textContent = descriptions[moduleId] || '';","description.textContent = String(config?.groups.flatMap(g=>g.items).filter(i=>canUse(MENU_ITEMS[i.id])).length || 0)+' telas';")
  return s
 edit(filename,modules)
edit('shell/quick-access.js',lambda s:s.replace("data.user.name+' · Telas disponíveis para seu perfil.'","data.user.name").replace('welcome.append(copy,all);','welcome.append(copy);').replace("window.UnificadoIcons.node(module,'uqa-icon')","window.UnificadoIcons.node(window.UnificadoIcons.forScreen({id:item.destinations[0]?.screen,label:item.label}),'uqa-icon')").replace("item.destinations.length===1?'Abrir':dest.label","item.destinations.length===1?item.label:dest.label").replace("card.append(text);","if(item.destinations.length>1)card.append(text);").replace('card.append(links);','card.append(links);'))
edit('shell/login-desktop.css',lambda s:s+'\n@media screen and (min-width:1025px){.login-desktop-story>div:not(.login-story-units),.login-card>p:not(#login-feedback),.login-note{display:none!important}.login-story-units{margin-top:auto}}\n')
edit('index.html',lambda s:s.replace('Realizado ÷ programado','').replace('Saldo dos setores','').replace('Programado no PCP e realizado no Mapa.','').replace('Telas disponíveis para seu perfil.',''))
edit('suprimentos/frontend/app.js',lambda s:s.replace("'Sua fila de trabalho e as solicitações da unidade.'","''").replace('${late} há mais de 24 h',"${late===0?'Nenhuma':late} há mais de 24 h").replace('${urgent} urgentes / parou produção',"${urgent} ${urgent===1?'urgente':'urgentes'} · parou produção").replace('<div class="kpi-grid">','<div class="kpi-grid strip">').replace('<table><thead><tr><th>Nº</th>','<table class="sup-request-list"><thead><tr><th>Nº</th>'))
def dash(s):
 s=s.replace('`${parseFloat(v || 0).toFixed(1)}%`',"v==null?'—':`${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`")
 s=s.replace("  const value = parseFloat(v || 0);","  if(v==null)return '';\n  const value = parseFloat(v || 0);")
 for total in ['data.total_programado_m3','grupo12.qtd_programada','grupo34.qtd_programada']:
  field={'data.total_programado_m3':'data.eficiencia_geral_pct','grupo12.qtd_programada':'grupo12.eficiencia_pct','grupo34.qtd_programada':'grupo34.eficiencia_pct'}[total]
  s=s.replace('value: pct('+field+'), rawValue: '+field, 'value: pct(Number('+total+')>0?'+field+':null), rawValue: Number('+total+')>0?'+field+':null')
 s=s.replace("title: 'GERAL'","title: 'Geral'").replace("title: 'SETOR 1 + SETOR 2'","title: 'Setor 1 e 2'").replace("title: 'SETOR 3 + SETOR 4'","title: 'Setor 3 e 4'").replace("subtitle: 'Volumes consolidados no período'","subtitle: ''").replace("subtitle: 'Postes consolidados no período'","subtitle: ''")
 return s
edit('pcp/dashboard/index.html',dash)
# Additional authored HTML gets the same progressive enhancement, not bundle rewrites.
for base in [U/'pcp',U/'usinas',U/'mapa/operacao',U/'laboratorio/frontend/embedded']:
 for p in base.rglob('*.html'):
  s=p.read_text(encoding='utf-8')
  if 'module-components.css' in s and 'shell/components.js' not in s:
   s=s.replace('</head>','<script defer src="/unificado/shell/components.js?v=1.4.21"></script></head>',1);p.write_text(s,encoding='utf-8')
# Keep the user's updated references in this isolated worktree.
refs=R.parent/'pwa-hub-fase1/docs/revisao-visual-unificado/telas'
for p in refs.glob('f2*'):
 if p.is_file():shutil.copy2(p,R/'docs/revisao-visual-unificado/telas'/p.name)
print('Prepared frontend follow-up and description inventory')

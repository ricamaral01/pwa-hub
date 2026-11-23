"""Apply approved shell presentation while retaining navigation and authorizers."""
from pathlib import Path
import re
U=Path(__file__).resolve().parents[1]/'unificado'
def edit(name,fn):
 p=U/name;s=p.read_text(encoding='utf-8');p.write_text(fn(s),encoding='utf-8',newline='\n')
def replace(s,a,b):
 assert a in s,a[:80]
 return s.replace(a,b)
def index(s):
 s=replace(s,'<script defer src="shell/module-theme.js','<script defer src="shell/icons.js?v=1.4.8"></script>\n  <script defer src="shell/module-theme.js')
 s=s.replace('</head>','<link rel="stylesheet" href="shell/visual-shell.css?v=1.4.8">\n</head>')
 start=s.index('        <div class="welcome opening-hero">');end=s.index('        <section class="opening-modules"',start)
 update=s[s.index('          <button id="platform-update"',start):s.index('          </button>',start)+len('          </button>')]
 s=s[:start]+'''        <header class="ph home-heading"><div><h1>Início</h1><p class="sub"><span id="opening-compact-date"></span> · Campinas · PCP e Mapa</p></div>'''+update+'''</header>
        <section class="strip home-strip" aria-label="Resumo dos setores de Campinas">
          <div><span class="l">Programado hoje</span><strong class="v" data-total="programado">—</strong><span class="d">PCP · setores 1 a 4</span></div>
          <div><span class="l">Realizado</span><strong class="v" data-total="realizado">—</strong><span class="d">Lançamentos do Mapa</span></div>
          <div><span class="l">Aderência</span><strong class="v" data-total="aderencia">—</strong><span class="d">Realizado ÷ programado</span></div>
          <div><span class="l">Falta produzir</span><strong class="v" data-total="falta">—</strong><span class="d">Saldo dos setores</span></div>
        </section>
'''+s[end:]
 s=s.replace('<div id="sector-cards" class="sector-grid"></div>','<div class="sector-table-wrap"><table class="t sector-table"><thead><tr><th>Setor</th><th class="r">Programado</th><th class="r">Realizado</th><th class="r">Falta</th><th>Aderência</th><th>Ações</th></tr></thead><tbody id="sector-cards"></tbody></table></div>')
 s=s.replace('As rotinas mais usadas em um só lugar.','Telas disponíveis para seu perfil.')
 return s
edit('index.html',index)
def shell(s):
 s=s.replace("document.getElementById('today').textContent","document.getElementById('opening-compact-date').textContent")
 s=replace(s,"const card = document.createElement('article');\n    card.className = 'sector-card';","const card = document.createElement('tr');\n    card.className = 'sector-card';")
 start=s.index('    card.innerHTML = `<div class="sector-top">');end=s.index(';',start)+1
 s=s[:start]+'''    card.innerHTML = `<td data-label="Setor"><strong>Setor ${sector}</strong></td><td class="r" data-label="Programado"><span data-stat="programado">—</span></td><td class="r" data-label="Realizado"><span data-stat="realizado">—</span></td><td class="r" data-label="Falta"><span data-stat="falta">—</span></td><td data-label="Aderência"><div class="sector-ratio"><div class="progress-track"><i></i></div><span data-stat="aderencia">—</span></div></td><td class="sector-actions" data-label="Ações"></td>`;'''+s[end:]
 start=s.index("    card.querySelector('.progress-track').style.background =");end=s.index("    card.querySelector('.progress-track').setAttribute",start)
 s=s[:start]+'''    const known = programmed != null && produced != null;
    card.querySelector('[data-stat="falta"]').textContent = known ? Math.max(0,Number(programmed)-Number(produced)).toLocaleString('pt-BR') : '—';
    card.querySelector('[data-stat="aderencia"]').textContent = known && Number(programmed)>0 ? Math.round(100*Number(produced)/Number(programmed))+'%' : '—';
    card.querySelector('.progress-track i').style.width = ratio+'%';
'''+s[end:]
 start=s.index("  const note = document.querySelector('.sample-note');",s.index('async function loadSectorData'))
 s=s[:start]+'''  const programmedRows = pcpData?.por_setor?.filter(row=>[1,2,3,4].includes(Number(row.setor_id)));
  const totalPlan = pcpData ? (programmedRows || []).reduce((sum,row)=>sum+Number(row.qtd_programada || 0),0) : null;
  const totalDone = mapaData ? [1,2,3,4].reduce((sum,id)=>sum+Number(mapaData.by_sector?.['S'+id] || 0),0) : null;
  const summary={programado:totalPlan,realizado:totalDone,aderencia:totalPlan>0&&totalDone!=null?Math.round(totalDone/totalPlan*100)+'%':null,
    falta:totalPlan!=null&&totalDone!=null?[1,2,3,4].reduce((sum,id)=>sum+Math.max(0,Number(programmedRows?.find(row=>Number(row.setor_id)===id)?.qtd_programada || 0)-Number(mapaData.by_sector?.['S'+id] || 0)),0):null};
  for(const [key,value] of Object.entries(summary)){const el=document.querySelector('[data-total="'+key+'"]');if(el)el.textContent=value==null?'—':typeof value==='number'?value.toLocaleString('pt-BR'):value;}
'''+s[start:]
 # Decorative codes and arrows are replaced after each permission-based render.
 start=s.index("  target.querySelectorAll('.opening-module').forEach((card, index) => {");end=s.index("  document.querySelector('.opening-modules').hidden",start)
 s=s[:start]+'''  target.querySelectorAll('.opening-module').forEach(card => {
    card.querySelector('.opening-module-number')?.remove();
    card.querySelector('.opening-app-icon')?.remove();
    card.querySelectorAll(':scope > svg').forEach(icon=>icon.remove());
    card.prepend(window.UnificadoIcons.node(card.dataset.module,'opening-module-icon'));
  });
'''+s[end:]
 return s
edit('shell/shell.js',shell)
# Keep only the date and update status integration; no greeting or colored punctuation.
p=U/'shell/home-header-compact.js';s=p.read_text(encoding='utf-8');start=s.index("  const title = document.querySelector");end=s.index("  const date =",start);s=s[:start]+s[end:];p.write_text(s,encoding='utf-8')
for file in ['shell/module-pages.js','shell/module-pages-mobile.js']:
 def modules(s):
  s=s.replace("description || 'Abrir tela e consultar os dados.'","description").replace("itemDescriptions[item?.id] || 'Abrir tela e consultar os dados.'","itemDescriptions[item?.id] || ''")
  s=s.replace('heading.append(eyebrow, h1, description);','heading.append(h1, description);')
  s=re.sub(r"    const eyebrow = document.createElement\('p'\);\n    eyebrow.className = 'module-page-eyebrow';\n    eyebrow.textContent = 'MÓDULO';\n",'',s)
  s=re.sub(r"icon.textContent = label.split\([^\n]+", "icon.append(window.UnificadoIcons.node('documento'));",s)
  s=re.sub(r"code.textContent = item\?\.mono[^\n]+", "code.append(window.UnificadoIcons.node('documento'));",s)
  s=s.replace("arrow.textContent = '↗';","arrow.textContent = '';")
  return s
 edit(file,modules)
def quick(s):
 s=replace(s,"copy.append(node('span','uqa-kicker','MEU ACESSO RÁPIDO'),node('h1','',`Olá, ${data.user.name.split(' ')[0]}.`),node('p','','As funções da sua rotina, em um só lugar.'));","copy.append(node('h1','','Meu acesso rápido'),node('p','',data.user.name+' · Telas disponíveis para seu perfil.'));")
 s=s.replace("heading.append(node('span','',code),document.createTextNode(title))","heading.append(document.createTextNode(title))")
 s=s.replace("card.append(node('span','uqa-code',item.code));","card.append(window.UnificadoIcons.node(module,'uqa-icon'));")
 return s
edit('shell/quick-access.js',quick)
def nav(s):
 s=s.replace("    const active=activeEntry();\n    mobileContext", "    const active=activeEntry();\n    const landingTitle=main.querySelector('.module-page:not([hidden]) h1')?.textContent;\n    mobileContext")
 s=s.replace(" : 'Unificado';\n    mobileTitle.textContent=active?.item.label||'In?cio';", " : landingTitle ? 'Concrefer' : 'Unificado';\n    mobileTitle.textContent=active?.item.label||landingTitle||'In?cio';")
 s=s.replace("el('span','nav-switcher-code',moduleCodes[state.module]||'MD')","window.UnificadoIcons.node(state.module,'nav-switcher-code')")
 s=s.replace("switcherLabel.append(el('small','','MÓDULO'),el('strong','',selectedModule?.label||'Telas'));","switcherLabel.append(el('strong','',selectedModule?.label||'Telas'));")
 s=s.replace("el('span','nav-module-badge',moduleCodes[module.id]||'MD')","window.UnificadoIcons.node(module.id,'nav-module-badge')")
 s=s.replace("el('span','nav-rail-code',moduleCodes[module.id]||module.label.slice(0,2).toUpperCase())","window.UnificadoIcons.node(module.id,'nav-rail-code')")
 s=s.replace("if(entry.item.mono) a.prepend(el('span','nav-item-code',entry.item.mono));","a.prepend(window.UnificadoIcons.node('documento','nav-item-code'));")
 s=s.replace("const mobileMenu = button('nav-mobile-icon','☰',", "const mobileMenu = button('nav-mobile-icon','',")
 s=s.replace("mobileMenu.setAttribute('aria-label','Abrir telas');","mobileMenu.setAttribute('aria-label','Abrir telas');mobileMenu.append(window.UnificadoIcons.node('menu'));")
 s=s.replace("const mobileSearch=button('nav-mobile-search','⌕',", "const mobileSearch=button('nav-mobile-search','',")
 s=s.replace("mobileSearch.setAttribute('aria-label','Buscar tela');","mobileSearch.setAttribute('aria-label','Buscar tela');mobileSearch.append(window.UnificadoIcons.node('busca'));")
 s=s.replace("el('span','nav-bottom-icon',icon)","window.UnificadoIcons.node(mode==='telas'?'menu':mode,'nav-bottom-icon')")
 return s
edit('shell/navigation.js',nav)
# Published module identities share one palette; labels and IDs are unchanged.
p=U/'shell/module-theme.js';s=p.read_text(encoding='utf-8');s=re.sub(r"color:'#[0-9A-Fa-f]+'","color:'var(--c-orange)'",s);s=re.sub(r"ink:'#[0-9A-Fa-f]+'","ink:'var(--c-ink)'",s);s=re.sub(r"soft:'#[0-9A-Fa-f]+'","soft:'var(--c-line-2)'",s);s=re.sub(r"accentInk:'#[0-9A-Fa-f]+'","accentInk:'var(--c-blue)'",s);p.write_text(s,encoding='utf-8')
# React source changes are rebuilt with the documented build command.
p=U/'sidebar-modelo-a/src/components/sidebar/Sidebar.tsx';s=p.read_text(encoding='utf-8');s=s.replace("{themes[mod.id]?.sigla || mod.label.slice(0,2).toUpperCase()}",'<Icon name={mod.icon} />').replace("{themes[m.id]?.sigla || m.label.slice(0,2).toUpperCase()}",'<Icon name={m.icon} />');s=s.replace('            <span className="sb-eyebrow">MÓDULO</span>\n','');p.write_text(s,encoding='utf-8')
def login(s):
 s=s.replace('</head>','<link rel="stylesheet" href="shell/login-desktop.css?v=1.4.8" media="(min-width:1025px)">\n</head>')
 s=s.replace('  <main class="login-layout">','''  <aside class="login-desktop-story" aria-label="Unificado Concrefer"><span class="login-story-brand"><img src="assets/img/logo-concrefer.png" alt="Concrefer"></span><div><h2>Planejamento, produção e qualidade das quatro fábricas</h2><p>Programação do PCP, apontamentos do Mapa, laboratório e suprimentos com um único usuário.</p></div><div class="login-story-units"><span>Campinas</span><span>Pederneiras</span><span>Ribeirão Preto</span><span>Noroeste</span></div></aside>
  <main class="login-layout">''')
 # CSS switches headings only on desktop, without changing the narrow login.
 s=s.replace('<h1 id="login-title">Bem-vindo de volta</h1>','<h1 id="login-title"><span class="login-current-heading">Bem-vindo de volta</span><span class="login-desktop-heading">Entrar</span></h1>')
 s=s.replace('</head>','<style>.login-desktop-story,.login-desktop-heading{display:none}</style>\n</head>')
 return s
edit('login.html',login)

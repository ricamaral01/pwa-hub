/* Add accessible mobile labels without replacing framework-owned elements. */
(() => {
  const originals=new Map();
  const displayed=new WeakMap();
  function setLabelText(node,value,next){
    if(next===value)return;
    if(!originals.has(node)||displayed.get(node)!==value)originals.set(node,value);
    displayed.set(node,next);node.textContent=next;
  }
  const acronyms=new Set(['GED','CP','CQ','CEC','PCP','MOD','MOI','DT','PDF','QR','MCC','IQT','IQF','NC','RNC','SC','ERP','CNPJ','EPI','EPC','RH','ABNT','NBR','ISO','CSV','XLSX','SGQ','FL','PRO','S1','S2','S3','S4']);
  const properNames=['Cobli','Mega','Campinas','Pederneiras','Ribeirão Preto','Noroeste','Concrefer','ConcreTrack','MPa'];
  const accents={producao:'produção',programacao:'programação',liberacao:'liberação',relatorio:'relatório',manutencao:'manutenção',analise:'análise',solicitacao:'solicitação',cotacao:'cotação',execucao:'execução',diagnostico:'diagnóstico',secundarios:'secundários',terciarios:'terciários',graficos:'gráficos',medio:'médio',eficiencia:'eficiência',padrao:'padrão',mes:'mês',relatorios:'relatórios',programacoes:'programações',liberacoes:'liberações',analises:'análises',solicitacoes:'solicitações',cotacoes:'cotações',acoes:'ações',aprovacao:'aprovação',aprovacoes:'aprovações',situacao:'situação'};
  function sentence(text){
    let firstWord=true;
    let value=pluralText(text).replace(/ vs /gi,' \u00d7 ').replace(/\s+--\s+banco local\b/gi,'').replace(/\s+--\s+/g,' · ').replace(/\bm3\b/g,'m³').split(/(\s+)/).map((word,i)=>{
      if(!/[A-Za-zÀ-ÿ]/.test(word)){if(/\d/.test(word))firstWord=false;return word;}
      const capitalize=firstWord;firstWord=false;
      if(/^(?:[A-Z]{1,8}[-/]?)+\d[A-Z\d./:-]*$/.test(word))return word;
      const upper=word.toLocaleUpperCase('pt-BR');if(acronyms.has(upper))return upper;
      const lower=word.toLocaleLowerCase('pt-BR');
      const corrected=accents[lower]||lower;
      return capitalize?corrected.charAt(0).toLocaleUpperCase('pt-BR')+corrected.slice(1):corrected;
    }).join('');
    for(const name of [...properNames,...acronyms])value=value.replace(new RegExp('\\b'+name+'\\b','gi'),name);
    return value;
  }
  window.UnificadoSentence=sentence;
  function pluralText(value){
    const plurals={homem:'homens',mês:'meses',setor:'setores',trabalhador:'trabalhadores',solicitação:'solicitações',requisição:'requisições',emissão:'emissões',liberação:'liberações',programação:'programações'};
    const plural=word=>{const result=plurals[word.toLocaleLowerCase('pt-BR')]||word+'s';return word===word.toLocaleUpperCase('pt-BR')?result.toLocaleUpperCase('pt-BR'):result;};
    return value.replace(/(\d+(?:[.,]\d+)?)\s+([\p{L}-]+)\(s\)(?:\s+([\p{L}-]+)\(s\))?/giu,(_,count,word,adjective)=>{
      const one=Number(count.replace(',','.'))===1;
      return `${count} ${one?word:plural(word)}${adjective?' '+(one?adjective:plural(adjective)):''}`;
    })
      .replace(/([\p{L}-]+)\(s\)/giu,(_,word)=>plural(word))
      .replace(/(?<![\d.,])1 dias? incompletos\b/g,'1 dia incompleto')
      .replace(/(?<![\d.,])1 (postes|urgentes|pessoas|dias)\b/gi,(_,word)=>'1 '+({postes:'poste',urgentes:'urgente',pessoas:'pessoa',dias:'dia'}[word.toLocaleLowerCase('pt-BR')]))
      .replace(/\bm3\b/g,'m³')
      .replace(/(\d+)\.(\d{1,2})(?=\s*(?:m³|kg|%))/g,'$1,$2');
  }
  window.UnificadoPluralText=pluralText;
  function presentation(){
    if(printing)return;
    for(const [node] of originals)if(!node.isConnected||node.textContent!==displayed.get(node)){originals.delete(node);displayed.delete(node);}
    const visibleTitle=doc=>{const el=doc.querySelector('.nav-mobile-title');return el&&el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0?el.textContent.trim():'';};
    let parentTitle=visibleTitle(document);
    try{if(window.parent!==window)parentTitle=visibleTitle(window.parent.document);}catch{}
    const mobile=Boolean(parentTitle);
    const allTitles=[...document.querySelectorAll('h1,h2,.section-title')];
    allTitles.forEach(el=>el.classList.remove('review-duplicate-title'));
    const titles=allTitles.filter(el=>!el.closest('[hidden],.hidden,.indicator-legacy,.login-layout')&&el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0);
    const titleKey=text=>sentence(text).toLocaleLowerCase('pt-BR').replace(/[^\p{L}\d]/gu,'');
    const seen=new Set(titles.filter(el=>el.tagName==='H1').map(el=>titleKey(el.textContent.trim())));
    for(const title of titles){
      const text=sentence(title.textContent.trim());
      const duplicate=(title.tagName!=='H1'&&seen.has(titleKey(text)))||(mobile&&Boolean(parentTitle)&&(title.tagName==='H1'||titleKey(text)===titleKey(parentTitle)));
      title.classList.toggle('review-duplicate-title',Boolean(text&&duplicate));
      if(!duplicate&&text)seen.add(titleKey(text));
    }
    document.querySelectorAll('.info-section .chart-title').forEach(title=>{
      const sectionTitle=title.closest('.info-section')?.querySelector('.info-title');
      if(sectionTitle&&sectionTitle!==title&&titleKey(sectionTitle.textContent)===titleKey(title.textContent))title.classList.add('review-duplicate-title');
    });
    document.querySelectorAll('.review-ged .grid').forEach(grid=>{
      const cards=[...grid.children];
      if(cards.length<2||cards.length>6||!cards.every(card=>card.querySelector('.text-3xl,.text-2xl')?.textContent.trim().match(/^\d+$/)))return;
      grid.classList.add('strip');
      cards.forEach(card=>{const icon=card.querySelector('svg');if(icon&&icon.parentElement!==card)icon.parentElement.classList.add('review-decoration');card.querySelectorAll('p.text-sm,span.text-sm').forEach(label=>label.classList.add('review-kpi-label'))});
    });
    document.querySelectorAll('.review-ged td span').forEach(el=>{if(/^\d+$/.test(el.textContent.trim())&&/(green|gray|slate)/.test(el.className))el.classList.add('review-plain-state')});
    document.querySelectorAll('h1').forEach(title=>{
      const before=title.previousElementSibling,after=title.nextElementSibling;
      if(before?.tagName==='P'&&before.textContent.trim()&&before.textContent===before.textContent.toLocaleUpperCase('pt-BR'))before.classList.add('review-decoration');
      if(after?.tagName==='P'&&!after.hasAttribute('data-review-data')&&after.textContent.trim()&&!/[0-9]|Campinas|Pederneiras|Ribeir\u00e3o|Noroeste|pend\u00eancia|atualizad/i.test(after.textContent))after.classList.add('review-decoration');
    });
    document.querySelectorAll('h1,h2,h3,h4,th,label,.section-title,.grouped-card-title,.module-page-category,.module-page-link-title,.nav-item-label,.nav-item,.nav-group-label,.module-page-group-head,.nav-mobile-title,.uqa-link,.review-kpi-label').forEach(el=>{
      if(el.closest('.login-layout,[contenteditable],.nav-account-title,[data-review-data]'))return;
      for(const child of [...el.childNodes])if(child.nodeType===3&&child.textContent.trim()){
        const value=child.textContent;
        const next=sentence(value);
        setLabelText(child,value,next);
      }
    });
    document.querySelectorAll('.badge,.pill,.tag,.status-badge,.urgency-badge,span').forEach(el=>{
      if(/^(Normal|Concluída|Concluida|Aprovada|Aprovado|Entregue|Vigente)$/i.test(el.textContent.trim()))el.classList.add('review-plain-state');
    });
    document.querySelectorAll('p,small,label,span,div.metric-sub,div[id$="status"],div[role="status"],.totals,.note').forEach(el=>{
      if(el.closest('td,[contenteditable],.login-layout,.indicator-legacy,[data-review-data]'))return;
      for(const child of [...el.childNodes])if(child.nodeType===3){
        const value=child.textContent,next=pluralText(value);
        setLabelText(child,value,next);
      }
    });
    document.querySelectorAll('td.type').forEach(el=>{
      for(const child of [...el.childNodes])if(child.nodeType===3&&child.textContent.trim()==='Indice m3 por trabalhador direto'){
        setLabelText(child,child.textContent,'Índice m³ por trabalhador direto');
      }
    });
    document.querySelectorAll('#rptFooter,#tblFooter').forEach(el=>{
      for(const child of [...el.childNodes])if(child.nodeType===3){
        const value=child.textContent;
        const next=value.split('|').filter(part=>!/Fonte:|Total no banco:|Dados atualizados em\s*--/.test(part)).map(part=>part.trim()).filter(Boolean).join(' · ');
        setLabelText(child,value,next);
      }
    });
    document.querySelectorAll('.dashboard-filter-heading strong,.dashboard-filter-group-label').forEach(el=>{
      for(const child of [...el.childNodes])if(child.nodeType===3){
        const value=child.textContent,next=value.replace(/^[^A-Za-zÀ-ÿ\d]+/,'');
        setLabelText(child,value,next);
      }
    });
  }
  function labelTables() {
    document.querySelectorAll('[data-review-date]:not([data-date-formatted])').forEach(el=>{const d=new Date(el.textContent.trim());if(!Number.isNaN(d.getTime())){el.textContent=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}).format(d);el.dataset.dateFormatted='true'}});
    document.querySelectorAll('table').forEach(table => {
      if (table.dataset.mobileLabels || table.querySelector('thead [colspan],thead [rowspan]')) return;
      const headings = [...table.querySelectorAll('thead tr:last-child th')].map(th => th.textContent.trim());
      if (!headings.length) return;
      table.classList.add('responsive-records');
      table.querySelectorAll('tbody tr').forEach(row => [...row.cells].forEach((cell, index) => {
        if (cell.colSpan === 1 && headings[index]) cell.dataset.label = headings[index];
      }));
    });
  }
  function compactFilters(){
    // Retain the existing input nodes, names and event handlers in authored filters.
    const nativeReports=/\/usinas\/relatorios\//.test(location.pathname);
    const nativeCec=/\/usinas\/$/.test(location.pathname)&&new URLSearchParams(location.search).get('area')==='cec';
    const supplies=/\/suprimentos\//.test(location.pathname);
    if(!nativeReports&&!nativeCec&&!supplies&&!/\/(pcp|mapa\/operacao)\//.test(location.pathname))return;
    document.querySelectorAll('.content-area>.section-card,.filter-card,.dashboard-filter-panel,.pa-filters-inline,.ar-filters,.filter-bar,form.filters,.panel.filters,.sup-buy-filters,.filters,#viewMontagemPostes>.grid,form.cec-filters').forEach(section=>{
      if(section.closest('dialog,[role=dialog]'))return;
      if(!((nativeReports||nativeCec||supplies||section.matches('.ar-filters'))&&section.querySelector('input,select'))&&!section.querySelector('#f-inicio,#sh-inicio,#filter-sector,#miDataInicio,#paDataInicio,#mpFiltroData'))return;
      if(section.querySelector('table,.review-filter-details'))return;
      const details=document.createElement('details');details.className='review-filter-details';
      const summary=document.createElement('summary');details.append(summary);
      while(section.firstChild)details.append(section.firstChild);
      section.append(details);
      const update=()=>{const count=[...details.querySelectorAll('input,select')].filter(input=>input.type==='checkbox'?input.checked:Boolean(input.value)).length;summary.textContent='Filtrar'+(count?' ('+count+')':'');};
      details.addEventListener('input',update);details.addEventListener('change',update);update();
      details.open=!matchMedia('(max-width:600px)').matches;
      if(section.id==='paFiltrosDrawer')document.getElementById('paBtnToggleFiltros')?.addEventListener('click',()=>{details.open=!details.open;});
    });
  }
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; labelTables(); compactFilters(); presentation(); });
  }).observe(document.documentElement, {childList: true, characterData: true, subtree: true});
  document.addEventListener('DOMContentLoaded', labelTables);
  document.addEventListener('DOMContentLoaded',presentation);
  document.addEventListener('DOMContentLoaded',compactFilters);
  let filtersWide=!matchMedia('(max-width:600px)').matches;
  addEventListener('resize',()=>{presentation();const wide=!matchMedia('(max-width:600px)').matches;if(wide!==filtersWide){filtersWide=wide;document.querySelectorAll('.review-filter-details').forEach(details=>{details.open=wide;});}});
  let printing=false;
  if(document.readyState!=='loading'){labelTables();compactFilters();presentation();}
  const printFilters=new Map();
  addEventListener('beforeprint',()=>{printing=true;for(const [node,text] of originals)if(node.isConnected)node.textContent=text;document.querySelectorAll('.review-filter-details,.review-resource-filters').forEach(details=>{printFilters.set(details,details.open);details.open=true;});});
  addEventListener('afterprint',()=>{for(const [details,open] of printFilters)details.open=open;printFilters.clear();printing=false;presentation();});
})();

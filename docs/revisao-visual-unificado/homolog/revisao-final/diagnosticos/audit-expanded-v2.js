() => {
 const styles=new WeakMap();
 const visible=el=>{const r=el.getBoundingClientRect();if(!r.width||!r.height)return false;const s=getComputedStyle(el);styles.set(el,s);return s.display!=='none'&&s.visibility!=='hidden'};
 if(document.querySelector('.login-layout')&&matchMedia('(max-width:1024px)').matches)return {issues:[],preserved_exception:'frozen narrow login; pixel comparison separately'};
 const nodes=[...document.querySelectorAll('body *')].filter(visible);
 const issues=[];const add=(type,el,detail)=>issues.push({type,selector:el.tagName.toLowerCase()+(el.id?'#'+el.id:'.'+[...el.classList].slice(0,2).join('.')),text:el.textContent.trim().slice(0,90),detail});
 for(const el of nodes){
  const s=styles.get(el)||getComputedStyle(el),text=el.textContent.trim();
  if(el.tagName==='IMG'&&(!el.complete||el.naturalWidth===0))add('broken_image',el,el.getAttribute('src'));
  const ownText=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
  if(ownText&&!['SCRIPT','STYLE','SVG','PATH','I'].includes(el.tagName)){
   if(!s.fontFamily.includes('Geist')&&!el.closest('.test-environment-bar,#unificado-version'))add('font',el,s.fontFamily);
   if(s.textTransform==='uppercase'&&!/^(CP|CEC|PCP|MOD|DT|QR|PDF|S[1-4])$/.test(text))add('uppercase_css',el,text);
   if(el.matches('h1,h2,h3,h4,th,.module-page-link-title,.nav-item-label')&&s.whiteSpace==='nowrap'&&el.scrollWidth>el.clientWidth+2&&!el.closest('[class*=scroll],.nav-quick-links,.tabs'))add('clipped_heading',el,{scroll:el.scrollWidth,width:el.clientWidth});
  }
  if(/gradient\(/.test(s.backgroundImage))add('gradient',el,s.backgroundImage);
  const radius=parseFloat(s.borderTopLeftRadius);
  if(radius>0&&![4,6].includes(radius)&&!el.matches('input[type=checkbox],input[type=radio]')&&!el.closest('svg')&&!/avatar|dot|point|spinner|progress|track|meter|switch|toggle|check|radio|circle|sr-only/.test(el.className?.toString()||'')&&!(Math.abs(el.clientWidth-el.clientHeight)<2&&s.borderTopLeftRadius.includes('%')))add('radius',el,s.borderTopLeftRadius);
  if(el.matches('.badge,.pill,.tag,.status-badge')&&/^(Normal|Concluída)$/i.test(text)&&(s.backgroundColor!=='rgba(0, 0, 0, 0)'||parseFloat(s.borderRadius)>6))add('normal_pill',el,s.backgroundColor);
  if(el.matches('.card .card,.panel .panel,.section-card .grouped-card')&&s.backgroundColor!=='rgba(0, 0, 0, 0)'&&parseFloat(s.borderTopWidth)>0)add('nested_card',el,s.backgroundColor);
 }
 const text=document.body.innerText;
 const filler=['Telas disponíveis para seu perfil.','Realizado ÷ programado','Saldo dos setores','Programado no PCP e realizado no Mapa.','Sua fila de trabalho e as solicitações da unidade.','Volumes consolidados no período'];
 for(const phrase of filler)if(text.includes(phrase))issues.push({type:'filler',detail:phrase});
 for(const el of nodes.filter(el=>el.matches('.module-page-link-description'))){if(el.textContent.trim().length>50)add('description_length',el,el.textContent.trim().length);}
 const quick=[...document.querySelectorAll('.module-page-quick-links a,.module-page-quick>a,.nav-quick>a')].filter(visible);
 const labels=quick.map(el=>el.textContent.trim());
 if(new Set(labels).size<labels.length)issues.push({type:'duplicate_shortcut_label',detail:labels});
 if(document.querySelector('#uqa-home:not([hidden])')&&nodes.some(el=>el.matches('#uqa-home a')&&el.textContent.trim()==='Abrir'))issues.push({type:'redundant_open_button'});
 const activeDialog=nodes.find(el=>el.matches('[role=dialog],[aria-modal=true],dialog[open],.scrim>.drawer,.pv-scrim>.pv-drawer'));
 const headings=nodes.filter(el=>el.matches('h1,h2,h3,h4')&&(!activeDialog||activeDialog.contains(el))&&(!document.body.classList.contains('nav-mobile-open')||el.closest('.nav-modern'))).map(el=>({el,rect:el.getBoundingClientRect()})).filter(({rect})=>rect.top<innerHeight&&rect.bottom>0).slice(0,80);
 for(let i=0;i<headings.length;i++)for(let j=i+1;j<headings.length;j++){
   const a=headings[i].el,b=headings[j].el;if(a.contains(b)||b.contains(a))continue;
   const x=headings[i].rect,y=headings[j].rect;
   if(x.top<innerHeight&&y.top<innerHeight&&Math.min(x.right,y.right)-Math.max(x.left,y.left)>8&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>4)add('overlapping_headings',a,b.textContent.trim());
 }
 if(/\b1 urgentes\b/.test(text))issues.push({type:'plural',detail:'1 urgentes'});
 if(/\b0 há mais de 24 h\b/.test(text))issues.push({type:'plural',detail:'0 há mais de 24 h'});
 if(/Atingimento\s+0\.0%/.test(text))issues.push({type:'zero_denominator_or_decimal',detail:'Atingimento 0.0%'});
 const mobileTitle=document.querySelector('.nav-mobile-title')?.textContent;
 // Expanded final review: inspect computed geometry, rather than CSS class names.
 const leafText=el=>[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim();
 const labelNodes=nodes.filter(el=>el.matches('h1,h2,h3,h4,th,.nav-mobile-title,.nav-item,.nav-item-label,.module-page-link-title'));
 for(const el of nodes){
  const own=leafText(el);if(!own||el.closest('script,style,svg,.test-environment-bar'))continue;
  if(/ -- |\(s\)|\bm3\b/.test(own))add('interface_text',el,own);
  if(/\b(producao|programacao|liberacao|relatorio|manutencao|analise|solicitacao|cotacao)\b/i.test(own)&&labelNodes.includes(el))add('missing_accent',el,own);
  if(el.matches('th')&&el.scrollWidth>el.clientWidth+1)add('clipped_table_heading',el,{scroll:el.scrollWidth,width:el.clientWidth});
 }
 const exceptions=['Cobli','Mega','SC','DT','CP','CEC','PCP','MOD','GED','ERP','IQF','CNPJ','EPI','NC','RH','Campinas','Pederneiras','Ribeirão Preto','Noroeste','Concrefer','ConcreTrack'];
 for(const el of labelNodes){
  const own=leafText(el);
  for(const name of exceptions){const matches=own.match(new RegExp('\\b'+name+'\\b','gi'))||[];if(matches.some(value=>value!==name))add('proper_name_case',el,name);}
 }
 for(const el of nodes.filter(el=>el.matches('button,a.btn,input[type=submit],[role=button]'))){
  const color=getComputedStyle(el).backgroundColor;
  const rgb=color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if(!rgb||el.closest('.login-layout,.nav-modern,.nav-mobile-bottom,.nav-quick'))continue;
  const [r,g,b]=rgb.slice(1).map(Number);
  if((r>150&&g>40&&g<180&&b<100)||(b>100&&b>r*1.4&&b>g*1.1)){
   if(!['rgb(11, 23, 48)','rgb(21, 65, 111)'].includes(color))add('button_palette',el,{color,classes:el.className});
  }
 }
 const siblingGroups=new Map();
 for(const el of nodes.filter(el=>el.matches('.nav-tree .nav-item'))){
  const label=el.querySelector('.nav-item-label');let x;
  if(label)x=label.getBoundingClientRect().left;
  else{const textNode=[...el.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());if(!textNode)continue;const range=document.createRange();range.selectNodeContents(textNode);x=range.getBoundingClientRect().left;}
  const group=siblingGroups.get(el.parentElement)||[];group.push({el,x});siblingGroups.set(el.parentElement,group);
 }
 for(const group of siblingGroups.values())if(group.length>1){const start=group[0].x;for(const item of group)if(Math.abs(item.x-start)>1)add('menu_alignment',item.el,{x:item.x,expected:start});}
 const titles=nodes.filter(el=>el.matches('h1,h2,.nav-mobile-title')&&el.getBoundingClientRect().top<innerHeight);
 for(let i=0;i<titles.length;i++)for(let j=i+1;j<titles.length;j++)if(titles[i].textContent.trim()&&titles[i].textContent.trim()===titles[j].textContent.trim()&&!titles[i].contains(titles[j]))add('duplicate_title',titles[j],titles[i].textContent.trim());
 const surface=el=>{const s=getComputedStyle(el);return ['Top','Right','Bottom','Left'].filter(side=>parseFloat(s['border'+side+'Width'])>0&&s['border'+side+'Style']!=='none').length>=3||s.boxShadow!=='none';};
 const surfaceContainers='section,article,fieldset,div:not([role=textbox]):not([role=combobox]):not([contenteditable])';
 for(const el of nodes.filter(el=>el.matches(surfaceContainers))){
  if(!surface(el))continue;let outer=el.parentElement;
  while(outer&&outer!==document.body&&!(outer.matches(surfaceContainers)&&visible(outer)&&surface(outer)))outer=outer.parentElement;
  if(outer===document.body)outer=null;
  if(outer&&visible(outer)&&surface(outer))add('nested_surface',el,outer.className);
 }
 for(const el of nodes.filter(el=>el.matches('h2,h3,.section-title'))){const icon=el.querySelector('svg,i')||el.previousElementSibling?.querySelector('svg');if(icon&&visible(icon)){const parent=icon.parentElement,s=getComputedStyle(parent);if(parent!==el&&visible(parent)&&s.backgroundColor!=='rgba(0, 0, 0, 0)'&&parent.getBoundingClientRect().width<=64)add('decorative_title_icon',el,parent.className);}}
 if(innerWidth<=600){const records=nodes.filter(el=>(location.pathname.endsWith('metodologia-conteudo.html')&&el.matches('p'))||el.matches('tbody tr,.sup-compact-list>*,.overview-unit-row,[data-review-record],.module-page-link,.activity-card,.metric-value,.stat-value,.kpi-value,.kpi strong,.overview-stat strong,.kg-homem-value,.grouped-indicator strong,.mi-kpi-val,.summary-grid strong,.abs-fields,.area-card,.metric strong,.cr-dimension .cr-form,.kpi-val,.kpi .value,.lg-kpis strong,.kpis strong,.cr-kpi strong,.native-card strong,.sup-rec-item,.ar-summary strong,.s4-layout-editor,.forma-card,.sensor .value,.stat strong,.native-tab,.card.grid2,.card.grid3'));const first=records.sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top)[0];if(first&&first.getBoundingClientRect().top>=844)add('mobile_data_below_fold',first,first.getBoundingClientRect().top);}
 if(innerWidth<768&&new URLSearchParams(location.search).has('view')&&mobileTitle==='Início')issues.push({type:'mobile_title',detail:mobileTitle});
 return {issues,images:nodes.filter(n=>n.tagName==='IMG').length,body_font:getComputedStyle(document.body).fontFamily,mobile_title:mobileTitle,
  criteria:{typed_icons:{visible_paths:[...new Set(nodes.filter(el=>el.matches('.module-page-icon path,.nav-item-code path,.uqa-icon path')).map(el=>el.getAttribute('d')))]},filler:{forbidden_phrases_found:issues.filter(i=>i.type==='filler').length},descriptions:{over_limit:issues.filter(i=>i.type==='description_length').length},tabs:{duplicate_labels:labels.length-new Set(labels).size},sentence_case:{uppercase_css:issues.filter(i=>i.type==='uppercase_css').length},density:{module_row_heights:nodes.filter(el=>el.matches('.module-page-link')).map(el=>Math.round(el.getBoundingClientRect().height))},surfaces:{nested_cards:issues.filter(i=>i.type==='nested_card').length},states:{normal_pills:issues.filter(i=>i.type==='normal_pill').length},redundancies:{open_buttons:issues.filter(i=>i.type==='redundant_open_button').length}},
  review_items:[...document.querySelectorAll('.module-page-link,.nav-item,.uqa-card')].filter(visible).slice(0,100).map(el=>({text:el.textContent.trim().slice(0,100),icon:el.querySelector('svg path')?.getAttribute('d'),height:Math.round(el.getBoundingClientRect().height)}))};
}

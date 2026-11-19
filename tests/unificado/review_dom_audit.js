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
 if(innerWidth<768&&new URLSearchParams(location.search).has('view')&&mobileTitle==='Início')issues.push({type:'mobile_title',detail:mobileTitle});
 return {issues,images:nodes.filter(n=>n.tagName==='IMG').length,body_font:getComputedStyle(document.body).fontFamily,mobile_title:mobileTitle,
  criteria:{typed_icons:{visible_paths:[...new Set(nodes.filter(el=>el.matches('.module-page-icon path,.nav-item-code path,.uqa-icon path')).map(el=>el.getAttribute('d')))]},filler:{forbidden_phrases_found:issues.filter(i=>i.type==='filler').length},descriptions:{over_limit:issues.filter(i=>i.type==='description_length').length},tabs:{duplicate_labels:labels.length-new Set(labels).size},sentence_case:{uppercase_css:issues.filter(i=>i.type==='uppercase_css').length},density:{module_row_heights:nodes.filter(el=>el.matches('.module-page-link')).map(el=>Math.round(el.getBoundingClientRect().height))},surfaces:{nested_cards:issues.filter(i=>i.type==='nested_card').length},states:{normal_pills:issues.filter(i=>i.type==='normal_pill').length},redundancies:{open_buttons:issues.filter(i=>i.type==='redundant_open_button').length}},
  review_items:[...document.querySelectorAll('.module-page-link,.nav-item,.uqa-card')].filter(visible).slice(0,100).map(el=>({text:el.textContent.trim().slice(0,100),icon:el.querySelector('svg path')?.getAttribute('d'),height:Math.round(el.getBoundingClientRect().height)}))};
}

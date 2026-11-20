/* Shared screen search. Pure engine is also exported for the reference tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UnificadoBusca = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const fold = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const words = value => fold(value).match(/[a-z0-9]+/g) || [];
  const formCache=new Map();
  function forms(word) {
    if(formCache.has(word))return formCache.get(word);
    const out = [word];
    if (word.length >= 4 && !/\d/.test(word)) {
      if (word.endsWith('oes')) out.push(word.slice(0,-3)+'ao');
      if (word.endsWith('ais')) out.push(word.slice(0,-3)+'al');
      if (word.endsWith('es')) out.push(word.slice(0,-2));
      if (word.endsWith('s')) out.push(word.slice(0,-1));
    }
    if(formCache.size<4000)formCache.set(word,out);
    return out;
  }
  const same = (a,b) => forms(a).some(form => forms(b).includes(form));
  function distance(a,b,limit=2) {
    if (Math.abs(a.length-b.length)>limit) return limit+1;
    let older, prev=Array.from({length:b.length+1},(_,i)=>i);
    for (let i=1;i<=a.length;i++) {
      const row=[i];
      for (let j=1;j<=b.length;j++) {
        row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
        if (i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) row[j]=Math.min(row[j],older[j-2]+1);
      }
      older=prev;prev=row;
    }
    return prev[b.length];
  }
  function synonymGroups(data) {
    return Object.entries(data || {}).filter(([key,values])=>key && Array.isArray(values)).map(([key,values])=>
      [key,...values.filter(value=>typeof value==='string')].map(text=>({text,tokens:words(text)})).filter(term=>term.tokens.length));
  }
  function createIndex(entries, synonyms={}) {
    const groups=synonymGroups(synonyms), dictionary=new Set();
    const rows=entries.map((entry,order)=> {
      const fields=[entry.name,entry.description,[entry.group,entry.module,entry.unit].filter(Boolean).join(' ')].map(words);
      const native=fields.flat(), aliases=[];
      for (const group of groups) {
        const source=group.find(term=>term.tokens.every(token=>native.some(word=>same(word,token))));
        if (!source) continue;
        for (const term of group) if (term!==source) for (const token of term.tokens) aliases.push({word:token,label:term.text+' ↔ '+source.text});
      }
      native.forEach(word=>dictionary.add(word));aliases.forEach(alias=>dictionary.add(alias.word));
      return {...entry,order,_fields:fields,_aliases:aliases};
    });
    const vocabulary=[...dictionary];
    function search(value,{moduleId,limit=Infinity,boost=[]}={}) {
      const query=words(value);if(!query.length)return {results:[],corrections:[],suggestion:''};
      const fuzzy=new Map();
      for (const token of query) {
        const candidates=new Map();const max=token.length>=8?2:token.length>=4?1:0;
        if(max&&!/\d/.test(token)) for (const word of vocabulary) {
          if(word.length<4||/\d/.test(word)||same(token,word))continue;
          let best={cost:max+1,to:word};
          for(const term of forms(word))for(const queryForm of forms(token)){
            if(term.length<4||queryForm.length<4)continue;
            const cost=distance(queryForm,term,max);if(cost<best.cost)best={cost,to:term};
          }
          if(best.cost<=max)candidates.set(word,best);
        }
        fuzzy.set(token,candidates);
      }
      const results=[];
      for (const row of rows) {
        if(moduleId&&row.moduleId!==moduleId)continue;
        let rank=0,cost=0;const corrected=[],synonymsUsed=[],highlight=new Set(query);let valid=true;
        for (const token of query) {
          let match=null;
          for (let field=0;field<row._fields.length&&!match;field++) {
            const word=row._fields[field].find(word=>same(token,word)||(token.length>=4&&!/\d/.test(token)&&word.startsWith(token)));
            if(word)match={rank:field+2,word,cost:0};
          }
          if(!match){const alias=row._aliases.find(alias=>same(token,alias.word));if(alias)match={rank:5,word:alias.word,synonym:alias.label,cost:0};}
          if(!match){
            for(const word of [...row._fields.flat(),...row._aliases.map(alias=>alias.word)]){
              const candidate=fuzzy.get(token).get(word);if(candidate===undefined)continue;
              if(!match||candidate.cost<match.cost)match={rank:6,word:candidate.to,cost:candidate.cost,correction:true,synonym:row._aliases.find(alias=>alias.word===word)?.label};
            }
          }
          if(!match){valid=false;break;}
          rank=Math.max(rank,match.rank);cost+=match.cost;highlight.add(match.word);
          if(match.correction)corrected.push({from:token,to:match.word});
          if(match.synonym)synonymsUsed.push(match.synonym);
        }
        if(!valid)continue;
        if(rank<=2){const name=words(row.name).join(' '),needle=query.join(' ');rank=name===needle?0:name.startsWith(needle)?1:2;}
        const { _fields,_aliases,...entry }=row;
        results.push({...entry,rank,cost,corrected,synonymsUsed:[...new Set(synonymsUsed)],highlight:[...highlight]});
      }
      const priority=id=>{const index=boost.indexOf(id);return index<0?1e6:index;};
      results.sort((a,b)=>a.rank-b.rank||a.cost-b.cost||priority(a.id)-priority(b.id)||a.order-b.order);
      const first=results[0];
      const corrections=first?.corrected || [];
      let suggestion='';
      if(!first){
        const corrected=query.map(token=> [...fuzzy.get(token).values()].sort((a,b)=>a.cost-b.cost||a.to.localeCompare(b.to))[0]?.to||token);
        if(corrected.some((word,i)=>word!==query[i]))suggestion=corrected.join(' ');
      }
      return {results:results.slice(0,limit),corrections,suggestion};
    }
    return Object.freeze({search,entries:rows.map(({_fields,_aliases,...row})=>row)});
  }
  function catalog(config,items,descriptions,allowed,{homolog=false,allowedModules=null}={}) {
    const entries=[];
    for(const [moduleId,module] of Object.entries(config)) {
      if(allowedModules&&!allowedModules.includes(moduleId))continue;
      for(const group of module.groups||[])for(const item of group.items||[]){
        const route=items[item.id];
        if(!route||!allowed(route)||(!homolog&&(item.ambiente==='homolog'||route.ambiente==='homolog'||item.id==='testeProgramacao')))continue;
        let unit=group.unitName || ({noroeste:'Noroeste',campinas:'Campinas',pederneiras:'Pederneiras',ribeirao:'Ribeirão Preto'}[group.unitCode]) || '';
        if(!unit&&['producao','laboratorio','usinas'].includes(moduleId))unit=/noroeste/i.test(group.label+' '+route.url)?'Noroeste':/pederneiras/i.test(group.label)?'Pederneiras':/ribeir/i.test(group.label)?'Ribeirão Preto':'Campinas';
        entries.push({id:item.id,name:item.label,description:descriptions[item.id]||'',module:module.label,moduleId,unit,group:group.label||'Geral',url:route.url,ambiente:item.ambiente||route.ambiente||null});
      }
    }
    return entries;
  }
  function mergeCatalog(entries) {
    const screens=new Map();
    for(const entry of entries){
      if(!entry?.id||!entry.url)continue;
      const url=new URL(entry.url,'https://unificado.invalid');url.searchParams.sort();
      const key=entry.moduleId+'|'+url.pathname+'?'+url.searchParams+url.hash;
      const existing=screens.get(key);
      if(!existing){screens.set(key,{...entry});continue;}
      existing.description=[...new Set([existing.description,entry.name!==existing.name?entry.name:'',entry.description].filter(Boolean))].join(' · ');
    }
    return [...screens.values()];
  }
  let index=createIndex([]),synonyms={},ready=Promise.resolve(),generation=0;
  const explanation=response=>response?.corrections?.length?'mostrando resultados para '+[...new Set(response.corrections.map(row=>row.to))].join(', '):response?.results?.[0]?.synonymsUsed?.length?'Encontradas pelo sinônimo '+response.results[0].synonymsUsed.join(', '):'';
  const api={fold,words,forms,distance,createIndex,catalog,mergeCatalog,explanation,search:(query,options)=>index.search(query,options),entries:()=>index.entries,ready:()=>ready};
  if(typeof window==='undefined'||!window.document)return api;
  const root='/unificado/',homolog=location.port==='18446';
  const scriptUrl=document.currentScript.src;
  const read=key=>{try{return localStorage.getItem(key);}catch{return null;}};
  function recentQueries(){try{const value=JSON.parse(read('unificado.busca.recentes')||'[]');return Array.isArray(value)?value.filter(text=>typeof text==='string').slice(0,5):[];}catch{return [];}}
  function rememberQuery(query){if(!query.trim())return;try{localStorage.setItem('unificado.busca.recentes',JSON.stringify([query.trim().slice(0,160),...recentQueries().filter(text=>fold(text)!==fold(query.trim()))].slice(0,5)));}catch{}}
  function boost(){
    const ids=[...document.querySelectorAll('#uqa-home [data-screen]')].map(node=>node.dataset.screen);
    const uid=(typeof mapaUser!=='undefined'&&mapaUser?.id)||(typeof pcpUser!=='undefined'&&pcpUser?.id)||'guest';
    try{for(const row of JSON.parse(read('unificado.navigation.recent.'+uid)||'[]'))if(row.id)ids.push(row.id);}catch{}
    return [...new Set(ids)];
  }
  async function rebuild(){
    const ticket=++generation;index=createIndex([]);
    if(!await window.UnificadoScreenAccess?.ready||ticket!==generation)return;
    const snapshot=window.UnificadoSidebarModelA?.snapshot();if(!snapshot)return;
    const configs={...MENU_CONFIG};
    if(snapshot.allowedModuleIds.includes('ged'))configs.ged={label:'GED',groups:[{label:'Gestão documental',items:(window.UnificadoGedMenu||[]).map(item=>({...item}))}]};
    const items={...MENU_ITEMS};for(const item of window.UnificadoGedMenu||[])items[item.id]={...item,url:root+'ged/'+item.route};
    const entries=catalog(configs,items,window.UnificadoPresentation?.descriptions||{},item=>snapshot.allowedItemIds.includes(item.id)&&(item.id.startsWith('ged-')||canUse(item)),{homolog,allowedModules:snapshot.allowedModuleIds});
    // Navigation publishes the exact authorized menu, including late native
    // groups and GED. Consume its existing result; never request access again.
    const menu=window.UnificadoNavigationCatalog?.entries()||[];
    if(ticket===generation){index=createIndex(mergeCatalog([...entries,...menu]),synonyms);if(dialog.open)render();}
  }
  ready=fetch(new URL('busca-sinonimos.json',scriptUrl),{cache:'no-store',credentials:'same-origin'}).then(response=>response.ok?response.json():{}).then(data=>{synonyms=data&&typeof data==='object'&&!Array.isArray(data)?data:{};}).catch(()=>{}).then(rebuild);
  api.rebuild=()=>{ready=ready.then(rebuild);return ready;};
  const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
  function marked(el,text,terms){
    let plain='';
    for(const part of String(text).split(/(\p{L}+[\p{L}\p{N}]*|\d+)/u)){
      const normalized=fold(part),match=terms.some(term=>same(normalized,term)||(term.length>=4&&normalized.startsWith(term)));
      if(match){if(plain){el.append(document.createTextNode(plain));plain='';}el.append(node('mark','',part));}else plain+=part;
    }
    if(plain)el.append(document.createTextNode(plain));
  }
  const iconTemplates=new Map();
  function resultIcon(entry){
    const key=window.UnificadoIcons.forScreen({id:entry.id,label:entry.name});
    if(!iconTemplates.has(key))iconTemplates.set(key,window.UnificadoIcons.node(key));
    return iconTemplates.get(key).cloneNode(true);
  }
  const dialog=node('dialog','uni-search');dialog.setAttribute('aria-label','Buscar telas do Uni');
  const heading=node('div','uni-search-heading'),back=node('button','uni-search-back','←');back.type='button';back.setAttribute('aria-label','Voltar e fechar busca');
  const label=node('label','uni-search-label');label.htmlFor='uni-search-input';label.textContent='Buscar telas';
  const input=node('input','uni-search-input');input.id='uni-search-input';input.type='search';input.placeholder='Buscar tela ou atividade';input.autocomplete='off';input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls','uni-search-results');input.setAttribute('aria-expanded','false');input.setAttribute('aria-label','Buscar tela ou atividade em todos os módulos');
  const close=node('button','uni-search-close','Esc');close.type='button';close.setAttribute('aria-label','Fechar busca');heading.append(back,label,input,close);
  const status=node('div','uni-search-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const list=node('div','uni-search-list');list.id='uni-search-results';list.setAttribute('role','listbox');list.setAttribute('aria-label','Telas encontradas');
  const foot=node('footer','uni-search-footer','↑ ↓ navegar    Enter abrir    Esc fechar');dialog.append(heading,status,list,foot);document.body.append(dialog);
  let results=[],active=-1,restoreFocus=null,renderMore=()=>false;
  function select(position,scroll=false){
    active=results.length?Math.max(0,Math.min(position,results.length-1)):-1;
    while(active>=0&&!document.getElementById('uni-search-result-'+active)&&renderMore()){}
    for(const option of list.querySelectorAll('[role=option]')){const selected=Number(option.dataset.index)===active;option.setAttribute('aria-selected',String(selected));option.classList.toggle('is-current',selected);}
    if(active>=0){input.setAttribute('aria-activedescendant','uni-search-result-'+active);if(scroll)document.getElementById('uni-search-result-'+active)?.scrollIntoView({block:'nearest'});}else input.removeAttribute('aria-activedescendant');
  }
  function hide(){
    rememberQuery(input.value);dialog.close();input.setAttribute('aria-expanded','false');
    if(restoreFocus?.isConnected&&!dialog.contains(restoreFocus))restoreFocus.focus();
    if(dialog.contains(document.activeElement)){
      const previous=document.body.getAttribute('tabindex');document.body.tabIndex=-1;document.body.focus({preventScroll:true});
      if(previous===null)document.body.removeAttribute('tabindex');else document.body.setAttribute('tabindex',previous);
    }
  }
  function openEntry(entry){
    if(!index.entries.some(row=>row.id===entry.id))return;
    rememberQuery(input.value);hide();
    if(entry.moduleId==='ged')window.UnificadoRouter?.openGed(entry.url.split('/').pop());
    else window.UnificadoRouter?.open(entry.url,entry.id);
  }
  function render(){
    const query=input.value.trim(),response=index.search(query,{boost:boost()});results=response.results;list.scrollTop=0;list.replaceChildren();status.replaceChildren();renderMore=()=>false;
    if(!query){
      results=[];status.textContent='Buscas recentes';const recent=recentQueries();
      if(!recent.length)list.append(node('p','uni-search-empty','Busque pelo nome da tela ou atividade.'));
      for(const text of recent){const button=node('button','uni-search-recent',text);button.type='button';button.addEventListener('click',()=>{input.value=text;render();input.focus();});list.append(button);}
      if(recent.length){const clear=node('button','uni-search-clear','Limpar');clear.type='button';clear.addEventListener('click',()=>{try{localStorage.removeItem('unificado.busca.recentes');}catch{}render();input.focus();});status.append(clear);}
    }else if(!results.length){
      status.textContent=`Nenhuma tela encontrada para '${query}'.`;
      if(response.suggestion){const suggest=node('button','uni-search-suggestion','Você quis dizer: '+response.suggestion);suggest.type='button';suggest.addEventListener('click',()=>{input.value=response.suggestion;render();input.focus();});list.append(suggest);}
    }else{
      status.textContent=results.length===1?'1 tela':results.length+' telas';
      if(response.corrections.length)status.append(document.createTextNode(' · mostrando resultados para '+[...new Set(response.corrections.map(row=>row.to))].join(', ')));
      let shown=0,lastTitle='',group=null;
      const snapshot=results;
      renderMore=()=>{
        if(snapshot!==results||shown>=results.length)return false;
        const end=Math.min(shown+6,results.length);
        for(let position=shown;position<end;position++){
          const entry=results[position],title=entry.group+' · '+entry.module;
          if(title!==lastTitle){group=node('div','uni-search-group');group.setAttribute('role','group');group.setAttribute('aria-label',title);const groupTitle=node('div','uni-search-group-title',title);groupTitle.setAttribute('role','presentation');group.append(groupTitle);list.append(group);lastTitle=title;}
          const option=node('div','uni-search-result');option.id='uni-search-result-'+position;option.dataset.index=position;option.dataset.screenId=entry.id;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.setAttribute('aria-setsize',String(results.length));option.setAttribute('aria-posinset',String(position+1));
          const icon=node('span','uni-search-icon');icon.setAttribute('aria-hidden','true');icon.append(resultIcon(entry));
          const copy=node('div','uni-search-copy'),name=node('strong',''),desc=node('small','');marked(name,entry.name,entry.highlight);marked(desc,entry.description||entry.group,entry.highlight);
          if(entry.unit){const unit=node('span','uni-search-desktop-unit');marked(unit,' · '+entry.unit,entry.highlight);desc.append(unit);}
          const context=node('small','uni-search-context');marked(context,[entry.module,entry.unit].filter(Boolean).join(' · '),entry.highlight);copy.append(name,desc,context);
          if(entry.synonymsUsed.length)copy.append(node('span','uni-search-synonym',entry.synonymsUsed.join(', ')));
          option.append(icon,copy);option.addEventListener('pointermove',()=>select(position));option.addEventListener('click',()=>openEntry(entry));group.append(option);
        }shown=end;return true;
      };
      renderMore();
      requestAnimationFrame(()=>{if(snapshot===results&&shown<results.length&&list.scrollHeight<=list.clientHeight)renderMore();});
    }select(results.length?0:-1);
  }
  async function open(){if(dialog.open)return;const initiator=document.activeElement;await ready;if(dialog.open)return;restoreFocus=initiator;input.value='';dialog.showModal();input.setAttribute('aria-expanded','true');render();input.focus();}
  api.open=open;api.close=hide;api.recentQueries=recentQueries;
  back.addEventListener('click',hide);close.addEventListener('click',hide);dialog.addEventListener('cancel',event=>{event.preventDefault();hide();});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)hide();}});
  input.addEventListener('input',render);
  list.addEventListener('scroll',()=>{if(list.scrollTop+list.clientHeight>=list.scrollHeight-80)renderMore();});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();hide();return;}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();select(active+(event.key==='ArrowDown'?1:-1),true);}
    if(event.key==='Enter'&&results[active]){event.preventDefault();openEntry(results[active]);}
    if(event.key==='Tab'){
      const focusable=[...dialog.querySelectorAll('button:not([hidden]),input')].filter(el=>el.getClientRects().length&&!el.disabled),first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  const shortcut=event=>{
    const target=event.target,typing=target?.nodeType===1&&Boolean(target.closest('input,textarea,select,[contenteditable]:not([contenteditable=false]),[role=textbox]'));
    if(!typing&&!event.altKey&&((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'||!event.ctrlKey&&!event.metaKey&&event.key==='/')){event.preventDefault();open();}
  };
  document.addEventListener('keydown',shortcut);
  const wired=new WeakSet();
  function wireFrames(){for(const frame of document.querySelectorAll('iframe')){if(wired.has(frame))continue;wired.add(frame);const wire=()=>{try{if(frame.contentWindow.location.origin===location.origin)frame.contentDocument.addEventListener('keydown',shortcut);}catch{}};frame.addEventListener('load',wire);wire();}}
  new MutationObserver(wireFrames).observe(document.getElementById('module-host')||document.body,{childList:true,subtree:true});wireFrames();
  addEventListener('unificado-sidebar-model-a-update',()=>{if(dialog.open)list.replaceChildren();api.rebuild().then(()=>{if(dialog.open)render();});});
  addEventListener('unificado-navigation-catalog-updated',()=>{api.rebuild();});
  return api;
});

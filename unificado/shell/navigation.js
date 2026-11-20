/* Navigation for the Unificado shell. Screen ids, URLs and access rules stay in
 * menu.config.js and the existing IAM snapshot. Dedicated module PWAs do not
 * load this file. */
(() => {
  const host = window.UnificadoSidebarModelA;
  if (!host || typeof MENU_CONFIG === 'undefined' || typeof MENU_ITEMS === 'undefined') return;
  const root = document.querySelector('.desktop-only');
  const main = root?.querySelector('.main-panel');
  if (!root || !main) return;

  const moduleTheme = window.UnificadoModuleTheme?.theme || {};
  const moduleCodes = Object.fromEntries(Object.entries(moduleTheme).map(([id,theme]) => [id,theme.sigla]));
  function applyModuleTheme(node, moduleId) {
    const theme = moduleTheme[moduleId];
    if (!theme) return;
    node.style.setProperty('--nav-accent', theme.color);
    node.style.setProperty('--nav-accent-ink', theme.ink);
  }
  const gedItems = [
    ['ged-dashboard','Painel','dashboard'],['ged-documents','Documentos','documents'],
    ['ged-approvals','Aprovações','approvals'],['ged-tasks','Tarefas','tasks'],
    ['ged-calibrations','Calibrações','calibrations']
  ];
  const safeGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const safeSet = (key,value) => { try { localStorage.setItem(key,value); } catch { /* storage optional */ } };
  const userId = mapaUser?.id || pcpUser?.id || 'guest';
  const keyFor = module => `unificado.navigation.${userId}.${module}`;
  const recentKey = `unificado.navigation.recent.${userId}`;
  const tabletKey = `unificado.navigation.tablet.${userId}`;
  const state = {module:null, route:'', search:'', tree:{}, tabletOpen:safeGet(tabletKey)==='1',
    desktopCollapsed:safeGet('ct.sidebar.collapsed')==='1', mobileOpen:false,
    mobileMode:'telas', historyAdded:false, helpOpen:false, recent:[], snapshot:null};
  state.armacaoUnits=[];
  try { state.recent = JSON.parse(safeGet(recentKey) || '[]').slice(0,8); } catch { state.recent=[]; }

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (className,text,handler) => {
    const node=el('button',className,text); node.type='button'; node.addEventListener('click',handler); return node;
  };
  const strokeIcon = (className,pathData) => {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class',className);
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('fill','none');
    svg.setAttribute('stroke','currentColor');
    svg.setAttribute('stroke-width','2');
    svg.setAttribute('stroke-linecap','round');
    svg.setAttribute('stroke-linejoin','round');
    svg.setAttribute('aria-hidden','true');
    svg.setAttribute('focusable','false');
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',pathData);
    svg.append(path);
    return svg;
  };
  const groupChevron=()=>strokeIcon('nav-chevron','m9 18 6-6-6-6');
  const downChevron=className=>strokeIcon(className,'m6 9 6 6 6-6');
  const reloadIcon=()=>strokeIcon('nav-reload-icon','M20 11a8 8 0 1 1-2.4-5.7 M20 4v7h-7');
  const nav = el('nav','nav-modern'); nav.id='nav-modern'; nav.setAttribute('aria-label','Navegação do Uni');
  const rail = el('div','nav-rail');
  const panel = el('div','nav-panel');
  const panelHead = el('div','nav-panel-head');
  const panelTitle = el('strong','nav-panel-title','Telas');
  const brand=el('a','nav-brand');brand.href='/unificado/';brand.setAttribute('aria-label','Início do Uni');
  const brandLogo=el('img','nav-brand-logo');brandLogo.src='/unificado/assets/img/logo-concrefer.png';brandLogo.alt='Concrefer';
  brand.append(brandLogo);
  brand.addEventListener('click',event=>{event.preventDefault();navigateHref('/unificado/');});
  const closeButton = button('nav-panel-close','',() => {
    if(matchMedia('(min-width:1280px)').matches)setDesktopCollapsed(true);
    else if(matchMedia('(min-width:768px)').matches)setTabletOpen(false);
    else closeMobile();
  }); closeButton.setAttribute('aria-label','Recolher ou fechar menu');
  closeButton.append(strokeIcon('nav-collapse-icon','m15 18-6-6 6-6'),
    strokeIcon('nav-close-icon','M18 6 6 18 M6 6l12 12'));
  panelHead.append(brand,panelTitle,closeButton);
  const moduleSwitcher=button('nav-module-switcher','',()=>{
    state.moduleMenuOpen=!state.moduleMenuOpen;
    nav.classList.toggle('nav-modules-open',state.moduleMenuOpen);
    moduleSwitcher.setAttribute('aria-expanded',String(state.moduleMenuOpen));
  });
  moduleSwitcher.setAttribute('aria-label','Selecionar módulo');
  moduleSwitcher.setAttribute('aria-expanded','false');
  const moduleArea = el('div','nav-module-area');
  const searchWrap = el('div','nav-search-wrap');
  const search = button('uni-search-trigger','',()=>window.UnificadoBusca.open());
  search.setAttribute('aria-label','Buscar telas · Ctrl K');
  search.append(window.UnificadoIcons.node('busca'),el('span','uni-search-trigger-text','Buscar'),el('kbd','','Ctrl K'));
  searchWrap.append(search);
  const controls = el('div','nav-controls');
  const tree = el('div','nav-tree');
  const footer = el('div','nav-footer');
  panel.append(panelHead,moduleSwitcher,moduleArea,searchWrap,controls,tree,footer);
  nav.append(rail,panel);
  root.insertBefore(nav,root.firstChild);

  const mobileTop = el('header','nav-mobile-top');
  const mobileMenu = button('nav-mobile-icon','',() => openMobile('telas'));
  mobileMenu.setAttribute('aria-label','Abrir telas');mobileMenu.append(window.UnificadoIcons.node('menu'));
  const mobileHeading=el('div','nav-mobile-heading');
  const mobileContext=el('small','nav-mobile-context','Uni');
  const mobileTitle=el('strong','nav-mobile-title','Início');
  mobileHeading.append(mobileContext,mobileTitle);
  const mobileSearch=button('nav-mobile-search','',() => window.UnificadoBusca.open());
  mobileSearch.setAttribute('aria-label','Buscar tela');mobileSearch.append(window.UnificadoIcons.node('busca'));
  mobileTop.append(mobileMenu,mobileHeading,mobileSearch);
  const banner=button('nav-mobile-update','',() => host.update()); banner.hidden=true;
  const quick=el('div','nav-quick');
  main.insertBefore(mobileTop,main.firstChild);
  main.insertBefore(banner,mobileTop.nextSibling);
  main.insertBefore(quick,banner.nextSibling);

  const bottom=el('nav','nav-mobile-bottom'); bottom.setAttribute('aria-label','Navegação rápida');
  for(const [mode,label,icon] of [['inicio','Início','⌂'],['telas','Telas','▦'],['recentes','Recentes','◷'],['conta','Conta','♙']]) {
    const action=button('nav-bottom-action','',() => {
      if(mode==='inicio') {navigateHref('/unificado/');return;}
      openMobile(mode);
    });
    action.dataset.mode=mode;
    action.append(window.UnificadoIcons.node(mode==='telas'?'menu':mode,'nav-bottom-icon'),el('span','nav-bottom-label',label));
    bottom.append(action);
  }
  document.body.append(bottom);

  function moduleDefinition(id) {
    if(id==='ged') return {label:'GED',groups:[{label:'Gestão documental',items:gedItems.map(([itemId,label,route])=>
      ({id:itemId,label,url:new URL('ged/'+route,UNIFICADO_BASE).href}))}]};
    return MENU_CONFIG[id];
  }
  function itemUrl(item) { return item.url || MENU_ITEMS[item.id]?.url; }
  function viewOf(item) {
    const url=new URL(itemUrl(item),location.origin);
    return url.pathname.slice('/unificado/'.length)+url.search;
  }
  function hrefOf(item) { return '/unificado/?view='+encodeURIComponent(viewOf(item)); }
  function visibleModules() {
    const snap=state.snapshot;
    if(!snap) return [];
    const modules=[...new Set([...snap.allowedModuleIds,...(state.armacaoUnits.length?['producao']:[])])];
    return modules.map(id=>{
      const module=moduleDefinition(id);
      if(!module) return null;
      const armacaoGroups=id==='producao' ? state.armacaoUnits.map(unit=>({
        label:'Armação',unitCode:unit.codigo,unitName:unit.nome,
        items:[['corte','Corte de aço','corte'],['banca','Banca de solda','banca'],
          ['fechamento','Fechamento do dia','banca'],
          ['rastreabilidade','Rastreabilidade','rastreabilidade'],
          ['supervisor','Supervisor','supervisor'],['cadastros','Cadastros','cadastros']]
          .filter(([key])=>unit.actions?.includes(key==='fechamento'?'armacao.banca':
            key==='rastreabilidade'?'armacao.consulta':`armacao.${key}`) ||
            unit.actions?.includes('armacao.supervisor') && !['cadastros','rastreabilidade'].includes(key))
          .map(([key,label,tab])=>({
            id:`armacao-${unit.codigo}-${key}`,label,armacao:true,
            url:`/unificado/armacao/?unidade=${encodeURIComponent(unit.codigo)}&tela=${tab}`
          }))})) : [];
      const groups=[...module.groups,...armacaoGroups].map((group,index)=>({
        ...group,index,items:(group.items||[]).filter(item=>item.armacao||snap.allowedItemIds.includes(item.id))
      })).filter(group=>group.items.length);
      return groups.length ? {id,label:module.label,groups} : null;
    }).filter(Boolean);
  }
  function locationFor(module,group,item) {
    if(module.id==='laboratorio' && group.unitName)
      return {module:module.label,unit:group.unitName,group:group.label||'',item:item.label};
    if(module.id==='producao') {
      const unit=group.unitName || (['Pederneiras','Ribeirão','Noroeste'].includes(group.label)?group.label:'Campinas');
      const groupName=group.unitName?'Armação':(unit==='Campinas'?(group.label||'').replace(/^Campinas\s*[·-]\s*/i,''):'');
      return {module:module.label,unit,group:groupName,item:item.label};
    }
    return {module:module.label,unit:'',group:group.label||'',item:item.label};
  }
  function allItems() {
    return visibleModules().flatMap(module=>module.groups.flatMap(group=>group.items.map(item=>
      ({module,group,item,location:locationFor(module,group,item)}))));
  }
  function activeEntry() {
    const view=new URLSearchParams(location.search).get('view');
    return window.UnificadoPresentation.resolveEntry(allItems(),view,window.UnificadoActiveItem,viewOf);
  }
  function getTree(moduleId) {
    if(!state.tree[moduleId]) {
      try {state.tree[moduleId]=JSON.parse(safeGet(keyFor(moduleId))||'{}');}
      catch {state.tree[moduleId]={};}
    }
    return state.tree[moduleId];
  }
  function isOpen(moduleId,id,defaultOpen=false) {
    const value=getTree(moduleId)[id];
    return value===undefined?defaultOpen:Boolean(value);
  }
  function toggle(moduleId,id) {
    const current=getTree(moduleId);
    current[id]=!isOpen(moduleId,id);
    safeSet(keyFor(moduleId),JSON.stringify(current));
    renderTrees();
  }
  function setAll(open) {
    const module=visibleModules().find(value=>value.id===state.module);
    if(!module)return;
    const current=getTree(module.id);
    module.groups.forEach(group=> {
      if(module.id==='producao'||module.id==='laboratorio') current[`unit:${group.unitCode|| (group.label==='Pederneiras'?'pederneiras':group.label==='Ribeirão'?'ribeirão':group.label==='Noroeste'?'noroeste':'campinas')}`]=open;
      current[`group:${group.index}`]=open;
    });
    safeSet(keyFor(module.id),JSON.stringify(current));
    renderTrees();
  }
  function remember(entry) {
    if(!entry)return;
    state.recent=[{id:entry.item.id,module:entry.module.id},
      ...state.recent.filter(row=>row.id!==entry.item.id)].slice(0,8);
    safeSet(recentKey,JSON.stringify(state.recent));
  }
  function navigate(entry) {
    remember(entry);
    if(entry.item.armacao) safeSet('armacao.unidade',entry.group.unitCode);
    navigateHref(hrefOf(entry.item),entry.module.id);
  }
  function navigateHref(href,moduleId) {
    const go=()=>{host.navigate(href);if(moduleId)state.module=moduleId;render();};
    if(state.mobileOpen&&state.historyAdded) {
      window.addEventListener('popstate',go,{once:true});
      closeMobile();
    } else {closeMobile();go();}
  }
  function itemLink(entry) {
    const a=el('a','nav-item',entry.item.label);
    a.href=hrefOf(entry.item);
    a.dataset.itemId=entry.item.id;
    a.prepend(window.UnificadoIcons.node(window.UnificadoIcons.forScreen(entry.item),'nav-item-code'));
    const active=activeEntry()?.item.id===entry.item.id;
    if(active){a.classList.add('is-active');a.setAttribute('aria-current','page');}
    a.addEventListener('click',event=>{
      if(event.metaKey||event.ctrlKey||event.shiftKey||event.button===1)return;
      event.preventDefault();navigate(entry);
    });
    return a;
  }
  function groupNode(module,group) {
    const section=el('section','nav-group');
    const id=`group:${group.index}`;
    const opened=isOpen(module.id,id);
    if(group.label) {
      const toggleButton=button('nav-group-toggle','',()=>toggle(module.id,id));
      toggleButton.setAttribute('aria-expanded',String(opened));
      toggleButton.append(groupChevron(),el('span','nav-group-name',group.label),
        el('span','nav-count',String(group.items.length)));
      section.append(toggleButton);
    }
    if(!group.label||opened) {
      const items=el('div','nav-group-items');
      for(const item of group.items)items.append(itemLink({module,group,item}));
      section.append(items);
    }
    return section;
  }
  function unitNode(module,unit,groups) {
    const section=el('section','nav-unit');
    const id=`unit:${groups[0]?.unitCode||unit.toLowerCase()}`;
    const opened=isOpen(module.id,id);
    const count=groups.reduce((total,group)=>total+group.items.length,0);
    const toggleButton=button('nav-unit-toggle','',()=>toggle(module.id,id));
    toggleButton.setAttribute('aria-expanded',String(opened));
    toggleButton.append(el('span','nav-unit-code',unit==='Campinas'?'CP':unit==='Pederneiras'?'PD':unit==='Noroeste'?'NO':'RB'),
      el('span','nav-unit-name',unit),el('span','nav-unit-count',`${count} telas${unit==='Campinas'?` · ${groups.length} grupos`:''}`),
      downChevron('nav-chevron'));
    section.append(toggleButton);
    if(opened) {
      const body=el('div','nav-unit-body');
      groups.forEach(group=>{
        if(module.id==='producao'&&['Pederneiras','Ribeirão','Noroeste'].includes(unit)&&!group.unitCode)
          group.items.forEach(item=>body.append(itemLink({module,group,item})));
        else body.append(groupNode({...module,id:module.id},
          {...group,label:module.id==='producao'&&group.unitCode?'Armação':(group.label||'').replace(/^Campinas\s*[·-]\s*/i,'')}));
      });
      section.append(body);
    }
    return section;
  }
  function renderTrees() {
    tree.replaceChildren(); controls.replaceChildren();
    const query=state.search.trim().toLocaleLowerCase('pt-BR');
    if(query) {
      const matches=new Set(window.UnificadoBusca.search(query).results.map(entry=>entry.id));
      const results=allItems().filter(entry=>matches.has(entry.item.id));
      tree.append(el('div','nav-search-summary',`${results.length} tela(s) encontrada(s)`));
      for(const entry of results) {
        const result=el('div','nav-search-result');
        result.append(itemLink(entry),el('small','',
          [entry.location.module,entry.location.unit,entry.location.group].filter(Boolean).join(' › ')));
        tree.append(result);
      }
      return;
    }
    const module=visibleModules().find(value=>value.id===state.module);
    if(!module)return;
    controls.append(el('span','',['producao','laboratorio'].includes(module.id)?'Unidades':'Grupos'),
      button('nav-text-action','Expandir tudo',()=>setAll(true)),
      button('nav-text-action','Recolher tudo',()=>setAll(false)));
    if(module.id==='producao'||module.id==='laboratorio') {
      const unitNames=[...new Set(module.groups.map(group=>group.unitName||
        (['Pederneiras','Ribeirão','Noroeste'].includes(group.label)?group.label:'Campinas')))];
      for(const unit of unitNames){
        const groups=module.groups.filter(group=>(group.unitName||
          (['Pederneiras','Ribeirão','Noroeste'].includes(group.label)?group.label:'Campinas'))===unit);
        tree.append(unitNode(module,unit,groups));
      }
    } else module.groups.forEach(group=>tree.append(groupNode(module,group)));
  }
  function renderModules() {
    moduleArea.replaceChildren();rail.replaceChildren();
    const railBrand=el('a','nav-rail-brand');railBrand.href='/unificado/';
    railBrand.setAttribute('aria-label','Início do Uni');
    const railLogo=el('img','nav-rail-logo');railLogo.src='/unificado/assets/img/logo-concretrack.png';
    railLogo.alt='ConcreTrack';railBrand.append(railLogo);
    railBrand.addEventListener('click',event=>{event.preventDefault();navigateHref('/unificado/');});
    rail.append(railBrand);
    const modules=visibleModules();
    const selectedModule=modules.find(module=>module.id===state.module);
    applyModuleTheme(nav, state.module);
    moduleSwitcher.replaceChildren(window.UnificadoIcons.node(state.module,'nav-switcher-code'));
    const switcherLabel=el('span','nav-switcher-label');
    switcherLabel.append(el('strong','',selectedModule?.label||'Telas'));
    moduleSwitcher.append(switcherLabel,downChevron('nav-switcher-chevron'));
    const railToggle=button('nav-rail-menu','',()=>{
      if(matchMedia('(min-width:1280px)').matches)setDesktopCollapsed(!state.desktopCollapsed);
      else setTabletOpen(!state.tabletOpen);
    });
    railToggle.append(strokeIcon('nav-rail-chevron','m9 18 6-6-6-6'));
    railToggle.setAttribute('aria-label',state.tabletOpen?'Fechar painel de telas':'Abrir painel de telas');
    rail.append(railToggle);
    for(const module of modules) {
      const selected=module.id===state.module;
      const chip=el('a','nav-module-chip'+(selected?' is-active':''),module.label);
      chip.href='/unificado/?module='+encodeURIComponent(module.id);
      chip.addEventListener('click',event=>{
        if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
        event.preventDefault();
        if(sharedMenuAllowed()) {
          state.module=module.id;state.search='';search.value='';state.moduleMenuOpen=false;
          nav.classList.remove('nav-modules-open');moduleSwitcher.setAttribute('aria-expanded','false');
          host.selectModule(module.id);render();return;
        }
        state.module=module.id;state.search='';search.value='';state.moduleMenuOpen=false;
        nav.classList.remove('nav-modules-open');moduleSwitcher.setAttribute('aria-expanded','false');
        render();
      });
      applyModuleTheme(chip, module.id);
      chip.prepend(window.UnificadoIcons.node(module.id,'nav-module-badge'));
      moduleArea.append(chip);
      const railButton=button('nav-rail-item'+(selected?' is-active':''),'',()=>{
        state.module=module.id;setTabletOpen(true);render();
      });
      railButton.setAttribute('aria-label',module.label);
      applyModuleTheme(railButton, module.id);
      railButton.append(window.UnificadoIcons.node(module.id,'nav-rail-code'),
        el('span','nav-rail-label',module.label));
      rail.append(railButton);
    }
    const railUpdate=button('nav-rail-update','',()=>host.update());
    railUpdate.append(reloadIcon());
    railUpdate.setAttribute('aria-label',updateText());
    railUpdate.dataset.state=state.snapshot.updateState;
    rail.append(railUpdate,el('small','nav-rail-version',`Uni ${state.snapshot.version}`));
  }
  function updateText() {
    const snap=state.snapshot;
    return snap.updateState==='available'?`Nova versão ${snap.latestVersion} — atualizar`:
      snap.updateState==='updating'?'Atualizando…':
      snap.updateState==='failed'?'Falhou — tentar de novo':
      snap.updateState==='checking'?'Verificando…':'Atualizar';
  }
  function renderFooter() {
    footer.replaceChildren();
    const snap=state.snapshot;
    footer.append(updateControl());
    if(snap.updateFailures>=2)footer.append(button('nav-update-reset','Recarregar e limpar cache',()=>host.clearUpdateCache()));
    footer.append(footerLinks());
    const person=el('div','nav-user');
    person.append(el('span','nav-user-avatar',(snap.user.name||'U').slice(0,1).toUpperCase()),
      el('span','nav-user-name',snap.user.name||'Usuário'),
      button('nav-logout','Sair',()=>host.logout()));
    footer.append(person);
  }
  function footerLinks(inline=false) {
    const links=el('div','nav-footer-links');
    const add=(parent,label,href)=>{
      const link=el('a','nav-footer-link',label);
      link.href=href;
      link.addEventListener('click',event=>{event.preventDefault();navigateHref(href);});
      if(label==='Usuários')link.prepend(strokeIcon('nav-footer-icon','M16 21v-2a4 4 0 0 0-8 0v2 M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8'));
      parent.append(link);
    };
    const helpItems=[];
    if(state.snapshot.footerItemIds.includes('labHelp')&&MENU_ITEMS.labHelp)
      helpItems.push(['Como funciona',hrefOf(MENU_ITEMS.labHelp)]);
    if(state.snapshot.footerItemIds.includes('reportProblem'))
      helpItems.push(['Relatar problema','/unificado/testar/#relatar']);
    if(inline){
      links.classList.add('nav-account-links');
      helpItems.forEach(([label,href])=>add(links,label,href));
    } else if(helpItems.length){
      const help=button('nav-help-toggle','',()=>{state.helpOpen=!state.helpOpen;render();});
      help.setAttribute('aria-expanded',String(state.helpOpen));
      help.append(strokeIcon('nav-footer-icon','M12 17h.01 M9.1 9a3 3 0 1 1 5.8 1c-.7 1-2.9 1.4-2.9 3'),el('span','','Ajuda'));
      links.append(help);
      if(state.helpOpen){
        const menu=el('div','nav-help-menu');
        helpItems.forEach(([label,href])=>add(menu,label,href));
        links.append(menu);
      }
    }
    if(state.snapshot.footerItemIds.includes('usuarios'))
      add(links,'Usuários','/unificado/?view='+encodeURIComponent(
        state.snapshot.allowedItemIds.includes('prodUsuarios')?'mapa/operacao/?tela=USUARIOS':'pcp/usuarios/'));
    return links;
  }
  function updateControl() {
    const snap=state.snapshot;
    const wrap=el('div','nav-update-wrap');
    const update=button('nav-update','',()=>host.update());
    update.append(reloadIcon(),el('span','',updateText()));
    update.dataset.state=snap.updateState;
    wrap.append(update,el('small','nav-update-version',`Uni ${snap.version}`));
    return wrap;
  }
  function renderContext() {
    const active=activeEntry();
    const landingTitle=main.querySelector('.module-page:not([hidden]) h1,.content.uqa-personal #uqa-home:not([hidden]) h1')?.textContent;
    mobileContext.textContent=active ? [active.location.unit,active.location.group].filter(Boolean).join(' · ') || active.module.label : landingTitle ? 'Concrefer' : 'Uni';
    const trail=document.querySelector('.breadcrumb > :last-child')?.textContent;
    const routeTitle=window.UnificadoPresentation.routeTitle(new URLSearchParams(location.search).get('view')||'');
    const screenTitle=routeTitle||(active?.item.label==='Início'?[active.location.group||active.module.label,active.item.label].join(' · '):active?.item.label);
    mobileTitle.textContent=screenTitle||landingTitle||(new URLSearchParams(location.search).has('view') ? trail||document.title : 'Início');
    const breadcrumb=document.querySelector('.breadcrumb');
    if(active&&breadcrumb) {
      breadcrumb.replaceChildren();
      for(const [index,label] of [active.location.module,active.location.unit,active.location.group,active.item.label].filter(Boolean).entries()) {
        if(index)breadcrumb.append(el('span','','›'));
        const part=el(index===0?'strong':'span',label===active.location.unit?'nav-breadcrumb-unit':'',label===active.item.label&&routeTitle?routeTitle:label);
        breadcrumb.append(part);
      }
    }
    quick.replaceChildren();
    if(active) {
      const peers=allItems().filter(entry=>entry.module.id===active.module.id&&entry.group.index===active.group.index);
      for(const entry of peers.slice(0,8)) {
        const chip=itemLink(entry);chip.classList.add('nav-quick-chip');quick.append(chip);
      }
    }
    quick.hidden=!active||quick.childElementCount<2;
    banner.hidden=state.snapshot.updateState!=='available';
    banner.textContent=`↻ Nova versão ${state.snapshot.latestVersion} disponível. Toque para atualizar.`;
    for(const action of bottom.children)action.classList.toggle('is-active',
      action.dataset.mode===(state.mobileOpen?state.mobileMode:(active?'telas':'inicio')));
  }
  function renderRecent() {
    tree.replaceChildren();controls.replaceChildren();searchWrap.hidden=true;
    for(const row of state.recent) {
      const entry=allItems().find(candidate=>candidate.item.id===row.id&&candidate.module.id===row.module);
      if(!entry)continue;
      const result=el('div','nav-search-result');
      result.append(itemLink(entry),el('small','',
        [entry.location.module,entry.location.unit,entry.location.group].filter(Boolean).join(' › ')));
      tree.append(result);
    }
    if(!tree.children.length)tree.append(el('p','nav-empty','As telas abertas recentemente aparecerão aqui.'));
  }
  function renderAccount() {
    tree.replaceChildren();controls.replaceChildren();searchWrap.hidden=true;
    tree.append(el('h2','nav-account-title',state.snapshot.user.name||'Usuário'),
      el('p','nav-account-role',state.snapshot.user.role||''));
    tree.append(updateControl());
    if(state.snapshot.updateFailures>=2)tree.append(button('nav-update-reset','Recarregar e limpar cache',()=>host.clearUpdateCache()));
    tree.append(footerLinks(true));
    tree.append(button('nav-account-exit','Sair da conta',()=>host.logout()));
  }
  function setTabletOpen(open) {
    state.tabletOpen=open;safeSet(tabletKey,open?'1':'0');
    document.body.classList.toggle('nav-tablet-open',open);
    renderModules();
  }
  function setDesktopCollapsed(collapsed) {
    state.desktopCollapsed=collapsed;safeSet('ct.sidebar.collapsed',collapsed?'1':'0');
    nav.classList.toggle('is-collapsed',collapsed);
    renderModules();
  }
  function openMobile(mode) {
    state.mobileMode=mode;state.mobileOpen=true;
    document.body.classList.add('nav-mobile-open');
    if(!state.historyAdded){history.pushState({unificadoNavigation:true},'',location.href);state.historyAdded=true;}
    render();
    closeButton.focus();
  }
  function closeMobile() {
    if(!state.mobileOpen)return;
    state.mobileOpen=false;document.body.classList.remove('nav-mobile-open');
    if(state.historyAdded){state.historyAdded=false;history.back();}
    renderContext();
  }
  function render() {
    const snap=host.snapshot();
    if(!snap||document.body.classList.contains('unificado-permissions-loading'))return;
    state.snapshot=snap;
    const route=new URLSearchParams(location.search).get('view')||'';
    if(route!==state.route) {
      state.route=route;
      const active=activeEntry();
      if(active) {
        state.module=active.module.id;
        const open=getTree(active.module.id);
        if(active.module.id==='producao')open[`unit:${active.location.unit==='Pederneiras'?'pederneiras':active.location.unit==='Ribeirão'?'ribeirão':active.location.unit==='Noroeste'?'noroeste':'campinas'}`]=true;
        open[`group:${active.group.index}`]=true;
        safeSet(keyFor(active.module.id),JSON.stringify(open));
        remember(active);
      }
    }
    if(!state.module||!visibleModules().some(module=>module.id===state.module))
      state.module=snap.activeModuleId||visibleModules()[0]?.id;
    if(!state.module)return;
    const mode=state.mobileOpen?state.mobileMode:'telas';
    panelTitle.textContent=mode==='recentes'?'Recentes':mode==='conta'?'Conta':
      'Telas';
    moduleArea.hidden=mode!=='telas';
    searchWrap.hidden=mode!=='telas';
    renderModules();
    if(state.mobileOpen&&state.mobileMode==='recentes')renderRecent();
    else if(state.mobileOpen&&state.mobileMode==='conta')renderAccount();
    else renderTrees();
    renderFooter();renderContext();
    document.body.classList.add('nav-modern-ready');
    document.body.classList.toggle('nav-tablet-open',state.tabletOpen);
    nav.classList.toggle('is-collapsed',state.desktopCollapsed);
  }
  window.addEventListener('unificado-sidebar-model-a-update',render);
  window.addEventListener('unificado-sidebar-module-selected',()=>{
    const selected=host.snapshot()?.activeModuleId;
    if(selected&&visibleModules().some(module=>module.id===selected)){
      state.module=selected;
      state.search='';search.value='';
    }
    render();
  });
  window.addEventListener('popstate',()=>{
    if(state.mobileOpen){state.mobileOpen=false;state.historyAdded=false;document.body.classList.remove('nav-mobile-open');}
    render();
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    if(state.moduleMenuOpen){state.moduleMenuOpen=false;nav.classList.remove('nav-modules-open');
      moduleSwitcher.setAttribute('aria-expanded','false');moduleSwitcher.focus();}
    else if(state.mobileOpen)closeMobile();
  });
  window.UnificadoScreenAccess?.ready?.then(render);
  if (typeof hasMapa === 'undefined' || hasMapa) fetch('/unificado/armacao/api/armacao/unidades',{credentials:'same-origin',cache:'no-store'})
    .then(response=>response.ok?response.json():[])
    .then(units=>{state.armacaoUnits=units.filter(unit=>unit.enabled);state.route='';render();})
    .catch(()=>{});

  render();
})();

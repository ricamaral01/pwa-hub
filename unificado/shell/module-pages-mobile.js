/* Páginas de entrada dos módulos, usando as mesmas permissões do menu lateral. */
(() => {
  if (sharedMenuAllowed()) return;
  const root = '/unificado/';
  const home = document.querySelector('.main-panel > .content');
  if (!home) return;

  const gedItems = window.UnificadoGedMenu.map(item => [item.label, item.route]);
  const page = document.createElement('section');
  page.className = 'module-page module-page-a';
  page.hidden = true;
  page.setAttribute('aria-label', 'Funções do módulo');
  home.after(page);

  function hide() { page.hidden = true; }

  function itemLink(label, href, open, item) {
    const link = document.createElement('a');
    link.className = 'module-page-link';
    link.href = item && item.id !== 'tvFormas'
      ? root + '?view=' + encodeURIComponent(new URL(href).pathname.slice(root.length) + new URL(href).search + new URL(href).hash)
      : href;
    if (item) link.dataset.itemId = item.id;
    const code = document.createElement('span');
    code.className = 'module-page-code';
    code.append(window.UnificadoIcons.node(window.UnificadoIcons.forScreen(item || {label})));
    const name = document.createElement('span');name.className='module-page-link-content';
    const title=document.createElement('span');title.className='module-page-link-title';title.textContent=label;name.append(title);
    const detail = document.createElement('small');detail.className='module-page-link-description';
    detail.textContent = window.UnificadoPresentation.descriptions[item?.id] || '';
    name.append(detail);
    const arrow = document.createElement('span');
    arrow.className = 'module-page-arrow';
    arrow.textContent = '';
    arrow.setAttribute('aria-hidden', 'true');
    link.append(code, name, arrow);
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (open() === false) return;
      event.preventDefault();
    });
    return link;
  }

  function show(moduleId, push = true) {
    if(moduleId==='ged'&&!window.UnificadoSidebarModelA?.snapshot().allowedModuleIds.includes('ged')){window.UnificadoRouter?.home();return;}
    const config = MENU_CONFIG[moduleId];
    if (!config && moduleId !== 'ged') return;
    const title = config?.label || 'GED';
    document.title = title + ' · Uni';
    page.replaceChildren();
    page.dataset.module = moduleId;

    const heading = document.createElement('header');
    heading.className = 'module-page-heading';
    const h1 = document.createElement('h1');
    h1.textContent = title;
    const description = document.createElement('p');
    description.className = 'module-page-description';
    description.textContent = String(config?.groups.flatMap(g=>g.items).filter(i=>canUse(MENU_ITEMS[i.id])).length || 0)+' telas';
    heading.append(h1, description);
    page.append(heading);

    const groups = moduleId === 'ged'
      ? [{label: 'Gestão documental', items: gedItems.map(([label, route]) => ({label, route}))}]
      : config.groups.map(group => ({
          unitName: group.unitName || (moduleId === 'laboratorio' ? (group.unitCode === 'noroeste' ? 'Noroeste' : 'Campinas') : ''),
          label: group.label || (group.items.some(item => item.id === 'labHelp') ? 'Ajuda' : 'Geral'),
          items: group.items.filter(item => canUse(MENU_ITEMS[item.id])),
        }));
    const visibleGroups = groups.filter(group => group.items.length);
    const isProduction = moduleId === 'producao';
    const unitFor = group => group.unitName || (!isProduction ? '' : /^Pederneiras$/i.test(group.label) ? 'Pederneiras' : /^Ribeirão$/i.test(group.label) ? 'Ribeirão' : /^Noroeste$/i.test(group.label) ? 'Noroeste' : /^Indicadores gerais$/i.test(group.label) ? 'Indicadores gerais' : 'Campinas');
    const units = [...new Set(visibleGroups.map(unitFor))];
    const unitKey=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const requestedUnit=new URLSearchParams(location.search).get('unit');
    const initialUnit=units.find(unit=>unitKey(unit)===unitKey(requestedUnit));
    const active = {unit: initialUnit||units[0], group: 0, query: ''};
    const hasUnits=(isProduction||moduleId==='laboratorio')&&units.length>1;
    const selector = document.createElement('div'); selector.className = 'module-page-selector';
    const unitTabs = document.createElement('div'); unitTabs.className = 'module-page-units';
    const search = document.createElement('input'); search.className = 'module-page-search';
    search.type = 'search'; search.placeholder = 'Buscar tela ou atividade';
    search.setAttribute('aria-label', search.placeholder);
    selector.append(unitTabs, search);
    const searchFeedback=document.createElement('p');searchFeedback.className='uni-search-inline-feedback';searchFeedback.setAttribute('role','status');searchFeedback.hidden=true;
    const layout = document.createElement('div'); layout.className = 'module-page-layout';
    const categories = document.createElement('nav'); categories.className = 'module-page-categories';
    const content = document.createElement('div'); content.className = 'module-page-content';
    const quick = document.createElement('aside'); quick.className = 'module-page-quick';
    layout.append(categories, content, quick); page.append(selector,searchFeedback,layout);
    function buildGroup(group, items) {
      const section = document.createElement('section');
      section.className = 'module-page-group';
      const h2 = document.createElement('h2');
      h2.textContent = (group.label || 'Geral').replace(/^Campinas\s*[·-]\s*/i, '');
      const grid = document.createElement('div');
      grid.className = 'module-page-grid';
      for (const item of items) {
        if (item.armacao) {
          grid.append(itemLink(item.label,item.url,() => {
            if (!window.UnificadoRouter?.open) return false;
            window.UnificadoRouter.open(item.url);
          }));
        } else         if (moduleId === 'ged') {
          const route = item.route;
          grid.append(itemLink(item.label, root + 'ged/' + route, () => {
            if (!window.UnificadoRouter?.openGed) return false;
            window.UnificadoRouter.openGed(route);
          }));
        } else {
          const route = MENU_ITEMS[item.id];
          grid.append(itemLink(item.label, route.url, () => {
            if (item.id === 'tvFormas') {
              if (matchMedia('(display-mode: standalone)').matches || matchMedia('(max-width:767px)').matches || navigator.standalone === true ||
                  navigator.userAgentData?.mobile === true || /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent)) return false;
              window.open(route.url, '_blank', 'noopener');
              return;
            }
            if (!window.UnificadoRouter?.open) return false;
            window.UnificadoRouter.open(route.url, item.id);
          }, item));
        }
      }
      section.append(h2, grid);
      return section;
    }
    function render() {
      unitTabs.replaceChildren(); categories.replaceChildren(); content.replaceChildren(); quick.replaceChildren();
      unitTabs.hidden = !hasUnits;
      if (hasUnits) for (const unit of units) {
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'module-page-unit' + (unit === active.unit ? ' active' : '');
        button.textContent = unit;
        button.setAttribute('aria-pressed', String(unit === active.unit));
        button.addEventListener('click', () => {active.unit = unit; active.group = 0; active.query = ''; search.value = '';history.replaceState({module:moduleId,unit:unitKey(unit)},'',root+'?module='+encodeURIComponent(moduleId)+'&unit='+encodeURIComponent(unitKey(unit)));render();});
        unitTabs.append(button);
      }
      const current = visibleGroups.filter(group => unitFor(group) === active.unit);
      description.textContent=current.reduce((sum,group)=>sum+group.items.length,0)+' telas'+(active.unit?' \u00b7 '+active.unit:'');
      current.forEach((group, index) => {
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'module-page-category' + (index === active.group && !active.query ? ' active' : '');
        button.textContent = (group.label || 'Geral').replace(/^Campinas\s*[·-]\s*/i, '');
        const count = document.createElement('span');count.className='module-page-count'; count.textContent = group.items.length; button.append(count);
        button.addEventListener('click', () => {active.group = index; active.query = ''; search.value = ''; render();});
        categories.append(button);
      });
      if (active.query) {
        const response=window.UnificadoBusca.search(active.query,{moduleId});
        const matches = new Set(response.results.map(entry=>entry.id));
        searchFeedback.textContent=(window.UnificadoBusca.explanation?.(response)||'');searchFeedback.hidden=!searchFeedback.textContent;
        for (const group of current) {
          const found = group.items.filter(item => matches.has(item.id || window.UnificadoGedMenu.find(entry=>entry.route===item.route)?.id));
          if (found.length) content.append(buildGroup(group, found));
        }
        if (!content.children.length) content.textContent = 'Nenhuma tela encontrada.';
      } else {searchFeedback.hidden=true;if (current[active.group]) content.append(buildGroup(current[active.group], current[active.group].items));}

      for (const group of current.slice(0, 4)) {
        const item = group.items[0];
        if (!item) continue;
        const link = document.createElement('a'); link.className = 'module-page-quick-link';
        link.href = item.armacao ? item.url : moduleId === 'ged' ? root + 'ged/' + item.route :
          root + '?view=' + encodeURIComponent(new URL(MENU_ITEMS[item.id].url).pathname.slice(root.length) + new URL(MENU_ITEMS[item.id].url).search);
        const title = document.createElement('strong'); title.textContent = window.UnificadoPresentation.shortcutLabel(group.label,item.label);
        const detail = document.createElement('small');detail.className='module-page-link-description'; detail.textContent = (group.label || 'Geral').replace(/^Campinas\s*[·-]\s*/i, '');
        link.append(title, detail);
        link.addEventListener('click', event => {
          if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          if (item.armacao) {
            if (!window.UnificadoRouter?.open) return;
            event.preventDefault();
            window.UnificadoRouter.open(item.url);
            return;
          }
          if (!window.UnificadoRouter) return;
          event.preventDefault();
          if (moduleId === 'ged') window.UnificadoRouter.openGed(item.route);
          else window.UnificadoRouter.open(MENU_ITEMS[item.id].url, item.id);
        }); quick.append(link);
      }
    }
    search.addEventListener('input', () => {active.query = search.value.trim(); render();});
    render();

    home.hidden = true;
    document.getElementById('module-host').hidden = true;
    document.querySelector('.unificado-access-denied')?.setAttribute('hidden', '');
    page.hidden = false;
    document.documentElement.classList.remove('unificado-routing');
    const crumb = document.querySelector('.breadcrumb');
    crumb.querySelector('strong').textContent = 'Concrefer';
    crumb.querySelector('span:last-child').textContent = title;
    if (push && new URLSearchParams(location.search).get('module') !== moduleId) {
      history.pushState({module: moduleId}, '', root + '?module=' + encodeURIComponent(moduleId));
    }

    if (moduleId === 'producao' && (typeof hasMapa === 'undefined' || hasMapa)) fetch('/unificado/armacao/api/armacao/unidades',
      {credentials:'same-origin',cache:'no-store'})
      .then(response => response.ok ? response.json() : [])
      .then(available => {
        if (page.dataset.module !== 'producao' || page.hidden) return;
        for (const unit of available.filter(value => value.enabled)) {
          const items=[['corte','Corte de aço','armacao.corte'],
            ['banca','Banca de solda','armacao.banca'],
            ['rastreabilidade','Rastreabilidade','armacao.consulta'],
            ['supervisor','Supervisor','armacao.supervisor'],
            ['cadastros','Cadastros','armacao.cadastros']]
            .filter(([, ,action]) => unit.actions?.includes(action) ||
              unit.actions?.includes('armacao.supervisor') && ['armacao.corte','armacao.banca'].includes(action))
            .map(([tab,label]) => ({armacao:true,label,
              url:`/unificado/armacao/?unidade=${encodeURIComponent(unit.codigo)}&tela=${tab}`}));
          if (!items.length) continue;
          visibleGroups.push({label:'Armação',unitName:unit.nome,items});
          if (!units.includes(unit.nome)) units.push(unit.nome);
        }
        render();
      }).catch(() => {});
    document.querySelector('.main-panel')?.scrollTo(0, 0);
  }

  window.UnificadoModulePages = Object.freeze({show, hide});
  const restore = () => {
    const moduleId = new URLSearchParams(location.search).get('module');
    if (moduleId) window.UnificadoSidebarModelA?.selectModule(moduleId, false);
    else hide();
  };
  addEventListener('popstate', restore);
  addEventListener('unificado-sidebar-model-a-update', () => {
    if (new URLSearchParams(location.search).has('view')) hide();
  });
  Promise.resolve(window.UnificadoScreenAccess?.ready).then(restore);
})();

/* Páginas de entrada dos módulos, usando as mesmas permissões do menu lateral. */
(() => {
  if (!sharedMenuAllowed()) return;
  const root = '/unificado/';
  const home = document.querySelector('.main-panel > .content');
  if (!home) return;

  const gedItems = window.UnificadoGedMenu.map(item => [item.label, item.route]);
  const page = document.createElement('section');
  page.className = 'module-page';
  page.hidden = true;
  page.setAttribute('aria-label', 'Funções do módulo');
  home.after(page);

  function hide() { page.hidden = true; }

  function shellHref(value) {
    const url = new URL(value, location.origin);
    if (url.origin !== location.origin || !url.pathname.startsWith(root)) return url.href;
    const view = url.pathname.slice(root.length) + url.search + url.hash;
    return root + '?view=' + encodeURIComponent(view) + url.hash;
  }

  function itemLink(label, href, open, description = '', item = null) {
    const link = document.createElement('a');
    link.className = 'module-page-link';
    link.href = href;
    link.dataset.search = `${label} ${description}`;
    const icon = document.createElement('span');
    icon.className = 'module-page-icon';
    icon.append(window.UnificadoIcons.node(window.UnificadoIcons.forScreen(item || {label})));
    const content = document.createElement('span');
    content.className = 'module-page-link-content';
    const name = document.createElement('span');
    name.className = 'module-page-link-title';
    name.textContent = label;
    const desc = document.createElement('span');
    desc.className = 'module-page-link-description';
    desc.textContent = window.UnificadoPresentation.descriptions[item?.id] || description;
    const arrow = document.createElement('span');
    arrow.className = 'module-page-arrow';
    arrow.textContent = '';
    arrow.setAttribute('aria-hidden', 'true');
    content.append(name, desc);
    link.append(icon, content, arrow);
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
    page.replaceChildren();
    page.dataset.module = moduleId;
    const palette = window.UnificadoModuleTheme?.theme[moduleId];
    if (palette) for (const [key, value] of Object.entries(window.UnificadoModuleTheme.vars(palette))) page.style.setProperty(key, value);

    const heading = document.createElement('header');
    heading.className = 'module-page-heading';
    const h1 = document.createElement('h1');
    h1.textContent = title;
    const description = document.createElement('p');
    description.className = 'module-page-description';
    description.textContent = String(config?.groups.flatMap(g=>g.items).filter(i=>canUse(MENU_ITEMS[i.id])).length || 0)+' telas';
    heading.append(h1, description);
    page.append(heading);

    let selectedUnit = '';
    if (moduleId === 'laboratorio') {
      const units = [...new Set(config.groups.filter(group => group.items.some(item => canUse(MENU_ITEMS[item.id])))
        .map(group => group.unitCode || 'campinas').filter(Boolean))];
      const requested = new URLSearchParams(location.search).get('unit');
      selectedUnit = units.includes(requested) ? requested : units[0] || '';
      page.dataset.unit = selectedUnit;
      if (units.length > 1) {
        const unitChips = document.createElement('nav');
        unitChips.className = 'module-page-units';
        unitChips.setAttribute('aria-label', 'Unidade do Laboratório');
        for (const code of units) {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.textContent = code === 'noroeste' ? 'Noroeste' : 'Campinas';
          chip.className = code === selectedUnit ? 'is-current' : '';
          chip.setAttribute('aria-current', code === selectedUnit ? 'page' : 'false');
          chip.addEventListener('click', () => {
            history.pushState({module:'laboratorio',unit:code},'',root + '?module=laboratorio&unit=' + code);
            show('laboratorio',false);
          });
          unitChips.append(chip);
        }
        page.append(unitChips);
      }
    }

    const groups = moduleId === 'ged'
      ? [{label: 'Gestão documental', items: gedItems.map(([label, route]) => ({label, route}))}]
      : config.groups.filter(group => moduleId !== 'laboratorio' || (group.unitCode || 'campinas') === selectedUnit).map(group => ({
          label: group.label || (group.items.some(item => item.id === 'labHelp') ? 'Ajuda' : 'Geral'),
          items: group.items.filter(item => canUse(MENU_ITEMS[item.id])),
        }));
    description.textContent=groups.reduce((sum,group)=>sum+group.items.length,0)+' telas'+(selectedUnit?' \u00b7 '+(selectedUnit==='noroeste'?'Noroeste':'Campinas'):'');
    const toolbar = document.createElement('div');
    toolbar.className = 'module-page-toolbar';
    const quick = document.createElement('nav');
    quick.className = 'module-page-quick';
    quick.setAttribute('aria-label', 'Acesso rápido');
    const quickTitle = document.createElement('span');
    quickTitle.textContent = 'Acesso rápido';

    const quickItems = groups.filter(group => group.items.length).slice(0, 4).map(group => group.items[0]);
    for (const item of quickItems) {
      const route = moduleId === 'ged' ? `${root}ged/${item.route}` : MENU_ITEMS[item.id]?.url;
      if (!route) continue;
      const chip = document.createElement('a');
      chip.href = shellHref(route);
      const group=groups.find(g=>g.items.includes(item));
      chip.textContent = window.UnificadoPresentation.shortcutLabel(group?.label,item.label);
      chip.addEventListener('click', event => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (moduleId === 'ged') window.UnificadoRouter?.openGed?.(item.route);
        else window.UnificadoRouter?.open?.(route, item.id);
      });
      quick.append(chip);
    }
    const search = document.createElement('input');
    search.className = 'module-page-search';
    search.type = 'search';
    search.placeholder = 'Buscar tela ou atividade';
    search.setAttribute('aria-label', 'Buscar tela ou atividade');
    toolbar.append(quick, search);
    page.append(toolbar);
    const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const empty = document.createElement('p');
    empty.className = 'module-page-empty';
    empty.textContent = 'Nenhuma tela encontrada.';
    empty.hidden = true;
    search.addEventListener('input', () => {
      const query = fold(search.value.trim());
      let visible = 0;
      for (const section of page.querySelectorAll('.module-page-group')) {
        let count = 0;
        for (const card of section.querySelectorAll('.module-page-link')) {
          card.hidden = !!query && !fold(`${card.dataset.search} ${section.dataset.group}`).includes(query);
          if (!card.hidden) count++;
        }
        section.hidden = count === 0;
        section.querySelector('.module-page-count').textContent = String(count);
        visible += count;
      }
      empty.hidden = visible > 0;
    });
    for (const group of groups) {
      if (!group.items.length) continue;
      const section = document.createElement('section');
      section.className = 'module-page-group';
      section.dataset.group = group.label;
      const head = document.createElement('div');
      head.className = 'module-page-group-head';
      const h2 = document.createElement('h2');
      h2.textContent = group.label;
      const count = document.createElement('span');
      count.className = 'module-page-count';
      count.textContent = String(group.items.length);
      head.append(h2, count);
      const grid = document.createElement('div');
      grid.className = 'module-page-grid';
      for (const item of group.items) {
        if (moduleId === 'ged') {
          const route = item.route;
          grid.append(itemLink(item.label, root + 'ged/' + route, () => {
            if (!window.UnificadoRouter?.openGed) return false;
            window.UnificadoRouter.openGed(route);
          }));
        } else {
          const route = MENU_ITEMS[item.id];
          const opensCertificateTab = moduleId === 'qualidade' &&
            ['labCertificados', 'labCertificadosHistorico',
              'labCertificadosCadastros', 'labTests'].includes(item.id);
          const link = itemLink(item.label, shellHref(route.url), () => {
            if (opensCertificateTab) return false;
            if (item.id === 'tvFormas') {
              if (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true ||
                  navigator.userAgentData?.mobile === true || /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent)) return false;
              window.open(route.url, '_blank', 'noopener');
              return;
            }
            if (!window.UnificadoRouter?.open) return false;
            window.UnificadoRouter.open(route.url, item.id);
          }, '', item);
          if (opensCertificateTab) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('aria-label', item.label + ' (abre em nova guia)');
          }
          grid.append(link);
        }
      }
      section.append(head, grid);
      page.append(section);
    }
    page.append(empty);

    if (moduleId === 'producao' && (typeof hasMapa === 'undefined' || hasMapa)) {
      fetch('/unificado/armacao/api/armacao/unidades', {credentials:'same-origin',cache:'no-store'})
        .then(response => response.ok ? response.json() : [])
        .then(units => {
          if (page.dataset.module !== 'producao' || page.hidden) return;
          for (const unit of units.filter(value => value.enabled)) {
            const entries = [
              ['corte','Corte de aço','armacao.corte'],
              ['banca','Banca de solda','armacao.banca'],
              ['rastreabilidade','Rastreabilidade','armacao.consulta'],
              ['supervisor','Supervisor','armacao.supervisor'],
              ['cadastros','Cadastros','armacao.cadastros']
            ].filter(([, ,action]) => unit.actions?.includes(action) ||
              unit.actions?.includes('armacao.supervisor') && ['armacao.corte','armacao.banca'].includes(action));
            if (!entries.length) continue;
            const section = document.createElement('section');
            section.className = 'module-page-group';
            section.dataset.group = `${unit.nome} Armação`;
            const head = document.createElement('div');
            head.className = 'module-page-group-head';
            const h2 = document.createElement('h2');
            h2.textContent = `${unit.nome} · Armação`;
            const count = document.createElement('span');
            count.className = 'module-page-count';
            count.textContent = String(entries.length);
            head.append(h2, count);
            const grid = document.createElement('div');
            grid.className = 'module-page-grid';
            for (const [tab,label] of entries) {
              const href = `/unificado/armacao/?unidade=${encodeURIComponent(unit.codigo)}&tela=${tab}`;
              grid.append(itemLink(label, href, () => {
                if (!window.UnificadoRouter?.open) return false;
                window.UnificadoRouter.open(href);
              }));
            }
            section.append(head,grid);page.insertBefore(section, empty);
            search.dispatchEvent(new Event('input'));
          }
        }).catch(() => {});
    }

    home.hidden = true;
    document.getElementById('module-host').hidden = true;
    document.querySelector('.unificado-access-denied')?.setAttribute('hidden', '');
    page.hidden = false;
    document.documentElement.classList.remove('unificado-routing');
    const crumb = document.querySelector('.breadcrumb');
    crumb.querySelector('strong').textContent = 'Concrefer';
    crumb.querySelector('span:last-child').textContent = title;
    if (push && (new URLSearchParams(location.search).get('module') !== moduleId ||
        moduleId === 'laboratorio' && new URLSearchParams(location.search).get('unit') !== selectedUnit)) {
      history.pushState({module: moduleId, unit: selectedUnit}, '', root + '?module=' + encodeURIComponent(moduleId) +
        (moduleId === 'laboratorio' ? '&unit=' + encodeURIComponent(selectedUnit) : ''));
    }
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

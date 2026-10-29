/* Páginas de entrada dos módulos, usando as mesmas permissões do menu lateral. */
(() => {
  const root = '/unificado/';
  const home = document.querySelector('.main-panel > .content');
  if (!home) return;

  const descriptions = {
    planejamento: 'Programação, PCP e relatórios',
    producao: 'Mapa, inspeção e montagem',
    qualidade: 'Não conformidades e controle',
    laboratorio: 'Ensaios e acompanhamento',
    usinas: 'Operação e acompanhamento das usinas',
    ged: 'Documentos e aprovações',
  };
  const gedItems = [
    ['Painel', 'dashboard'], ['Documentos', 'documents'],
    ['Aprovações', 'approvals'], ['Tarefas', 'tasks'],
    ['Calibrações', 'calibrations'],
  ];
  const itemDescriptions = {
    relatorioMapa:'Conferência diária do encarregado.',
    historico:'Consulte registros dos dias anteriores.',
    acmpConcretagem:'Conferência e confirmação das formas.',
    manutencao:'Registre e acompanhe intervenções.',
    tratativa:'Analise fotos, causas e justificativas.',
    fechamentoDiario:'Veja o resumo das atividades do dia.',
    indicadorGeralProducao:'Compare Campinas, Pederneiras e Ribeirão dia a dia.',
    dashboard:'Visão dos indicadores do Planejamento.',
    labCartaTraco:'Cartas de traço, cadastro e MCC.'
  };
  const page = document.createElement('section');
  page.className = 'module-page module-page-a';
  page.hidden = true;
  page.setAttribute('aria-label', 'Funções do módulo');
  home.after(page);

  function hide() { page.hidden = true; }

  function itemLink(label, href, open, item) {
    const link = document.createElement('a');
    link.className = 'module-page-link';
    link.href = item ? root + '?view=' + encodeURIComponent(new URL(href).pathname.slice(root.length) + new URL(href).search + new URL(href).hash) : href;
    if (item) link.dataset.itemId = item.id;
    const code = document.createElement('span');
    code.className = 'module-page-code';
    code.textContent = item?.mono || label.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
    const name = document.createElement('span');
    name.textContent = label;
    const detail = document.createElement('small');
    detail.textContent = itemDescriptions[item?.id] || 'Abrir tela e consultar os dados.';
    name.append(detail);
    const arrow = document.createElement('span');
    arrow.className = 'module-page-arrow';
    arrow.textContent = '↗';
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
    const config = MENU_CONFIG[moduleId];
    if (!config && moduleId !== 'ged') return;
    const title = config?.label || 'GED';
    page.replaceChildren();
    page.dataset.module = moduleId;

    const back = document.createElement('a');
    back.className = 'module-page-back';
    back.href = root;
    back.textContent = '← Menu principal';
    back.addEventListener('click', event => {
      event.preventDefault();
      window.UnificadoSidebarModelA?.navigate(root);
    });
    const heading = document.createElement('header');
    heading.className = 'module-page-heading';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'module-page-eyebrow';
    eyebrow.textContent = 'MÓDULO';
    const h1 = document.createElement('h1');
    h1.textContent = title;
    const description = document.createElement('p');
    description.className = 'module-page-description';
    description.textContent = descriptions[moduleId] || '';
    heading.append(eyebrow, h1, description);
    page.append(back, heading);

    const groups = moduleId === 'ged'
      ? [{label: 'Gestão documental', items: gedItems.map(([label, route]) => ({label, route}))}]
      : config.groups.map(group => ({
          label: group.label || (group.items.some(item => item.id === 'labHelp') ? 'Ajuda' : 'Geral'),
          items: group.items.filter(item => canUse(MENU_ITEMS[item.id])),
        }));
    const visibleGroups = groups.filter(group => group.items.length);
    const isProduction = moduleId === 'producao';
    const unitFor = group => !isProduction ? '' : /^Pederneiras$/i.test(group.label) ? 'Pederneiras' : /^Ribeirão$/i.test(group.label) ? 'Ribeirão' : 'Campinas';
    const units = [...new Set(visibleGroups.map(unitFor))];
    const active = {unit: units[0], group: 0, query: ''};
    const selector = document.createElement('div'); selector.className = 'module-page-selector';
    const unitTabs = document.createElement('div'); unitTabs.className = 'module-page-units';
    const search = document.createElement('input'); search.className = 'module-page-search';
    search.type = 'search'; search.placeholder = 'Buscar tela ou atividade';
    search.setAttribute('aria-label', search.placeholder);
    selector.append(unitTabs, search);
    const layout = document.createElement('div'); layout.className = 'module-page-layout';
    const categories = document.createElement('nav'); categories.className = 'module-page-categories';
    const content = document.createElement('div'); content.className = 'module-page-content';
    const quick = document.createElement('aside'); quick.className = 'module-page-quick';
    layout.append(categories, content, quick); page.append(selector, layout);
    function buildGroup(group, items) {
      const section = document.createElement('section');
      section.className = 'module-page-group';
      const h2 = document.createElement('h2');
      h2.textContent = (group.label || 'Geral').replace(/^Campinas\s*[·-]\s*/i, '');
      const grid = document.createElement('div');
      grid.className = 'module-page-grid';
      for (const item of items) {
        if (moduleId === 'ged') {
          const route = item.route;
          grid.append(itemLink(item.label, root + 'ged/' + route, () => {
            if (!window.UnificadoRouter?.openGed) return false;
            window.UnificadoRouter.openGed(route);
          }));
        } else {
          const route = MENU_ITEMS[item.id];
          grid.append(itemLink(item.label, route.url, () => {
            if (item.id === 'tvFormas') {
              if (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true ||
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
      unitTabs.hidden = !isProduction;
      if (isProduction) for (const unit of units) {
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'module-page-unit' + (unit === active.unit ? ' active' : '');
        button.textContent = unit;
        button.setAttribute('aria-pressed', String(unit === active.unit));
        button.addEventListener('click', () => {active.unit = unit; active.group = 0; active.query = ''; search.value = ''; render();});
        unitTabs.append(button);
      }
      const current = visibleGroups.filter(group => unitFor(group) === active.unit);
      current.forEach((group, index) => {
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'module-page-category' + (index === active.group && !active.query ? ' active' : '');
        button.textContent = (group.label || 'Geral').replace(/^Campinas\s*[·-]\s*/i, '');
        const count = document.createElement('span'); count.textContent = group.items.length; button.append(count);
        button.addEventListener('click', () => {active.group = index; active.query = ''; search.value = ''; render();});
        categories.append(button);
      });
      if (active.query) {
        const q = active.query.toLocaleLowerCase('pt-BR');
        for (const group of current) {
          const found = group.items.filter(item => (item.label + ' ' + group.label).toLocaleLowerCase('pt-BR').includes(q));
          if (found.length) content.append(buildGroup(group, found));
        }
        if (!content.children.length) content.textContent = 'Nenhuma tela encontrada.';
      } else if (current[active.group]) content.append(buildGroup(current[active.group], current[active.group].items));
      const top = document.createElement('h3'); top.textContent = 'Acesso rápido'; quick.append(top);
      for (const group of current.slice(0, 4)) {
        const item = group.items[0];
        if (!item) continue;
        const link = document.createElement('a'); link.className = 'module-page-quick-link';
        link.href = moduleId === 'ged' ? root + 'ged/' + item.route :
          root + '?view=' + encodeURIComponent(new URL(MENU_ITEMS[item.id].url).pathname.slice(root.length) + new URL(MENU_ITEMS[item.id].url).search);
        const title = document.createElement('strong'); title.textContent = item.label;
        const detail = document.createElement('small'); detail.textContent = (group.label || 'Geral').replace(/^Campinas\s*[·-]\s*/i, '');
        link.append(title, detail);
        link.addEventListener('click', event => {
          if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
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

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

  function itemLink(label, href, open) {
    const link = document.createElement('a');
    link.className = 'module-page-link';
    link.href = href;
    const name = document.createElement('span');
    name.textContent = label;
    const arrow = document.createElement('span');
    arrow.className = 'module-page-arrow';
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    link.append(name, arrow);
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
    for (const group of groups) {
      if (!group.items.length) continue;
      const section = document.createElement('section');
      section.className = 'module-page-group';
      const h2 = document.createElement('h2');
      h2.textContent = group.label;
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
          });
          if (opensCertificateTab) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('aria-label', item.label + ' (abre em nova guia)');
          }
          grid.append(link);
        }
      }
      section.append(h2, grid);
      page.append(section);
    }

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

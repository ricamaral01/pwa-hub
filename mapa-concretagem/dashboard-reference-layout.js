/* Layout shared by the three dashboards. Calculations remain in app.js. */
(() => {
  const $ = (root, selector) => root?.querySelector(selector);
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  function montage() {
    const root = document.getElementById('viewMontagemIndicadores');
    const tabs = $(root, '.mi-tabs-bar');
    if (!tabs || $(root, '.ref-overview')) return;
    const overview = create('div', 'ref-overview');
    const kpis = $(root, '#miSecaoResumo .mi-kpis-grid');
    const analysis = $(root, '#miSecaoResumo .mi-charts-row');
    const rate = $(root, '#miSecaoProdutividade .mi-taxa-card');
    if (kpis) overview.append(kpis);
    overview.append(create('h3', 'ref-section-heading', 'Análise da montagem'));
    if (analysis) overview.append(analysis);
    if (rate) overview.append(rate);
    tabs.before(overview);
    const first = $(tabs, '[data-tab="resumo"]');
    if (first) first.textContent = 'Indicadores';
  }

  function concreting() {
    const root = document.getElementById('viewProdAnalise');
    const tabs = $(root, '.pa-tabs-bar');
    if (!tabs || $(root, '.ref-overview')) return;
    const title = $(root, '.pa-topbar h2');
    if (title) title.textContent = 'Concretagem';
    const drawer = $(root, '#paFiltrosDrawer');
    if (drawer) {
      drawer.classList.add('ref-inline-filters');
      drawer.classList.remove('hidden');
      drawer.setAttribute('aria-hidden', 'false');
      const dialog = $(drawer, '[role="dialog"]');
      if (dialog) { dialog.removeAttribute('role'); dialog.removeAttribute('aria-modal'); }
      new MutationObserver(() => {
        if (drawer.classList.contains('hidden')) drawer.classList.remove('hidden');
        if (drawer.getAttribute('aria-hidden') !== 'false') drawer.setAttribute('aria-hidden', 'false');
      }).observe(drawer, {attributes: true, attributeFilter: ['class', 'aria-hidden']});
    }
    const overview = create('div', 'ref-overview');
    const top = create('div', 'mi-kpis-grid ref-five-kpis');
    for (const id of ['paKpiFormas', 'paKpiVolume', 'paKpiCicloMedio', 'paKpiFormasHora', 'paKpiEficiencia']) {
      const card = document.getElementById(id)?.closest('.mi-kpi-card');
      if (card) top.append(card);
    }
    overview.append(top, create('h3', 'ref-section-heading', 'Análises da concretagem'));
    const analysis = create('div', 'ref-analysis-grid');
    for (const id of ['chartPaVolDiaStacked', 'chartPaCicloDia', 'paVolumeTipoSetor']) {
      const card = document.getElementById(id)?.closest('.mi-chart-card');
      if (card) analysis.append(card);
    }
    overview.append(analysis);
    tabs.before(overview);
    const first = $(tabs, '[data-pa-tab="resumo"]');
    if (first) first.textContent = 'Indicadores adicionais';
  }

  function defects() {
    const section = document.getElementById('miSecaoDefeitos');
    if (!section || $(section, '.ref-defect-tabs')) return;
    const unified = Boolean($(section, '.df-new-head'));
    const overview = create('div', 'ref-defect-overview');
    const details = create('div', 'ref-defect-details');
    const tabs = create('div', 'ref-defect-tabs');
    tabs.setAttribute('role', 'tablist');
    const overviewButton = create('button', 'active', 'Visão geral');
    const detailsButton = create('button', '', 'Detalhes e indicadores adicionais');
    for (const button of [overviewButton, detailsButton]) {
      button.type = 'button'; button.setAttribute('role', 'tab'); tabs.append(button);
    }
    const children = [...section.children];
    if (unified) {
      const newHead = $(section, '.df-new-head');
      if (newHead) overview.append(newHead);
      for (const selector of ['.df-new-secondary', '#dfReportedPanel', '#dfNewUnspecified']) {
        const extra = $(newHead, selector);
        if (extra) details.append(extra);
      }
      for (const child of children) if (child !== newHead) details.append(child);
    } else {
      const hero = $(section, '.df-v4-hero-grid');
      const mini = $(section, '.df-v4-mini-grid');
      if (hero && mini?.firstElementChild) hero.append(mini.firstElementChild);
      if (hero) overview.append(hero);
      overview.append(create('h3', 'ref-section-heading', 'Análise dos defeitos'));
      for (const layout of [...section.querySelectorAll(':scope > .df-v4-layout')].slice(0, 2)) overview.append(layout);
      for (const child of children) if (child.parentElement === section) details.append(child);
    }
    section.append(overview, tabs, details);
    const show = expanded => {
      details.hidden = !expanded;
      overview.hidden = expanded;
      overviewButton.classList.toggle('active', !expanded);
      detailsButton.classList.toggle('active', expanded);
      overviewButton.setAttribute('aria-selected', String(!expanded));
      detailsButton.setAttribute('aria-selected', String(expanded));
    };
    overviewButton.addEventListener('click', () => show(false));
    detailsButton.addEventListener('click', () => show(true));
    show(false);
  }

  function renameMenu() {
    const side = document.getElementById('navProdAnalise');
    if (side) for (const child of side.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && child.textContent.includes('Produtividade'))
        child.textContent = child.textContent.replace('Produtividade', 'Concretagem');
    }
    for (const button of document.querySelectorAll('[data-hub-mode="PROD_ANALISE"]')) {
      const label = button.querySelector('.hub-icon-lbl') || button;
      label.textContent = 'Concretagem';
    }
  }
  montage(); concreting(); defects(); renameMenu();
})();

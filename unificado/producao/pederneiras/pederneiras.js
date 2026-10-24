(() => {
  const tabs = {
    apontamento: ['Apontamento do dia', 'Registro diário de postes por produto, com revisão e confirmação.'],
    'mao-de-obra': ['Mão de obra', 'Equipe do dia por área, com totais MOD, MOI e postes por homem.'],
    mensal: ['Produção Pederneiras', 'Matriz mensal por produto e por dia com produção.'],
    indicadores: ['Indicadores', 'Painel de acompanhamento da unidade.'],
    produtos: ['Cadastro de produtos', 'Catálogo de postes, códigos e volume por peça.'],
  };
  const selected = new URLSearchParams(location.search).get('tab') || 'apontamento';
  const tab = Object.hasOwn(tabs, selected) ? selected : 'apontamento';
  document.title = `${tabs[tab][0]} · Produção Pederneiras`;
  document.getElementById('section-title').textContent = tabs[tab][0];
  document.getElementById('section-copy').textContent = tabs[tab][1];
  document.querySelectorAll('[data-tab]').forEach(link => {
    if (link.dataset.tab === tab) link.setAttribute('aria-current', 'page');
  });
})();

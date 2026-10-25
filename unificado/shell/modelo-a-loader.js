// Carrega React apenas no modo PC/tablet já escolhido pela casca.
(() => {
  const viewport = matchMedia('(min-width: 601px)');
  let started = false;
  function showFallback(error) {
    if (!document.body.classList.contains('unificado-model-a')) return;
    document.body.classList.add('unificado-model-a-failed');
    if (error) console.error('Menu Modelo A não carregou', error);
    renderSidebar();
  }
  function load() {
    if (started || !document.body.classList.contains('unificado-model-a')) return;
    started = true;
    import('./modelo-a/menu.js?v=1.0.56').catch(showFallback);
    setTimeout(() => {
      if (!document.querySelector('#sidebar-model-a .sb')) showFallback();
    }, 8000);
  }
  viewport.addEventListener('change', load);
  load();
})();

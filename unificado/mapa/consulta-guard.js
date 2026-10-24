// Prévia de consulta: impede apontamentos antes da paridade operacional.
(() => {
  const notice = 'Esta prévia permite apenas consulta. Os apontamentos continuam no Mapa atual.';
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const method = String(init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const url = new URL(input instanceof Request ? input.url : String(input), location.href);
    if (method === 'POST' && url.pathname.endsWith('/mapa/api/logout')) return originalFetch(input, init);
    if (method !== 'GET' && method !== 'HEAD') return Promise.reject(new Error(notice));
    return originalFetch(input, init);
  };
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, ...args) {
    if (!['GET', 'HEAD'].includes(String(method).toUpperCase())) throw new Error(notice);
    return originalOpen.call(this, method, ...args);
  };
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest('.forma-card');
    const button = target?.closest('button, input[type="button"], input[type="submit"]');
    const label = (button?.textContent || button?.value || '').trim();
    if (card || (button && /\b(salvar|gravar|finalizar|confirmar|excluir|apagar|registrar|liberar forma|programar forma|parar forma)\b/i.test(label))) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const banner = document.getElementById('consulta-banner');
      if (banner) { banner.classList.add('is-alert'); banner.querySelector('span').textContent = notice; }
    }
  }, true);
  document.addEventListener('submit', (event) => {
    if ((event.target.method || 'GET').toUpperCase() !== 'GET') {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();

// A cópia do PCP permanece em modo somente leitura até a integração ser validada.
// O guard roda antes dos scripts das páginas, inclusive scripts inline.
(() => {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      return Promise.reject(new Error('A escrita está desativada na cópia de validação do PCP.'));
    }
    return originalFetch(input, init);
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, ...args) {
    if (!['GET', 'HEAD'].includes(String(method).toUpperCase())) {
      throw new Error('A escrita está desativada na cópia de validação do PCP.');
    }
    return originalOpen.call(this, method, ...args);
  };

  document.addEventListener('submit', event => {
    if (!['GET', 'HEAD'].includes((event.target.method || 'GET').toUpperCase())) {
      event.preventDefault();
    }
  }, true);
})();

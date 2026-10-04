/* Keep PCP page handlers intact while routing their API calls to the isolated test API. */
(() => {
  const officialHosts = new Set(["pcp.concretrack.com.br", "usina.concretrack.com.br"]);
  function localUrl(value) {
    const url = new URL(value, location.href);
    if (url.origin === location.origin && url.pathname.startsWith("/api/")) {
      return "/unificado/pcp" + url.pathname + url.search + url.hash;
    }
    if (officialHosts.has(url.hostname) && url.pathname.startsWith("/api/")) {
      return "/unificado/pcp" + url.pathname + url.search + url.hash;
    }
    if (officialHosts.has(url.hostname) || url.hostname.endsWith(".supabase.co")) {
      throw new Error("Acesso a dados oficiais bloqueado nesta cópia de testes.");
    }
    return value;
  }
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      const value = localUrl(typeof input === "string" ? input : input.url);
      return originalFetch(typeof input === "string" ? value : new Request(value, input), init)
        .then(response => {
          if (new URL(value, location.href).pathname.startsWith("/unificado/pcp/api/")) {
            dispatchEvent(new CustomEvent("unificado-pcp-sync", {detail: response.ok}));
          }
          return response;
        });
    } catch (error) {
      return Promise.reject(error);
    }
  };
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    return originalOpen.call(this, method, localUrl(url), ...rest);
  };
  function rewriteMapaLink() {
    document.querySelectorAll('a[href^="https://usina.concretrack.com.br/mapa-concretagem/"]')
      .forEach(link => { link.href = "/unificado/mapa/operacao/"; link.removeAttribute("target"); });
  }
  document.addEventListener("DOMContentLoaded", () => {
    rewriteMapaLink();
    const nav = document.querySelector("#sidebar nav");
    if (nav) new MutationObserver(rewriteMapaLink).observe(nav, {childList: true, subtree: true});
    document.addEventListener("click", event => {
      if (!event.target.closest("#btn-logout")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      localStorage.removeItem("pcp_token");
      localStorage.removeItem("pcp_user");
      localStorage.removeItem("pwa_mapa_auth_session_v1");
      originalFetch("/unificado/mapa/api/logout", {method: "POST", credentials: "same-origin"})
        .finally(() => location.assign("/unificado/login.html"));
    }, true);
  });
})();

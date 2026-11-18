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
  let sessionRecovery = null;
  function recoverPcpSession() {
    if (sessionRecovery) return sessionRecovery;
    const token = localStorage.getItem("pcp_token");
    sessionRecovery = originalFetch("/unificado/mapa/api/unified/pcp-session", {
      credentials: "same-origin", cache: "no-store",
      headers: token ? {Authorization: "Bearer " + token} : {}
    }).then(async response => {
      if (!response.ok) return false;
      const result = await response.json();
      if (!result.access_token || !result.usuario) return false;
      localStorage.setItem("pcp_token", result.access_token);
      localStorage.setItem("pcp_user", JSON.stringify(result.usuario));
      return true;
    }).catch(() => false).finally(() => { sessionRecovery = null; });
    return sessionRecovery;
  }
  window.unificadoRecoverPcpSession = recoverPcpSession;
  function recordClientError(code, message) {
    originalFetch("/unificado/testar/api/client-errors", {
      method: "POST", credentials: "same-origin", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({screen: location.pathname + location.search, code, message: String(message || "").slice(0, 500)})
    }).catch(() => {});
  }
  window.fetch = (input, init) => {
    try {
      const value = localUrl(typeof input === "string" ? input : input.url);
      const request = new Request(typeof input === "string" ? value : new Request(value, input), init);
      const retry = request.clone();
      return originalFetch(request)
        .then(async response => {
          const path = new URL(value, location.href).pathname;
          if (response.status === 401 && path.startsWith("/unificado/pcp/api/")
              && path !== "/unificado/pcp/api/login" && await recoverPcpSession()) {
            const headers = new Headers(retry.headers);
            headers.set("Authorization", "Bearer " + localStorage.getItem("pcp_token"));
            response = await originalFetch(new Request(retry, {headers}));
          }
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
    addEventListener("error", event => recordClientError("window.error", event.message));
    addEventListener("unhandledrejection", event => recordClientError("unhandledrejection", event.reason?.message || event.reason));
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

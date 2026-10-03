/* Endpoints for the isolated Mapa test site. The application logic stays original. */
(() => {
  const prefix = "/unificado/mapa/api";
  const originalFetch = window.fetch.bind(window);
  const rewrite = (input) => {
    const url = new URL(typeof input === "string" ? input : input.url, location.href);
    const host = url.hostname;
    if (host.endsWith(".supabase.co")) return prefix + url.pathname + url.search;
    if (host === "pcp.concretrack.com.br" && url.pathname.startsWith("/api/")) {
      return prefix + "/pcp/" + url.pathname.slice(5) + url.search;
    }
    if (host === "usina.concretrack.com.br" && url.pathname.startsWith("/api/programacao")) {
      return prefix + "/pcp/" + url.pathname.slice(5) + url.search;
    }
    if (host === "dautomacao.com" && url.pathname.startsWith("/api/")) {
      return prefix + url.pathname.slice(4) + url.search;
    }
    if (host === "docs.google.com" && url.pathname.startsWith("/spreadsheets/")) {
      return prefix + "/usina/leituras-qr.csv" + url.search;
    }
    return null;
  };
  window.fetch = (input, init) => {
    const local = rewrite(input);
    if (!local) return originalFetch(input, init);
    if (typeof input === "string") return originalFetch(local, init);
    return originalFetch(new Request(local, input), init);
  };
})();

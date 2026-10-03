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
  document.addEventListener("DOMContentLoaded", () => {
    originalFetch("/unificado/mapa/api/me", { credentials: "same-origin", cache: "no-store" })
      .then(response => {
        if (!response.ok) {
          const next = "mapa/operacao/" + (location.search || "");
          location.replace("/unificado/login.html?next=" + encodeURIComponent(next));
        }
      })
      .catch(() => {
        const next = "mapa/operacao/" + (location.search || "");
        location.replace("/unificado/login.html?next=" + encodeURIComponent(next));
      });
    document.getElementById("authLogoutBtn")?.addEventListener("click", () => {
      localStorage.removeItem("pcp_token");
      localStorage.removeItem("pcp_user");
      originalFetch("/unificado/mapa/api/logout", {
        method: "POST", credentials: "same-origin"
      });
    });
    const last = { date: "", production: null, maintenance: null, busy: false };
    const pollChanges = async () => {
      if (last.busy || document.hidden || typeof state === "undefined" || !state.authUser) return;
      const sector = state.activeLiberacaoSector || "";
      if (!/^LIBERACAO(?:_S[1-4])?$/.test(sector)) return;
      const date = el.libData?.value || "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      last.busy = true;
      try {
        const base = "/unificado/mapa/api/rest/v1/";
        const productionUrl = base + "producao?select=id,data_hora,status,tipo_concreto,forma,setor"
          + "&data_fabricacao=eq." + encodeURIComponent(date) + "&order=id.asc";
        const maintenanceUrl = base + "formas_manutencao?select=id,status,updated_at&order=id.asc";
        const [productionResponse, maintenanceResponse] = await Promise.all([
          originalFetch(productionUrl, { cache: "no-store", credentials: "same-origin" }),
          originalFetch(maintenanceUrl, { cache: "no-store", credentials: "same-origin" })
        ]);
        if (!productionResponse.ok || !maintenanceResponse.ok) return;
        const production = JSON.stringify(await productionResponse.json());
        const maintenance = JSON.stringify(await maintenanceResponse.json());
        if (last.date === date && last.production !== null &&
            (production !== last.production || maintenance !== last.maintenance)) {
          if (production !== last.production && typeof loadClickedFormsFromSupabase === "function") {
            await loadClickedFormsFromSupabase(date);
          }
          if (maintenance !== last.maintenance && typeof carregarFormasManutencaoSupabase === "function") {
            await carregarFormasManutencaoSupabase();
          }
          if (typeof renderLiberacaoDual === "function") renderLiberacaoDual();
        }
        last.date = date;
        last.production = production;
        last.maintenance = maintenance;
      } catch (error) {
        console.warn("Atualização periódica do Mapa indisponível:", error);
      } finally {
        last.busy = false;
      }
    };
    setInterval(pollChanges, 12000);
  });
})();

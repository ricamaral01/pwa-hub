/* Endpoints for the isolated Mapa test site. The application logic stays original. */
(() => {
  const visibilityStyle = document.createElement('link');
  visibilityStyle.rel = 'stylesheet';
  visibilityStyle.href = '/unificado/shell/password-visibility.css?v=2';
  document.head.append(visibilityStyle);
  const visibilityScript = document.createElement('script');
  visibilityScript.src = '/unificado/shell/password-visibility.js?v=2';
  document.head.append(visibilityScript);
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
    const renewSession = () => originalFetch("/unificado/mapa/api/me", {
      credentials: "same-origin", cache: "no-store"
    });
    let handlingAccess = false;
    const unavailableOrLogin = async () => {
      if (handlingAccess) return;
      handlingAccess = true;
      const other = await originalFetch("/unificado/testar/", {
        credentials: "same-origin", cache: "no-store"
      }).catch(() => null);
      const pcpToken = localStorage.getItem("pcp_token");
      const pcp = !other?.ok && pcpToken ? await originalFetch("/unificado/pcp/api/dashboard", {
        headers: {Authorization: `Bearer ${pcpToken}`}, cache: "no-store"
      }).catch(() => null) : null;
      if (other?.ok || pcp?.ok) {
        const notice = document.createElement("div");
        notice.setAttribute("role", "status");
        notice.style.cssText = "position:fixed;inset:0;z-index:1000000;display:grid;place-items:center;background:#0B1730;color:white;font:600 22px system-ui;text-align:center;padding:24px";
        notice.innerHTML = '<div>Produ\u00e7\u00e3o indispon\u00edvel para esta conta.<br><a style="color:#E8762A;font-size:16px" href="/unificado/">Voltar ao In\u00edcio</a></div>';
        document.body.append(notice);
        return;
      }
      const next = "mapa/operacao/" + (location.search || "");
      location.replace("/unificado/login.html?next=" + encodeURIComponent(next));
    };
    renewSession()
      .then(response => {
        if (response.status === 401) {
          unavailableOrLogin();
        }
      })
      .catch(() => {});
    setInterval(() => {
      if (!document.hidden) renewSession().then(response => {
        if (response.status === 401) unavailableOrLogin();
      }).catch(() => {});
    }, 5 * 60 * 1000);
    document.getElementById("authLogoutBtn")?.addEventListener("click", () => {
      localStorage.removeItem("pcp_token");
      localStorage.removeItem("pcp_user");
      originalFetch("/unificado/mapa/api/logout", {
        method: "POST", credentials: "same-origin"
      });
    });
    const last = { date: "", production: null, releases: null, maintenance: null, busy: false };
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
        const releaseUrl = base + "liberacao_formas?select=id,data_hora,forma,setor"
          + "&data_fabricacao=eq." + encodeURIComponent(date) + "&order=id.asc";
        const maintenanceUrl = base + "formas_manutencao?select=id,status,updated_at&order=id.asc";
        const [productionResponse, releaseResponse, maintenanceResponse] = await Promise.all([
          window.fetch(productionUrl, { cache: "no-store", credentials: "same-origin" }),
          window.fetch(releaseUrl, { cache: "no-store", credentials: "same-origin" }),
          window.fetch(maintenanceUrl, { cache: "no-store", credentials: "same-origin" })
        ]);
        if (!productionResponse.ok || !releaseResponse.ok) return;
        const production = JSON.stringify(await productionResponse.json());
        const releases = JSON.stringify(await releaseResponse.json());
        const maintenance = maintenanceResponse.ok
          ? JSON.stringify(await maintenanceResponse.json()) : last.maintenance;
        if (last.date !== date || last.production === null ||
            production !== last.production || releases !== last.releases || maintenance !== last.maintenance) {
          if ((last.date !== date || production !== last.production || releases !== last.releases) &&
              typeof loadClickedFormsFromSupabase === "function") {
            await loadClickedFormsFromSupabase(date);
          }
          if (maintenanceResponse.ok && maintenance !== last.maintenance &&
              typeof carregarFormasManutencaoSupabase === "function") {
            await carregarFormasManutencaoSupabase();
          }
          if (typeof renderLiberacaoDual === "function") renderLiberacaoDual();
        }
        last.date = date;
        last.production = production;
        last.releases = releases;
        last.maintenance = maintenance;
      } catch (error) {
        console.warn("Atualização periódica do Mapa indisponível:", error);
      } finally {
        last.busy = false;
      }
    };
    setInterval(pollChanges, 12000);

    const notice = document.createElement('section');
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.hidden = true;
    notice.className = 'pcp-week-notice';
    notice.innerHTML = '<strong>Programação semanal publicada</strong><span></span><button type="button">Entendi</button>';
    const noticeStyle = document.createElement('style');
    noticeStyle.textContent = '.pcp-week-notice{position:fixed;right:16px;bottom:88px;z-index:1100;width:min(360px,calc(100vw - 32px));padding:16px;background:#102b49;color:#fff;border:2px solid #f28c36;border-radius:12px;box-shadow:0 8px 24px #102b4966;font:14px/1.4 system-ui,sans-serif}.pcp-week-notice[hidden]{display:none}.pcp-week-notice strong,.pcp-week-notice span{display:block}.pcp-week-notice span{margin:6px 0 12px}.pcp-week-notice button{min-height:44px;padding:8px 16px;border:0;border-radius:8px;background:#f28c36;color:#102b49;font:700 14px system-ui,sans-serif;cursor:pointer}';
    document.head.append(noticeStyle);
    document.body.append(notice);
    let noticeKey = '';
    notice.querySelector('button').addEventListener('click', () => {
      if (noticeKey) localStorage.setItem(noticeKey, 'lido');
      notice.hidden = true;
    });
    const checkWeeklyNotice = async () => {
      if (document.hidden || typeof state === 'undefined' || !state.authUser ||
          !/^LIBERACAO_S[12]$/.test(state.activeLiberacaoSector || '')) {
        notice.hidden = true;
        return;
      }
      try {
        const response = await originalFetch('/unificado/mapa/api/pcp/aviso-programacao', {
          credentials: 'same-origin', cache: 'no-store',
          headers: {'X-Unificado-Screen': state.activeLiberacaoSector}
        });
        if (!response.ok) return;
        const {aviso} = await response.json();
        if (!aviso) { notice.hidden = true; return; }
        noticeKey = `pcp-week-notice:${state.authUser.id}:${aviso.id}:${aviso.versao}`;
        if (localStorage.getItem(noticeKey) === 'lido') { notice.hidden = true; return; }
        const start = String(aviso.semana_inicio).split('-');
        notice.querySelector('span').textContent = `Semana de ${start[2]}/${start[1]}/${start[0]} · versão ${aviso.versao}. Confira as formas antes da montagem.`;
        notice.hidden = false;
      } catch (_) { /* A produção continua disponível se o aviso falhar. */ }
    };
    checkWeeklyNotice();
    setInterval(checkWeeklyNotice, 20000);
  });
})();

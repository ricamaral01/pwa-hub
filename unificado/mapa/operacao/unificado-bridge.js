/* Desktop presentation only. Original Mapa handlers remain responsible for every action. */
(() => {
  // Única chave para a futura casca de Início/menu em tablet. Deve permanecer false
  // até a autorização do Ricardo; as telas operacionais em tablet nunca recebem a classe.
  const ENABLE_TABLET_HUB_SHELL = false;
  const groups = [
    ["Produção", [["PL","Produção / Liberação","LIBERACAO"],["P1","Setor 1","LIBERACAO_S1"],
      ["P2","Setor 2","LIBERACAO_S2"],["P3","Setor 3","LIBERACAO_S3"],
      ["P4","Setor 4","LIBERACAO_S4"],["MC","Mandril Circular","MANDRIL_CIRCULAR"]]],
    ["Montagem", [["MI","Inspeção Setor 3 e 4","INSPECAO"],
      ["MP","Montagem Postes","MONTAGEM_POSTES"],["S3","Sequência Setor 3","SEQUENCIA_S3"]]],
    ["Controle", [["RE","Relatório Enc. Produção","RELATORIO"],
      ["HI","Histórico","HISTORICO"],["CC","Acmp. Concretagem","ACMP_CONCRETAGEM"],
      ["MF","Manutenção Formas","RELATORIO_MANUTENCAO"],
      ["TD","Tratativa Defeitos","TRATATIVA_DEFEITOS"]]],
    ["Indicadores", [["DM","Dashboard Montagem","MONTAGEM_INDICADORES"],
      ["DF","Dashboard Defeitos","DASHBOARD_DEFEITOS"],
      ["PR","Produtividade","PROD_ANALISE"]]],
    ["Administração", [["US","Usuários","USUARIOS"]]]
  ];
  const labels = Object.fromEntries(groups.flatMap(([, items]) => items.map(([, label, mode]) => [mode, label])));
  labels.HUB = "Início";
  const requestedMode = new URLSearchParams(location.search).get("tela");
  let requestedModeApplied = false;
  let kgHomemRequest = null;
  let kgHomemKey = "";
  let kgHomemUpdatedAt = 0;
  const desktop = () => matchMedia("(min-width: 1025px)").matches && !document.body.classList.contains("kiosk-active");
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const neutralDatabaseText = value => String(value || "")
    .replace(/Falha ao verificar banco Supabase\./gi, "Falha ao verificar o banco de dados.")
    .replace(/Conectado ao Supabase:/gi, "Conectado:")
    .replace(/(?:Erro|Falha) ao sincronizar(?: com o)? Supabase/gi, "Erro ao sincronizar com o servidor")
    .replace(/\bSupabase\b/gi, "servidor");
  function setupKgHomem() {
    const summary = document.querySelector("#paSecaoResumo");
    if (!summary || summary.querySelector("#paKgHomem")) return;
    const panel = element("section", "pa-kg-homem");
    panel.id = "paKgHomem";
    panel.innerHTML = '<div class="pa-kg-homem-heading"><h3>KG / Homem</h3>'
      + '<p>Peso dos postes produzidos ÷ (MOD + MOI). O MOI dos Setores 3 e 4 é dividido igualmente.</p></div>'
      + '<div id="paKgHomemDays" class="pa-kg-homem-days">Carregando...</div>';
    summary.append(panel);
    for (const id of ["paBtnAtualizar", "paBtnFiltrar", "paBtnLimparFiltros"]) {
      document.getElementById(id)?.addEventListener("click", () => setTimeout(() => loadKgHomem(true), 0));
    }
  }
  async function pcpDashboardToken(refresh = false) {
    if (!refresh && localStorage.getItem("pcp_token")) return localStorage.getItem("pcp_token");
    const response = await fetch("/unificado/mapa/api/unified/pcp-session", {
      credentials: "same-origin", cache: "no-store"
    });
    if (!response.ok) return null;
    const session = await response.json();
    if (!session.access_token || !session.usuario) return null;
    localStorage.setItem("pcp_token", session.access_token);
    localStorage.setItem("pcp_user", JSON.stringify(session.usuario));
    return session.access_token;
  }
  function renderKgHomem(rows) {
    const target = document.getElementById("paKgHomemDays");
    if (!target) return;
    const days = new Map();
    for (const row of rows) {
      if (!days.has(row.data)) days.set(row.data, new Map());
      days.get(row.data).set(String(row.grupo_id), row);
    }
    const number = value => Number(value || 0).toLocaleString("pt-BR", {maximumFractionDigits: 2});
    const ratio = value => Number(value).toLocaleString("pt-BR", {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const card = (row, title) => `<article class="pa-kg-homem-card"><h4>${title}</h4>`
      + `<strong>${row?.kg_por_homem == null ? "—" : ratio(row.kg_por_homem)}</strong>`
      + '<span class="pa-kg-homem-unit">kg por pessoa</span>'
      + (row ? `<small>${number(row.peso_realizado_kg)} kg produzidos ÷ ${number(row.pessoas)} pessoa(s)</small>`
        + `<small>MOD ${number(row.mod)} + MOI ${number(row.moi)}</small>` : '') + '</article>';
    target.innerHTML = [...days].sort(([a], [b]) => b.localeCompare(a))
      .map(([day, groups]) => `<section><h4>${day.split("-").reverse().join("/")}</h4><div class="pa-kg-homem-grid">${[["12", "Setores 1 e 2"], ["3", "Setor 3"], ["4", "Setor 4"]].map(([id, title]) => card(groups.get(id), title)).join("")}</div></section>`)
      .join("") || 'Sem dados no período.';
  }
  async function loadKgHomem(force = false) {
    if (typeof state === "undefined" || state.mode !== "PROD_ANALISE") return;
    const start = document.getElementById("paDataInicio")?.value;
    const end = document.getElementById("paDataFim")?.value;
    const target = document.getElementById("paKgHomemDays");
    if (!start || !end || !target || kgHomemRequest) return;
    const key = `${start}:${end}`;
    if (!force && key === kgHomemKey && Date.now() - kgHomemUpdatedAt < 60000) return;
    target.textContent = 'Carregando...';
    kgHomemRequest = (async () => {
      let token = await pcpDashboardToken();
      if (!token) throw new Error("Sem acesso aos dados de mão de obra.");
      const url = `/unificado/pcp/api/dashboard?data_inicio=${encodeURIComponent(start)}&data_fim=${encodeURIComponent(end)}`;
      let response = await fetch(url, {headers: {Authorization: `Bearer ${token}`}, cache: "no-store"});
      if (response.status === 401) {
        token = await pcpDashboardToken(true);
        if (token) response = await fetch(url, {headers: {Authorization: `Bearer ${token}`}, cache: "no-store"});
      }
      if (!response.ok) throw new Error("Não foi possível carregar KG / Homem.");
      const data = await response.json();
      renderKgHomem(data.kg_homem_diario || []);
      kgHomemKey = key;
      kgHomemUpdatedAt = Date.now();
    })().catch(error => {
      target.textContent = error.message || "Indicador indisponível.";
    }).finally(() => { kgHomemRequest = null; });
    await kgHomemRequest;
  }
  function neutralizeVisibleDatabaseText(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const updated = neutralDatabaseText(node.nodeValue);
      if (updated !== node.nodeValue) node.nodeValue = updated;
    });
    root.querySelectorAll?.("[title],[aria-label],[placeholder]").forEach(node => {
      ["title", "aria-label", "placeholder"].forEach(attribute => {
        if (node.hasAttribute(attribute)) {
          node.setAttribute(attribute, neutralDatabaseText(node.getAttribute(attribute)));
        }
      });
    });
  }
  function makeNav() {
    const nav = element("aside", "unificado-sidebar");
    nav.id = "unificadoSidebar";
    const brand = element("div", "unificado-brand");
    brand.innerHTML = '<span class="unificado-brand-logos"><img src="/unificado/assets/img/logo-concrefer.png" alt="Concrefer"><img src="/unificado/assets/img/logo-concretrack.png" alt="ConcreTrack"></span>';
    nav.append(brand);
    const collapse = element("button", "unificado-collapse", "☰");
    collapse.type = "button";
    collapse.title = "Recolher ou expandir menu";
    collapse.setAttribute("aria-label", "Recolher ou expandir menu");
    collapse.addEventListener("click", () => {
      const collapsed = !document.body.classList.contains("unificado-menu-collapsed");
      localStorage.setItem("unificado_menu_collapsed", collapsed ? "1" : "0");
      document.body.classList.toggle("unificado-menu-collapsed", collapsed);
      collapse.setAttribute("aria-expanded", String(!collapsed));
    });
    nav.append(collapse);
    const switcher = element("div", "unificado-switch");
    const planning = element("button", "unificado-switch-btn", "Planejamento");
    planning.type = "button";
    planning.title = "Planejamento";
    planning.setAttribute("aria-label", "Planejamento");
    planning.dataset.icon = "PL";
    planning.addEventListener("click", async () => {
      if (planning.disabled) return;
      planning.disabled = true;
      try {
        const response = await fetch("/unificado/mapa/api/unified/pcp-session", {
          credentials: "same-origin", cache: "no-store"
        });
        if (response.status === 401) {
          location.assign("/unificado/login.html?next=pcp%2Fdashboard%2F");
          return;
        }
        const result = await response.json();
        if (!response.ok || !result.access_token || !result.usuario) {
          throw new Error(result.error || "Planejamento indisponível no momento.");
        }
        localStorage.setItem("pcp_token", result.access_token);
        localStorage.setItem("pcp_user", JSON.stringify(result.usuario));
        location.assign("/unificado/?view=pcp%2Fdashboard%2F");
      } catch (error) {
        alert(error.message || "Não foi possível abrir o Planejamento.");
        planning.disabled = false;
      }
    });
    const production = element("button", "unificado-switch-btn is-active", "Produção");
    production.type = "button";
    production.setAttribute("aria-current", "page");
    production.title = "Produção";
    production.setAttribute("aria-label", "Produção");
    production.dataset.icon = "PR";
    switcher.append(planning, production);
    nav.append(switcher);
    const scroll = element("nav", "unificado-nav");
    scroll.setAttribute("aria-label", "Menu unificado");
    const home = element("button", "unificado-nav-link", "Início");
    home.type = "button";
    home.dataset.mode = "HUB";
    home.title = "Início";
    home.setAttribute("aria-label", "Início");
    home.prepend(element("span", "unificado-mono", "IN"));
    home.addEventListener("click", () => setMode("HUB"));
    scroll.append(home);
    for (const [name, items] of groups) {
      const group = element("div", "unificado-nav-group");
      group.append(element("div", "unificado-group-title", name));
      for (const [mono, label, mode] of items) {
        const button = element("button", "unificado-nav-link", label);
        button.type = "button";
        button.dataset.mode = mode;
        button.title = label;
        button.setAttribute("aria-label", label);
        button.prepend(element("span", "unificado-mono", mono));
        button.addEventListener("click", () => setMode(mode));
        group.append(button);
      }
      scroll.append(group);
    }
    nav.append(scroll);
    const report = element("a", "unificado-nav-foot", "Relatar problema");
    report.href = "/unificado/testar/#relatar";
    nav.append(report);
    return nav;
  }
  function makeTopbar() {
    const header = element("header", "unificado-topbar");
    header.innerHTML = '<div class="unificado-crumb"><span>Produção</span><span aria-hidden="true">/</span><strong id="unificadoCrumbScreen">Início</strong></div>'
      + '<div class="unificado-top-actions"><span class="unificado-sync"><i></i><span id="unificadoSyncText">Sincronizando</span></span>'
      + '<span class="unificado-user"><span class="unificado-avatar" id="unificadoAvatar"></span><span><strong id="unificadoUserName"></strong><small id="unificadoUserRole"></small></span></span>'
      + '<button id="unificadoLogout" class="unificado-exit" type="button" aria-label="Sair" title="Sair">↗</button></div>';
    header.querySelector("#unificadoLogout").addEventListener("click", () =>
      document.querySelector("#authLogoutBtn")?.click());
    return header;
  }
  function addSegments() {
    const select = document.querySelector("#relSetor");
    if (!select || select.dataset.unificadoSegments) return;
    select.dataset.unificadoSegments = "1";
    const wrap = element("span", "unificado-segments");
    for (const option of select.options) {
      const button = element("button", "unificado-segment", option.textContent);
      button.type = "button";
      button.dataset.value = option.value;
      button.addEventListener("click", () => {
        select.value = option.value;
        select.dispatchEvent(new Event("change", {bubbles: true}));
        update();
      });
      wrap.append(button);
    }
    select.after(wrap);
  }
  function groupHistory() {
    const list = document.querySelector("#historicoLista");
    if (!list) return;
    const observer = new MutationObserver(() => {
      if (![...list.children].some(child => child.matches("article.item"))) return;
      observer.disconnect();
      list.querySelectorAll(".unificado-date-heading").forEach(node => node.remove());
      let lastDate = "";
      for (const article of list.querySelectorAll(":scope > article.item")) {
        const date = article.querySelector(".item-meta")?.textContent.match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
        if (date && date !== lastDate) {
          article.before(element("h3", "unificado-date-heading", date));
          lastDate = date;
        }
      }
      observer.observe(list, {childList: true});
    });
    observer.observe(list, {childList: true});
  }
  function placeHistoryFilters() {
    const section = document.querySelector("#viewHistorico");
    const controls = section?.querySelector(".desktop-split-left .page-fc, .section-title-row .page-fc");
    const title = section?.querySelector(".section-title-row");
    const left = section?.querySelector(".desktop-split-left");
    if (!controls || !title || !left) return;
    if (desktop() && controls.parentElement !== title) title.append(controls);
    if (!desktop() && controls.parentElement !== left) left.append(controls);
  }
  function recordClientError(code, message) {
    fetch("/unificado/mapa/api/unified/client-errors", {
      method: "POST", credentials: "same-origin", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({screen: location.pathname + location.search, code, message: String(message || "").slice(0, 500)})
    }).catch(() => {});
  }
  function prepareInstall() {
    let promptEvent = null;
    addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      promptEvent = event;
      if (document.querySelector(".unificado-install-button")) return;
      const button = element("button", "unificado-install-button", "Instalar Produção Concrefer");
      button.type = "button";
      button.addEventListener("click", () => {
        const dialog = element("div", "unificado-install-dialog");
        dialog.innerHTML = '<section class="unificado-install-card"><div class="unificado-install-logos" aria-label="Concrefer e ConcreTrack"><img src="/unificado/assets/img/logo-concrefer.png" alt="Concrefer"><img src="/unificado/assets/img/logo-concretrack.png" alt="ConcreTrack"></div><h2>Instalar Produção Concrefer</h2><p>Este aplicativo abre o módulo Produção do sistema unificado.</p><button type="button" data-install>Instalar</button><button type="button" class="secondary" data-close>Cancelar</button></section>';
        dialog.querySelector("[data-close]").addEventListener("click", () => dialog.remove());
        dialog.querySelector("[data-install]").addEventListener("click", async () => { dialog.remove(); await promptEvent.prompt(); promptEvent = null; button.remove(); });
        document.body.append(dialog);
      });
      document.body.append(button);
    });
  }
  function update() {
    if (typeof state === "undefined") return;
    const mode = state.mode || "HUB";
    document.querySelector("#unificadoCrumbScreen").textContent = labels[mode]
      || document.querySelector("#topbarTitle")?.textContent || mode;
    document.querySelectorAll(".unificado-nav-link").forEach(button => {
      button.classList.toggle("is-active", button.dataset.mode === mode);
      button.hidden = button.dataset.mode !== "HUB" &&
        typeof isModeAllowed === "function" && !isModeAllowed(button.dataset.mode);
    });
    const user = state.authUser;
    if (user) {
      document.querySelector("#unificadoUserName").textContent = user.name || user.id;
      document.querySelector("#unificadoUserRole").textContent = user.roleLabel || user.role;
      document.querySelector("#unificadoAvatar").textContent = (user.name || user.id || "U").slice(0, 1).toUpperCase();
    }
    const status = document.querySelector("#syncStatus");
    const pill = document.querySelector(".unificado-sync");
    if (status) {
      document.querySelector("#unificadoSyncText").textContent = status.textContent.trim();
      pill.classList.toggle("is-error", status.classList.contains("sync-error") || status.classList.contains("sync-warn"));
    }
    const select = document.querySelector("#relSetor");
    document.querySelectorAll(".unificado-segment").forEach(button =>
      button.classList.toggle("is-active", button.dataset.value === select?.value));
    document.body.classList.toggle("unificado-desktop", desktop());
    const tabletHub = ENABLE_TABLET_HUB_SHELL
      && matchMedia("(max-width: 1024px)").matches
      && !document.body.classList.contains("kiosk-active")
      && mode === "HUB";
    document.body.classList.toggle("unificado-tablet-hub", tabletHub);
    placeHistoryFilters();
    if (mode === "PROD_ANALISE") loadKgHomem();
  }
  function applyRequestedMode() {
    if (requestedModeApplied || !requestedMode
        || !Object.prototype.hasOwnProperty.call(labels, requestedMode)) return;
    if (typeof state === "undefined" || !state.authUser || typeof setMode !== "function") return;
    if (typeof isModeAllowed === "function" && !isModeAllowed(requestedMode)) {
      requestedModeApplied = true;
      return;
    }
    requestedModeApplied = true;
    setMode(requestedMode);
    update();
  }
  document.addEventListener("DOMContentLoaded", () => {
    prepareInstall();
    const problem = element("a", "unificado-problem-fab", "Relatar problema");
    problem.href = "/unificado/testar/#relatar";
    problem.setAttribute("aria-label", "Relatar problema");
    document.body.append(problem);
    addEventListener("error", event => recordClientError("window.error", event.message));
    addEventListener("unhandledrejection", event => recordClientError("unhandledrejection", event.reason?.message || event.reason));
    document.body.classList.toggle("unificado-menu-collapsed", localStorage.getItem("unificado_menu_collapsed") === "1");
    const shell = document.querySelector("#appShell");
    const main = shell?.querySelector(".app-main");
    if (!shell || !main) return;
    shell.prepend(makeNav());
    main.prepend(makeTopbar());
    addSegments();
    groupHistory();
    setupKgHomem();
    update();
    neutralizeVisibleDatabaseText();
    new MutationObserver(records => records.forEach(record => {
      if (record.type === "characterData") {
        const updated = neutralDatabaseText(record.target.nodeValue);
        if (updated !== record.target.nodeValue) record.target.nodeValue = updated;
      } else {
        record.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            const updated = neutralDatabaseText(node.nodeValue);
            if (updated !== node.nodeValue) node.nodeValue = updated;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            neutralizeVisibleDatabaseText(node);
          }
        });
      }
    })).observe(document.body, {subtree: true, childList: true, characterData: true});
    applyRequestedMode();
    const requestedModeTimer = setInterval(() => {
      applyRequestedMode();
      if (requestedModeApplied) clearInterval(requestedModeTimer);
    }, 100);
    setTimeout(() => clearInterval(requestedModeTimer), 20000);
    new MutationObserver(update).observe(document.querySelector("#topbarTitle"), {childList: true, subtree: true});
    new MutationObserver(update).observe(document.querySelector("#syncStatus"), {childList: true, subtree: true, attributes: true});
    matchMedia("(min-width: 1025px)").addEventListener("change", update);
    setInterval(update, 1500);
  });
})();

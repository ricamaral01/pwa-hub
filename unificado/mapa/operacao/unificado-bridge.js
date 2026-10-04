/* Desktop presentation only. Original Mapa handlers remain responsible for every action. */
(() => {
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
  const desktop = () => matchMedia("(min-width: 1025px)").matches && !document.body.classList.contains("kiosk-active");
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function makeNav() {
    const nav = element("aside", "unificado-sidebar");
    nav.id = "unificadoSidebar";
    const brand = element("div", "unificado-brand");
    brand.innerHTML = '<span class="unificado-brand-icon">C</span><span><strong>Concrefer</strong><small>Planejamento e produção</small></span>';
    nav.append(brand);
    const switcher = element("div", "unificado-switch");
    const planning = element("button", "unificado-switch-btn", "Planejamento");
    planning.type = "button";
    planning.addEventListener("click", () => {
      location.assign("/unificado/pcp/");
    });
    const production = element("button", "unificado-switch-btn is-active", "Produção");
    production.type = "button";
    production.setAttribute("aria-current", "page");
    switcher.append(planning, production);
    nav.append(switcher);
    const scroll = element("nav", "unificado-nav");
    scroll.setAttribute("aria-label", "Menu unificado");
    const home = element("button", "unificado-nav-link", "Início");
    home.type = "button";
    home.dataset.mode = "HUB";
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
        button.prepend(element("span", "unificado-mono", mono));
        button.addEventListener("click", () => setMode(mode));
        group.append(button);
      }
      scroll.append(group);
    }
    nav.append(scroll);
    const test = element("a", "unificado-nav-foot", "Ambiente de teste");
    test.href = "/unificado/testar/";
    nav.append(test);
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
    placeHistoryFilters();
  }
  document.addEventListener("DOMContentLoaded", () => {
    const shell = document.querySelector("#appShell");
    const main = shell?.querySelector(".app-main");
    if (!shell || !main) return;
    shell.prepend(makeNav());
    main.prepend(makeTopbar());
    addSegments();
    groupHistory();
    update();
    new MutationObserver(update).observe(document.querySelector("#topbarTitle"), {childList: true, subtree: true});
    new MutationObserver(update).observe(document.querySelector("#syncStatus"), {childList: true, subtree: true, attributes: true});
    matchMedia("(min-width: 1025px)").addEventListener("change", update);
    setInterval(update, 1500);
  });
})();

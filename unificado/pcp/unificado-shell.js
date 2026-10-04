/* Re-skin existing PCP controls; all page and API functions stay in the original frontend. */
(() => {
  function make(tag, cls, text) {
    const node = document.createElement(tag);
    node.className = cls;
    node.textContent = text;
    return node;
  }
  function makeStandaloneShell() {
    if (document.querySelector("#sidebar") || !location.pathname.includes("/formas-por-setor/")) return;
    const hero = document.querySelector("body>.hero");
    const content = document.querySelector("body>main.wrap");
    if (!hero || !content || typeof MENU_CONFIG === "undefined") return;
    const user = (() => {
      try { return JSON.parse(localStorage.getItem("pcp_user") || "null"); }
      catch { return null; }
    })();
    const role = user?.nivel_acesso || "CONSULTA";
    const sidebar = make("aside", "", "");
    sidebar.id = "sidebar";
    const nav = document.createElement("nav");
    const home = make("a", "nav-link", "Início");
    home.href = "/unificado/";
    home.dataset.page = "IN";
    nav.append(home);
    for (const group of MENU_CONFIG.planejamento.groups) {
      const section = make("div", "nav-group", "");
      if (group.label) section.append(make("div", "nav-group-toggle", group.label));
      for (const item of group.items) {
        const config = MENU_ITEMS[item.id];
        const allowed = role === "ADMIN" || !config.require
          || (role === "PCP" && config.require !== "ADMIN")
          || (role === "PRODUCAO" && config.require === "PRODUCAO");
        if (!allowed) continue;
        const link = make("a", "nav-link" + (item.id === "formasPorSetor" ? " active" : ""), item.label);
        link.href = config.url;
        link.dataset.page = item.id;
        section.append(link);
      }
      if (section.querySelector("a")) nav.append(section);
    }
    sidebar.append(nav);
    const logout = make("button", "unificado-pcp-hidden-logout", "");
    logout.id = "btn-logout";
    logout.type = "button";
    sidebar.append(logout);
    const wrapper = make("div", "", "");
    wrapper.id = "main-content";
    wrapper.append(make("header", "topbar", ""), hero, content);
    document.body.append(sidebar, wrapper);
    document.body.classList.add("unificado-pcp-standalone");
  }
  function apply() {
    makeStandaloneShell();
    const sidebar = document.querySelector("#sidebar");
    const topbar = document.querySelector("#main-content>.topbar");
    if (!sidebar || !topbar) return;
    for (const link of sidebar.querySelectorAll("nav a.nav-link")) {
      if (link.querySelector(".unificado-pcp-mono")) continue;
      const code = (link.dataset.page || "PC").replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase();
      link.prepend(make("span", "unificado-pcp-mono", code));
    }
    if (sidebar.querySelector(".unificado-pcp-brand")) return;
    const brand = make("div", "unificado-pcp-brand", "");
    brand.innerHTML = '<span class="unificado-pcp-brand-icon">C</span><span><strong>Concrefer</strong><small>Planejamento e produção</small></span>';
    sidebar.prepend(brand);
    const switcher = make("div", "unificado-pcp-switch", "");
    const planning = make("button", "unificado-pcp-switch-button is-active", "Planejamento");
    planning.type = "button";
    planning.setAttribute("aria-current", "page");
    const production = make("button", "unificado-pcp-switch-button", "Produção");
    production.type = "button";
    production.addEventListener("click", () => location.assign("/unificado/mapa/operacao/"));
    switcher.append(planning, production);
    sidebar.querySelector("nav")?.before(switcher);
    const title = topbar.querySelector(".page-title")?.textContent.trim() || document.title.split("—")[0].trim();
    const user = typeof API !== "undefined" ? API.getUser() : (() => {
      try { return JSON.parse(localStorage.getItem("pcp_user") || "null"); }
      catch { return null; }
    })();
    const crumb = make("div", "unificado-pcp-crumb", "");
    crumb.innerHTML = '<span>Planejamento</span><span aria-hidden="true">/</span><strong></strong>';
    crumb.querySelector("strong").textContent = title;
    const controls = make("div", "unificado-pcp-top-actions", "");
    controls.innerHTML = '<span class="unificado-pcp-sync"><i></i><span>Aguardando</span></span>'
      + '<span class="unificado-pcp-user"><span class="unificado-pcp-avatar"></span><span><strong></strong><small></small></span></span>'
      + '<button class="unificado-pcp-exit" type="button" aria-label="Sair" title="Sair">↗</button>';
    controls.querySelector(".unificado-pcp-user strong").textContent = user?.nome || user?.username || "Usuário";
    controls.querySelector(".unificado-pcp-user small").textContent = user?.nivel_acesso || "";
    controls.querySelector(".unificado-pcp-avatar").textContent = (user?.nome || "U").slice(0, 1).toUpperCase();
    controls.querySelector(".unificado-pcp-exit").addEventListener("click", () =>
      document.querySelector("#btn-logout")?.click());
    topbar.append(crumb, controls);
    const foot = make("a", "unificado-pcp-test-link", "Ambiente de teste");
    foot.href = "/unificado/testar/";
    sidebar.append(foot);
  }
  document.addEventListener("DOMContentLoaded", () => {
    apply();
    new MutationObserver(apply).observe(document.body, {childList: true, subtree: true});
    window.addEventListener("unificado-pcp-sync", event => {
      const pill = document.querySelector(".unificado-pcp-sync");
      if (!pill) return;
      pill.classList.toggle("is-error", !event.detail);
      pill.querySelector("span").textContent = event.detail ? "Sincronizado" : "Sem conexão";
    });
  });
})();

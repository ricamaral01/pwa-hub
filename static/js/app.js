(function () {
  const config = window.erpTemplateConfig || {};

  async function includeFragment(selector) {
    const node = document.querySelector(selector);
    if (!node) return;
    const source = node.getAttribute("data-include");
    if (!source) return;
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) throw new Error(`Falha ao carregar fragmento: ${source}`);
    node.innerHTML = await response.text();
  }

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node && value) node.textContent = value;
  }

  function setAttr(selector, attr, value) {
    const node = document.querySelector(selector);
    if (node && value) node.setAttribute(attr, value);
  }

  function wireHeader() {
    setText("[data-template-title]", config.appName);
    setText("[data-template-subtitle]", config.appSubtitle);
    setText("[data-template-footer-name]", config.footerName || config.appName);
    setAttr("[data-template-logo]", "src", config.logoPath);
    setAttr("[data-template-home]", "href", config.homeHref);

    const logoutButton = document.querySelector("[data-template-logout]");
    if (logoutButton && typeof config.auth?.logout === "function") {
      logoutButton.hidden = false;
      logoutButton.addEventListener("click", async function () {
        await config.auth.logout();
      });
    }
  }

  function renderModules() {
    const grid = document.getElementById("moduleGrid");
    if (!grid || !Array.isArray(config.modules)) return;

    grid.innerHTML = config.modules.map(function (module) {
      const tone = module.tone || "blue";
      return `
        <article class="card">
          <div class="module-badge module-badge--${tone}">${module.icon || "MD"}</div>
          <h3>${module.title}</h3>
          <p>${module.description}</p>
          <a class="btn btn-secondary" href="${module.href || "#"}">Abrir modulo</a>
        </article>
      `;
    }).join("");
  }

  async function enforceAuth() {
    if (!config.requireAuth) return true;
    if (document.body.dataset.publicPage === "true") return true;
    if (typeof config.auth?.check !== "function") return true;

    try {
      const allowed = await config.auth.check();
      if (!allowed && config.loginPage) {
        window.location.replace(config.loginPage);
        return false;
      }
      return allowed;
    } catch (error) {
      if (config.loginPage) window.location.replace(config.loginPage);
      return false;
    }
  }

  async function init() {
    await Promise.all([
      includeFragment("#headerSlot"),
      includeFragment("#footerSlot"),
    ]);

    wireHeader();
    renderModules();
    await enforceAuth();

    document.dispatchEvent(new CustomEvent("erp-template:ready", { detail: config }));
  }

  document.addEventListener("DOMContentLoaded", init);

  window.erpTemplate = {
    go: function (href) {
      window.location.href = href;
    },
    config,
  };
})();

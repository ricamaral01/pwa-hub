const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "mapa-concretagem/app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "mapa-concretagem/index.html"), "utf8");
const between = (start, end) => app.slice(app.indexOf(start), app.indexOf(end, app.indexOf(start)));

test("arquivos de produção compartilham a versão de publicação", () => {
  const sw = fs.readFileSync(path.join(root, "mapa-concretagem/sw.js"), "utf8");
  const manifest = fs.readFileSync(path.join(root, "mapa-concretagem/manifest.json"), "utf8");
  const reset = fs.readFileSync(path.join(root, "mapa-concretagem/reset-cache.html"), "utf8");
  const version = /mapa-concretagem-(v[\d.]+)/.exec(sw)?.[1];
  assert.equal(version, "v5.29");
  assert.ok(html.includes(`app.js?v=${version}`));
  assert.ok(html.includes(`styles.css?v=${version}`));
  assert.ok(app.includes(`sw.js?v=${version}`));
  assert.ok(sw.includes(`app.js?v=${version}`));
  assert.ok(manifest.includes(`cache-reset=${version}`));
  assert.ok(reset.includes(`abrir ${version}`));
});

test("todos os ícones do hub abrem uma seção", () => {
  const modes = [...html.matchAll(/class="hub-icon-btn(?: hidden)?"[^>]*data-hub-mode="([^"]+)"/g)].map(match => match[1]);
  assert.ok(modes.length >= 18);
  const opened = [];
  const context = vm.createContext({
    el: Object.fromEntries(["libData", "insFiltroData", "mpFiltroData", "relData", "acmpData"].map(id => [id, { value: "2026-10-01" }])),
    setMode: mode => opened.push(mode),
    todayYmd: () => "2026-10-01",
    renderLiberacaoDual: () => {}, renderInspecaoLiberados: () => {},
    renderMontagemPostesLiberados: () => {}, renderHistorico: () => {}, renderAcmpConcretagem: () => {},
  });
  vm.runInContext(between("function handleHubModeNavigation(mode)", "function bindEssentialNavigation()"), context);
  for (const mode of modes) vm.runInContext(`handleHubModeNavigation(${JSON.stringify(mode)})`, context);
  assert.deepEqual(opened, modes);
});

test("os 19 links laterais têm tratamento de clique", () => {
  const navIds = [...html.matchAll(/<button[^>]*class="nav-item[^"]*"[^>]*id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(navIds.length, 19);
  for (const id of navIds) {
    const direct = new RegExp(`el\\.${id}(?:\\?\\.|\\.)addEventListener\\("click"`);
    const local = new RegExp(`(?:const|let) ${id} = document\\.getElementById\\("${id}"\\);[\\s\\S]*?${id}\\.addEventListener\\("click"`);
    const lookup = `document.getElementById("${id}")?.addEventListener("click"`;
    assert.ok(direct.test(app) || local.test(app) || app.includes(lookup), `${id} sem clique`);
  }
});

test("menu lateral abre e fecha em computador e tablet", () => {
  const classes = () => {
    const values = new Set();
    return {
      contains: value => values.has(value),
      add: value => values.add(value),
      remove: value => values.delete(value),
      toggle(value, force) {
        const next = force === undefined ? !values.has(value) : force;
        if (next) values.add(value); else values.delete(value);
        return next;
      },
    };
  };
  const element = () => ({ classList: classes(), events: {}, attrs: {},
    addEventListener(event, callback) { this.events[event] = callback; },
    setAttribute(name, value) { this.attrs[name] = value; },
  });
  const appSidebar = element(), sidebarOverlay = element(), sidebarToggle = element();
  const body = { classList: classes() };
  const storage = new Map();
  const context = vm.createContext({
    state: { essentialNavigationBound: false }, window: { innerWidth: 1366 },
    document: {
      body,
      getElementById: id => ({ appSidebar, sidebarOverlay, sidebarToggle })[id],
      querySelectorAll: () => [],
    },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
  });
  vm.runInContext(between("function bindEssentialNavigation()", "function bindEvents()"), context);
  context.bindEssentialNavigation();
  sidebarToggle.events.click();
  assert.equal(body.classList.contains("sidebar-hidden"), true);
  assert.equal(sidebarToggle.attrs["aria-expanded"], "false");
  sidebarToggle.events.click();
  assert.equal(body.classList.contains("sidebar-hidden"), false);
  context.window.innerWidth = 800;
  sidebarToggle.events.click();
  assert.equal(appSidebar.classList.contains("sidebar-open"), true);
  assert.equal(sidebarOverlay.classList.contains("visible"), true);
  sidebarOverlay.events.click();
  assert.equal(appSidebar.classList.contains("sidebar-open"), false);
  assert.equal(sidebarToggle.attrs["aria-expanded"], "false");
});

test("foto do checklist abre em visualização interna", () => {
  const children = [];
  const document = {
    querySelector: () => null,
    createElement: tag => ({ tag, src: "", children: [], append(...items) { this.children.push(...items); }, addEventListener() {} }),
    body: { appendChild: item => children.push(item) },
  };
  const context = vm.createContext({ window: {}, document });
  vm.runInContext(between("window.abrirFotoVisualizacao =", "window.abrirVisualizacaoChecklist ="), context);
  context.window.abrirFotoVisualizacao("data:image/png;base64,AAAA");
  assert.equal(children.length, 1);
  assert.equal(children[0].children[0].src, "data:image/png;base64,AAAA");
});

test("segunda inspeção grava segregação ou aprovação com retrabalho sem mudar os códigos de métricas", async () => {
  const block = between("  // Segunda inspeção: o código R permanece", "  // Render global photos");
  assert.ok(block.includes(".maybeSingle()"));

  for (const [resultado, statusEsperado] of [["SEGREGADO", "R"], ["APROVADO_RETRABALHADO", "RR"]]) {
    const writes = [];
    const localDb = { postes: { "poste-1": {} } };
    const messages = [];
    const makeElement = () => ({
      children: [], listeners: {}, className: "", disabled: false,
      appendChild(child) { this.children.push(child); },
      addEventListener(event, callback) { this.listeners[event] = callback; },
      querySelectorAll() { return this.children; },
      classList: { remove() {} },
    });
    const container = makeElement();
    const context = vm.createContext({
      document: { createElement: makeElement }, container,
      normRow: { id: "poste-1", status_montagem: "R", finalizado_em: "2026-10-01T18:00:00Z", etapa: "INSPECAO" },
      checklists: { visual: { item: "nao" } },
      state: { authUser: { name: "Inspetor" } },
      nowIso: () => "2026-10-01T20:00:00Z", formatDateTime: value => value,
      isModeAllowed: () => true,
      supabaseClient: { from(table) {
        assert.equal(table, "montagem_poste");
        return { update(payload) {
          const query = {
            eq(field, value) { writes.push({ field, value }); return query; },
            select() { return query; },
            async maybeSingle() { writes.push({ payload }); return { data: { id: "poste-1" }, error: null }; },
          };
          return query;
        } };
      } },
      readMontagemPostesDb: () => localDb, writeMontagemPostesDb: () => {},
      localStorage: {}, MAPA_REPORT_CACHE_PREFIX: "cache",
      modal: makeElement(), showMsgBox: (message, kind) => messages.push({ message, kind }),
      renderInspecaoLiberados: async () => {}, renderMontagemPostesLiberados: async () => {},
      console,
    });
    vm.runInContext(`globalThis.renderSecond = async () => {${block}}`, context);
    await context.renderSecond();
    const actions = container.children[0].children.find(child => child.className === "vc-second-inspection-actions");
    assert.ok(actions);
    const button = actions.children.find(child => child.textContent === (resultado === "SEGREGADO" ? "Segregado" : "Aprovado e Retrabalhado"));
    await button.listeners.click();
    const payload = writes.find(write => write.payload).payload;
    assert.equal(payload.status_montagem, statusEsperado);
    assert.equal(payload.checklists.__segunda_inspecao.resultado, resultado);
    assert.equal(localDb.postes["poste-1"].statusMontagem, statusEsperado);
    assert.ok(messages.some(message => message.kind === "success"));
  }
});

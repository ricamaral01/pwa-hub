const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../mapa-concretagem-teste/app.js"), "utf8");
const start = source.indexOf('const SAQUE_MANDRIL_API =');
const end = source.indexOf('async function carregarMandrilCircular()', start);
const actionsEnd = source.indexOf('async function gerarRelatorioSetor()', end);
assert.ok(start > 0 && end > start && actionsEnd > end);

function setup(initialStorage = {}, initialRows = []) {
  const storage = new Map(Object.entries(initialStorage));
  const calls = [];
  let rows = initialRows;
  let failPost = false;
  const context = vm.createContext({
    URLSearchParams, Date, console,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    normalizeForma: forma => String(forma || "").toUpperCase().replace(/^SC0+/, "SC"),
    document: { hidden: true, getElementById: () => null },
    el: { mcFiltroData: { value: "2026-10-01" } },
    window: {},
    setInterval: () => {},
    showMsgBox: () => {},
    carregarMandrilCircular: () => {},
    fetch: async (url, options = {}) => {
      calls.push({ url, options });
      if (options.method === "POST" && failPost) return { ok: false, status: 500 };
      if (url.endsWith("/importar")) {
        rows = rows.concat(JSON.parse(options.body).registros);
        return { ok: true };
      }
      if (options.method === "POST") {
        rows = rows.concat(JSON.parse(options.body));
        return { ok: true };
      }
      if (options.method === "DELETE") {
        const query = new URL(url).searchParams;
        rows = rows.filter(row => row.codigo_forma !== query.get("codigo_forma"));
        return { ok: true };
      }
      return { ok: true, json: async () => rows };
    },
  });
  vm.runInContext(source.slice(start, end) + source.slice(source.indexOf('window.registrarSaque =', end), actionsEnd), context);
  return { context, calls, storage, setFailPost: value => { failPost = value; } };
}

test("consulta o banco e normaliza SC01 para a chave exibida na tabela", async () => {
  const { context } = setup({}, [{ data: "2026-10-01", codigo_forma: "SC01", data_hora_saque: "2026-10-01T21:38:53Z" }]);
  const saques = await vm.runInContext('buscarSaquesMandril("2026-10-01")', context);
  assert.equal(saques["2026-10-01||SC1"], "2026-10-01T21:38:53Z");
  assert.match(vm.runInContext('renderAcaoSaqueMandril("SC01", "2026-10-01T21:38:53Z")', context), /Saque: \d{2}:\d{2}/);
});

test("importa saque antigo ausente uma só vez, sem recriá-lo após remoção remota", async () => {
  const local = { "2026-10-01||SC2": "2026-10-01T21:38:53Z" };
  const { context, calls } = setup({ pwa_saque_mandril_v1: JSON.stringify(local) });
  const first = await vm.runInContext('sincronizarSaquesMandrilLocais("2026-10-01", {})', context);
  assert.equal(first["2026-10-01||SC2"], local["2026-10-01||SC2"]);
  await vm.runInContext('sincronizarSaquesMandrilLocais("2026-10-01", {})', context);
  assert.equal(calls.filter(call => call.url.endsWith("/importar")).length, 1);
});

test("falha no banco não confirma um novo saque no aparelho", async () => {
  const { context, storage, setFailPost } = setup();
  setFailPost(true);
  await vm.runInContext('window.registrarSaque("SC03")', context);
  assert.equal(storage.get("pwa_saque_mandril_v1"), undefined);
});

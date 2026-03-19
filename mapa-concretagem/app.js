const STORAGE_KEY = "pwa_liberacao_inspecao_v1";
const SUBMIT_LOCKS_KEY = "pwa_liberacao_submit_locks_v1";
const CLICKED_FORMS_KEY = "pwa_formas_clicadas_hoje";

function getClickedFormsToday() {
  const raw = localStorage.getItem(CLICKED_FORMS_KEY);
  if (!raw) return { dia: "", formas: {} };
  try {
    const parsed = JSON.parse(raw);
    const hoje = new Date().toLocaleDateString("pt-BR");
    if (parsed.dia !== hoje) return { dia: hoje, formas: {} };
    return parsed;
  } catch { return { dia: "", formas: {} }; }
}

function markFormaClicked(forma, setor) {
  const data = getClickedFormsToday();
  data.dia = new Date().toLocaleDateString("pt-BR");
  const key = setor + "||" + normalizeUpper(forma);
  data.formas[key] = true;
  localStorage.setItem(CLICKED_FORMS_KEY, JSON.stringify(data));
}

function isFormaClicked(forma, setor) {
  const data = getClickedFormsToday();
  const key = setor + "||" + normalizeUpper(forma);
  return !!data.formas[key];
}
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbx83KmaFs3O3_RqfThs_0SCnaMBc3mb-RP30QKvtfJuEfnqft4eaFQVgYwuHxx3F-RttQ/exec"
};

const CHECKLIST_INSPECAO_CODIGOS = [
  { codigo: "A", descricao: "Falha na Concretagem" },
  { codigo: "B", descricao: "Cano entupido" },
  { codigo: "C", descricao: "Excesso de Bolhas" },
  { codigo: "D", descricao: "Problema na caixa do Relógio ou Disjuntor" },
  { codigo: "E", descricao: "Furos Obstruídos ou Faltando" },
  { codigo: "F", descricao: "Identificação do poste (Carimbos)" },
  { codigo: "G", descricao: "Presença de Trincas" },
  { codigo: "H", descricao: "Bolha nas caixas" },
  { codigo: "I", descricao: "Trincas em toda a extensão do Poste" },
  { codigo: "J", descricao: "Pequenas Avarias" },
  { codigo: "K", descricao: "Manchas Brancas Superficiais" },
  { codigo: "L", descricao: "Buchas das cxs e/ou Buchas fixação abraç. EDP" },
  { codigo: "M", descricao: "Parafuso Lacre da caixa do Medidor" }
];

const SETOR_1_LEFT_FORMS = [
  { forma: "IE-01", modelo: "3 CXS VL" },
  { forma: "BD-01", modelo: "1 CX VL" },
  { forma: "BD-02", modelo: "1 CX VL" },
  { forma: "BD-03", modelo: "1 CX VL" },
  { forma: "BD-04", modelo: "1 CX VL" },
  { forma: "BD-05", modelo: "1 CX VL" },
  { forma: "BD-06", modelo: "1 CX VL" },
  { forma: "BD-07", modelo: "1 CX VL" },
  { forma: "BD-08", modelo: "1 CX VL" },
  { forma: "BD-09", modelo: "1 CX VL" },
  { forma: "BD-10", modelo: "1 CX VL" },
  { forma: "BD-11", modelo: "1 CX VL" },
  { forma: "BD-12", modelo: "1 CX VL" },
  { forma: "BD-13", modelo: "1 CX VL" },
  { forma: "BD-14", modelo: "1 CX VL" },
  { forma: "BD-15", modelo: "1 CX VL" },
  { forma: "AE-27", modelo: "1 CX VR" },
  { forma: "AE-26", modelo: "1 CX VR" },
  { forma: "AE-25", modelo: "1 CX VR" },
  { forma: "AE-24", modelo: "1 CX VR" },
  { forma: "AE-23", modelo: "1 CX VR" },
  { forma: "AE-22", modelo: "1 CX VR" },
  { forma: "AE-21", modelo: "1 CX VR" },
  { forma: "AE-20", modelo: "1 CX VR" },
  { forma: "AE-19", modelo: "1 CX VR" },
  { forma: "AE-18", modelo: "1 CX VR" },
  { forma: "AE-17", modelo: "1 CX VR" },
  { forma: "AE-16", modelo: "1 CX VR" },
  { forma: "AE-15", modelo: "1 CX VR" },
  { forma: "AE-14", modelo: "1 CX VR" },
  { forma: "AE-13", modelo: "1 CX VR" },
  { forma: "AE-12", modelo: "1 CX VR" },
  { forma: "AE-11", modelo: "1 CX VR" },
  { forma: "AE-10", modelo: "1 CX VR" },
  { forma: "AE-09", modelo: "1 CX VR" },
  { forma: "AE-08", modelo: "1 CX VR" },
  { forma: "AE-07", modelo: "1 CX VR" },
  { forma: "AE-06", modelo: "1 CX VR" },
  { forma: "AE-05", modelo: "1 CX VR" },
  { forma: "AE-04", modelo: "1 CX VR" },
  { forma: "AE-03", modelo: "1 CX VR" },
  { forma: "AE-02", modelo: "1 CX VR" },
  { forma: "AE-01", modelo: "1 CX VR" },
  { forma: "100-1", modelo: "SUB. 100-AMP" },
  { forma: "100-2", modelo: "SUB. 100-AMP" },
  { forma: "100-3", modelo: "SUB. 100-AMP" }
];

const SETOR_1_RIGHT_FORMS = [
  { forma: "L-01", modelo: "4 CXS VR" },
  { forma: "L-02", modelo: "4 CXS VR" },
  { forma: "J-01", modelo: "4 CXS VR" },
  { forma: "H-01", modelo: "3 CXS VR" },
  { forma: "H-02", modelo: "3 CXS VR" },
  { forma: "P-01", modelo: "Ec. 3 CXS" },
  { forma: "P-02", modelo: "Ec. 3 CXS" },
  { forma: "BE-04", modelo: "1 CX VL" },
  { forma: "BE-03", modelo: "1 CX VL" },
  { forma: "BE-02", modelo: "1 CX VL" },
  { forma: "BE-01", modelo: "1 CX VL" },
  { forma: "G-01", modelo: "Ec. 2 CXS VR" },
  { forma: "G-02", modelo: "Ec. 2 CXS VR" },
  { forma: "G-03", modelo: "Ec. 2 CXS VR" },
  { forma: "G-04", modelo: "Ec. 2 CXS VR" },
  { forma: "G-05", modelo: "Ec. 2 CXS VR" },
  { forma: "E-01", modelo: "Ec. 1 CX VR" },
  { forma: "E-02", modelo: "Ec. 1 CX VR" },
  { forma: "E-03", modelo: "Ec. 1 CX VR" },
  { forma: "E-04", modelo: "Ec. 1 CX VR" },
  { forma: "E-05", modelo: "Ec. 1 CX VR" },
  { forma: "E-06", modelo: "Ec. 1 CX VR" },
  { forma: "D-03", modelo: "2 CXS VL" },
  { forma: "D-04", modelo: "2 CXS VL" },
  { forma: "D-05", modelo: "2 CXS VL" },
  { forma: "D-06", modelo: "2 CXS VL" },
  { forma: "D-07", modelo: "2 CXS VL" },
  { forma: "M-01", modelo: "1 CX VR - 600" },
  { forma: "CE-13", modelo: "2 CXS VR" },
  { forma: "CE-12", modelo: "2 CXS VR" },
  { forma: "CE-11", modelo: "2 CXS VR" },
  { forma: "CE-10", modelo: "2 CXS VR" },
  { forma: "CE-09", modelo: "2 CXS VR" },
  { forma: "CE-05", modelo: "2 CXS VR" },
  { forma: "CE-04", modelo: "2 CXS VR" },
  { forma: "CE-03", modelo: "2 CXS VR" },
  { forma: "100-4", modelo: "SUB. 100 AMP." },
  { forma: "100-5", modelo: "SUB. 100 AMP." },
  { forma: "SB-E1", modelo: "SUB. 100-AMP-E" },
  { forma: "100-6", modelo: "SUB. 100 AMP." },
  { forma: "200-1", modelo: "SUB. 200-AMP C/ TC" },
  { forma: "200-2", modelo: "SUB. 200-AMP C/ TC" },
  { forma: "DE-03", modelo: "2 CXS VL" },
  { forma: "DE-02", modelo: "2 CXS VL" },
  { forma: "DE-01", modelo: "2 CXS VL" }
];

const SETOR_2_LEFT_FORMS = [
  { forma: "300-VL", modelo: "2 CXS VL" },
  { forma: "300-VR", modelo: "2 CXS VR" },
  { forma: "PL - 2", modelo: "7,5x300 c/ Lente" },
  { forma: "PL - 1", modelo: "7,5x300 c/ Lente" },
  { forma: "A-28", modelo: "1 CX VR" },
  { forma: "A-85", modelo: "1 CX VR" },
  { forma: "A-10", modelo: "1 CX VR" },
  { forma: "A-36", modelo: "1 CX VR" },
  { forma: "A-82", modelo: "1 CX VR" },
  { forma: "A-22", modelo: "1 CX VR" },
  { forma: "A-11", modelo: "1 CX VR" },
  { forma: "ESTOQ", modelo: "ESTOQUE" },
  { forma: "A-52", modelo: "1 CX VR" },
  { forma: "A-70", modelo: "1 CX VR" },
  { forma: "A-83", modelo: "1 CX VR" },
  { forma: "A-18", modelo: "1 CX VR" },
  { forma: "A-42", modelo: "1 CX VR" },
  { forma: "A-54", modelo: "1 CX VR" },
  { forma: "A-31", modelo: "1 CX VR" },
  { forma: "A-63", modelo: "1 CX VR" },
  { forma: "A-62", modelo: "1 CX VR" },
  { forma: "A-61", modelo: "1 CX VR" },
  { forma: "A-60", modelo: "1 CX VR" },
  { forma: "A-14", modelo: "1 CX VR" },
  { forma: "A-58", modelo: "1 CX VR" },
  { forma: "A-57", modelo: "1 CX VR" },
  { forma: "A-30", modelo: "1 CX VR" },
  { forma: "A-55", modelo: "1 CX VR" },
  { forma: "A-02", modelo: "1 CX VR" },
  { forma: "A-03", modelo: "1 CX VR" },
  { forma: "B-22", modelo: "1 CX VL" },
  { forma: "B-21", modelo: "1 CX VL" },
  { forma: "B-08", modelo: "1 CX VL" },
  { forma: "B-09", modelo: "1 CX VL" },
  { forma: "B-07", modelo: "1 CX VL" },
  { forma: "B-20", modelo: "1 CX VL" },
  { forma: "B-10", modelo: "1 CX VL" },
  { forma: "B-17", modelo: "1 CX VL" },
  { forma: "B-14", modelo: "1 CX VL" },
  { forma: "B-05", modelo: "1 CX VL" },
  { forma: "B-16", modelo: "1 CX VL" },
  { forma: "B-15", modelo: "1 CX VL" }
];

const SETOR_2_RIGHT_FORMS = [
  { forma: "TCL-1", modelo: "600-VL" },
  { forma: "TCL-2", modelo: "600-VL" },
  { forma: "TCR-4", modelo: "600-VR" },
  { forma: "TCR-3", modelo: "600-VR" },
  { forma: "TCR-2", modelo: "600-VR" },
  { forma: "TCR-1", modelo: "600-VR" },
  { forma: "A-23", modelo: "1 CX VR" },
  { forma: "A-17", modelo: "1 CX VR" },
  { forma: "A-35", modelo: "1 CX VR" },
  { forma: "A-24", modelo: "1 CX VR" },
  { forma: "A-59", modelo: "1 CX VR" },
  { forma: "A-33", modelo: "1 CX VR" },
  { forma: "A-07", modelo: "1 CX VR" },
  { forma: "A-05", modelo: "1 CX VR" },
  { forma: "A-06", modelo: "1 CX VR" },
  { forma: "A-16", modelo: "1 CX VR" },
  { forma: "A-43", modelo: "1 CX VR" },
  { forma: "A-32", modelo: "1 CX VR" },
  { forma: "A-84", modelo: "1 CX VR" },
  { forma: "A-19", modelo: "1 CX VR" },
  { forma: "A-15", modelo: "1 CX VR" },
  { forma: "A-12", modelo: "1 CX VR" },
  { forma: "A-38", modelo: "1 CX VR" },
  { forma: "A-39", modelo: "1 CX VR" },
  { forma: "A-44", modelo: "1 CX VR" },
  { forma: "A-45", modelo: "1 CX VR" },
  { forma: "A-48", modelo: "1 CX VR" },
  { forma: "C-03", modelo: "2 CXS VR" },
  { forma: "C-14", modelo: "2 CXS VR" },
  { forma: "C-16", modelo: "2 CXS VR" },
  { forma: "C-18", modelo: "2 CXS VR" },
  { forma: "C-11", modelo: "2 CXS VR" },
  { forma: "C-19", modelo: "2 CXS VR" },
  { forma: "C-20", modelo: "2 CXS VR" },
  { forma: "C-21", modelo: "2 CXS VR" },
  { forma: "C-22", modelo: "2 CXS VR" },
  { forma: "C-23", modelo: "2 CXS VR" },
  { forma: "C-12", modelo: "2 CXS VR" },
  { forma: "C-25", modelo: "2 CXS VR" }
];

const SECTOR_FORMS = {
  "Setor 1": { left: SETOR_1_LEFT_FORMS, right: SETOR_1_RIGHT_FORMS },
  "Setor 2": { left: SETOR_2_LEFT_FORMS, right: SETOR_2_RIGHT_FORMS }
};

function getSectorForms(setor) {
  return SECTOR_FORMS[setor] || SECTOR_FORMS["Setor 2"];
}

const state = {
  mode: "HUB",
  libPhotos: [],
  insPhotos: [],
  isSendingLiberacao: false,
  isSendingInspecao: false,
  submitLocks: readSubmitLocks()
};

const el = {
  backMain: document.getElementById("btnBackMain"),
  backButtons: Array.from(document.querySelectorAll("[data-back-btn]")),
  hubView: document.getElementById("viewHub"),
  hubLiberacao: document.getElementById("hubLiberacao"),
  hubInspecao: document.getElementById("hubInspecao"),
  hubRelatorio: document.getElementById("hubRelatorio"),
  hubHistorico: document.getElementById("hubHistorico"),
  hubAcompanhamento: document.getElementById("hubAcompanhamento"),
  viewLiberacao: document.getElementById("viewLiberacao"),
  viewInspecao: document.getElementById("viewInspecao"),
  viewRelatorio: document.getElementById("viewRelatorio"),
  viewHistorico: document.getElementById("viewHistorico"),
  viewAcompanhamento: document.getElementById("viewAcompanhamento"),
  syncStatus: document.getElementById("syncStatus"),

  libData: document.getElementById("libData"),
  libColaborador: document.getElementById("libColaborador"),
  libFeedback: document.getElementById("libFeedback"),
  sheetSetorLabel: document.getElementById("sheetSetorLabel"),
  sheetLeftBody: document.getElementById("sheetLeftBody"),
  sheetRightBody: document.getElementById("sheetRightBody"),
  btnLimparFormas: document.getElementById("btnLimparFormas"),

  insFiltroData: document.getElementById("insFiltroData"),
  insModoCarga: document.getElementById("insModoCarga"),
  insSetor: document.getElementById("insSetor"),
  insColaborador: document.getElementById("insColaborador"),
  insCarregarLiberados: document.getElementById("insCarregarLiberados"),
  insLiberadosBody: document.getElementById("insLiberadosBody"),
  insQtdItens: document.getElementById("insQtdItens"),
  insChecklistCodigos: document.getElementById("insChecklistCodigos"),
  insObs: document.getElementById("insObs"),
  insFotos: document.getElementById("insFotos"),
  insFotosPreview: document.getElementById("insFotosPreview"),
  salvarInspecao: document.getElementById("salvarInspecao"),

  histData: document.getElementById("histData"),
  histTipo: document.getElementById("histTipo"),
  histForma: document.getElementById("histForma"),
  dashData: document.getElementById("dashData"),
  atualizarDashboard: document.getElementById("atualizarDashboard"),
  dashSetor1Count: document.getElementById("dashSetor1Count"),
  dashSetor2Count: document.getElementById("dashSetor2Count"),
  dashTotalCount: document.getElementById("dashTotalCount"),
  dashSetor1Meta: document.getElementById("dashSetor1Meta"),
  dashSetor2Meta: document.getElementById("dashSetor2Meta"),
  dashBarSetor1: document.getElementById("dashBarSetor1"),
  dashBarSetor2: document.getElementById("dashBarSetor2"),
  dashBarSetor1Label: document.getElementById("dashBarSetor1Label"),
  dashBarSetor2Label: document.getElementById("dashBarSetor2Label"),
  dashStatus: document.getElementById("dashStatus"),
  filtrarHistorico: document.getElementById("filtrarHistorico"),
  historicoLista: document.getElementById("historicoLista"),
  relData: document.getElementById("relData"),
  relSetor: document.getElementById("relSetor"),
  relEncarregado: document.getElementById("relEncarregado"),
  gerarRelatorioSetor: document.getElementById("gerarRelatorioSetor"),
  relatorioSetorOutput: document.getElementById("relatorioSetorOutput")
};

function nowIso() {
  return new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T");
}

function uuid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 999999)}`;
}

function todayYmd() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

function normalizeUpper(text) {
  return String(text || "").trim().toUpperCase();
}

function dateToYmd(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())) return String(value).trim();
  const d = new Date(String(value));
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  }
  return String(value).trim();
}

function readDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { records: [], events: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      records: Array.isArray(parsed.records) ? parsed.records : [],
      events: Array.isArray(parsed.events) ? parsed.events : []
    };
  } catch {
    return { records: [], events: [] };
  }
}

function readSubmitLocks() {
  const raw = localStorage.getItem(SUBMIT_LOCKS_KEY);
  if (!raw) return { liberacao: "", inspecao: "" };
  try {
    const parsed = JSON.parse(raw);
    return {
      liberacao: typeof parsed.liberacao === "string" ? parsed.liberacao : "",
      inspecao: typeof parsed.inspecao === "string" ? parsed.inspecao : ""
    };
  } catch {
    return { liberacao: "", inspecao: "" };
  }
}

function writeSubmitLocks(submitLocks) {
  localStorage.setItem(SUBMIT_LOCKS_KEY, JSON.stringify(submitLocks));
}

function payloadToken(payload) {
  return JSON.stringify(payload);
}

function setSubmitButtonState(button, isLoading) {
  if (!button) return;
  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent || "Salvar";
  }
  button.disabled = isLoading;
  button.textContent = isLoading ? "Enviando..." : button.dataset.originalText;
}

function clearSubmitLock(type) {
  if (!state.submitLocks[type]) return;
  state.submitLocks[type] = "";
  writeSubmitLocks(state.submitLocks);
}

function setSubmitLock(type, token) {
  state.submitLocks[type] = token;
  writeSubmitLocks(state.submitLocks);
}

function writeDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function addEvent(db, event) {
  db.events.push(event);
}

function upsertRecord(db, record) {
  const idx = db.records.findIndex((r) => r.id === record.id);
  if (idx === -1) db.records.push(record);
  else db.records[idx] = record;
}

function hasApiConfigured() {
  return CONFIG.API_URL && CONFIG.API_URL.startsWith("https://script.google.com/");
}

function setSyncStatus(kind, message) {
  if (!el.syncStatus) return;
  el.syncStatus.className = "sync-status";
  if (kind === "ok") el.syncStatus.classList.add("sync-ok");
  if (kind === "warn") el.syncStatus.classList.add("sync-warn");
  if (kind === "error") el.syncStatus.classList.add("sync-error");
  if (kind === "pending") el.syncStatus.classList.add("sync-pending");
  el.syncStatus.textContent = message;
}

async function checkApiStatus() {
  if (!hasApiConfigured()) {
    setSyncStatus("warn", "API não configurada: salvando apenas localmente.");
    return;
  }

  try {
    const resp = await fetch(`${CONFIG.API_URL}?action=status`);
    const text = await resp.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      setSyncStatus("error", "API respondeu formato inválido.");
      return;
    }

    if (data && data.ok) {
      setSyncStatus("ok", "Conectado com planilha: sincronização online ativa.");
    } else {
      setSyncStatus("error", "Falha ao verificar API da planilha.");
    }
  } catch {
    setSyncStatus("error", "Sem conexão com API da planilha no momento.");
  }
}

async function postToApi(action, payload) {
  if (!hasApiConfigured()) {
    return { ok: false, skipped: true, error: "API não configurada" };
  }

  const body = new URLSearchParams();
  body.set("action", action);
  body.set("payload", JSON.stringify(payload));

  try {
    const response = await fetch(CONFIG.API_URL, {
      method: "POST",
      body
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, error: "Resposta inválida do servidor", raw: text };
    }
  } catch (error) {
    return { ok: false, error: `Falha de rede: ${String(error)}` };
  }
}

function formatDateTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pt-BR");
}

function statusFluxoFromRecord(record) {
  if (!record.liberacao) return "SEM_LIBERACAO";
  if (!record.inspecoes || record.inspecoes.length === 0) return "PENDENTE_INSPECAO";
  const last = record.inspecoes[record.inspecoes.length - 1];
  if (last.status === "A") return "CONCLUIDO_APROVADO";
  if (last.status === "RR") return "CONCLUIDO_RETRABALHO";
  return "CONCLUIDO_REPROVADO";
}

function findRecordByKey(db, dataFabricacao, setor, formaNumero) {
  return db.records.find(
    (record) => record.dataFabricacao === dataFabricacao && record.setor === setor && record.formaNumero === formaNumero
  );
}

function getInspecaoResumo(record) {
  if (!record || !Array.isArray(record.inspecoes) || !record.inspecoes.length) return { status: "", cod: "" };
  const ultima = record.inspecoes[record.inspecoes.length - 1];
  const cod = Array.isArray(ultima.codigos) ? ultima.codigos.join("/") : "";
  return { status: ultima.status || "", cod };
}

function statusFlagsFromCode(statusCodigo) {
  return {
    liberado: statusCodigo === "1" ? 1 : 0,
    naoMontado: statusCodigo === "D" ? 1 : 0,
    manutencao: statusCodigo === "M" ? 1 : 0
  };
}

function getLiberacaoSelectOptions(selectedStatus) {
  const status = selectedStatus || "";
  return `
    <div class="lib-actions" data-lib-actions>
      <input type="hidden" data-lib-status value="${status}">
      <button type="button" class="lib-btn ${status === "1" ? "active btn-liberado" : ""}" data-lib-btn="1">Liberado</button>
      <button type="button" class="lib-btn ${status === "D" ? "active btn-nao" : ""}" data-lib-btn="D">Não montado</button>
      <button type="button" class="lib-btn ${status === "M" ? "active btn-manut" : ""}" data-lib-btn="M">Manutenção</button>
    </div>
  `;
}

function renderInspecaoCodigosChecklist() {
  el.insChecklistCodigos.innerHTML = "";
  CHECKLIST_INSPECAO_CODIGOS.forEach((item) => {
    const row = document.createElement("div");
    row.className = "check-row";
    row.innerHTML = `<span><strong>${item.codigo}</strong> — ${item.descricao}</span>`;
    el.insChecklistCodigos.appendChild(row);
  });
}

function renderPhotoPreview(container, photos) {
  container.innerHTML = "";
  photos.forEach((photo) => {
    const img = document.createElement("img");
    img.className = "thumb";
    img.src = photo.dataUrl;
    img.alt = photo.name || "foto";
    container.appendChild(img);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl, maxWidth, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
      const width = Math.round(img.width * ratio);
      const height = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

async function filesToCompressedDataUrls(fileList) {
  const files = Array.from(fileList || []);
  const out = [];
  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    const compressed = await compressImage(dataUrl, 1280, 0.72);
    out.push({ id: uuid(), name: file.name, type: file.type, dataUrl: compressed });
  }
  return out;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function buildFormaRange(prefix, start, end) {
  const out = [];
  const step = start <= end ? 1 : -1;
  for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
    out.push(`${prefix}${pad2(i)}`);
  }
  return out;
}

function mapCatalogByForma(catalog) {
  const map = new Map();
  (catalog || []).forEach((item) => {
    map.set(normalizeUpper(item.forma), item);
  });
  return map;
}

function resolveFormasFromCatalog(catalog, formas) {
  const map = mapCatalogByForma(catalog);
  return formas.map((forma) => map.get(normalizeUpper(forma))).filter(Boolean);
}

function buildSetor1LeftBlocks(catalog) {
  const block1 = ["100-3", "100-2", "100-1", ...buildFormaRange("AE-", 1, 11)];
  const block2 = buildFormaRange("AE-", 12, 25);
  const block3 = ["AE-26", "AE-27", ...buildFormaRange("BD-", 15, 1), "IE-01"];

  return [
    resolveFormasFromCatalog(catalog, block1),
    resolveFormasFromCatalog(catalog, block2),
    resolveFormasFromCatalog(catalog, block3)
  ];
}

function buildSetor1RightBlocks(catalog) {
  const bottomUp = Array.isArray(catalog) ? [...catalog].reverse() : [];
  return [
    bottomUp.slice(0, 14),
    bottomUp.slice(14, 28),
    bottomUp.slice(28)
  ];
}

function createFormaButton(item, setor) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "lib-btn";
  const setBtnLabel = (done = false) => {
    const check = done ? " ✓" : "";
    btn.innerHTML = `<span class="lib-btn-model">${item.modelo || "-"}</span> <span class="lib-btn-forma">${item.forma}${check}</span>`;
  };
  setBtnLabel(false);
  btn.dataset.formaNumero = normalizeUpper(item.forma);
  btn.dataset.modelo = item.modelo;

  if (setor && isFormaClicked(item.forma, setor)) {
    btn.classList.add("active", "btn-liberado");
    setBtnLabel(true);
    btn.disabled = true;
  } else {
    btn.addEventListener("click", () => {
      salvarFormaClicada(item.forma, setor, btn);
    });
  }

  return btn;
}

function createLiberacaoRow(item, setor) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="lib-cell"></td>
    <td>${item.modelo || ""}</td>
    <td class="ins-related">-</td>
    <td class="ins-related">-</td>
  `;
  const formaCell = tr.querySelector("td.lib-cell");
  const btn = createFormaButton(item, setor);
  if (setor && isFormaClicked(item.forma, setor)) {
    tr.classList.add("row-liberada");
  }
  formaCell.appendChild(btn);
  return tr;
}

async function getSetorRowsByDate(setor, dataFabricacao) {
  if (!hasApiConfigured() || !dataFabricacao || !setor) return [];

  try {
    const url = `${CONFIG.API_URL}?action=relatorio_setor&dataFabricacao=${encodeURIComponent(dataFabricacao)}&setor=${encodeURIComponent(setor)}`;
    const response = await fetch(url);
    const text = await response.text();
    const payload = JSON.parse(text);
    if (payload.ok && Array.isArray(payload.rows)) return payload.rows;
  } catch {
    // Usa catalogo local quando a API nao responder.
  }
  return [];
}

async function getSectorFormsForLiberacao(setor) {
  const forms = getSectorForms(setor);
  return forms;
}

function renderSheetBlocks(blocks, container, setor, labels = []) {
  container.innerHTML = "";
  container.classList.add("forma-grid-blocos");

  blocks.forEach((blockItems, index) => {
    const blockWrap = document.createElement("div");
    blockWrap.className = "forma-block-wrap";

    const divider = document.createElement("div");
    divider.className = "forma-block-divider";
    divider.textContent = labels[index] || `Bloco ${index + 1}`;

    const block = document.createElement("div");
    block.className = "forma-block";
    (blockItems || []).forEach((item) => {
      block.appendChild(createFormaButton(item, setor));
    });

    blockWrap.appendChild(divider);
    blockWrap.appendChild(block);
    container.appendChild(blockWrap);
  });
}

function renderSheetSide(items, container, options = {}) {
  const setor = el.libSetor?.value || "";
  container.innerHTML = "";
  container.classList.remove("forma-grid-blocos");

  const catalog = Array.isArray(items) ? items : [];
  const isTableBody = container.tagName === "TBODY";

  if (Array.isArray(options.blocks) && options.blocks.length) {
    renderSheetBlocks(options.blocks, container, setor, options.blockLabels || []);
    return;
  }

  catalog.forEach((item) => {
    if (isTableBody) {
      container.appendChild(createLiberacaoRow(item, setor));
      return;
    }
    const btn = createFormaButton(item, setor);
    container.appendChild(btn);
  });
}

function setCardState(card, state) {
  card.classList.remove("is-idle", "is-saving", "is-saved", "is-error");
  card.classList.add("is-" + state);
  const statusEl = card.querySelector(".fc-status");
  if (!statusEl) return;
  if (state === "saving") {
    statusEl.textContent = "⋯";
    card.disabled = true;
  } else if (state === "saved") {
    statusEl.textContent = "✓";
    card.disabled = true;
  } else if (state === "error") {
    statusEl.textContent = "✗";
    card.disabled = false;
  } else {
    statusEl.textContent = "";
    card.disabled = false;
  }
}

function createFormaCard(item, setor) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "forma-card is-idle";
  card.dataset.formaNumero = normalizeUpper(item.forma);
  card.dataset.modelo = item.modelo || "";

  const numEl = document.createElement("span");
  numEl.className = "fc-number";
  numEl.textContent = item.forma;

  const statusEl = document.createElement("span");
  statusEl.className = "fc-status";

  card.appendChild(numEl);
  card.appendChild(statusEl);

  if (isFormaClicked(item.forma, setor)) {
    setCardState(card, "saved");
  } else {
    card.addEventListener("click", () => {
      const data = el.libData?.value;
      const colaborador = (el.libColaborador?.value || "").trim();
      if (!data) {
        showLibFeedback("Preencha a data de fabricação antes de registrar.", "error");
        el.libData?.focus();
        return;
      }
      if (!colaborador) {
        showLibFeedback("Preencha o colaborador antes de registrar.", "error");
        el.libColaborador?.focus();
        return;
      }
      salvarFormaClicada(item.forma, setor, card, item.modelo || "");
    });
  }

  return card;
}

function renderSectorCols(container, leftForms, rightForms, setor) {
  if (!container) return;
  container.innerHTML = "";
  const leftCol = document.createElement("div");
  leftCol.className = "lib-forms-col";
  const rightCol = document.createElement("div");
  rightCol.className = "lib-forms-col";
  leftForms.forEach((item) => leftCol.appendChild(createFormaCard(item, setor)));
  rightForms.forEach((item) => rightCol.appendChild(createFormaCard(item, setor)));
  container.appendChild(leftCol);
  container.appendChild(rightCol);
}

function renderLiberacaoDual() {
  renderSectorCols(
    document.getElementById("libSetor1Cols"),
    SETOR_1_LEFT_FORMS,
    SETOR_1_RIGHT_FORMS,
    "Setor 1"
  );
  renderSectorCols(
    document.getElementById("libSetor2Cols"),
    SETOR_2_LEFT_FORMS,
    SETOR_2_RIGHT_FORMS,
    "Setor 2"
  );
  updateSectorCounters();
}

function updateSectorCounters() {
  const clicked = getClickedFormsToday();
  const formas = clicked.formas || {};

  const s1All = SETOR_1_LEFT_FORMS.concat(SETOR_1_RIGHT_FORMS);
  const s2All = SETOR_2_LEFT_FORMS.concat(SETOR_2_RIGHT_FORMS);

  let s1Count = 0;
  s1All.forEach((item) => {
    if (formas["Setor 1||" + normalizeUpper(item.forma)]) s1Count++;
  });

  let s2Count = 0;
  s2All.forEach((item) => {
    if (formas["Setor 2||" + normalizeUpper(item.forma)]) s2Count++;
  });

  const c1 = document.getElementById("libCounterSetor1");
  const c2 = document.getElementById("libCounterSetor2");
  if (c1) {
    c1.textContent = s1Count + " / " + s1All.length;
    c1.classList.toggle("counter-done", s1Count === s1All.length && s1All.length > 0);
  }
  if (c2) {
    c2.textContent = s2Count + " / " + s2All.length;
    c2.classList.toggle("counter-done", s2Count === s2All.length && s2All.length > 0);
  }
}

async function renderSheetGrid() {
  const setor = el.sheetSetorLabel?.textContent || "Setor 2";
  const forms = await getSectorFormsForLiberacao(setor);
  if (el.sheetLeftBody) renderSheetSide(forms.left, el.sheetLeftBody);
  if (el.sheetRightBody) renderSheetSide(forms.right, el.sheetRightBody);
}

function showLibFeedback(message, type) {
  if (!el.libFeedback) return;
  el.libFeedback.textContent = message;
  el.libFeedback.className = "lib-feedback";
  if (type === "ok") el.libFeedback.classList.add("feedback-ok");
  if (type === "error") el.libFeedback.classList.add("feedback-error");
  el.libFeedback.classList.remove("hidden");
  setTimeout(() => el.libFeedback.classList.add("hidden"), 3000);
}

async function salvarFormaClicada(forma, setor, card, modelo) {
  setCardState(card, "saving");

  const agora = new Date();
  const dia = agora.toLocaleDateString("pt-BR");
  const hora = agora.toLocaleTimeString("pt-BR");
  const dataFabricacao = el.libData?.value || todayYmd();
  const colaborador = (el.libColaborador?.value || "").trim();
  const modeloFinal = modelo || card.dataset.modelo || "";

  const payload = {
    dia,
    hora,
    setor,
    forma,
    dataFabricacao,
    colaborador,
    modelo: modeloFinal
  };

  const apiResult = await postToApi("salvar_forma_click", payload);

  if (apiResult.ok || apiResult.skipped) {
    const db = readDb();
    let record = findRecordByKey(db, dataFabricacao, setor, normalizeUpper(forma));
    if (!record) {
      record = {
        id: uuid(),
        dataFabricacao,
        setor,
        formaNumero: normalizeUpper(forma),
        modelo: modeloFinal,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        liberacao: null,
        inspecoes: []
      };
    }
    if (!record.liberacao || record.liberacao.status !== "1") {
      record.liberacao = { status: "1", colaborador, observacoes: "", fotos: [], timestamp: nowIso() };
      record.updatedAt = nowIso();
    }
    upsertRecord(db, record);
    writeDb(db);
  }

  if (apiResult.ok) {
    markFormaClicked(forma, setor);
    setCardState(card, "saved");
    updateSectorCounters();
    setSyncStatus("ok", `Forma ${forma} registrada com sucesso.`);
    showLibFeedback(`${forma} — registrado!`, "ok");
  } else if (apiResult.skipped) {
    markFormaClicked(forma, setor);
    setCardState(card, "saved");
    updateSectorCounters();
    setSyncStatus("warn", "API não configurada. Forma salva localmente.");
    showLibFeedback(`${forma} — salvo localmente.`, "ok");
  } else {
    setCardState(card, "error");
    setSyncStatus("error", `Falha ao registrar ${forma}: ${apiResult.error || "erro desconhecido"}`);
    showLibFeedback(`${forma} — falha no envio!`, "error");
  }
}

function getInspecaoCodeOptions(selectedCode) {
  const first = '<option value="">Selecione</option>';
  const options = CHECKLIST_INSPECAO_CODIGOS.map((item) => {
    const selected = selectedCode === item.codigo ? "selected" : "";
    return `<option value="${item.codigo}" ${selected}>${item.codigo}</option>`;
  }).join("");
  return first + options;
}

async function getInspecaoRowsFromApi(filtroData, modoCarga, setor) {
  if (!hasApiConfigured()) return null;

  const params = new URLSearchParams();
  params.set("action", "inspecao_pendentes");
  // O backend pode estar com datas em formato textual longo; filtramos por data no cliente.
  if (setor) params.set("setor", setor);

  try {
    const response = await fetch(`${CONFIG.API_URL}?${params.toString()}`);
    const text = await response.text();
    const payload = JSON.parse(text);
    if (payload.ok && Array.isArray(payload.rows)) return payload.rows;
    console.error("[inspecao_pendentes] resposta inesperada:", payload);
  } catch (err) {
    console.error("[inspecao_pendentes] erro na requisição:", err);
    return null;
  }

  return null;
}

async function renderInspecaoLiberados() {
  const db = readDb();
  const filtroData = el.insFiltroData.value;
  const modoCarga = el.insModoCarga?.value || "data";
  const setor = el.insSetor?.value || "";

  el.insLiberadosBody.innerHTML = "";
  if (modoCarga === "data" && !filtroData) {
    el.insQtdItens.textContent = "0";
    el.insLiberadosBody.innerHTML = '<tr><td colspan="6" class="muted">Selecione a data de produção para carregar os itens liberados.</td></tr>';
    return;
  }

  const apiRows = await getInspecaoRowsFromApi(filtroData, modoCarga, setor);
  // Usa API se retornou dados; se retornou vazio ou null, usa localStorage
  if (Array.isArray(apiRows) && apiRows.length > 0) {
    const rows = apiRows
      .filter((record) => String(record.liberacao_status || "") === "1")
      .filter((record) => !setor || String(record.setor || "") === setor)
      .filter((record) => (modoCarga === "data" ? dateToYmd(record.data_fabricacao || "") === filtroData : true))
      .filter((record) => !String(record.ins_status || "").trim())
      .sort((a, b) => String(a.forma_numero || "").localeCompare(String(b.forma_numero || "")));

    el.insQtdItens.textContent = String(rows.length);

    if (!rows.length) {
      el.insLiberadosBody.innerHTML = '<tr><td colspan="6" class="muted">Nenhuma forma pendente de inspeção para os filtros informados.</td></tr>';
      return;
    }

    rows.forEach((record) => {
      const tr = document.createElement("tr");
      tr.dataset.recordId = String(record.record_id || "");
      tr.dataset.dataFabricacao = String(record.data_fabricacao || "");
      tr.dataset.setor = String(record.setor || "");
      tr.dataset.formaNumero = String(record.forma_numero || "");
      tr.dataset.modelo = String(record.modelo || "");

      tr.innerHTML = `
        <td>${record.forma_numero || ""}</td>
        <td>${record.modelo || ""}</td>
        <td>${record.liberacao_status || ""}</td>
        <td>
          <select data-ins-status>
            <option value="">Selecione</option>
            <option value="A">A - Aprovado</option>
            <option value="R">R - Reprovado</option>
            <option value="RR">RR - Reprovado e retrabalhado</option>
          </select>
        </td>
        <td>
          <select data-ins-code>${getInspecaoCodeOptions("")}</select>
        </td>
        <td><input type="text" data-ins-row-obs placeholder="Observação"></td>
      `;

      const statusSelect = tr.querySelector("select[data-ins-status]");
      const codeSelect = tr.querySelector("select[data-ins-code]");
      if (statusSelect && codeSelect) {
        statusSelect.addEventListener("change", () => {
          if (statusSelect.value === "A") {
            codeSelect.value = "A";
            codeSelect.disabled = true;
          } else {
            codeSelect.disabled = false;
          }
        });
      }

      el.insLiberadosBody.appendChild(tr);
    });
    return;
  }

  const rows = db.records
    .filter((record) => record.liberacao && record.liberacao.status === "1")
    .filter((record) => (modoCarga === "data" ? record.dataFabricacao === filtroData : true))
    .filter((record) => !setor || record.setor === setor)
    .filter((record) => !Array.isArray(record.inspecoes) || record.inspecoes.length === 0)
    .sort((a, b) => (a.formaNumero > b.formaNumero ? 1 : -1));

  el.insQtdItens.textContent = String(rows.length);

  if (!rows.length) {
    el.insLiberadosBody.innerHTML = '<tr><td colspan="6" class="muted">Nenhuma forma liberada para os filtros informados.</td></tr>';
    return;
  }

  rows.forEach((record) => {
    const ultima = Array.isArray(record.inspecoes) && record.inspecoes.length ? record.inspecoes[record.inspecoes.length - 1] : null;
    const tr = document.createElement("tr");
    tr.dataset.recordId = record.id;
    tr.dataset.dataFabricacao = record.dataFabricacao || "";
    tr.dataset.setor = record.setor || "";
    tr.dataset.formaNumero = record.formaNumero || "";
    tr.dataset.modelo = record.modelo || "";
    tr.innerHTML = `
      <td>${record.formaNumero}</td>
      <td>${record.modelo || ""}</td>
      <td>${record.liberacao.status}</td>
      <td>
        <select data-ins-status>
          <option value="">Selecione</option>
          <option value="A" ${ultima?.status === "A" ? "selected" : ""}>A - Aprovado</option>
          <option value="R" ${ultima?.status === "R" ? "selected" : ""}>R - Reprovado</option>
          <option value="RR" ${ultima?.status === "RR" ? "selected" : ""}>RR - Reprovado e retrabalhado</option>
        </select>
      </td>
      <td>
        <select data-ins-code>${getInspecaoCodeOptions(ultima?.codigos?.[0] || "")}</select>
      </td>
      <td><input type="text" data-ins-row-obs placeholder="Observação"></td>
    `;

    const statusSelect = tr.querySelector("select[data-ins-status]");
    const codeSelect = tr.querySelector("select[data-ins-code]");
    if (statusSelect && codeSelect) {
      const syncCodeState = () => {
        if (statusSelect.value === "A") {
          codeSelect.value = "A";
          codeSelect.disabled = true;
        } else {
          codeSelect.disabled = false;
        }
      };
      statusSelect.addEventListener("change", syncCodeState);
      syncCodeState();
    }

    el.insLiberadosBody.appendChild(tr);
  });
}

async function saveInspecao() {
  if (state.isSendingInspecao) return;

  const colaborador = el.insColaborador.value.trim();
  const observacaoGlobal = el.insObs.value.trim();

  if (!colaborador) {
    alert("Preencha o colaborador da inspeção.");
    return;
  }

  const linhasInspecao = Array.from(document.querySelectorAll("#insLiberadosBody tr[data-record-id]"));
  const selectedRows = linhasInspecao.filter((linha) => {
    const status = linha.querySelector("select[data-ins-status]")?.value || "";
    return Boolean(status);
  });

  if (!selectedRows.length) {
    alert("Preencha o Status em ao menos uma forma para salvar a inspeção.");
    return;
  }

  const lockPayloadRows = selectedRows
    .map((tr) => {
      return {
        recordId: tr?.dataset.recordId || "",
        status: tr?.querySelector("select[data-ins-status]")?.value || "",
        codigo: tr?.querySelector("select[data-ins-code]")?.value || "",
        observacoes: tr?.querySelector("input[data-ins-row-obs]")?.value?.trim() || ""
      };
    })
    .sort((a, b) => a.recordId.localeCompare(b.recordId));

  const lockPayload = {
    action: "salvar_inspecao_lote",
    colaborador,
    observacaoGlobal,
    fotos: state.insPhotos.map((photo) => photo.id || photo.name || ""),
    rows: lockPayloadRows
  };
  const lockToken = payloadToken(lockPayload);

  if (state.submitLocks.inspecao && state.submitLocks.inspecao === lockToken) {
    setSyncStatus("warn", "Envio de inspeção já realizado para este mesmo conteúdo. Altere os dados para reenviar.");
    alert("Este envio de inspeção já foi realizado. Altere os dados para enviar novamente.");
    return;
  }

  state.isSendingInspecao = true;
  setSubmitButtonState(el.salvarInspecao, true);

  try {

    const db = readDb();
    let saved = 0;
    const inspecaoEntries = [];

    for (const tr of selectedRows) {
      const dataFabricacao = tr?.dataset.dataFabricacao || el.insFiltroData.value;
      const setor = tr?.dataset.setor || el.insSetor.value || "";
      const formaNumero = normalizeUpper(tr?.dataset.formaNumero || "");
      const modelo = tr?.dataset.modelo || "";
      const recordId = tr?.dataset.recordId || uuid();
      const status = tr?.querySelector("select[data-ins-status]")?.value || "";
      const codigo = tr?.querySelector("select[data-ins-code]")?.value || "";
      const codigoFinal = status === "A" ? (codigo || "A") : codigo;
      const obsLinha = tr?.querySelector("input[data-ins-row-obs]")?.value?.trim() || "";

      if (!recordId || !status) {
        alert("Cada forma selecionada deve ter Status preenchido.");
        return;
      }

      if (status !== "A" && !codigoFinal) {
        alert("Para status R ou RR, preencha o Código (A-M).");
        return;
      }

      let record = db.records.find((item) => item.id === recordId);
      if (!record) {
        record = findRecordByKey(db, dataFabricacao, setor, formaNumero);
      }
      if (!record) {
        record = {
          id: recordId,
          dataFabricacao,
          setor,
          formaNumero,
          modelo,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          liberacao: {
            status: "1",
            statusFlags: statusFlagsFromCode("1"),
            colaborador: "",
            observacoes: "",
            fotos: [],
            timestamp: nowIso()
          },
          inspecoes: []
        };
      }
      if (!record.liberacao || record.liberacao.status !== "1") {
        record.liberacao = {
          status: "1",
          statusFlags: statusFlagsFromCode("1"),
          colaborador: record.liberacao?.colaborador || "",
          observacoes: record.liberacao?.observacoes || "",
          fotos: Array.isArray(record.liberacao?.fotos) ? record.liberacao.fotos : [],
          timestamp: record.liberacao?.timestamp || nowIso()
        };
      }

      const tipo = Array.isArray(record.inspecoes) && record.inspecoes.length ? "REINSPECAO" : "INSPECAO";
      const observacoes = obsLinha || observacaoGlobal;

      const inspecao = {
        id: uuid(),
        tipo,
        colaborador,
        status,
        codigos: [codigoFinal],
        observacoes,
        fotos: [...state.insPhotos],
        timestamp: nowIso()
      };

      record.inspecoes = Array.isArray(record.inspecoes) ? record.inspecoes : [];
      record.inspecoes.push(inspecao);
      record.updatedAt = nowIso();
      record.statusFluxo = statusFluxoFromRecord(record);
      upsertRecord(db, record);

      addEvent(db, {
        id: uuid(),
        recordId: record.id,
        etapa: tipo,
        status,
        colaborador,
        setor: record.setor || setor,
        formaNumero: record.formaNumero || formaNumero,
        dataFabricacao: record.dataFabricacao || dataFabricacao,
        codigos: [codigoFinal],
        observacoes,
        fotosCount: state.insPhotos.length,
        timestamp: nowIso()
      });

      inspecaoEntries.push({
        recordId: record.id,
        dataFabricacao: record.dataFabricacao || dataFabricacao,
        setor: record.setor || setor,
        formaNumero: record.formaNumero || formaNumero,
        tipo,
        status,
        codigo: codigoFinal,
        colaborador,
        observacoes,
        fotosCount: state.insPhotos.length,
        timestamp: inspecao.timestamp
      });

      saved += 1;
    }

    writeDb(db);
    setSubmitLock("inspecao", lockToken);

    state.insPhotos = [];
    el.insObs.value = "";
    el.insFotos.value = "";
    renderPhotoPreview(el.insFotosPreview, state.insPhotos);

    renderInspecaoLiberados();
    renderLiberacaoDual();
    renderHistorico();

    const apiResult = await postToApi("salvar_inspecao_lote", { entries: inspecaoEntries });
    if (apiResult.ok) {
      setSyncStatus("ok", `Inspeção sincronizada com sucesso (${apiResult.updated || saved} atualizações).`);
      alert(`Inspeções salvas: ${saved} (planilha atualizada).`);
    } else if (apiResult.skipped) {
      setSyncStatus("warn", "Inspeções salvas localmente. Configure a URL da API para sincronizar.");
      alert(`Inspeções salvas localmente: ${saved}. Configure a API para atualizar a planilha.`);
    } else {
      setSyncStatus("error", "Inspeções salvas localmente, mas falhou atualização na planilha.");
      alert(`Inspeções salvas localmente: ${saved}, mas falhou atualização da planilha.`);
    }
  } finally {
    state.isSendingInspecao = false;
    setSubmitButtonState(el.salvarInspecao, false);
  }
}

async function renderHistorico() {
  const db = readDb();
  const data = el.histData.value;
  const tipo = (el.histTipo?.value || "").trim();
  const forma = normalizeUpper(el.histForma.value);

  let rows = db.events
    .filter((event) => !data || event.dataFabricacao === data)
    .filter((event) => {
      if (!tipo) return true;
      if (tipo === "LIBERACAO") return event.etapa === "LIBERACAO";
      if (tipo === "INSPECAO") return event.etapa === "INSPECAO" || event.etapa === "REINSPECAO";
      return true;
    })
    .filter((event) => !forma || event.formaNumero === forma)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  if (!rows.length && hasApiConfigured() && data) {
    const [setor1, setor2] = await Promise.all([
      getRowsForDashboard(data, "Setor 1"),
      getRowsForDashboard(data, "Setor 2")
    ]);
    const apiRows = [...(setor1.rows || []), ...(setor2.rows || [])];
    const apiEvents = [];
    apiRows.forEach((row) => {
      const formaNumero = String(row.forma_numero || "");
      const setor = String(row.setor || "");
      const baseTs = row.lib_timestamp || row.updated_at || nowIso();
      if (String(row.liberacao_status || "") === "1") {
        apiEvents.push({
          etapa: "LIBERACAO",
          status: String(row.liberacao_status || ""),
          dataFabricacao: String(row.data_fabricacao || data),
          setor,
          formaNumero,
          colaborador: String(row.lib_colaborador || ""),
          timestamp: baseTs,
          fotosCount: 0,
          codigos: [],
          observacoes: ""
        });
      }
      if (String(row.ins_status || "").trim()) {
        apiEvents.push({
          etapa: "INSPECAO",
          status: String(row.ins_status || ""),
          dataFabricacao: String(row.data_fabricacao || data),
          setor,
          formaNumero,
          colaborador: String(row.ins_colaborador || ""),
          timestamp: row.ins_timestamp || baseTs,
          fotosCount: 0,
          codigos: row.ins_codigo ? [String(row.ins_codigo)] : [],
          observacoes: String(row.ins_observacoes || "")
        });
      }
    });

    rows = apiEvents
      .filter((event) => {
        if (!tipo) return true;
        if (tipo === "LIBERACAO") return event.etapa === "LIBERACAO";
        if (tipo === "INSPECAO") return event.etapa === "INSPECAO" || event.etapa === "REINSPECAO";
        return true;
      })
      .filter((event) => !forma || normalizeUpper(event.formaNumero) === forma)
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  }

  el.historicoLista.innerHTML = "";
  if (!rows.length) {
    el.historicoLista.innerHTML = '<p class="muted">Sem eventos para o filtro informado.</p>';
    return;
  }

  rows.forEach((evt) => {
    const item = document.createElement("article");
    item.className = "item";
    item.innerHTML = `
      <div class="item-main">
        <strong>${evt.etapa} • ${evt.status}</strong>
        <div class="item-meta">${evt.dataFabricacao} • ${evt.setor} • ${evt.formaNumero}</div>
        <div class="item-meta">${evt.colaborador || "-"} • ${formatDateTime(evt.timestamp)} • Fotos: ${evt.fotosCount || 0}</div>
        ${Array.isArray(evt.codigos) && evt.codigos.length ? `<div class="item-meta">Códigos: ${evt.codigos.join(", ")}</div>` : ""}
        ${evt.statusFlags ? `<div class="item-meta">1/0: L=${evt.statusFlags.liberado} D=${evt.statusFlags.naoMontado} M=${evt.statusFlags.manutencao}</div>` : ""}
        ${evt.observacoes ? `<div class="item-meta">Obs: ${evt.observacoes}</div>` : ""}
      </div>
    `;
    el.historicoLista.appendChild(item);
  });
}

function statusLabelFromCode(code) {
  if (code === "1") return "Liberado";
  if (code === "D") return "Não montado";
  if (code === "M") return "Manutenção";
  return "-";
}

function buildReportDataFromRows(rows) {
  const total = rows.length;
  const liberado = rows.filter((r) => String(r.liberacao_status || r.liberacaoStatus || "") === "1").length;
  const manutencao = rows.filter((r) => String(r.liberacao_status || r.liberacaoStatus || "") === "M").length;
  const naoMontado = rows.filter((r) => String(r.liberacao_status || r.liberacaoStatus || "") === "D").length;
  return { total, liberado, naoMontado, manutencao };
}

function getRowsFromLocalForDashboard(data, setor) {
  const db = readDb();
  return db.records
    .filter((r) => r.dataFabricacao === data)
    .filter((r) => r.setor === setor)
    .map((r) => ({
      forma_numero: r.formaNumero,
      modelo: r.modelo,
      liberacao_status: r.liberacao?.status || ""
    }));
}

async function getRowsForDashboard(data, setor) {
  if (!hasApiConfigured()) {
    return { rows: getRowsFromLocalForDashboard(data, setor), source: "local" };
  }

  try {
    const url = `${CONFIG.API_URL}?action=relatorio_setor&dataFabricacao=${encodeURIComponent(data)}&setor=${encodeURIComponent(setor)}`;
    const response = await fetch(url);
    const text = await response.text();
    const payload = JSON.parse(text);
    if (payload.ok && Array.isArray(payload.rows)) {
      return { rows: payload.rows, source: "api" };
    }
  } catch {
    // Fallback local em caso de falha temporária da API.
  }

  return { rows: getRowsFromLocalForDashboard(data, setor), source: "local" };
}

function renderDashboardConcretagem({ setor1, setor2, source, data }) {
  const concretadasSetor1 = buildReportDataFromRows(setor1).liberado;
  const concretadasSetor2 = buildReportDataFromRows(setor2).liberado;
  const totalConcretadas = concretadasSetor1 + concretadasSetor2;

  const max = Math.max(concretadasSetor1, concretadasSetor2, 1);
  const width1 = Math.round((concretadasSetor1 / max) * 100);
  const width2 = Math.round((concretadasSetor2 / max) * 100);

  el.dashSetor1Count.textContent = String(concretadasSetor1);
  el.dashSetor2Count.textContent = String(concretadasSetor2);
  el.dashTotalCount.textContent = String(totalConcretadas);

  el.dashSetor1Meta.textContent = `${concretadasSetor1} de ${setor1.length} leituras concretadas`;
  el.dashSetor2Meta.textContent = `${concretadasSetor2} de ${setor2.length} leituras concretadas`;

  el.dashBarSetor1.style.width = `${width1}%`;
  el.dashBarSetor2.style.width = `${width2}%`;
  el.dashBarSetor1Label.textContent = String(concretadasSetor1);
  el.dashBarSetor2Label.textContent = String(concretadasSetor2);

  el.dashStatus.textContent = `Painel atualizado para ${data} (${source === "api" ? "dados da planilha" : "cache local"}).`;
}

async function carregarDashboardConcretagem() {
  if (!el.dashData?.value) {
    el.dashStatus.textContent = "Selecione uma data para atualizar o painel.";
    return;
  }

  const data = el.dashData.value;
  el.dashStatus.textContent = "Atualizando painel de concretagem...";

  const [setor1Result, setor2Result] = await Promise.all([
    getRowsForDashboard(data, "Setor 1"),
    getRowsForDashboard(data, "Setor 2")
  ]);

  const source = setor1Result.source === "api" && setor2Result.source === "api" ? "api" : "local";
  renderDashboardConcretagem({
    setor1: setor1Result.rows,
    setor2: setor2Result.rows,
    source,
    data
  });
}

function renderRelatorioSetor({ data, setor, encarregado, rows }) {
  if (!el.relatorioSetorOutput) return;
  const resumo = buildReportDataFromRows(rows);
  const linhas = rows
    .sort((a, b) => String(a.forma_numero || a.formaNumero || "").localeCompare(String(b.forma_numero || b.formaNumero || "")))
    .map((r) => {
      const forma = r.forma_numero || r.formaNumero || "";
      const modelo = r.modelo || "";
      const status = statusLabelFromCode(String(r.liberacao_status || r.liberacaoStatus || ""));
      return `<tr><td>${forma}</td><td>${modelo}</td><td>${status}</td></tr>`;
    })
    .join("");

  el.relatorioSetorOutput.innerHTML = `
    <div class="report-header">
      <strong>Relatório de Produção</strong><br>
      Data: ${data} • ${setor}
    </div>
    <div class="report-summary">
      Total: ${resumo.total} • Produzido (Liberado): ${resumo.liberado} • Não Produzido: ${resumo.naoMontado} • Manutenção: ${resumo.manutencao}
    </div>
    <table class="sheet-table report-table">
      <thead>
        <tr><th>Forma</th><th>Modelo</th><th>Status</th></tr>
      </thead>
      <tbody>${linhas || '<tr><td colspan="3">Sem registros</td></tr>'}</tbody>
    </table>
    <div class="report-sign">Encarregado: ${encarregado || "____________________________"}</div>
    <div class="report-sign-line">Assinatura: ___________________________________________</div>
  `;
}

async function gerarRelatorioSetor() {
  const data = el.relData.value;
  const setor = el.relSetor.value;
  const encarregado = el.relEncarregado.value.trim();

  if (!data || !setor) {
    alert("Informe data e setor para gerar o relatório.");
    return;
  }

  if (hasApiConfigured()) {
    try {
      const url = `${CONFIG.API_URL}?action=relatorio_setor&dataFabricacao=${encodeURIComponent(data)}&setor=${encodeURIComponent(setor)}`;
      const response = await fetch(url);
      const text = await response.text();
      const payload = JSON.parse(text);
      if (payload.ok && Array.isArray(payload.rows)) {
        renderRelatorioSetor({ data, setor, encarregado, rows: payload.rows });
        setSyncStatus("ok", `Relatório do ${setor} em ${data} gerado pela planilha.`);
        return;
      }
    } catch {
      setSyncStatus("warn", "Falha ao buscar relatório na planilha. Gerando pelo cache local.");
    }
  }

  const db = readDb();
  const rows = db.records
    .filter((r) => r.dataFabricacao === data)
    .filter((r) => r.setor === setor)
    .map((r) => ({ forma_numero: r.formaNumero, modelo: r.modelo, liberacao_status: r.liberacao?.status || "" }));

  renderRelatorioSetor({ data, setor, encarregado, rows });
}

function setMode(mode) {
  state.mode = mode;
  [el.hubView, el.viewLiberacao, el.viewInspecao, el.viewRelatorio, el.viewHistorico, el.viewAcompanhamento]
    .forEach((view) => view.classList.add("hidden"));
  if (mode === "HUB") el.hubView.classList.remove("hidden");
  if (mode === "LIBERACAO") el.viewLiberacao.classList.remove("hidden");
  if (mode === "INSPECAO") el.viewInspecao.classList.remove("hidden");
  if (mode === "RELATORIO") el.viewRelatorio.classList.remove("hidden");
  if (mode === "HISTORICO") el.viewHistorico.classList.remove("hidden");
  if (mode === "ACOMPANHAMENTO") el.viewAcompanhamento.classList.remove("hidden");

  document.body.classList.remove("mode-hub", "mode-liberacao", "mode-inspecao", "mode-relatorio", "mode-historico", "mode-acompanhamento");
  if (mode === "HUB") document.body.classList.add("mode-hub");
  if (mode === "LIBERACAO") document.body.classList.add("mode-liberacao");
  if (mode === "INSPECAO") {
    document.body.classList.add("mode-inspecao");
    if ((el.insModoCarga?.value || "data") === "data" && !el.insFiltroData.value) {
      el.insLiberadosBody.innerHTML = '<tr><td colspan="7" class="muted">Selecione a data de produção para carregar os itens liberados.</td></tr>';
      el.insQtdItens.textContent = "0";
    }
  }
  if (mode === "RELATORIO") document.body.classList.add("mode-relatorio");
  if (mode === "HISTORICO") document.body.classList.add("mode-historico");
  if (mode === "ACOMPANHAMENTO") document.body.classList.add("mode-acompanhamento");
}

function navigateBack() {
  if (state.mode !== "HUB") {
    setMode("HUB");
    return;
  }

  setSyncStatus("warn", "Voce ja esta na tela principal.");
}

function bindEvents() {
  el.hubLiberacao.addEventListener("click", () => {
    setMode("LIBERACAO");
    if (!el.libData.value) el.libData.value = todayYmd();
    renderLiberacaoDual();
  });
  el.hubInspecao.addEventListener("click", () => {
    setMode("INSPECAO");
    if (!el.insFiltroData.value) el.insFiltroData.value = todayYmd();
    renderInspecaoLiberados();
  });
  el.hubRelatorio.addEventListener("click", () => {
    setMode("RELATORIO");
    if (!el.relData.value) el.relData.value = todayYmd();
  });
  el.hubHistorico.addEventListener("click", () => {
    setMode("HISTORICO");
    renderHistorico();
  });
  el.hubAcompanhamento.addEventListener("click", () => {
    setMode("ACOMPANHAMENTO");
    carregarDashboardConcretagem();
  });

  el.backButtons.forEach((btn) => btn.addEventListener("click", navigateBack));
  if (el.backMain) {
    el.backMain.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "../index.html";
      }
    });
  }
  el.libData.addEventListener("change", renderLiberacaoDual);
  if (el.btnLimparFormas) {
    el.btnLimparFormas.addEventListener("click", () => {
      if (!confirm("Limpar todas as formas concretadas? (não apaga da planilha)")) return;
      localStorage.removeItem(CLICKED_FORMS_KEY);
      renderLiberacaoDual();
    });
  }

  el.insFiltroData.addEventListener("change", renderInspecaoLiberados);
  el.insModoCarga.addEventListener("change", renderInspecaoLiberados);
  el.insSetor.addEventListener("change", renderInspecaoLiberados);
  el.insCarregarLiberados.addEventListener("click", renderInspecaoLiberados);
  el.insFiltroData.addEventListener("change", () => clearSubmitLock("inspecao"));
  el.insColaborador.addEventListener("input", () => clearSubmitLock("inspecao"));
  el.insObs.addEventListener("input", () => clearSubmitLock("inspecao"));
  el.insCarregarLiberados.addEventListener("click", () => clearSubmitLock("inspecao"));
  el.insLiberadosBody.addEventListener("change", () => clearSubmitLock("inspecao"));
  el.insLiberadosBody.addEventListener("input", () => clearSubmitLock("inspecao"));

  el.salvarInspecao.addEventListener("click", saveInspecao);
  el.atualizarDashboard.addEventListener("click", carregarDashboardConcretagem);
  el.dashData.addEventListener("change", carregarDashboardConcretagem);
  el.filtrarHistorico.addEventListener("click", () => renderHistorico());
  el.histTipo?.addEventListener("change", () => renderHistorico());
  el.gerarRelatorioSetor.addEventListener("click", gerarRelatorioSetor);

  el.insFotos.addEventListener("change", async (event) => {
    clearSubmitLock("inspecao");
    const photos = await filesToCompressedDataUrls(event.target.files);
    state.insPhotos = state.insPhotos.concat(photos);
    renderPhotoPreview(el.insFotosPreview, state.insPhotos);
  });
}

function init() {
  setMode("HUB");
  setSyncStatus("pending", "Verificando conexão com a planilha...");
  renderInspecaoCodigosChecklist();
  bindEvents();

  const now = todayYmd();
  el.libData.value = now;
  el.insFiltroData.value = now;
  el.insModoCarga.value = "data";
  el.insSetor.value = "Setor 2";
  if (el.histTipo) el.histTipo.value = "";
  el.dashData.value = now;
  el.relData.value = now;
  el.relSetor.value = "Setor 2";

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  renderLiberacaoDual();
  renderInspecaoLiberados();
  renderHistorico();
  carregarDashboardConcretagem();
  checkApiStatus();
}

init();
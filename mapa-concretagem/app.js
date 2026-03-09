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
  API_URL: "https://script.google.com/macros/s/AKfycbxX8qCCVDspS3ZOKt9A4lYnCPZ-C_WmwYyP8fL6u-qJCmnDVbOJGqMgA3txFEDstuu5GQ/exec"
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
  { forma: "D-02", modelo: "2 CXS VL" },
  { forma: "D-03", modelo: "2 CXS VL" },
  { forma: "D-04", modelo: "2 CXS VL" },
  { forma: "D-05", modelo: "2 CXS VL" },
  { forma: "D-06", modelo: "2 CXS VL" },
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
  { forma: "SB-1", modelo: "SUB. 100 AMP." },
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
  { forma: "A-11", modelo: "1 CX VR" },
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
  { forma: "A-22", modelo: "1 CX VR" },
  { forma: "A-03", modelo: "1 CX VR" },
  { forma: "B-22", modelo: "1 CX VL" },
  { forma: "B-21", modelo: "1 CX VL" },
  { forma: "B-08", modelo: "1 CX VL" },
  { forma: "B-09", modelo: "1 CX VL" },
  { forma: "B-07", modelo: "1 CX VL" },
  { forma: "B-20", modelo: "1 CX VL" },
  { forma: "B-10", modelo: "1 CX VL" },
  { forma: "B-17", modelo: "1 CX VL" },
  { forma: "B-05", modelo: "1 CX VL" },
  { forma: "B-16", modelo: "1 CX VL" },
  { forma: "B-14", modelo: "1 CX VL" },
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
  mode: "LIBERACAO",
  libPhotos: [],
  insPhotos: [],
  isSendingLiberacao: false,
  isSendingInspecao: false,
  submitLocks: readSubmitLocks()
};

const el = {
  modeLiberacao: document.getElementById("modeLiberacao"),
  modeInspecao: document.getElementById("modeInspecao"),
  modeHistorico: document.getElementById("modeHistorico"),
  viewLiberacao: document.getElementById("viewLiberacao"),
  viewInspecao: document.getElementById("viewInspecao"),
  viewHistorico: document.getElementById("viewHistorico"),
  syncStatus: document.getElementById("syncStatus"),

  libSetor: document.getElementById("libSetor"),
  libFeedback: document.getElementById("libFeedback"),
  sheetSetorLabel: document.getElementById("sheetSetorLabel"),
  sheetLeftBody: document.getElementById("sheetLeftBody"),
  sheetRightBody: document.getElementById("sheetRightBody"),

  insFiltroData: document.getElementById("insFiltroData"),
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
  histForma: document.getElementById("histForma"),
  filtrarHistorico: document.getElementById("filtrarHistorico"),
  historicoLista: document.getElementById("historicoLista"),
  relData: document.getElementById("relData"),
  relSetor: document.getElementById("relSetor"),
  relEncarregado: document.getElementById("relEncarregado"),
  gerarRelatorioSetor: document.getElementById("gerarRelatorioSetor"),
  relatorioSetorOutput: document.getElementById("relatorioSetorOutput")
};

function nowIso() {
  return new Date().toISOString();
}

function uuid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 999999)}`;
}

function todayYmd() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tzOffset);
  return local.toISOString().slice(0, 10);
}

function normalizeUpper(text) {
  return String(text || "").trim().toUpperCase();
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

function renderSheetSide(items, container) {
  const setor = el.libSetor.value;
  container.innerHTML = "";

  const catalog = Array.isArray(items) ? items : [];

  catalog.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "forma-btn";
    btn.textContent = item.forma;
    btn.dataset.formaNumero = normalizeUpper(item.forma);
    btn.dataset.modelo = item.modelo;

    if (setor && isFormaClicked(item.forma, setor)) {
      btn.classList.add("forma-btn-done");
      btn.disabled = true;
    } else {
      btn.addEventListener("click", () => {
        salvarFormaClicada(item.forma, setor, btn);
      });
    }

    container.appendChild(btn);
  });
}

function renderSheetGrid() {
  el.sheetSetorLabel.textContent = el.libSetor.value || "-";
  const forms = getSectorForms(el.libSetor.value || "Setor 2");
  renderSheetSide(forms.left, el.sheetLeftBody);
  renderSheetSide(forms.right, el.sheetRightBody);
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

async function salvarFormaClicada(forma, setor, btn) {
  if (!setor) {
    alert("Selecione o setor antes de clicar na forma.");
    return;
  }

  btn.disabled = true;
  const agora = new Date();
  const dia = agora.toLocaleDateString("pt-BR");
  const hora = agora.toLocaleTimeString("pt-BR");

  const payload = {
    dia,
    hora,
    setor,
    forma
  };

  showLibFeedback(`Registrando ${forma}...`, "ok");

  const apiResult = await postToApi("salvar_forma_click", payload);
  if (apiResult.ok) {
    markFormaClicked(forma, setor);
    btn.classList.add("forma-btn-done");
    setSyncStatus("ok", `Forma ${forma} registrada com sucesso.`);
    showLibFeedback(`${forma} — registrado!`, "ok");
  } else if (apiResult.skipped) {
    btn.disabled = false;
    setSyncStatus("warn", "API não configurada. Registro não enviado.");
    showLibFeedback(`${forma} — salvo localmente (sem API).`, "error");
  } else {
    btn.disabled = false;
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

function renderInspecaoLiberados() {
  const db = readDb();
  const filtroData = el.insFiltroData.value;

  el.insLiberadosBody.innerHTML = "";
  if (!filtroData) {
    el.insQtdItens.textContent = "0";
    el.insLiberadosBody.innerHTML = '<tr><td colspan="6" class="muted">Selecione a data de produção para carregar os itens liberados.</td></tr>';
    return;
  }

  const rows = db.records
    .filter((record) => record.liberacao && record.liberacao.status === "1")
    .filter((record) => !filtroData || record.dataFabricacao === filtroData)
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
      const recordId = tr?.dataset.recordId;
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

      const record = db.records.find((item) => item.id === recordId);
      if (!record || !record.liberacao || record.liberacao.status !== "1") continue;

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
        setor: record.setor,
        formaNumero: record.formaNumero,
        dataFabricacao: record.dataFabricacao,
        codigos: [codigoFinal],
        observacoes,
        fotosCount: state.insPhotos.length,
        timestamp: nowIso()
      });

      inspecaoEntries.push({
        recordId: record.id,
        dataFabricacao: record.dataFabricacao,
        setor: record.setor,
        formaNumero: record.formaNumero,
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
    renderSheetGrid();
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

function renderHistorico() {
  const db = readDb();
  const data = el.histData.value;
  const forma = normalizeUpper(el.histForma.value);

  const rows = db.events
    .filter((event) => !data || event.dataFabricacao === data)
    .filter((event) => !forma || event.formaNumero === forma)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

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
  [el.viewLiberacao, el.viewInspecao, el.viewHistorico].forEach((view) => view.classList.add("hidden"));
  if (mode === "LIBERACAO") el.viewLiberacao.classList.remove("hidden");
  if (mode === "INSPECAO") el.viewInspecao.classList.remove("hidden");
  if (mode === "HISTORICO") el.viewHistorico.classList.remove("hidden");

  [el.modeLiberacao, el.modeInspecao, el.modeHistorico].forEach((button) => button.classList.remove("active", "primary"));
  if (mode === "LIBERACAO") el.modeLiberacao.classList.add("active", "primary");
  if (mode === "INSPECAO") el.modeInspecao.classList.add("active", "primary");
  if (mode === "HISTORICO") el.modeHistorico.classList.add("active", "primary");

  document.body.classList.remove("mode-liberacao", "mode-inspecao", "mode-historico");
  if (mode === "LIBERACAO") document.body.classList.add("mode-liberacao");
  if (mode === "INSPECAO") {
    document.body.classList.add("mode-inspecao");
    if (!el.insFiltroData.value) {
      el.insLiberadosBody.innerHTML = '<tr><td colspan="7" class="muted">Selecione a data de produção para carregar os itens liberados.</td></tr>';
      el.insQtdItens.textContent = "0";
    }
  }
  if (mode === "HISTORICO") document.body.classList.add("mode-historico");
}

function bindEvents() {
  el.modeLiberacao.addEventListener("click", () => setMode("LIBERACAO"));
  el.modeInspecao.addEventListener("click", () => {
    setMode("INSPECAO");
    renderInspecaoLiberados();
  });
  el.modeHistorico.addEventListener("click", () => {
    setMode("HISTORICO");
    renderHistorico();
  });

  el.libSetor.addEventListener("change", renderSheetGrid);

  el.insFiltroData.addEventListener("change", renderInspecaoLiberados);
  el.insCarregarLiberados.addEventListener("click", renderInspecaoLiberados);
  el.insFiltroData.addEventListener("change", () => clearSubmitLock("inspecao"));
  el.insColaborador.addEventListener("input", () => clearSubmitLock("inspecao"));
  el.insObs.addEventListener("input", () => clearSubmitLock("inspecao"));
  el.insCarregarLiberados.addEventListener("click", () => clearSubmitLock("inspecao"));
  el.insLiberadosBody.addEventListener("change", () => clearSubmitLock("inspecao"));
  el.insLiberadosBody.addEventListener("input", () => clearSubmitLock("inspecao"));

  el.salvarInspecao.addEventListener("click", saveInspecao);
  el.filtrarHistorico.addEventListener("click", renderHistorico);
  el.gerarRelatorioSetor.addEventListener("click", gerarRelatorioSetor);

  el.insFotos.addEventListener("change", async (event) => {
    clearSubmitLock("inspecao");
    const photos = await filesToCompressedDataUrls(event.target.files);
    state.insPhotos = state.insPhotos.concat(photos);
    renderPhotoPreview(el.insFotosPreview, state.insPhotos);
  });
}

function init() {
  setMode("LIBERACAO");
  setSyncStatus("pending", "Verificando conexão com a planilha...");
  renderInspecaoCodigosChecklist();
  bindEvents();

  const now = todayYmd();
  el.libSetor.value = "Setor 2";
  el.insFiltroData.value = "";
  el.relData.value = now;
  el.relSetor.value = "Setor 2";

  renderSheetGrid();
  renderInspecaoLiberados();
  renderHistorico();
  checkApiStatus();
}

init();
/**
 * MAPA CONCRETAGEM — Apps Script UNIFICADO
 * Suporte completo: Usuários + Montagem + Produção/Liberação
 *
 * Planilha para produção: https://docs.google.com/spreadsheets/d/1uV-H5hGRyqR04xb9wKF8__xl5-XLt68CEKKkM30JF1o
 * Aba: Pagina1
 *
 * Planilha para usuários/montagem: A mesma planilha ou configure via propriedade
 *
 * COMO USAR:
 * 1. Abra a planilha → Extensões → Apps Script
 * 2. APAGUE tudo que tiver no Código.gs
 * 3. Cole este código inteiro
 * 4. Salve (Ctrl+S)
 * 5. Implantar → Nova implantação
 *    - Tipo: App da Web
 *    - Executar como: Eu (seu e-mail)
 *    - Quem tem acesso: Qualquer pessoa
 * 6. Copie a URL e atualize no CONFIG.API_URL do mapa-concretagem/app.js
 */

// ========== CONFIGURAÇÕES ==========
var SPREADSHEET_ID_PRODUCAO = "1uV-H5hGRyqR04xb9wKF8__xl5-XLt68CEKKkM30JF1o";
var SHEET_NAME_PRODUCAO = "Pagina1";

var MAPA_MONTAGEM_POSTE_SHEET = "montagem_poste";
var MAPA_USUARIOS_SHEET = "usuarios_mapa";
var PROP_SPREADSHEET_ID = "MAPA_CONCRETAGEM_SPREADSHEET_ID";
var MAPA_TIMEZONE = "America/Sao_Paulo";

// ========== HANDLERS GET/POST ==========
function doGet(e) {
  try {
    var action = getAction_(e);
    if (action === "status" || !action) {
      return asJson_(statusResponse_());
    }
    return asJson_({ ok: false, error: "Ação GET inválida", action: action });
  } catch (err) {
    return asJson_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var action = getAction_(e);
    var payload = getPayloadFromPost_(e);

    // ========== AÇÕES DE USUÁRIOS ==========
    if (action === "listar_usuarios") {
      return asJson_(listarUsuarios_(payload));
    }
    if (action === "autenticar_usuario") {
      return asJson_(autenticarUsuario_(payload));
    }
    if (action === "criar_usuario") {
      return asJson_(criarUsuario_(payload));
    }
    if (action === "excluir_usuario") {
      return asJson_(excluirUsuario_(payload));
    }

    // ========== AÇÕES DE MONTAGEM ==========
    if (action === "salvar_montagem_poste") {
      return asJson_(salvarMontagemPoste_(payload));
    }

    // ========== AÇÕES DE PRODUÇÃO ==========
    if (action === "salvar_forma_click") {
      return salvarFormaClick(payload);
    }
    if (action === "salvar_inspecao_lote") {
      return salvarInspecaoLote(payload);
    }
    if (action === "listar_inspecao_pendentes") {
      return listarInspecaoPendentes(payload);
    }
    if (action === "relatorio_setor") {
      return relatorioSetor(payload);
    }

    if (action === "status") {
      return asJson_(statusResponse_());
    }

    return asJson_({ ok: false, error: "Ação POST inválida", action: action || "" });
  } catch (err) {
    return asJson_({ ok: false, error: String(err) });
  }
}

// ========== UTILITÁRIOS ==========
function asJson_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAction_(e) {
  return (e && e.parameter && e.parameter.action) ? String(e.parameter.action).trim() : "";
}

function getPayloadFromPost_(e) {
  var raw = (e && e.parameter && e.parameter.payload) ? e.parameter.payload : "{}";
  try {
    return JSON.parse(raw);
  } catch (err) {
    return { __parseError: String(err) };
  }
}

function getSpreadsheet_() {
  var ssId = PropertiesService.getScriptProperties().getProperty(PROP_SPREADSHEET_ID);
  if (ssId) {
    var ssById = SpreadsheetApp.openById(ssId);
    ensureSpreadsheetTimezone_(ssById);
    return ssById;
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    ensureSpreadsheetTimezone_(active);
    return active;
  }

  throw new Error("Planilha não definida. Configure a propriedade " + PROP_SPREADSHEET_ID + ".");
}

function ensureSpreadsheetTimezone_(ss) {
  try {
    if (ss && ss.getSpreadsheetTimeZone && ss.setSpreadsheetTimeZone) {
      var current = ss.getSpreadsheetTimeZone();
      if (current !== MAPA_TIMEZONE) ss.setSpreadsheetTimeZone(MAPA_TIMEZONE);
    }
  } catch (err) {
    // Se não tiver permissão para ajustar o fuso, apenas segue.
  }
}

function statusResponse_() {
  var ss = getSpreadsheet_();
  return {
    ok: true,
    status: "online",
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheetMontagem: MAPA_MONTAGEM_POSTE_SHEET,
    sheetUsuarios: MAPA_USUARIOS_SHEET,
    sheetProducao: SHEET_NAME_PRODUCAO,
    actions: [
      "salvar_montagem_poste", "listar_usuarios", "autenticar_usuario", "criar_usuario", "excluir_usuario",
      "salvar_forma_click", "salvar_inspecao_lote", "listar_inspecao_pendentes", "relatorio_setor"
    ]
  };
}

// ========== FUNÇÕES DE USUÁRIOS (do AppsScript_montagem_poste.gs) ==========
function getDefaultUsers_() {
  return [
    { id: "user-admin", name: "admin", role: "GERENCIA", password: "admin123", active: "1" },
    { id: "user-ricardo-do-amaral", name: "Ricardo Do Amaral", role: "GERENCIA", password: "1520", active: "1" }
  ];
}

function getOrCreateUsuariosSheet_(ss) {
  var sh = ss.getSheetByName(MAPA_USUARIOS_SHEET);
  if (sh) {
    ensureUsuariosSheetColumns_(sh);
    seedUsuariosPadrao_(sh);
    return sh;
  }

  sh = ss.insertSheet(MAPA_USUARIOS_SHEET);
  sh.getRange(1, 1, 1, 7).setValues([[
    "user_id",
    "nome",
    "perfil",
    "senha",
    "ativo",
    "created_at",
    "updated_at"
  ]]);
  sh.setFrozenRows(1);
  seedUsuariosPadrao_(sh);
  return sh;
}

function ensureUsuariosSheetColumns_(sheet) {
  var headers = ["user_id", "nome", "perfil", "senha", "ativo", "created_at", "updated_at"];
  if (sheet.getLastColumn() < headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function slugifyUserId_(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[áàãâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[íìîï]/g, "i")
    .replace(/[óòõôö]/g, "o")
    .replace(/[úùûü]/g, "u")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readUsuarios_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  return values.map(function(row, index) {
    return {
      rowIndex: index + 2,
      id: String(row[0] || "").trim(),
      name: String(row[1] || "").trim(),
      role: String(row[2] || "").trim(),
      password: String(row[3] || ""),
      active: String(row[4] || "1") !== "0",
      createdAt: row[5],
      updatedAt: row[6]
    };
  }).filter(function(user) {
    return !!user.name;
  });
}

function seedUsuariosPadrao_(sheet) {
  var existing = readUsuarios_(sheet);
  var names = {};
  existing.forEach(function(user) {
    names[String(user.name || "").toLowerCase()] = true;
  });

  var now = new Date();
  var rowsToAppend = [];
  getDefaultUsers_().forEach(function(user) {
    if (!names[String(user.name || "").toLowerCase()]) {
      rowsToAppend.push([user.id, user.name, user.role, user.password, user.active, now, now]);
    }
  });

  if (rowsToAppend.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, 7).setValues(rowsToAppend);
  }
}

function serializeUsuario_(user) {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    active: user.active
  };
}

function listarUsuarios_(payload) {
  var ss = getSpreadsheet_();
  var sh = getOrCreateUsuariosSheet_(ss);
  var users = readUsuarios_(sh)
    .filter(function(user) { return user.active; })
    .map(serializeUsuario_);

  return { ok: true, users: users, total: users.length, sheet: MAPA_USUARIOS_SHEET };
}

function autenticarUsuario_(payload) {
  payload = payload || {};
  var name = String(payload.name || "").trim().toLowerCase();
  var password = String(payload.password || "");
  if (!name || !password) {
    return { ok: false, error: "Usuário e senha são obrigatórios." };
  }

  var ss = getSpreadsheet_();
  var sh = getOrCreateUsuariosSheet_(ss);
  var users = readUsuarios_(sh);
  var match = null;

  for (var i = 0; i < users.length; i += 1) {
    var user = users[i];
    if (user.active && String(user.name || "").toLowerCase() === name && user.password === password) {
      match = user;
      break;
    }
  }

  if (!match) {
    return { ok: false, error: "Usuário ou senha incorretos." };
  }

  return { ok: true, user: serializeUsuario_(match) };
}

function criarUsuario_(payload) {
  payload = payload || {};
  var name = String(payload.name || "").trim();
  var role = String(payload.role || "").trim().toUpperCase();
  var password = String(payload.password || "");
  if (!name || !role || !password) {
    return { ok: false, error: "Nome, perfil e senha são obrigatórios." };
  }

  var ss = getSpreadsheet_();
  var sh = getOrCreateUsuariosSheet_(ss);
  var users = readUsuarios_(sh);
  var alreadyExists = users.some(function(user) {
    return String(user.name || "").toLowerCase() === name.toLowerCase() && user.active;
  });
  if (alreadyExists) {
    return { ok: false, error: "Já existe um usuário com esse nome." };
  }

  var now = new Date();
  var userIdBase = slugifyUserId_(name) || "usuario";
  var userId = "user-" + userIdBase;
  var suffix = 1;
  while (users.some(function(user) { return user.id === userId; })) {
    suffix += 1;
    userId = "user-" + userIdBase + "-" + suffix;
  }

  sh.appendRow([userId, name, role, password, "1", now, now]);
  return {
    ok: true,
    user: { id: userId, name: name, role: role, active: true },
    sheet: MAPA_USUARIOS_SHEET
  };
}

function excluirUsuario_(payload) {
  payload = payload || {};
  var userId = String(payload.id || "").trim();
  if (!userId) {
    return { ok: false, error: "ID do usuário é obrigatório." };
  }

  var ss = getSpreadsheet_();
  var sh = getOrCreateUsuariosSheet_(ss);
  var users = readUsuarios_(sh);
  var current = null;

  for (var i = 0; i < users.length; i += 1) {
    if (users[i].id === userId && users[i].active) {
      current = users[i];
      break;
    }
  }

  if (!current) {
    return { ok: false, error: "Usuário não encontrado." };
  }

  var activeGerencia = users.filter(function(user) {
    return user.active && user.role === "GERENCIA";
  });
  if (current.role === "GERENCIA" && activeGerencia.length <= 1) {
    return { ok: false, error: "Não é possível excluir o único usuário com perfil Gerência." };
  }

  sh.getRange(current.rowIndex, 5).setValue("0");
  sh.getRange(current.rowIndex, 7).setValue(new Date());
  return { ok: true, deletedId: userId, name: current.name, sheet: MAPA_USUARIOS_SHEET };
}

// ========== FUNÇÕES DE MONTAGEM (do AppsScript_montagem_poste.gs) ==========
function getOrCreateMontagemPosteSheet_(ss) {
  var sh = ss.getSheetByName(MAPA_MONTAGEM_POSTE_SHEET);
  if (sh) {
    ensureMontagemSheetColumns_(sh);
    return sh;
  }

  sh = ss.insertSheet(MAPA_MONTAGEM_POSTE_SHEET);
  sh.getRange(1, 1, 1, 17).setValues([[
    "key",
    "record_id",
    "data_fabricacao",
    "setor",
    "forma_numero",
    "modelo",
    "status_montagem",
    "motivo_recusa",
    "etapa",
    "inicio_inspecao_montagem",
    "finalizado_em",
    "checklists_json",
    "updated_at",
    "created_at",
    "banco",
    "observacoes_montagem",
    "montador_nome"
  ]]);
  sh.setFrozenRows(1);
  return sh;
}

function ensureMontagemSheetColumns_(sheet) {
  if (sheet.getLastColumn() < 16) {
    sheet.getRange(1, 16).setValue("observacoes_montagem");
  }
  if (sheet.getLastColumn() < 17) {
    sheet.getRange(1, 17).setValue("montador_nome");
  }
}

function normalizeMontagemPayload_(payload) {
  if (!payload) payload = {};

  var key = String(payload.key || "").trim();
  if (!key) {
    key = [
      String(payload.recordId || ""),
      String(payload.dataFabricacao || ""),
      String(payload.setor || ""),
      String(payload.formaNumero || "")
    ].join("||");
  }

  return {
    key: key,
    recordId: String(payload.recordId || ""),
    dataFabricacao: String(payload.dataFabricacao || ""),
    setor: String(payload.setor || ""),
    formaNumero: String(payload.formaNumero || ""),
    modelo: String(payload.modelo || ""),
    statusMontagem: String(payload.statusMontagem || ""),
    motivoRecusa: String(payload.motivoRecusa || ""),
    etapa: String(payload.etapa || ""),
    inicioInspecaoMontagem: String(payload.inicioInspecaoMontagem || ""),
    finalizadoEm: String(payload.finalizadoEm || ""),
    checklists: payload.checklists || {},
    banco: String(payload.banco || "montagem_poste"),
    observacoesMontagem: String(payload.observacoesMontagem || ""),
    montadorNome: String(payload.montadorNome || "")
  };
}

function buildMontagemRow_(payload, createdAt) {
  var now = new Date();
  return [
    payload.key,
    payload.recordId,
    payload.dataFabricacao,
    payload.setor,
    payload.formaNumero,
    payload.modelo,
    payload.statusMontagem,
    payload.motivoRecusa,
    payload.etapa,
    payload.inicioInspecaoMontagem,
    payload.finalizadoEm,
    JSON.stringify(payload.checklists || {}),
    now,
    createdAt || now,
    payload.banco,
    payload.observacoesMontagem,
    payload.montadorNome
  ];
}

function findRowByKey_(sheet, key) {
  if (!key) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  var finder = sheet.getRange(2, 1, lastRow - 1, 1).createTextFinder(String(key)).matchEntireCell(true);
  var match = finder.findNext();
  return match ? match.getRow() : -1;
}

function salvarMontagemPoste_(payload) {
  if (!payload || payload.__parseError) {
    return { ok: false, error: "payload invalido" };
  }

  var data = normalizeMontagemPayload_(payload);
  if (!data.key) {
    return { ok: false, error: "key obrigatoria" };
  }

  var ss = getSpreadsheet_();
  var sh = getOrCreateMontagemPosteSheet_(ss);
  var rowIndex = findRowByKey_(sh, data.key);

  if (rowIndex === -1) {
    sh.appendRow(buildMontagemRow_(data, null));
    return { ok: true, upsert: "insert", key: data.key, sheet: MAPA_MONTAGEM_POSTE_SHEET };
  }

  var createdAt = sh.getRange(rowIndex, 14).getValue();
  sh.getRange(rowIndex, 1, 1, 17).setValues([buildMontagemRow_(data, createdAt)]);
  return { ok: true, upsert: "update", key: data.key, row: rowIndex, sheet: MAPA_MONTAGEM_POSTE_SHEET };
}

// ========== FUNÇÕES DE PRODUÇÃO (do AppsScript_mapa_concretagem.gs) ==========
function salvarFormaClick(data) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID_PRODUCAO);
    var sheet = ss.getSheetByName(SHEET_NAME_PRODUCAO);

    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "Aba Pagina1 não encontrada" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Encontra a primeira linha vazia na coluna A
    var lastRow = sheet.getLastRow();
    var nextRow = lastRow + 1;

    // Salva os dados na planilha
    sheet.getRange(nextRow, 1).setValue(data.dia + " " + data.hora); // Data e Hora
    sheet.getRange(nextRow, 2).setValue(data.setor); // Setor
    sheet.getRange(nextRow, 3).setValue(data.forma); // Forma
    sheet.getRange(nextRow, 4).setValue(data.modelo || ""); // Modelo
    sheet.getRange(nextRow, 5).setValue(data.tipo_concreto || "Padrão"); // Tipo de Concreto
    sheet.getRange(nextRow, 6).setValue(data.colaborador || ""); // Colaborador
    sheet.getRange(nextRow, 7).setValue(data.dataFabricacao || ""); // Data de Fabricação
    sheet.getRange(nextRow, 8).setValue("LIBERADO"); // Status

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: "Forma liberada salva com sucesso" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Erro ao salvar forma: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function salvarInspecaoLote(data) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID_PRODUCAO);
    var sheet = ss.getSheetByName(SHEET_NAME_PRODUCAO);

    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "Aba Pagina1 não encontrada" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var entries = data.entries || [];
    var results = [];

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var lastRow = sheet.getLastRow();
      var nextRow = lastRow + 1;

      // Salva inspeção
      sheet.getRange(nextRow, 1).setValue(new Date().toLocaleString("pt-BR")); // Data e Hora
      sheet.getRange(nextRow, 2).setValue(entry.setor); // Setor
      sheet.getRange(nextRow, 3).setValue(entry.forma); // Forma
      sheet.getRange(nextRow, 4).setValue(entry.modelo || ""); // Modelo
      sheet.getRange(nextRow, 5).setValue("INSPECIONADO"); // Tipo de Concreto (usado para status)
      sheet.getRange(nextRow, 6).setValue(entry.colaborador || ""); // Colaborador
      sheet.getRange(nextRow, 7).setValue(entry.dataProducao || ""); // Data de Fabricação
      sheet.getRange(nextRow, 8).setValue("INSPECIONADO"); // Status

      results.push({ forma: entry.forma, status: "ok" });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: "Inspeções salvas", results: results }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Erro ao salvar inspeções: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function listarInspecaoPendentes(data) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID_PRODUCAO);
    var sheet = ss.getSheetByName(SHEET_NAME_PRODUCAO);

    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "Aba Pagina1 não encontrada" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var filtroData = data.data;
    var filtroSetor = data.setor;

    // Busca todos os dados da planilha
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();

    var pendentes = [];

    // Pula o cabeçalho (linha 0)
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var status = row[7]; // Coluna H (Status)

      // Se não está liberado, pula
      if (status !== "LIBERADO") continue;

      var itemData = row[6]; // Coluna G (Data de Fabricação)
      var itemSetor = row[1]; // Coluna B (Setor)

      // Aplica filtros
      if (filtroData && itemData !== filtroData) continue;
      if (filtroSetor && itemSetor !== filtroSetor) continue;

      pendentes.push({
        forma: row[2], // Coluna C (Forma)
        setor: itemSetor,
        modelo: row[3], // Coluna D (Modelo)
        dataProducao: itemData,
        tipoConcreto: row[4] // Coluna E (Tipo de Concreto)
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, pendentes: pendentes }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Erro ao listar pendentes: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function relatorioSetor(data) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID_PRODUCAO);
    var sheet = ss.getSheetByName(SHEET_NAME_PRODUCAO);

    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "Aba Pagina1 não encontrada" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var filtroData = data.data;
    var filtroSetor = data.setor;

    // Busca todos os dados da planilha
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();

    var relatorio = {
      liberados: 0,
      inspecionados: 0,
      porSetor: {},
      porTipo: {}
    };

    // Pula o cabeçalho (linha 0)
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var status = row[7]; // Coluna H (Status)
      var setor = row[1]; // Coluna B (Setor)
      var tipoConcreto = row[4]; // Coluna E (Tipo de Concreto)
      var itemData = row[6]; // Coluna G (Data de Fabricação)

      // Aplica filtros
      if (filtroData && itemData !== filtroData) continue;
      if (filtroSetor && setor !== filtroSetor) continue;

      // Conta por status
      if (status === "LIBERADO") relatorio.liberados++;
      if (status === "INSPECIONADO") relatorio.inspecionados++;

      // Conta por setor
      if (!relatorio.porSetor[setor]) relatorio.porSetor[setor] = { liberados: 0, inspecionados: 0 };
      if (status === "LIBERADO") relatorio.porSetor[setor].liberados++;
      if (status === "INSPECIONADO") relatorio.porSetor[setor].inspecionados++;

      // Conta por tipo de concreto
      if (!relatorio.porTipo[tipoConcreto]) relatorio.porTipo[tipoConcreto] = 0;
      relatorio.porTipo[tipoConcreto]++;
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, relatorio: relatorio }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Erro no relatório: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
/*
  Apps Script completo - Montagem de Postes (Mapa Concretagem)

  Publicar como Web App e usar no frontend com:
    GET  ?action=status
    POST action=salvar_montagem_poste&payload={...}

  Opcional:
    Defina a propriedade de script MAPA_CONCRETAGEM_SPREADSHEET_ID
    para forcar a planilha destino mesmo em projeto standalone.
*/

var MAPA_MONTAGEM_POSTE_SHEET = "montagem_poste";
var MAPA_USUARIOS_SHEET = "usuarios_mapa";
var PROP_SPREADSHEET_ID = "MAPA_CONCRETAGEM_SPREADSHEET_ID";

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

    if (action === "salvar_montagem_poste") {
      return asJson_(salvarMontagemPoste_(payload));
    }

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

    if (action === "status") {
      return asJson_(statusResponse_());
    }

    return asJson_({ ok: false, error: "Ação POST inválida", action: action || "" });
  } catch (err) {
    return asJson_({ ok: false, error: String(err) });
  }
}

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
  if (ssId) return SpreadsheetApp.openById(ssId);

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  throw new Error("Planilha não definida. Configure a propriedade " + PROP_SPREADSHEET_ID + ".");
}

function statusResponse_() {
  var ss = getSpreadsheet_();
  return {
    ok: true,
    status: "online",
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheet: MAPA_MONTAGEM_POSTE_SHEET,
    usersSheet: MAPA_USUARIOS_SHEET,
    actions: ["salvar_montagem_poste", "listar_usuarios", "autenticar_usuario", "criar_usuario", "excluir_usuario"]
  };
}

/**
 * Utilitario: retorna a URL da planilha vinculada.
 * Execute esta funcao manualmente no editor do Apps Script
 * para obter o link direto da planilha.
 */
function getSpreadsheetUrl() {
  var ss = getSpreadsheet_();
  Logger.log("URL da planilha: " + ss.getUrl());
  return ss.getUrl();
}

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

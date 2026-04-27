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
    sheet: MAPA_MONTAGEM_POSTE_SHEET,
    actions: ["salvar_montagem_poste"]
  };
}

function getOrCreateMontagemPosteSheet_(ss) {
  var sh = ss.getSheetByName(MAPA_MONTAGEM_POSTE_SHEET);
  if (sh) return sh;

  sh = ss.insertSheet(MAPA_MONTAGEM_POSTE_SHEET);
  sh.getRange(1, 1, 1, 15).setValues([[
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
    "banco"
  ]]);
  sh.setFrozenRows(1);
  return sh;
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
    banco: String(payload.banco || "montagem_poste")
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
    payload.banco
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
  sh.getRange(rowIndex, 1, 1, 15).setValues([buildMontagemRow_(data, createdAt)]);
  return { ok: true, upsert: "update", key: data.key, row: rowIndex, sheet: MAPA_MONTAGEM_POSTE_SHEET };
}

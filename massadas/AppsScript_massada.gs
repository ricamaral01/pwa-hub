/**
 * CONCRETRACK — Massadas com Problemas
 * Apps Script para gravar na aba "massada"
 *
 * Planilha: https://docs.google.com/spreadsheets/d/1m_a4gI3l3cO3YvwMBTZ5KA8dVcQ8cPiZ6utQzDJ77YM
 *
 * COMO USAR:
 * 1. Abra a planilha → Extensões → Apps Script
 * 2. Crie um novo arquivo (+ ao lado de "Arquivos") chamado "massada"
 *    OU adicione este código no mesmo Código.gs (pode conviver com o da aba tecnica)
 * 3. Salve (Ctrl+S)
 * 4. Implantar → Gerenciar implantações → editar → Nova versão → Implantar
 *    (ou Nova implantação se for script separado)
 * 5. Copie a URL gerada e cole no index.html do PWA Massadas
 *
 * IMPORTANTE: Se já existe o doPost do "tecnica" no mesmo projeto,
 * use o modelo UNIFICADO no final deste arquivo.
 *
 * PUSH NOTIFICATIONS (ntfy.sh):
 * 1. Instale o app ntfy no celular: https://ntfy.sh  (Android / iOS / Web)
 * 2. Escolha um nome de tópico único e PRIVADO (ex: concretrack-massadas-abc123)
 * 3. Cole o nome em NTFY_TOPIC abaixo
 * 4. No app ntfy, assine esse mesmo tópico
 * 5. Toda massada registrada enviará push para todos os assinantes
 */

/* ========================================================
   VERSÃO SEPARADA (se for um projeto Apps Script à parte)
   ======================================================== */

var SHEET_NAME_MASSADA = "massada";

/* ── PUSH NOTIFICATIONS ─────────────────────────────────────
   ntfy.sh : notificação via app gratuito (Android/iOS/Web)
   Deixe vazio ("") para desativar o ntfy.
   Web Push nativo via VPS já é ativado automaticamente.
   ─────────────────────────────────────────────────────────── */
var NTFY_TOPIC = "concretrack-massadas"; // ← TROQUE por um nome privado seu

/* VPS Web Push — usa a infra já existente em dautomacao.com */
var VPS_PUSH_URL    = "https://dautomacao.com/etiquetas/push/send";
var VPS_PUSH_SECRET = "concretrack-push-2026";

var HEADERS_MASSADA = [
  "Data e Hora",
  "Problema",
  "Concreto na Produção",
  "Forma",
  "Observações"
];

var LEGACY_HEADERS_MASSADA = [
  "Data e Hora",
  "Número de Série",
  "Hora da Massada",
  "Exsudação",
  "Nível de Exsudação",
  "Perdeu a Massada",
  "Observações"
];

function sendVpsPush_(d) {
  if (!VPS_PUSH_URL || !VPS_PUSH_SECRET) return;
  try {
    var prioridade = (d.perdeu === "Sim" || d.grauExsudacao === "Severo") ? "urgent" : "high";
    var corpo = [
      "⚠️ Problema: "      + (d.problema         || "-"),
      "⏰ "                + (d.dataHora          || "-"),
      "🧱 Na produção: "  + (d.concretoProducao || "-"),
      "📋 Forma: "         + (d.forma             || "-")
    ];
    if (d.observacoes) corpo.push("📝 " + d.observacoes);

    UrlFetchApp.fetch(VPS_PUSH_URL, {
      method:      "post",
      contentType: "application/json",
      payload: JSON.stringify({
        title: "⚠️ Massada com Problema",
        body:  corpo.join("\n"),
        url:   "https://usina.concretrack.com.br/massadas/"
      }),
      headers: { "X-Token": VPS_PUSH_SECRET },
      muteHttpExceptions: true
    });
  } catch (e) {
    // não-crítico
  }
}

function sendNtfyNotification_(d) {
  if (!NTFY_TOPIC) return;
  try {
    var prioridade = (d.perdeu === "Sim" || d.grauExsudacao === "Severo") ? "urgent" : "high";
    var tags = "warning";
    if (d.perdeu === "Sim")          tags += ",x";
    if (d.grauExsudacao === "Severo") tags += ",rotating_light";

    var corpo = [
      "⚠️ Problema: "      + (d.problema         || "-"),
      "⏰ "                + (d.dataHora          || "-"),
      "🧱 Na produção: "  + (d.concretoProducao || "-"),
      "📋 Forma: "         + (d.forma             || "-")
    ];
    if (d.observacoes) corpo.push("📝 " + d.observacoes);

    UrlFetchApp.fetch("https://ntfy.sh/" + NTFY_TOPIC, {
      method: "post",
      payload: corpo.join("\n"),
      headers: {
        "Title":    "⚠️ Massada com Problema",
        "Priority": prioridade,
        "Tags":     tags
      },
      muteHttpExceptions: true
    });
  } catch (e) {
    // notificação é não-crítica; falha silenciosa
  }
}

function headersMatch_(actual, expected) {
  return expected.every(function(header, index) {
    return actual[index] === header;
  });
}

function formatMassadaSheet_(sh) {
  var headerRange = sh.getRange(1, 1, 1, HEADERS_MASSADA.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#2F3640");
  headerRange.setFontColor("#F3F6FF");
  headerRange.setHorizontalAlignment("center");

  sh.setColumnWidth(1, 160);  // Data e Hora
  sh.setColumnWidth(2, 220);  // Problema
  sh.setColumnWidth(3, 160);  // Concreto na Produção
  sh.setColumnWidth(4, 180);  // Forma
  sh.setColumnWidth(5, 300);  // Observações

  sh.setFrozenRows(1);
}

function getOrCreateSheetMassada() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME_MASSADA);

  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME_MASSADA);
  }

  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, HEADERS_MASSADA.length).setValues([HEADERS_MASSADA]);
  } else {
    var currentHeaders = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

    if (headersMatch_(currentHeaders, LEGACY_HEADERS_MASSADA)) {
      sh.insertColumnsAfter(3, 2);
      sh.getRange(1, 1, 1, HEADERS_MASSADA.length).setValues([HEADERS_MASSADA]);
    } else if (!headersMatch_(currentHeaders, HEADERS_MASSADA)) {
      sh.getRange(1, 1, 1, HEADERS_MASSADA.length).setValues([HEADERS_MASSADA]);
    }
  }

  formatMassadaSheet_(sh);

  return sh;
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var sh = getOrCreateSheetMassada();

    sh.appendRow([
      d.dataHora         || "",
      d.problema         || "",
      d.concretoProducao || "",
      d.forma            || "",
      d.observacoes      || ""
    ]);

    sendNtfyNotification_(d);
    sendVpsPush_(d);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: "Massada registrada com sucesso" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : null;

  if (action === "get_data") {
    try {
      var sh = getOrCreateSheetMassada();
      var lastRow = sh.getLastRow();
      
      if (lastRow <= 1) {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: true, data: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var dataRange = sh.getRange(2, 1, lastRow - 1, HEADERS_MASSADA.length);
      var values = dataRange.getValues();
      
      // Convert arrays to objects
      var data = values.map(function(row) {
        return {
          dataHora: row[0] || "",
          problema: row[1] || "",
          concretoProducao: row[2] || "",
          forma: row[3] || "",
          observacoes: row[4] || ""
        };
      });
      
      // Return sorted by newest first (optional, or front-end does it)
      data.reverse();
      
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, data: data }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch(err) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Default ping/status
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "online",
      sheet: SHEET_NAME_MASSADA,
      columns: HEADERS_MASSADA
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupMassada() {
  var sh = getOrCreateSheetMassada();
  SpreadsheetApp.getUi().alert("Aba '" + SHEET_NAME_MASSADA + "' pronta com " + HEADERS_MASSADA.length + " colunas!");
}


/* ========================================================
   VERSÃO UNIFICADA (se quiser tudo no mesmo doPost
   junto com o da aba "tecnica")
   
   Neste caso, APAGUE o doPost acima e use este:
   ======================================================== */

/*
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);

    // Roteamento por action
    if (d.action === "registrar_parada") {
      var sh = getOrCreateSheet();  // aba "tecnica"
      sh.appendRow([
        d.dataHora     || "",
        d.equipamento  || "",
        d.duracao      || "",
        d.motivo       || "",
        d.descricao    || "",
        d.responsavel  || "",
        d.status       || ""
      ]);
    }
    else if (d.action === "registrar_massada") {
      var sh = getOrCreateSheetMassada();  // aba "massada"
      sh.appendRow([
        d.dataHora      || "",
        d.numSerie      || "",
        d.horaMassada   || "",
        d.flow          || "",
        d.faltouAgua    || "",
        d.exsudacao     || "",
        d.grauExsudacao || "",
        d.perdeu        || "",
        d.observacoes   || ""
      ]);
      sendNtfyNotification_(d);
      sendVpsPush_(d);
    }
    else {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "action desconhecida: " + d.action }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: "Registrado com sucesso" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
*/

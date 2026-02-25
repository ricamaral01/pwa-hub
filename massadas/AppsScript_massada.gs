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
 */

/* ========================================================
   VERSÃO SEPARADA (se for um projeto Apps Script à parte)
   ======================================================== */

var SHEET_NAME_MASSADA = "massada";

var HEADERS_MASSADA = [
  "Data e Hora",
  "Número de Série",
  "Hora da Massada",
  "Exsudação",
  "Nível de Exsudação",
  "Perdeu a Massada",
  "Observações"
];

function getOrCreateSheetMassada() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME_MASSADA);

  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME_MASSADA);
  }

  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS_MASSADA);

    var headerRange = sh.getRange(1, 1, 1, HEADERS_MASSADA.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#2F3640");
    headerRange.setFontColor("#F3F6FF");
    headerRange.setHorizontalAlignment("center");

    sh.setColumnWidth(1, 160);  // Data e Hora
    sh.setColumnWidth(2, 160);  // Número de Série
    sh.setColumnWidth(3, 130);  // Hora da Massada
    sh.setColumnWidth(4, 110);  // Exsudação
    sh.setColumnWidth(5, 150);  // Nível de Exsudação
    sh.setColumnWidth(6, 140);  // Perdeu a Massada
    sh.setColumnWidth(7, 300);  // Observações

    sh.setFrozenRows(1);
  }

  return sh;
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var sh = getOrCreateSheetMassada();

    sh.appendRow([
      d.dataHora      || "",
      d.numSerie      || "",
      d.horaMassada   || "",
      d.exsudacao     || "",
      d.nivel         || "",
      d.perdeu        || "",
      d.observacoes   || ""
    ]);

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
        d.exsudacao     || "",
        d.nivel         || "",
        d.perdeu        || "",
        d.observacoes   || ""
      ]);
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

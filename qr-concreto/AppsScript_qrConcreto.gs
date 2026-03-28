/**
 * CONCRETRACK — qr-concreto Apps Script
 * Salva leituras de rompimento e fornece endpoint JSON para o relatório.
 *
 * COMO USAR:
 * 1. Abra o projecto GAS existente (WEBAPP_URL AKfycbxP...)
 * 2. Adicione / substitua o doGet() pelo código abaixo.
 * 3. Salve → Implantar → Nova versão (manter acesso: Qualquer pessoa)
 */

var SHEET_NAME = "Campinas";

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "";

  if (action === "listar") {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
      var data = sh.getDataRange().getValues();

      if (data.length < 2) {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: true, rows: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var headers = data[0].map(function (h) { return String(h).trim(); });
      var rows = [];
      for (var i = 1; i < data.length; i++) {
        var row = {};
        headers.forEach(function (h, j) { row[h] = String(data[i][j] !== null && data[i][j] !== undefined ? data[i][j] : ""); });
        rows.push(row);
      }

      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, rows: rows }))
        .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Resposta padrão para outros GETs
  return ContentService
    .createTextOutput(JSON.stringify({ status: "online" }))
    .setMimeType(ContentService.MimeType.JSON);
}

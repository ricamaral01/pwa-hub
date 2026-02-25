/**
 * CONCRETRACK — Parada Usina
 * Apps Script para gravar na aba "tecnica"
 *
 * Planilha: https://docs.google.com/spreadsheets/d/1m_a4gI3l3cO3YvwMBTZ5KA8dVcQ8cPiZ6utQzDJ77YM
 *
 * COMO USAR:
 * 1. Abra a planilha → Extensões → Apps Script
 * 2. Cole este código inteiro no editor (substitua qualquer conteúdo existente)
 * 3. Salve (Ctrl+S)
 * 4. Implantar → Nova implantação
 *    - Tipo: App da Web
 *    - Executar como: Eu (seu e-mail)
 *    - Quem tem acesso: Qualquer pessoa
 * 5. Copie a URL gerada e cole no index.html do PWA
 */

var SHEET_NAME = "tecnica";

var HEADERS = [
  "Data e Hora",
  "Equipamento",
  "Duração",
  "Motivo",
  "Descrição",
  "Responsável",
  "Status"
];

/**
 * Garante que a aba existe e tem cabeçalhos
 */
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);

  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
  }

  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);

    // Formatação do cabeçalho
    var headerRange = sh.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#2F3640");
    headerRange.setFontColor("#F3F6FF");
    headerRange.setHorizontalAlignment("center");

    // Larguras das colunas
    sh.setColumnWidth(1, 160);  // Data e Hora
    sh.setColumnWidth(2, 180);  // Equipamento
    sh.setColumnWidth(3, 100);  // Duração
    sh.setColumnWidth(4, 130);  // Motivo
    sh.setColumnWidth(5, 300);  // Descrição
    sh.setColumnWidth(6, 150);  // Responsável
    sh.setColumnWidth(7, 130);  // Status

    // Congela cabeçalho
    sh.setFrozenRows(1);
  }

  return sh;
}

/**
 * Recebe POST do PWA e grava na planilha
 */
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var sh = getOrCreateSheet();

    sh.appendRow([
      d.dataHora     || "",
      d.equipamento  || "",
      d.duracao      || "",
      d.motivo       || "",
      d.descricao    || "",
      d.responsavel  || "",
      d.status       || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: "Parada registrada com sucesso" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Permite teste via GET (abre no navegador para verificar)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "online",
      sheet: SHEET_NAME,
      columns: HEADERS
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Executa manualmente para criar a aba e cabeçalhos
 * Menu: Executar → setup
 */
function setup() {
  var sh = getOrCreateSheet();
  SpreadsheetApp.getUi().alert("Aba '" + SHEET_NAME + "' pronta com " + HEADERS.length + " colunas!");
}

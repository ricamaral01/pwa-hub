/**
 * CONCRETRACK — Apps Script Unificado
 * Grava nas abas "tecnica" e "massada" da mesma planilha
 *
 * Planilha: https://docs.google.com/spreadsheets/d/1m_a4gI3l3cO3YvwMBTZ5KA8dVcQ8cPiZ6utQzDJ77YM
 *
 * COMO USAR:
 * 1. Abra a planilha → Extensões → Apps Script
 * 2. APAGUE tudo que tiver no Código.gs
 * 3. Cole este código inteiro
 * 4. Salve (Ctrl+S)
 * 5. Clique em Executar → setup (cria as 2 abas com cabeçalhos)
 * 6. Implantar → Nova implantação
 *    - Tipo: App da Web
 *    - Executar como: Eu (seu e-mail)
 *    - Quem tem acesso: Qualquer pessoa
 * 7. Copie a URL e use nos 2 PWAs (parada-usina e massadas)
 *    É A MESMA URL PARA AMBOS!
 */

/* ===================== ABA TECNICA ===================== */

var SHEET_TECNICA = "tecnica";
var HEADERS_TECNICA = [
  "Data e Hora",
  "Equipamento",
  "Duração",
  "Motivo",
  "Descrição",
  "Responsável",
  "Status"
];

function getOrCreateSheetTecnica() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_TECNICA);
  if (!sh) sh = ss.insertSheet(SHEET_TECNICA);

  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS_TECNICA);
    var r = sh.getRange(1, 1, 1, HEADERS_TECNICA.length);
    r.setFontWeight("bold");
    r.setBackground("#2F3640");
    r.setFontColor("#F3F6FF");
    r.setHorizontalAlignment("center");
    sh.setColumnWidth(1, 160);
    sh.setColumnWidth(2, 180);
    sh.setColumnWidth(3, 100);
    sh.setColumnWidth(4, 130);
    sh.setColumnWidth(5, 300);
    sh.setColumnWidth(6, 150);
    sh.setColumnWidth(7, 130);
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ===================== ABA MASSADA ===================== */

var SHEET_MASSADA = "massada";
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
  var sh = ss.getSheetByName(SHEET_MASSADA);
  if (!sh) sh = ss.insertSheet(SHEET_MASSADA);

  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS_MASSADA);
    var r = sh.getRange(1, 1, 1, HEADERS_MASSADA.length);
    r.setFontWeight("bold");
    r.setBackground("#2F3640");
    r.setFontColor("#F3F6FF");
    r.setHorizontalAlignment("center");
    sh.setColumnWidth(1, 160);
    sh.setColumnWidth(2, 160);
    sh.setColumnWidth(3, 130);
    sh.setColumnWidth(4, 110);
    sh.setColumnWidth(5, 150);
    sh.setColumnWidth(6, 140);
    sh.setColumnWidth(7, 300);
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ================ ROTEAMENTO UNIFICADO ================ */

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);

    if (d.action === "registrar_parada") {
      var sh = getOrCreateSheetTecnica();
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
    }
    else {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "action desconhecida: " + (d.action || "vazio") }))
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

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "online",
      abas: [SHEET_TECNICA, SHEET_MASSADA],
      actions: ["registrar_parada", "registrar_massada"]
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ================ SETUP (executar 1 vez) ================ */

function setup() {
  getOrCreateSheetTecnica();
  getOrCreateSheetMassada();
  SpreadsheetApp.getUi().alert(
    "✅ Pronto!\n\n" +
    "Aba \"tecnica\" → " + HEADERS_TECNICA.length + " colunas\n" +
    "Aba \"massada\" → " + HEADERS_MASSADA.length + " colunas"
  );
}

/**
 * DOSAGEM DE CONCRETO — Apps Script para Traços
 * Grava e lista traços na aba "Página1" da planilha
 *
 * Planilha: https://docs.google.com/spreadsheets/d/1IG4nNa8lsRrUqn8UHnA5Hu6eD4A1vt8BJqepCTv8i14/edit?usp=sharing
 *
 * COMO USAR:
 * 1. Abra a planilha → Extensões → Apps Script
 * 2. APAGUE tudo que tiver no Código.gs
 * 3. Cole este código inteiro
 * 4. Salve (Ctrl+S)
 * 5. Clique em Executar → setup (cria a aba com cabeçalhos)
 * 6. Implantar → Nova implantação
 *    - Tipo: App da Web
 *    - Executar como: Eu (seu e-mail)
 *    - Quem tem acesso: Qualquer pessoa
 * 7. Copie a URL gerada e cole na variável DOSAGEM_WEBAPP_URL no index.html
 */

var SHEET_TRACOS = "Página1";
var HEADERS_TRACOS = [
  "ID",
  "Data e Hora",
  "Nome do Traço",
  "FCK (MPa)",
  "Cimento (kg)",
  "Adição (kg)",
  "Areia Natural (kg)",
  "Areia Industrial (kg)",
  "Brita 0 (kg)",
  "Brita 1/2 (kg)",
  "Água (kg)",
  "Aditivo SP (kg)",
  "Ar Incorporado (%)",
  "Flow (mm)",
  "a/c",
  "a/agl",
  "Consumo Cimento (kg/m³)",
  "Massa Esp. Concreto (kg/m³)",
  "Volume Total (L)",
  "Teor Argamassa Massa (%)",
  "Teor Argamassa Volume (%)",
  "Observações"
];

function getOrCreateSheetTracos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_TRACOS);
  if (!sh) sh = ss.insertSheet(SHEET_TRACOS);

  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS_TRACOS);
    var r = sh.getRange(1, 1, 1, HEADERS_TRACOS.length);
    r.setFontWeight("bold");
    r.setBackground("#1a5276");
    r.setFontColor("#FFFFFF");
    r.setHorizontalAlignment("center");
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(2, 160);
    sh.setColumnWidth(3, 200);
    sh.setColumnWidth(4, 90);
    for (var i = 5; i <= 12; i++) sh.setColumnWidth(i, 120);
    sh.setColumnWidth(13, 130);
    sh.setColumnWidth(14, 100);
    sh.setColumnWidth(15, 80);
    sh.setColumnWidth(16, 80);
    sh.setColumnWidth(17, 160);
    sh.setColumnWidth(18, 180);
    sh.setColumnWidth(19, 120);
    sh.setColumnWidth(20, 160);
    sh.setColumnWidth(21, 160);
    sh.setColumnWidth(22, 300);
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ================ ROTEAMENTO ================ */

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);

    if (d.action === "salvar_traco") {
      var sh = getOrCreateSheetTracos();
      sh.appendRow([
        d.id            || "",
        d.dataHora      || "",
        d.nomeTraco     || "",
        d.fck           || "",
        d.cimento       || "",
        d.adicao        || "",
        d.areiaNatural  || "",
        d.areiaIndustrial || "",
        d.brita0        || "",
        d.brita1        || "",
        d.agua          || "",
        d.aditivoSP     || "",
        d.arIncorporado || "",
        d.flow          || "",
        d.ac            || "",
        d.aAgl          || "",
        d.consumoCimento || "",
        d.massaEspConcreto || "",
        d.volumeTotal   || "",
        d.teorArgMassa  || "",
        d.teorArgVolume || "",
        d.observacoes   || ""
      ]);

      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, message: "Traço salvo com sucesso!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "action desconhecida: " + (d.action || "vazio") }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "";

    if (action === "listar_tracos") {
      var sh = getOrCreateSheetTracos();
      var lastRow = sh.getLastRow();
      if (lastRow <= 1) {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: true, tracos: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var data = sh.getRange(2, 1, lastRow - 1, HEADERS_TRACOS.length).getValues();
      var tracos = [];
      for (var i = 0; i < data.length; i++) {
        tracos.push({
          id: data[i][0],
          dataHora: data[i][1],
          nomeTraco: data[i][2],
          fck: data[i][3],
          cimento: data[i][4],
          adicao: data[i][5],
          areiaNatural: data[i][6],
          areiaIndustrial: data[i][7],
          brita0: data[i][8],
          brita1: data[i][9],
          agua: data[i][10],
          aditivoSP: data[i][11],
          arIncorporado: data[i][12],
          flow: data[i][13],
          ac: data[i][14],
          aAgl: data[i][15],
          consumoCimento: data[i][16],
          massaEspConcreto: data[i][17],
          volumeTotal: data[i][18],
          teorArgMassa: data[i][19],
          teorArgVolume: data[i][20],
          observacoes: data[i][21]
        });
      }
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, tracos: tracos }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "online", aba: SHEET_TRACOS, actions: ["salvar_traco", "listar_tracos"] }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ================ SETUP (executar 1 vez) ================ */

function setup() {
  getOrCreateSheetTracos();
  SpreadsheetApp.getUi().alert(
    "✅ Pronto!\n\n" +
    "Aba \"" + SHEET_TRACOS + "\" → " + HEADERS_TRACOS.length + " colunas"
  );
}

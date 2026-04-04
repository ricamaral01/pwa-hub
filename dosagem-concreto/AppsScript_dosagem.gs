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
var SHEET_EXPERIMENTAL = "Experimental";
var SHEET_CARTAS = "CartasTraco";

var HEADERS_CARTAS = [
  "ID", "Data/Hora", "Nome do Traço", "Versão", "Unidade",
  "Ativa Automação", "Nome Automação", "Revisão",
  "Cliente", "Obra", "Local", "Aplicação",
  "Engenheiro", "Técnico", "ART/RRT", "Data Carta",
  "FCK (MPa)", "Flow (mm)", "a/c",
  "Cimento (kg)", "Adição (kg)", "Areia Nat (kg)", "Areia Ind (kg)",
  "Brita 0 (kg)", "Brita 1/2 (kg)", "Água (kg)", "Aditivo (kg)",
  "% Aditivo/Lig", "Ar (%)", "Observações",
  "Custo Total (R$/m³)", "Custo Ligantes", "Custo Agregados", "Custo Quím./Água", "MCC Snapshot"
];

var HEADERS_TRACOS = [
  "ID",
  "Data e Hora",
  "Nome do Traço",
  "FCK (MPa)",
  "Cimento (kg)",
  "Adição (kg)",
  "Areia Natural (kg)",
  "Areia Industrial (kg)",
  "Custo Total (R$/m³)", "Custo Ligantes", "Custo Agregados", "Custo Quím./Água", "MCC Snapshot",
  "Volume Total (L)", "Teor Argamassa Massa (%)", "Teor Argamassa Volume (%)"
  "Brita 1/2 (kg)",

function ensureSheetCartasHeaders(sh) {
  var currentCols = sh.getLastColumn();
  if (currentCols >= HEADERS_CARTAS.length) return;

  sh.getRange(1, currentCols + 1, 1, HEADERS_CARTAS.length - currentCols)
    .setValues([HEADERS_CARTAS.slice(currentCols)]);

  var r = sh.getRange(1, 1, 1, HEADERS_CARTAS.length);
  r.setFontWeight("bold");
  r.setBackground("#1a3a5c");
  r.setFontColor("#FFFFFF");
  r.setHorizontalAlignment("center");
  sh.setFrozenRows(1);
  for (var i = currentCols + 1; i <= HEADERS_CARTAS.length; i++) sh.setColumnWidth(i, 140);
}
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

var HEADERS_EXPERIMENTAL = [
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
  "Volume Betonada (L)",
  "Nº Betonadas",
  "Umid. Areia Nat. (%)",
  "Umid. Areia Ind. (%)",
  "Umid. Brita 0 (%)",
  "Umid. Brita 1/2 (%)",
  "Tipo Consistência",
  "Consistência (mm)",
  "Temp. Ambiente (°C)",
  "Temp. Concreto (°C)",
  "a/c",
  "a/agl",
  "Consumo Cimento (kg/m³)",
  "R24h CP1 (MPa)",
  "R24h CP2 (MPa)",
  "R3d CP1 (MPa)",
  "R3d CP2 (MPa)",
  "R7d CP1 (MPa)",
  "R7d CP2 (MPa)",
  "R28d CP1 (MPa)",
  "R28d CP2 (MPa)",
  "Consist. 10min (mm)",
  "Consist. 20min (mm)",
  "Consist. 30min (mm)",
  "Observações"
];

function getOrCreateSheetCartas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_CARTAS);
  if (!sh) sh = ss.insertSheet(SHEET_CARTAS);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS_CARTAS);
    var r = sh.getRange(1, 1, 1, HEADERS_CARTAS.length);
    r.setFontWeight("bold");
    r.setBackground("#1a3a5c");
    r.setFontColor("#FFFFFF");
    r.setHorizontalAlignment("center");
    sh.setFrozenRows(1);
    for (var i = 1; i <= HEADERS_CARTAS.length; i++) sh.setColumnWidth(i, 140);
  } else {
    ensureSheetCartasHeaders(sh);
  }
  return sh;
}

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

function getOrCreateSheetExperimental() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_EXPERIMENTAL);
  if (!sh) sh = ss.insertSheet(SHEET_EXPERIMENTAL);

  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS_EXPERIMENTAL);
    var r = sh.getRange(1, 1, 1, HEADERS_EXPERIMENTAL.length);
    r.setFontWeight("bold");
    r.setBackground("#283593");
    r.setFontColor("#FFFFFF");
    r.setHorizontalAlignment("center");
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(2, 160);
    sh.setColumnWidth(3, 200);
    for (var i = 4; i <= HEADERS_EXPERIMENTAL.length; i++) sh.setColumnWidth(i, 130);
    sh.setColumnWidth(HEADERS_EXPERIMENTAL.length, 300);
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ================ ROTEAMENTO ================ */

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);

    if (d.action === "salvar_carta_traco") {
      var sh = getOrCreateSheetCartas();
      var lig = (d.cim || 0) + (d.adic || 0);
      var ac  = lig > 0 ? (d.agua || 0) / lig : "";
      sh.appendRow([
        d.id              || "",
        d.dataHora        || "",
        d.tracoNome       || "",
        d.versao          || 1,
        d.unidade         || "",
        d.ativaAutomacao  ? "SIM" : "NÃO",
        d.nomeAutomacao   || "",
        d.revisaoTraco    || 0,
        d.cliente         || "",
        d.obra            || "",
        d.local           || "",
        d.aplicacao       || "",
        d.engenheiro      || "",
        d.tecnicoResp     || "",
        d.art             || "",
        d.data            || "",
        d.fck             || "",
        d.flow            || "",
        ac                || "",
        d.cim             || "",
        d.adic            || "",
        d.an              || "",
        d.ai              || "",
        d.b0              || "",
        d.b1              || "",
        d.agua            || "",
        d.adit            || "",
        d.pctAdit         || "",
        d.ar              || "",
        d.obs             || "",
        d.custoTotal      || 0,
        d.custoLigantes   || 0,
        d.custoAgregados  || 0,
        d.custoQuimicos   || 0,
        d.mccSnapshot     ? JSON.stringify(d.mccSnapshot) : "",
        d.volumeTotal     || 0,
        d.teorArgMassa    || 0,
        d.teorArgVolume   || 0
      ]);
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, message: "Carta traço salva!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

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

    if (d.action === "salvar_experimental") {
      var sh = getOrCreateSheetExperimental();
      sh.appendRow([
        d.id               || "",
        d.dataHora         || "",
        d.nomeTraco        || "",
        d.fck              || "",
        d.cimento          || "",
        d.adicao           || "",
        d.areiaNatural     || "",
        d.areiaIndustrial  || "",
        d.brita0           || "",
        d.brita1           || "",
        d.agua             || "",
        d.aditivoSP        || "",
        d.arIncorporado    || "",
        d.volumeBetonada   || "",
        d.numBetonadas     || "",
        d.umAN             || "",
        d.umAI             || "",
        d.umB0             || "",
        d.umB1             || "",
        d.tipoConsistencia || "",
        d.consistencia     || "",
        d.tempAmbiente     || "",
        d.tempConcreto     || "",
        d.ac               || "",
        d.aAgl             || "",
        d.consumoCimento   || "",
        d.r24h_1           || "",
        d.r24h_2           || "",
        d.r3d_1            || "",
        d.r3d_2            || "",
        d.r7d_1            || "",
        d.r7d_2            || "",
        d.r28d_1           || "",
        d.r28d_2           || "",
        d.consist10min     || "",
        d.consist20min     || "",
        d.consist30min     || "",
        d.observacoes      || ""
      ]);

      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, message: "Traço experimental salvo!" }))
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

    if (action === "listar_cartas_traco") {
      var sh = getOrCreateSheetCartas();
      var lastRow = sh.getLastRow();
      if (lastRow <= 1) {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: true, cartas: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var data = sh.getRange(2, 1, lastRow - 1, HEADERS_CARTAS.length).getValues();
      var unidadeFiltro = (e && e.parameter && e.parameter.unidade) ? e.parameter.unidade : "";
      var cartas = [];
      for (var i = 0; i < data.length; i++) {
        if (unidadeFiltro && data[i][4] !== unidadeFiltro) continue;
        cartas.push({
          id:             data[i][0],
          dataHora:       data[i][1],
          tracoNome:      data[i][2],
          versao:         data[i][3],
          unidade:        data[i][4],
          ativaAutomacao: data[i][5] === "SIM",
          nomeAutomacao:  data[i][6],
          revisaoTraco:   data[i][7],
          cliente:        data[i][8],
          obra:           data[i][9],
          local:          data[i][10],
          aplicacao:      data[i][11],
          engenheiro:     data[i][12],
          tecnicoResp:    data[i][13],
          art:            data[i][14],
          data:           data[i][15],
          fck:            data[i][16],
          flow:           data[i][17],
          ac:             data[i][18],
          cim:            data[i][19],
          adic:           data[i][20],
          an:             data[i][21],
          ai:             data[i][22],
          b0:             data[i][23],
          b1:             data[i][24],
          agua:           data[i][25],
          adit:           data[i][26],
          pctAdit:        data[i][27],
          ar:             data[i][28],
          obs:            data[i][29],
          custoTotal:     Number(data[i][30]) || 0,
          custoLigantes:  Number(data[i][31]) || 0,
          custoAgregados: Number(data[i][32]) || 0,
          custoQuimicos:  Number(data[i][33]) || 0,
          mccSnapshot:    (function(v){ try { return v ? JSON.parse(v) : {}; } catch(e) { return {}; } })(data[i][34]),
          volumeTotal:    Number(data[i][35]) || 0,
          teorArgMassa:   Number(data[i][36]) || 0,
          teorArgVolume:  Number(data[i][37]) || 0
        });
      }
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, cartas: cartas }))
        .setMimeType(ContentService.MimeType.JSON);
    }

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

    if (action === "listar_experimentais") {
      var sh = getOrCreateSheetExperimental();
      var lastRow = sh.getLastRow();
      if (lastRow <= 1) {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: true, tracos: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var data = sh.getRange(2, 1, lastRow - 1, HEADERS_EXPERIMENTAL.length).getValues();
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
          volumeBetonada: data[i][13],
          numBetonadas: data[i][14],
          umAN: data[i][15],
          umAI: data[i][16],
          umB0: data[i][17],
          umB1: data[i][18],
          tipoConsistencia: data[i][19],
          consistencia: data[i][20],
          tempAmbiente: data[i][21],
          tempConcreto: data[i][22],
          ac: data[i][23],
          aAgl: data[i][24],
          consumoCimento: data[i][25],
          r24h_1: data[i][26],
          r24h_2: data[i][27],
          r3d_1: data[i][28],
          r3d_2: data[i][29],
          r7d_1: data[i][30],
          r7d_2: data[i][31],
          r28d_1: data[i][32],
          r28d_2: data[i][33],
          consist10min: data[i][34],
          consist20min: data[i][35],
          consist30min: data[i][36],
          observacoes: data[i][37]
        });
      }
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, tracos: tracos }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "online",
        abas: [SHEET_TRACOS, SHEET_EXPERIMENTAL, SHEET_CARTAS],
        actions: ["salvar_traco", "salvar_experimental", "listar_tracos", "listar_experimentais", "salvar_carta_traco", "listar_cartas_traco"]
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ================ SETUP (executar 1 vez) ================ */

function setup() {
  getOrCreateSheetCartas();
  getOrCreateSheetTracos();
  getOrCreateSheetExperimental();
  SpreadsheetApp.getUi().alert(
    "✅ Pronto!\n\n" +
    "Aba \"" + SHEET_CARTAS + "\" → " + HEADERS_CARTAS.length + " colunas\n" +
    "Aba \"" + SHEET_TRACOS + "\" → " + HEADERS_TRACOS.length + " colunas\n" +
    "Aba \"" + SHEET_EXPERIMENTAL + "\" → " + HEADERS_EXPERIMENTAL.length + " colunas"
  );
}

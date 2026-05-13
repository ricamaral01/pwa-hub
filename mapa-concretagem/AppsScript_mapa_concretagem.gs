/**
 * MAPA CONCRETAGEM — Apps Script
 * Salva dados de produção/liberação na planilha específica
 *
 * Planilha: https://docs.google.com/spreadsheets/d/1uV-H5hGRyqR04xb9wKF8__xl5-XLt68CEKKkM30JF1o
 * Aba: Pagina1
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

var SPREADSHEET_ID = "1uV-H5hGRyqR04xb9wKF8__xl5-XLt68CEKKkM30JF1o";
var SHEET_NAME = "Pagina1";

function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === "status") {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, message: "API Mapa Concretagem ativa" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Ação GET inválida" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "salvar_forma_click") {
      return salvarFormaClick(data);
    }

    if (action === "salvar_inspecao_lote") {
      return salvarInspecaoLote(data);
    }

    if (action === "listar_inspecao_pendentes") {
      return listarInspecaoPendentes(data);
    }

    if (action === "relatorio_setor") {
      return relatorioSetor(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Ação desconhecida: " + action }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function salvarFormaClick(data) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

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
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

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
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

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
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

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
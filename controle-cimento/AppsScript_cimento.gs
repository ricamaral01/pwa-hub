/**
 * CONCRETRACK — Controle de Cimento (Silos)
 * Apps Script back-end para o PWA
 *
 * Planilha de consumo:
 *   https://docs.google.com/spreadsheets/d/1xCNgiN9bb5ItdqvLvnxS-uw_H9N8CA6aCn5ds_ydy3A/edit?gid=454887708#gid=454887708
 *
 * COMO USAR:
 * 1. Abra a planilha → Extensões → Apps Script
 * 2. Cole este código inteiro (substitua qualquer conteúdo existente)
 * 3. Salve (Ctrl+S)
 * 4. Implantar → Nova implantação
 *    - Tipo: App da Web
 *    - Executar como: Eu (seu e-mail)
 *    - Quem tem acesso: Qualquer pessoa
 * 5. Copie a URL gerada e cole na const API_URL do index.html do PWA
 */

// ========================
// CONFIGURAÇÃO
// ========================
const NOME_ABA          = 'arquivo';
const NOME_ABA_ENTRADAS = 'entradas_silo';
const NOME_ABA_SALDO    = 'saldo_inicial';

const CONSUMO_WINDOW_DIAS = 180;
const CACHE_TTL_SEG       = 300;   // 5 min (dados de consumo não mudam com tanta freq.)
const CACHE_MAX_CHARS     = 90000;
const MAX_LINHAS_LEITURA  = 5000;  // Lê no máximo as últimas N linhas da aba arquivo

// Colunas da aba "arquivo" (0-based)
const COL_DATA   = 0;   // A – TimeStamp
const COL_SILO_1 = 18;  // S – Silo 1
const COL_SILO_2 = 19;  // T – Silo 2
const COL_SILO_3 = 20;  // U – Silo 3

// ========================
// ROTEADOR — GET e POST
// ========================
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  var result;

  try {
    switch (action) {
      case 'consumo':
        result = getConsumoDados();
        break;
      case 'entradas':
        result = getEntradasRegistradas();
        break;
      case 'saldo_inicial':
        result = getSaldoInicial();
        break;
      default:
        result = { error: 'Ação GET não reconhecida: ' + action };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result;

  try {
    var d = JSON.parse(e.postData.contents);
    var action = d.action || '';

    switch (action) {
      // === Leituras (GET via POST para evitar CORS) ===
      case 'get_consumo':
        result = getConsumoDados();
        break;
      case 'get_entradas':
        result = getEntradasRegistradas();
        break;
      case 'get_saldo_inicial':
        result = getSaldoInicial();
        break;
      // === Escritas ===
      case 'registrar_entrada':
        result = registrarEntrada(d.data, d.silo, d.qtd, d.fornecedor, d.tipo, d.nf);
        break;
      case 'deletar_entrada':
        result = deletarEntrada(d.id);
        break;
      case 'salvar_saldo_inicial':
        result = salvarSaldoInicial(d.silo1, d.silo2, d.silo3, d.data);
        break;
      default:
        result = { error: 'Ação POST não reconhecida: ' + action };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================
// PARSE DATA FLEXÍVEL
// ========================
function parseDataFlex(dataCell) {
  if (dataCell instanceof Date) return dataCell;
  if (!dataCell) return null;

  var texto = String(dataCell).trim();
  if (!texto) return null;

  // dd/MM/yyyy
  var m = texto.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    var dia = Number(m[1]);
    var mes = Number(m[2]) - 1;
    var ano = Number(m[3]);
    if (ano < 100) ano += 2000;
    return new Date(ano, mes, dia);
  }

  // yyyy-MM-dd
  m = texto.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  var d = new Date(texto);
  if (!isNaN(d.getTime())) return d;
  return null;
}

// ========================
// CONSUMO — lê aba "arquivo"
// ========================
function getConsumoDados() {
  var cache = CacheService.getScriptCache();
  var cacheKey = 'consumo_v3_agregado_' + CONSUMO_WINDOW_DIAS;
  var cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(NOME_ABA);
  if (!sheet) throw new Error('Aba "' + NOME_ABA + '" não encontrada.');

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // Otimização: lê apenas as últimas MAX_LINHAS_LEITURA linhas
  var startRow = Math.max(2, lastRow - MAX_LINHAS_LEITURA + 1);
  var n = lastRow - startRow + 1;
  var colA  = sheet.getRange(startRow, 1,  n, 1).getValues();
  var colSU = sheet.getRange(startRow, 19, n, 3).getValues();

  var tz = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  var hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  var minDate = new Date(hoje);
  minDate.setDate(minDate.getDate() - CONSUMO_WINDOW_DIAS);

  var map = {};

  for (var i = n - 1; i >= 0; i--) {
    var d = parseDataFlex(colA[i][0]);
    if (!d) continue;

    var d0 = new Date(d);
    d0.setHours(0, 0, 0, 0);

    if (d0 > hoje) continue;
    if (d0 < minDate) break;

    var dataISO = Utilities.formatDate(d, tz, 'yyyy-MM-dd');

    var c1 = Number(colSU[i][0] || 0) / 1000;
    var c2 = Number(colSU[i][1] || 0) / 1000;
    var c3 = Number(colSU[i][2] || 0) / 1000;

    if (!isNaN(c1) && c1 !== 0) {
      var k1 = dataISO + '|Silo 1';
      map[k1] = (map[k1] || 0) + c1;
    }
    if (!isNaN(c2) && c2 !== 0) {
      var k2 = dataISO + '|Silo 2';
      map[k2] = (map[k2] || 0) + c2;
    }
    if (!isNaN(c3) && c3 !== 0) {
      var k3 = dataISO + '|Silo 3';
      map[k3] = (map[k3] || 0) + c3;
    }
  }

  var resultados = [];
  for (var key in map) {
    var parts = key.split('|');
    var dataISO2 = parts[0];
    var silo = parts[1];
    resultados.push({
      data: dataISO2,
      ano: Number(dataISO2.slice(0, 4)),
      mes: Number(dataISO2.slice(5, 7)),
      silo: silo,
      consumo: map[key]
    });
  }

  resultados.sort(function(a, b) {
    return a.data === b.data ? a.silo.localeCompare(b.silo) : a.data.localeCompare(b.data);
  });

  var json = JSON.stringify(resultados);
  if (json.length < CACHE_MAX_CHARS) {
    cache.put(cacheKey, json, CACHE_TTL_SEG);
  }

  return resultados;
}

// ========================
// ENTRADAS — lê aba "entradas_silo"
// ========================
function getEntradasRegistradas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(NOME_ABA_ENTRADAS);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var numLinhas = lastRow - 1;
  var numColunas = Math.max(7, sheet.getLastColumn());
  var values = sheet.getRange(2, 1, numLinhas, numColunas).getValues();

  var tz = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  var lista = [];
  var needSaveIds = false;
  var idValues = sheet.getRange(2, 6, numLinhas, 1).getValues();

  for (var i = 0; i < numLinhas; i++) {
    var row = values[i];
    var d = parseDataFlex(row[0]);
    if (!d || !row[1]) continue;

    var qtd = Number(row[2]);
    if (isNaN(qtd) || qtd === 0) continue;

    var id = row[5];
    if (!id) {
      id = Utilities.getUuid();
      idValues[i][0] = id;
      needSaveIds = true;
    }

    lista.push({
      id: id,
      data: Utilities.formatDate(d, tz, 'yyyy-MM-dd'),
      silo: String(row[1]),
      qtd: qtd,
      fornecedor: row[3] || '',
      tipo: row[4] || '',
      nf: row[6] ? String(row[6]) : ''
    });
  }

  if (needSaveIds) {
    sheet.getRange(2, 6, numLinhas, 1).setValues(idValues);
  }

  return lista;
}

// ========================
// REGISTRAR ENTRADA
// ========================
function registrarEntrada(dataISO, silo, qtd, fornecedor, tipo, nf) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(NOME_ABA_ENTRADAS);
  if (!sheet) {
    sheet = ss.insertSheet(NOME_ABA_ENTRADAS);
    sheet.getRange(1, 1, 1, 7).setValues([[
      'Data', 'Silo', 'Quantidade (t)', 'Fornecedor', 'Tipo', 'ID', 'NF'
    ]]);
    sheet.setFrozenRows(1);
  }

  var d = parseDataFlex(dataISO) || new Date(dataISO);
  var id = Utilities.getUuid();
  sheet.appendRow([d, silo, qtd, fornecedor || '', tipo || '', id, nf || '']);

  return { ok: true, id: id };
}

// ========================
// DELETAR ENTRADA
// ========================
function deletarEntrada(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(NOME_ABA_ENTRADAS);
  if (!sheet) return { ok: false, msg: 'Aba de entradas não encontrada.' };

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: false, msg: 'Nenhuma entrada para excluir.' };

  var ids = sheet.getRange(2, 6, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      sheet.deleteRow(2 + i);
      return { ok: true };
    }
  }

  return { ok: false, msg: 'ID não encontrado.' };
}

// ========================
// SALDO INICIAL — aba "saldo_inicial"
// ========================
function getSaldoInicial() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(NOME_ABA_SALDO);
  if (!sheet) return { data: '', silo1: 0, silo2: 0, silo3: 0 };

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { data: '', silo1: 0, silo2: 0, silo3: 0 };

  var row = sheet.getRange(lastRow, 1, 1, 4).getValues()[0];
  var tz = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  var d = parseDataFlex(row[0]);
  var dataISO = d ? Utilities.formatDate(d, tz, 'yyyy-MM-dd') : '';

  return {
    data: dataISO,
    silo1: Number(row[1]) || 0,
    silo2: Number(row[2]) || 0,
    silo3: Number(row[3]) || 0
  };
}

function salvarSaldoInicial(silo1, silo2, silo3, dataISO) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(NOME_ABA_SALDO);
  if (!sheet) {
    sheet = ss.insertSheet(NOME_ABA_SALDO);
    sheet.getRange(1, 1, 1, 4).setValues([[
      'Data', 'Silo 1 (t)', 'Silo 2 (t)', 'Silo 3 (t)'
    ]]);
    sheet.setFrozenRows(1);
  }

  var d = parseDataFlex(dataISO) || new Date(dataISO);
  sheet.appendRow([d, Number(silo1), Number(silo2), Number(silo3)]);

  return { ok: true };
}

// ========================
// MENU
// ========================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧱 Cimento')
    .addItem('Abrir Controle de Cimento', 'abrirCimento')
    .addToUi();
}

function abrirCimento() {
  var url = '<<COLE_A_URL_DO_SEU_PWA_AQUI>>';
  var html = HtmlService.createHtmlOutput(
    '<script>window.open("' + url + '","_blank");google.script.host.close();</script>'
  ).setWidth(300).setHeight(80);
  SpreadsheetApp.getUi().showModalDialog(html, 'Abrindo…');
}

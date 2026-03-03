/**
 * CONCRETRACK — Controle de Agregados
 * Apps Script back-end para o PWA
 *
 * Planilha de consumo (mesma do cimento):
 *   https://docs.google.com/spreadsheets/d/1xCNgiN9bb5ItdqvLvnxS-uw_H9N8CA6aCn5ds_ydy3A/edit?gid=454887708#gid=454887708
 *
 * COMO USAR:
 * 1. Abra a planilha → Extensões → Apps Script
 * 2. Crie um novo arquivo .gs (ex: Agregados.gs)
 * 3. Cole este código inteiro
 * 4. Salve (Ctrl+S)
 * 5. Implantar → Nova implantação
 *    - Tipo: App da Web
 *    - Executar como: Eu (seu e-mail)
 *    - Quem tem acesso: Qualquer pessoa
 * 6. Copie a URL gerada e cole na const API_URL do index.html do PWA
 *
 * ATENÇÃO: Se o script de cimento já estiver no mesmo projeto,
 * renomeie as funções doGet/doPost para evitar conflito,
 * ou crie um novo projeto Apps Script vinculado à mesma planilha.
 */

// ========================
// CONFIGURAÇÃO
// ========================
const NOME_ABA          = 'arquivo';
const NOME_ABA_ENTRADAS = 'entradas_agregados';
const NOME_ABA_SALDO    = 'saldo_inicial_agregados';

const CONSUMO_WINDOW_DIAS = 180;
const CACHE_TTL_SEG       = 300;   // 5 min
const CACHE_MAX_CHARS     = 90000;
const MAX_LINHAS_LEITURA  = 5000;

// Colunas da aba "arquivo" (0-based)
const COL_DATA       = 0;   // A – TimeStamp
// Agregados (1-based para getRange, 0-based para arrays lidos)
const COL_RANGE_INI  = 10;  // J (1-based) — início do range de leitura
const COL_RANGE_QTD  = 5;   // J até N = 5 colunas
// Índices dentro do range lido (0-based)
const IDX_AREIA_IND  = 0;   // J — Areia Industrial
const IDX_AREIA_NAT  = 1;   // K — Areia Natural
// L = coluna 12 — ignorada (índice 2)
const IDX_BRITA_12   = 3;   // M — Brita 1/2
const IDX_BRITA_0    = 4;   // N — Brita 0

const MATERIAIS = ['Areia Natural', 'Areia Industrial', 'Brita 0', 'Brita 1/2'];
const MAT_IDX = {
  'Areia Industrial': IDX_AREIA_IND,
  'Areia Natural':    IDX_AREIA_NAT,
  'Brita 0':          IDX_BRITA_0,
  'Brita 1/2':        IDX_BRITA_12
};

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
        result = registrarEntrada(d.data, d.material, d.qtd, d.fornecedor, d.nf);
        break;
      case 'deletar_entrada':
        result = deletarEntrada(d.id);
        break;
      case 'salvar_saldo_inicial':
        result = salvarSaldoInicial(d.areiaNatural, d.areiaIndustrial, d.brita0, d.brita12, d.data);
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
  var cacheKey = 'consumo_agreg_v1_' + CONSUMO_WINDOW_DIAS;
  var cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(NOME_ABA);
  if (!sheet) throw new Error('Aba "' + NOME_ABA + '" não encontrada.');

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var startRow = Math.max(2, lastRow - MAX_LINHAS_LEITURA + 1);
  var n = lastRow - startRow + 1;
  var colA   = sheet.getRange(startRow, 1, n, 1).getValues();                   // Coluna A (data)
  var colJN  = sheet.getRange(startRow, COL_RANGE_INI, n, COL_RANGE_QTD).getValues(); // Colunas J-N

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

    // Valores em gramas → toneladas (÷1000)
    var vAN  = Number(colJN[i][IDX_AREIA_NAT]  || 0) / 1000;
    var vAI  = Number(colJN[i][IDX_AREIA_IND]  || 0) / 1000;
    var vB0  = Number(colJN[i][IDX_BRITA_0]    || 0) / 1000;
    var vB12 = Number(colJN[i][IDX_BRITA_12]   || 0) / 1000;

    if (!isNaN(vAN) && vAN !== 0) {
      var kAN = dataISO + '|Areia Natural';
      map[kAN] = (map[kAN] || 0) + vAN;
    }
    if (!isNaN(vAI) && vAI !== 0) {
      var kAI = dataISO + '|Areia Industrial';
      map[kAI] = (map[kAI] || 0) + vAI;
    }
    if (!isNaN(vB0) && vB0 !== 0) {
      var kB0 = dataISO + '|Brita 0';
      map[kB0] = (map[kB0] || 0) + vB0;
    }
    if (!isNaN(vB12) && vB12 !== 0) {
      var kB12 = dataISO + '|Brita 1/2';
      map[kB12] = (map[kB12] || 0) + vB12;
    }
  }

  var resultados = [];
  for (var key in map) {
    var parts = key.split('|');
    var dataISO2 = parts[0];
    var material = parts[1];
    resultados.push({
      data: dataISO2,
      ano: Number(dataISO2.slice(0, 4)),
      mes: Number(dataISO2.slice(5, 7)),
      material: material,
      consumo: map[key]
    });
  }

  resultados.sort(function(a, b) {
    return a.data === b.data ? a.material.localeCompare(b.material) : a.data.localeCompare(b.data);
  });

  var json = JSON.stringify(resultados);
  if (json.length < CACHE_MAX_CHARS) {
    cache.put(cacheKey, json, CACHE_TTL_SEG);
  }

  return resultados;
}

// ========================
// ENTRADAS — lê aba "entradas_agregados"
// ========================
function getEntradasRegistradas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(NOME_ABA_ENTRADAS);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var numLinhas = lastRow - 1;
  var numColunas = Math.max(6, sheet.getLastColumn());
  var values = sheet.getRange(2, 1, numLinhas, numColunas).getValues();

  var tz = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  var lista = [];
  var needSaveIds = false;
  var idValues = sheet.getRange(2, 5, numLinhas, 1).getValues();

  for (var i = 0; i < numLinhas; i++) {
    var row = values[i];
    var d = parseDataFlex(row[0]);
    if (!d || !row[1]) continue;

    var qtd = Number(row[2]);
    if (isNaN(qtd) || qtd === 0) continue;

    var id = row[4];
    if (!id) {
      id = Utilities.getUuid();
      idValues[i][0] = id;
      needSaveIds = true;
    }

    lista.push({
      id: id,
      data: Utilities.formatDate(d, tz, 'yyyy-MM-dd'),
      material: String(row[1]),
      qtd: qtd,
      fornecedor: row[3] || '',
      nf: row[5] ? String(row[5]) : ''
    });
  }

  if (needSaveIds) {
    sheet.getRange(2, 5, numLinhas, 1).setValues(idValues);
  }

  return lista;
}

// ========================
// REGISTRAR ENTRADA
// ========================
function registrarEntrada(dataISO, material, qtd, fornecedor, nf) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(NOME_ABA_ENTRADAS);
  if (!sheet) {
    sheet = ss.insertSheet(NOME_ABA_ENTRADAS);
    sheet.getRange(1, 1, 1, 6).setValues([[
      'Data', 'Material', 'Quantidade (t)', 'Fornecedor', 'ID', 'NF'
    ]]);
    sheet.setFrozenRows(1);
  }

  var d = parseDataFlex(dataISO) || new Date(dataISO);
  var id = Utilities.getUuid();
  sheet.appendRow([d, material, qtd, fornecedor || '', id, nf || '']);

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

  var ids = sheet.getRange(2, 5, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      sheet.deleteRow(2 + i);
      return { ok: true };
    }
  }

  return { ok: false, msg: 'ID não encontrado.' };
}

// ========================
// SALDO INICIAL — aba "saldo_inicial_agregados"
// ========================
function getSaldoInicial() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(NOME_ABA_SALDO);
  if (!sheet) return { data: '', areiaNatural: 0, areiaIndustrial: 0, brita0: 0, brita12: 0 };

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { data: '', areiaNatural: 0, areiaIndustrial: 0, brita0: 0, brita12: 0 };

  var row = sheet.getRange(lastRow, 1, 1, 5).getValues()[0];
  var tz = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  var d = parseDataFlex(row[0]);
  var dataISO = d ? Utilities.formatDate(d, tz, 'yyyy-MM-dd') : '';

  return {
    data: dataISO,
    areiaNatural:    Number(row[1]) || 0,
    areiaIndustrial: Number(row[2]) || 0,
    brita0:          Number(row[3]) || 0,
    brita12:         Number(row[4]) || 0
  };
}

function salvarSaldoInicial(areiaNatural, areiaIndustrial, brita0, brita12, dataISO) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(NOME_ABA_SALDO);
  if (!sheet) {
    sheet = ss.insertSheet(NOME_ABA_SALDO);
    sheet.getRange(1, 1, 1, 5).setValues([[
      'Data', 'Areia Natural (t)', 'Areia Industrial (t)', 'Brita 0 (t)', 'Brita 1/2 (t)'
    ]]);
    sheet.setFrozenRows(1);
  }

  var d = parseDataFlex(dataISO) || new Date(dataISO);
  sheet.appendRow([d, Number(areiaNatural), Number(areiaIndustrial), Number(brita0), Number(brita12)]);

  return { ok: true };
}

// ========================
// MENU
// ========================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🪨 Agregados')
    .addItem('Abrir Controle de Agregados', 'abrirAgregados')
    .addToUi();
}

function abrirAgregados() {
  var url = '<<COLE_A_URL_DO_SEU_PWA_AQUI>>';
  var html = HtmlService.createHtmlOutput(
    '<script>window.open("' + url + '","_blank");google.script.host.close();</script>'
  ).setWidth(300).setHeight(80);
  SpreadsheetApp.getUi().showModalDialog(html, 'Abrindo…');
}

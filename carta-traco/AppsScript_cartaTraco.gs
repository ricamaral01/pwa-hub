/* ============================================================
   CARTAS TRAÇO - Google Apps Script Backend
   ============================================================
   
   INSTRUÇÕES DE DEPLOY:
   1. Acesse https://script.google.com
   2. Crie um novo projeto
   3. Cole este código no arquivo Code.gs
   4. Em "Implantar" > "Nova implantação"
   5. Tipo: "Aplicativo da Web"
   6. Executar como: "Eu" (sua conta)
   7. Quem tem acesso: "Qualquer pessoa"
   8. Clique em "Implantar" e copie a URL gerada
   9. Cole a URL no arquivo js/app.js na variável SCRIPT_URL
   
   ============================================================ */

const SPREADSHEET_ID = '14m7yrpXF2Q3To_C2H9oQqwIHLJ32uhPOzFbrKE63CjE';

// ========== HELPERS ==========

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    initSheetHeaders(sheet, name);
  }
  return sheet;
}

function initSheetHeaders(sheet, name) {
  switch (name) {
    case 'cadastro':
      sheet.appendRow([
        'ID', 'Nome', 'Revisão', 'Unidade', 'Status',
        'Data Vigência', 'Data Cadastro', 'Fornecedor',
        'Produto', 'Quantidade', 'Unidade Medida', 'Massa Específica',
        'Observação', 'Tipo Frete'
      ]);
      sheet.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#1a5276').setFontColor('white');
      sheet.setFrozenRows(1);
      break;
    case 'custos':
      sheet.appendRow([
        'ID', 'Data', 'Unidade', 'Fornecedor', 'Material',
        'Unidade Medida', 'Valor Unitário', 'ICMS %',
        'Frete', 'Valor Líquido', 'Tipo Frete'
      ]);
      sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#1a5276').setFontColor('white');
      sheet.setFrozenRows(1);
      break;
    case 'resumo':
      sheet.appendRow([
        'Unidade', 'Nome da Carta', 'Revisão', 'MCC Total (R$)',
        'Status', 'Data Vigência'
      ]);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#1a5276').setFontColor('white');
      sheet.setFrozenRows(1);
      break;
  }
}

function generateId() {
  return Utilities.getUuid().substring(0, 8);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========== ENDPOINTS ==========

function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;

    switch (action) {
      case 'getCartas':
        result = getCartas(e.parameter);
        break;
      case 'getCustos':
        result = getCustos(e.parameter);
        break;
      case 'getResumo':
        result = getResumo();
        break;
      default:
        result = { error: 'Ação não reconhecida: ' + action };
    }

    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    let result;

    switch (action) {
      case 'salvarCarta':
        result = salvarCarta(payload);
        break;
      case 'salvarCusto':
        result = salvarCusto(payload);
        break;
      default:
        result = { error: 'Ação não reconhecida: ' + action };
    }

    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// ========== CARTAS TRAÇO ==========

function getCartas(params) {
  const sheet = getSheet('cadastro');
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { data: [] };
  }

  const headers = data[0];
  const rows = data.slice(1);

  let cartas = rows.map(row => ({
    id: row[0],
    nome: row[1],
    revisao: row[2],
    unidade: row[3],
    status: row[4],
    vigencia: formatDateForJson(row[5]),
    dataCadastro: formatDateForJson(row[6]),
    fornecedor: row[7],
    produto: row[8],
    quantidade: row[9],
    unidadeMedida: row[10],
    massaEspecifica: row[11] || 0,
    observacao: row[12] || '',
    tipoFrete: row[13] || ''
  }));

  // Filtrar por unidade
  if (params.unidade && params.unidade !== '') {
    cartas = cartas.filter(c => c.unidade === params.unidade);
  }

  // Filtrar inativas
  if (params.mostrarInativas !== 'true') {
    cartas = cartas.filter(c => c.status === 'Ativa');
  }

  return { data: cartas };
}

function salvarCarta(payload) {
  const sheet = getSheet('cadastro');
  const cartaId = generateId();
  const nome = payload.nome;
  const revisao = parseInt(payload.revisao) || 0;
  const unidade = payload.unidade;
  const vigencia = payload.vigencia;
  const status = payload.status || 'Ativa';
  const dataCadastro = payload.dataCadastro || Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
  const observacao = payload.observacao || '';
  const tipoFrete = payload.tipoFrete || '';
  const materiais = payload.materiais || [];

  // Se a nova carta é Ativa, inativar versões anteriores do mesmo nome e unidade
  if (status === 'Ativa') {
    inativarVersaoAnterior(sheet, nome, unidade);
  }

  // Salvar cada material como uma linha
  materiais.forEach(mat => {
    sheet.appendRow([
      cartaId,
      nome,
      revisao,
      unidade,
      status,
      vigencia,
      dataCadastro,
      mat.fornecedor,
      mat.produto,
      mat.quantidade,
      mat.unidade,
      mat.massaEspecifica || 0,
      observacao,
      tipoFrete
    ]);
  });

  // Atualizar aba Resumo
  atualizarResumo();

  return { success: true, id: cartaId, message: 'Carta Traço salva com sucesso!' };
}

function inativarVersaoAnterior(sheet, nome, unidade) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  for (let i = 1; i < data.length; i++) {
    const rowNome = data[i][1];
    const rowUnidade = data[i][3];
    const rowStatus = data[i][4];

    if (rowNome === nome && rowUnidade === unidade && rowStatus === 'Ativa') {
      // Coluna E (index 5 na planilha, mas col 5) = Status
      sheet.getRange(i + 1, 5).setValue('Inativa');
    }
  }
}

// ========== CUSTOS / MATERIAIS ==========

function getCustos(params) {
  const sheet = getSheet('custos');
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { data: [] };
  }

  const rows = data.slice(1);

  let custos = rows.map(row => ({
    id: row[0],
    data: formatDateForJson(row[1]),
    unidade: row[2],
    fornecedor: row[3],
    material: row[4],
    unidadeMedida: row[5],
    valor: row[6],
    icms: row[7],
    frete: row[8],
    valorLiquido: row[9],
    tipoFrete: row[10] || ''
  }));

  // Filtrar por unidade
  if (params.unidade && params.unidade !== '') {
    custos = custos.filter(c => c.unidade === params.unidade);
  }

  // Ordenar: mais recente primeiro (para rastreamento)
  custos.reverse();

  return { data: custos };
}

function salvarCusto(payload) {
  const sheet = getSheet('custos');
  const id = generateId();

  sheet.appendRow([
    id,
    payload.data || Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd'),
    payload.unidade,
    payload.fornecedor,
    payload.material,
    payload.unidadeMedida || '',
    payload.valor,
    payload.icms,
    payload.frete,
    payload.valorLiquido,
    payload.tipoFrete || ''
  ]);

  return { success: true, id: id, message: 'Material salvo com sucesso!' };
}

// ========== RESUMO ==========

function getResumo() {
  const sheet = getSheet('resumo');
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { data: [] };
  }

  return {
    data: data.slice(1).map(row => ({
      unidade: row[0],
      nome: row[1],
      revisao: row[2],
      mccTotal: row[3],
      status: row[4],
      vigencia: formatDateForJson(row[5])
    }))
  };
}

function atualizarResumo() {
  const cadastroSheet = getSheet('cadastro');
  const custosSheet = getSheet('custos');
  const resumoSheet = getSheet('resumo');

  const cadastroData = cadastroSheet.getDataRange().getValues();
  const custosData = custosSheet.getDataRange().getValues();

  if (cadastroData.length <= 1) return;

  // Obter todos os custos indexados por material+unidade (último valor)
  const custosMap = {};
  if (custosData.length > 1) {
    custosData.slice(1).forEach(row => {
      const key = (row[4] + '|' + row[2]).toLowerCase(); // material|unidade
      custosMap[key] = parseFloat(row[9]) || 0; // valor líquido
    });
  }

  // Agrupar cartas por nome+unidade, pegar somente a de maior revisão
  const cartasMap = {};
  cadastroData.slice(1).forEach(row => {
    const id = row[0];
    const nome = row[1];
    const revisao = parseInt(row[2]) || 0;
    const unidade = row[3];
    const status = row[4];
    const vigencia = row[5];
    const produto = row[8];
    const quantidade = parseFloat(row[9]) || 0;

    const key = nome + '|' + unidade;

    if (!cartasMap[key]) {
      cartasMap[key] = {
        nome: nome,
        unidade: unidade,
        revisao: revisao,
        status: status,
        vigencia: vigencia,
        materiais: []
      };
    }

    // Se encontramos uma revisão maior, substituir
    if (revisao > cartasMap[key].revisao) {
      cartasMap[key].revisao = revisao;
      cartasMap[key].status = status;
      cartasMap[key].vigencia = vigencia;
      cartasMap[key].materiais = [];
    }

    // Adicionar material se for da revisão mais recente
    if (revisao === cartasMap[key].revisao) {
      cartasMap[key].materiais.push({ produto, quantidade, unidade: unidade });
    }
  });

  // Calcular MCC para cada carta
  const resumoRows = [];
  Object.values(cartasMap).forEach(carta => {
    let mccTotal = 0;
    carta.materiais.forEach(mat => {
      const key = (mat.produto + '|' + carta.unidade).toLowerCase();
      const custoUnit = custosMap[key] || 0;
      mccTotal += mat.quantidade * custoUnit;
    });

    resumoRows.push([
      carta.unidade,
      carta.nome,
      carta.revisao,
      mccTotal,
      carta.status,
      carta.vigencia
    ]);
  });

  // Limpar aba resumo e reescrever
  resumoSheet.clear();
  initSheetHeaders(resumoSheet, 'resumo');

  if (resumoRows.length > 0) {
    resumoSheet.getRange(2, 1, resumoRows.length, 6).setValues(resumoRows);

    // Formatar coluna de MCC como moeda
    resumoSheet.getRange(2, 4, resumoRows.length, 1)
      .setNumberFormat('R$ #,##0.00');
  }
}

// ========== UTILITY FUNCTIONS ==========

function formatDateForJson(date) {
  if (!date) return '';
  if (date instanceof Date) {
    return Utilities.formatDate(date, 'America/Sao_Paulo', 'yyyy-MM-dd');
  }
  return String(date);
}

// ========== SETUP FUNCTION (run once) ==========
// Execute esta função uma vez para criar as abas necessárias
function setupSpreadsheet() {
  getSheet('cadastro');
  getSheet('custos');
  getSheet('resumo');
  Logger.log('Planilha configurada com sucesso!');
}

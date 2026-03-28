const SPREADSHEET_ID = '1KSDyi6Sz1xAC063JIOofrRXX3bdhz-E5k85lz-OmVz8';
const SHEET_NAME = 'Página1';

// URL da VPS para disparar push notification após salvar checklist
// Configurar o token: Arquivo > Propriedades do projeto > Propriedades do script
// Chave: PUSH_SECRET  Valor: (mesmo valor de PUSH_SECRET no servidor)
const PUSH_ENDPOINT = 'https://dautomacao.com/etiquetas/push/send';

const CHECKLIST_ORDER = [
  'limpeza_esteira_m1',
  'limpeza_esteira_m2',
  'limpeza_sensores',
  'baia_b0',
  'baia_b12',
  'baia_an',
  'baia_ai',
  'baia_coque',
  'cx_b0',
  'cx_b12',
  'cx_an',
  'cx_ai',
  'cx_coque',
  'silo1',
  'silo2',
  'silo3',
  'agua_m1',
  'agua_m2',
  'm1_ad1_linha',
  'm1_ad2_linha',
  'm1_ad1_vol',
  'm1_ad2_vol',
  'm2_ad1_linha',
  'm2_ad2_linha',
  'm2_ad1_vol',
  'm2_ad2_vol',
  'pc_reiniciado',
  'umidade_manual',
  'umidade_supervisorio',
  'sensores_ligados',
  'traco_correto',
  'temp_sup',
  'corte_agua'
];

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const result = salvarChecklistUsina(payload);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, result: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function parsePayload_(e) {
  const raw = e && e.postData && e.postData.contents ? String(e.postData.contents) : '';

  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      // Continua para tentar outros formatos simples de envio.
    }
  }

  if (e && e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }

  if (e && e.parameters && e.parameters.payload && e.parameters.payload[0]) {
    return JSON.parse(e.parameters.payload[0]);
  }

  throw new Error('Payload inválido.');
}

function salvarChecklistUsina(payload) {
  if (!payload || !payload.responses) {
    throw new Error('Payload inválido.');
  }

  validarChecklistCompleto(payload.responses);

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Aba não encontrada: ' + SHEET_NAME);
  }

  garantirCabecalho(sheet);

  const row = [
    new Date(),
    payload.data || '',
    payload.turno || '',
    payload.momentoInspecao || '',
    payload.responsavel || '',
    payload.misturadorOperacao || '',
    payload.observacoes || ''
  ];

  CHECKLIST_ORDER.forEach(function(key) {
    row.push(payload.responses[key] || '');
  });

  sheet.appendRow(row);

  // Dispara push notification para todos os dispositivos cadastrados
  try {
    const pushSecret = PropertiesService.getScriptProperties().getProperty('PUSH_SECRET') || '';
    UrlFetchApp.fetch(PUSH_ENDPOINT, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'X-Token': pushSecret },
      payload: JSON.stringify({
        title: '✅ Checklist Enviada',
        body:  'Usina pronta para começar — registrado por ' + (payload.responsavel || 'operador'),
        url:   'https://ricamaral01.github.io/pwa-hub/checklist-usina/'
      }),
      muteHttpExceptions: true
    });
  } catch (e) {
    // Falha no push não deve impedir o salvamento
    Logger.log('Push error: ' + e);
  }

  return {
    rowNumber: sheet.getLastRow(),
    savedAt: new Date().toISOString()
  };
}

function validarChecklistCompleto(responses) {
  const pendencias = CHECKLIST_ORDER.filter(function(key) {
    return !responses[key];
  });

  if (pendencias.length > 0) {
    throw new Error('Checklist incompleto. Pendências: ' + pendencias.join(', '));
  }
}

function garantirCabecalho(sheet) {
  if (sheet.getLastRow() > 0) {
    return;
  }

  const headers = [
    'registrado_em',
    'data_checklist',
    'turno',
    'momento_inspecao',
    'responsavel',
    'misturador_operacao',
    'observacoes'
  ].concat(CHECKLIST_ORDER);

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

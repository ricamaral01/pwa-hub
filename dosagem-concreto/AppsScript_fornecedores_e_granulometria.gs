const SHEET_ID_PADRAO = '1kfCQChHSAHG3s9u4fginpXonXYNxAlEc3yBRCN1wtOk';
const ABA_PADRAO = 'fornecedor';
const ABA_ENSAIO_GRAN_PADRAO = 'ensaios_granulometria';

function doGet(e) {
  try {
    const acao = (e && e.parameter && e.parameter.acao) ? e.parameter.acao : 'status';

    if (acao === 'listar_ensaio_gran') {
      return listarEnsaiosGran_(e);
    }

    if (acao === 'obter_ensaio_gran') {
      return obterEnsaioGran_(e);
    }

    return jsonResponse_({
      ok: true,
      message: 'Web App ativo para cadastro de fornecedores e ensaios granulométricos.'
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      message: err && err.message ? err.message : String(err)
    });
  }
}

function doPost(e) {
  try {
    const body = parseBody_(e);

    const acao = body.acao || 'salvar_fornecedor';
    if (acao === 'salvar_fornecedor') {
      return salvarFornecedor_(body);
    }

    if (acao === 'salvar_ensaio_gran') {
      return salvarEnsaioGran_(body);
    }

    if (acao !== 'salvar_fornecedor' && acao !== 'salvar_ensaio_gran') {
      return jsonResponse_({ ok: false, message: 'Ação inválida.' });
    }

    return jsonResponse_({ ok: false, message: 'Ação inválida.' });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      message: err && err.message ? err.message : String(err)
    });
  }
}

function salvarFornecedor_(body) {
  const sheetId = body.sheetId || SHEET_ID_PADRAO;
  const aba = body.aba || ABA_PADRAO;
  const dados = body.dados || {};

  validarDados_(dados);

  const ss = SpreadsheetApp.openById(sheetId);
  let sh = ss.getSheetByName(aba);
  if (!sh) {
    sh = ss.insertSheet(aba);
  }

  garantirCabecalho_(sh);

  const linha = [
    dados.id || '',
    dados.fornecedor || '',
    dados.contato || '',
    dados.telefone || '',
    dados.produtoTipo || '',
    dados.produtoNome || '',
    dados.valor ?? '',
    dados.produtoIcmsPct ?? '',
    dados.contribuinteIcms || '',
    dados.freteCusto ?? '',
    dados.freteIcmsPct ?? '',
    dados.freteContato || '',
    dados.freteTelefone || '',
    dados.valorFinal ?? '',
    dados.valorLiquido ?? '',
    dados.endereco || '',
    dados.tipoFrete || '',
    dados.suporteTecnico || '',
    dados.avaliacao ?? '',
    dados.observacoes || '',
    dados.dataCadastro || new Date().toISOString()
  ];

  sh.appendRow(linha);

  return jsonResponse_({
    ok: true,
    message: 'Fornecedor salvo com sucesso.',
    id: dados.id || null
  });
}

function salvarEnsaioGran_(body) {
  const sheetId = body.sheetId || SHEET_ID_PADRAO;
  const aba = body.aba || ABA_ENSAIO_GRAN_PADRAO;
  const dados = body.dados || {};

  validarDadosEnsaioGran_(dados);

  const ss = SpreadsheetApp.openById(sheetId);
  let sh = ss.getSheetByName(aba);
  if (!sh) {
    sh = ss.insertSheet(aba);
  }

  garantirCabecalhoEnsaiosGran_(sh);

  const payload = JSON.stringify(dados);
  const linha = [
    dados.id || '',
    dados.tipo || '',
    dados.material || '',
    dados.fornecedor || '',
    dados.data_ensaio || '',
    dados.responsavel || '',
    dados.timestamp || new Date().toISOString(),
    payload
  ];

  sh.appendRow(linha);

  return jsonResponse_({
    ok: true,
    message: 'Ensaio granulométrico salvo com sucesso.',
    id: dados.id || null
  });
}

function listarEnsaiosGran_(e) {
  const p = (e && e.parameter) ? e.parameter : {};
  const sheetId = p.sheetId || SHEET_ID_PADRAO;
  const aba = p.aba || ABA_ENSAIO_GRAN_PADRAO;
  const tipo = p.tipo || '';
  const limite = Math.max(1, Math.min(parseInt(p.limite || '120', 10), 500));

  const ss = SpreadsheetApp.openById(sheetId);
  const sh = ss.getSheetByName(aba);
  if (!sh || sh.getLastRow() < 2) {
    return jsonResponse_({ ok: true, items: [] });
  }

  const vals = sh.getDataRange().getValues();
  const headers = vals[0].map(function(v) { return String(v || '').trim(); });
  const idx = indexByHeader_(headers);

  const out = [];
  for (let i = vals.length - 1; i >= 1; i--) {
    const row = vals[i];
    const rowTipo = String(row[idx.tipo] || '');
    if (tipo && rowTipo !== tipo) continue;

    out.push({
      id: String(row[idx.id] || ''),
      tipo: rowTipo,
      material: String(row[idx.material] || ''),
      fornecedor: String(row[idx.fornecedor] || ''),
      data_ensaio: String(row[idx.data_ensaio] || ''),
      responsavel: String(row[idx.responsavel] || ''),
      timestamp: String(row[idx.timestamp] || '')
    });

    if (out.length >= limite) break;
  }

  return jsonResponse_({ ok: true, items: out });
}

function obterEnsaioGran_(e) {
  const p = (e && e.parameter) ? e.parameter : {};
  const sheetId = p.sheetId || SHEET_ID_PADRAO;
  const aba = p.aba || ABA_ENSAIO_GRAN_PADRAO;
  const id = String(p.id || '').trim();

  if (!id) {
    return jsonResponse_({ ok: false, message: 'ID do ensaio é obrigatório.' });
  }

  const ss = SpreadsheetApp.openById(sheetId);
  const sh = ss.getSheetByName(aba);
  if (!sh || sh.getLastRow() < 2) {
    return jsonResponse_({ ok: false, message: 'Nenhum ensaio encontrado.' });
  }

  const vals = sh.getDataRange().getValues();
  const headers = vals[0].map(function(v) { return String(v || '').trim(); });
  const idx = indexByHeader_(headers);

  for (let i = vals.length - 1; i >= 1; i--) {
    const row = vals[i];
    if (String(row[idx.id] || '').trim() !== id) continue;

    const payloadRaw = String(row[idx.payload_json] || '{}');
    let dados = null;
    try {
      dados = JSON.parse(payloadRaw);
    } catch (_) {
      dados = null;
    }

    if (!dados || typeof dados !== 'object') {
      return jsonResponse_({ ok: false, message: 'Payload do ensaio inválido na planilha.' });
    }

    return jsonResponse_({ ok: true, dados: dados });
  }

  return jsonResponse_({ ok: false, message: 'Ensaio não encontrado.' });
}

function indexByHeader_(headers) {
  function find(name) {
    var idx = headers.indexOf(name);
    if (idx < 0) throw new Error('Cabeçalho ausente: ' + name);
    return idx;
  }

  return {
    id: find('id'),
    tipo: find('tipo'),
    material: find('material'),
    fornecedor: find('fornecedor'),
    data_ensaio: find('data_ensaio'),
    responsavel: find('responsavel'),
    timestamp: find('timestamp'),
    payload_json: find('payload_json')
  };
}

function parseBody_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '';

  if (e && e.parameter && e.parameter.payload) {
    try {
      return JSON.parse(e.parameter.payload);
    } catch (_) {
      throw new Error('Payload inválido no parâmetro "payload".');
    }
  }

  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (_) {}
  }

  if (e && e.parameter) {
    const dadosObj = {
      id: e.parameter.id || '',
      fornecedor: e.parameter.fornecedor || '',
      contato: e.parameter.contato || '',
      telefone: e.parameter.telefone || '',
      produtoTipo: e.parameter.produtoTipo || '',
      produtoNome: e.parameter.produtoNome || '',
      valor: e.parameter.valor || '',
      produtoIcmsPct: e.parameter.produtoIcmsPct || '',
      contribuinteIcms: e.parameter.contribuinteIcms || '',
      freteCusto: e.parameter.freteCusto || '',
      freteIcmsPct: e.parameter.freteIcmsPct || '',
      freteContato: e.parameter.freteContato || '',
      freteTelefone: e.parameter.freteTelefone || '',
      valorFinal: e.parameter.valorFinal || '',
      valorLiquido: e.parameter.valorLiquido || '',
      endereco: e.parameter.endereco || '',
      tipoFrete: e.parameter.tipoFrete || '',
      suporteTecnico: e.parameter.suporteTecnico || '',
      avaliacao: e.parameter.avaliacao || '',
      observacoes: e.parameter.observacoes || '',
      dataCadastro: e.parameter.dataCadastro || ''
    };

    return {
      acao: e.parameter.acao || 'salvar_fornecedor',
      sheetId: e.parameter.sheetId || '',
      aba: e.parameter.aba || '',
      dados: dadosObj
    };
  }

  throw new Error('Corpo da requisição vazio ou inválido.');
}

function validarDados_(dados) {
  if (!dados || typeof dados !== 'object') {
    throw new Error('Campo "dados" obrigatório.');
  }
  if (!dados.fornecedor || !String(dados.fornecedor).trim()) {
    throw new Error('Fornecedor é obrigatório.');
  }
  if (!dados.produtoNome || !String(dados.produtoNome).trim()) {
    throw new Error('Descrição do produto é obrigatória.');
  }
}

function validarDadosEnsaioGran_(dados) {
  if (!dados || typeof dados !== 'object') {
    throw new Error('Campo "dados" obrigatório.');
  }

  if (!dados.id || !String(dados.id).trim()) {
    throw new Error('ID do ensaio é obrigatório.');
  }

  if (dados.tipo !== 'gran_miudo' && dados.tipo !== 'gran_graudo') {
    throw new Error('Tipo do ensaio inválido.');
  }
}

function garantirCabecalho_(sh) {
  if (sh.getLastRow() > 0) return;

  sh.appendRow([
    "id",
    "fornecedor",
    "contato",
    "telefone",
    "produtoTipo",
    "produtoNome",
    "valor",
    "produtoIcmsPct",
    "contribuinteIcms",
    "freteCusto",
    "freteIcmsPct",
    "freteContato",
    "freteTelefone",
    "valorFinal",
    "valorLiquido",
    "endereco",
    "tipoFrete",
    "suporteTecnico",
    "avaliacao",
    "observacoes",
    "dataCadastro"
  ]);
}

function garantirCabecalhoEnsaiosGran_(sh) {
  if (sh.getLastRow() > 0) return;

  sh.appendRow([
    'id',
    'tipo',
    'material',
    'fornecedor',
    'data_ensaio',
    'responsavel',
    'timestamp',
    'payload_json'
  ]);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function atualizarCabecalhosFornecedor() {
  var sheetId = "1kfCQChHSAHG3s9u4fginpXonXYNxAlEc3yBRCN1wtOk";
  var ss = SpreadsheetApp.openById(sheetId);
  var sh = ss.getSheetByName("fornecedor");
  if (!sh) {
    sh = ss.insertSheet("fornecedor");
  }
  
  var newHeaders = [
    "id",
    "fornecedor",
    "contato",
    "telefone",
    "produtoTipo",
    "produtoNome",
    "valor",
    "produtoIcmsPct",
    "contribuinteIcms",
    "freteCusto",
    "freteIcmsPct",
    "freteContato",
    "freteTelefone",
    "valorFinal",
    "valorLiquido",
    "endereco",
    "tipoFrete",
    "suporteTecnico",
    "avaliacao",
    "observacoes",
    "dataCadastro"
  ];
  
  sh.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
  
  // Formatar cabeçalho
  var range = sh.getRange(1, 1, 1, newHeaders.length);
  range.setFontWeight("bold");
  range.setBackground("#1a3a5c");
  range.setFontColor("#FFFFFF");
  range.setHorizontalAlignment("center");
  
  Logger.log("✅ Cabeçalhos da aba 'fornecedor' atualizados com sucesso!");
}

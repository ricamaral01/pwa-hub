function planilha_() {
  const id = PropertiesService.getScriptProperties().getProperty('PLANILHA_ID');
  if (!id) throw new Error('PLANILHA_ID não configurado.');
  return SpreadsheetApp.openById(id);
}
function aba_(nome, cabecalho) {
  const ss = planilha_();
  let sh = ss.getSheetByName(nome);
  if (!sh) sh = ss.insertSheet(nome);
  if (sh.getLastRow() === 0) sh.appendRow(cabecalho);
  return sh;
}
function documentosAba_(tipo) { return aba_(tipo, ['chave', 'id', 'unidade', 'versao', 'revisao', 'status', 'json', 'alteradoEm']); }
function lerDocumentos_(tipo) {
  const sh = documentosAba_(tipo);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 7, sh.getLastRow() - 1, 1).getValues().map(r => { try { return JSON.parse(r[0]); } catch (_) { return null; } }).filter(Boolean);
}
function gravarDocumento_(tipo, doc, chave) {
  const sh = documentosAba_(tipo);
  const ultima = sh.getLastRow();
  const chaves = ultima < 2 ? [] : sh.getRange(2, 1, ultima - 1, 1).getValues();
  const index = chaves.findIndex(r => String(r[0]) === String(chave));
  const row = [chave, doc.id, doc.unidade, doc.versao || 1, doc.revisao || 1, doc.status || '', JSON.stringify(doc), new Date().toISOString()];
  if (index < 0) sh.appendRow(row); else sh.getRange(index + 2, 1, 1, row.length).setValues([row]);
}
function requisicaoAnterior_(id) {
  const sh = aba_('requisicoes', ['requestId', 'resposta', 'em']);
  if (sh.getLastRow() < 2) return null;
  const cell = sh.getRange(2, 1, sh.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
  return cell ? JSON.parse(sh.getRange(cell.getRow(), 2).getValue()) : null;
}
function registrarRequisicao_(id, resposta) { aba_('requisicoes', ['requestId', 'resposta', 'em']).appendRow([id, JSON.stringify(resposta), new Date().toISOString()]); }

function validarTracoServidor_(t) {
  const erros = [];
  if (!t.id || !t.nome || !String(t.nome).trim() || !t.unidade) erros.push('ID, nome e unidade são obrigatórios.');
  if (!t.objetivo || !Number.isFinite(Number(t.objetivo.fckMPa)) || Number(t.objetivo.fckMPa) <= 0) erros.push('Fck inválido.');
  if (!t.objetivo || !Number.isFinite(Number(t.objetivo.sdMPa)) || Number(t.objetivo.sdMPa) < 0) erros.push('Desvio padrão inválido.');
  if (!Number.isFinite(Number(t.arIncorporadoPct)) || Number(t.arIncorporadoPct) < 0 || Number(t.arIncorporadoPct) >= 100) erros.push('Ar incorporado inválido.');
  if (!Array.isArray(t.itens) || !t.itens.some(i => i.categoria === 'cimento' && Number(i.massaKgM3) > 0)) erros.push('Informe cimento positivo.');
  (t.itens || []).forEach(i => {
    if (!Number.isFinite(Number(i.massaEspecificaKgDm3)) || Number(i.massaEspecificaKgDm3) <= 0) erros.push('Massa específica inválida.');
    if (i.massaKgM3 != null && (!Number.isFinite(Number(i.massaKgM3)) || Number(i.massaKgM3) < 0)) erros.push('Massa inválida.');
    if (i.dosagemPct != null && (!Number.isFinite(Number(i.dosagemPct)) || Number(i.dosagemPct) < 0 || Number(i.dosagemPct) > 100)) erros.push('Dosagem percentual inválida.');
  });
  const agua = (t.itens || []).filter(i => i.categoria === 'agua').reduce((s, i) => s + Number(i.massaKgM3 || 0), 0);
  const umidade = (t.itens || []).filter(i => i.categoria === 'areia' || i.categoria === 'brita')
    .reduce((s, i) => s + Number(i.massaKgM3 || 0) * Number(i.umidadeLivrePct || 0) / 100, 0);
  if (!Number.isFinite(agua) || !Number.isFinite(umidade) || umidade > agua) erros.push('Água de obra negativa.');
  return erros;
}
function salvarTraco_(dados, perfil) {
  if (!podeUnidade_(perfil, dados.unidade)) return falha_('SEM_PERMISSAO', 'Unidade não autorizada.');
  const erros = validarTracoServidor_(dados);
  if (erros.length) return falha_('VALIDACAO', 'Traço inválido.', { campos: erros });
  const todos = lerDocumentos_('tracos').filter(t => t.id === dados.id);
  const agora = new Date().toISOString();
  let doc;
  if (!todos.length) {
    const codigo = 'TR-' + String(documentosAba_('tracos').getLastRow()).padStart(4, '0');
    doc = { ...dados, codigo, versao: 1, revisao: 1, status: 'rascunho', auditoria: { criadoPor: perfil.email, criadoEm: agora, alteradoPor: perfil.email, alteradoEm: agora } };
  } else {
    const atual = todos.sort((a, b) => b.versao - a.versao)[0];
    if (!podeUnidade_(perfil, atual.unidade)) return falha_('SEM_PERMISSAO', 'Unidade não autorizada.');
    if (atual.status === 'aprovado') {
      doc = { ...dados, codigo: atual.codigo, versao: atual.versao + 1, revisao: 1, status: 'rascunho', baseVersaoId: atual.id + ':v' + atual.versao, aprovacao: null, auditoria: { ...atual.auditoria, alteradoPor: perfil.email, alteradoEm: agora } };
    } else {
      if (Number(dados.revisao) !== Number(atual.revisao)) return falha_('CONFLITO_REVISAO', 'Este traço foi alterado por outra pessoa.', { atual });
      doc = { ...dados, codigo: atual.codigo, versao: atual.versao, revisao: atual.revisao + 1, status: atual.status, auditoria: { ...atual.auditoria, alteradoPor: perfil.email, alteradoEm: agora } };
    }
  }
  gravarDocumento_('tracos', doc, doc.id + ':v' + doc.versao);
  return sucesso_({ id: doc.id, codigo: doc.codigo, versao: doc.versao, revisao: doc.revisao, documento: doc });
}
function aprovarTraco_(dados, perfil) {
  if (perfil.papel !== 'engenheiro' && perfil.papel !== 'admin') return falha_('SEM_PERMISSAO', 'Aprovação exige papel engenheiro.');
  const doc = lerDocumentos_('tracos').find(t => t.id === dados.id && t.versao === dados.versao);
  if (!doc) return falha_('NAO_ENCONTRADO', 'Traço não encontrado.');
  if (!podeUnidade_(perfil, doc.unidade)) return falha_('SEM_PERMISSAO', 'Unidade não autorizada.');
  if (doc.status === 'aprovado') return falha_('VALIDACAO', 'Versão já aprovada.');
  if (Number(dados.revisao) !== Number(doc.revisao)) return falha_('CONFLITO_REVISAO', 'Revisão diferente.', { atual: doc });
  const erros = validarTracoServidor_(doc);
  if (erros.length) return falha_('VALIDACAO', 'Há erros no traço.', { campos: erros });
  const aprovado = { ...doc, status: 'aprovado', revisao: doc.revisao + 1, aprovacao: { por: perfil.email, em: new Date().toISOString(), parecer: dados.parecer || '' } };
  gravarDocumento_('tracos', aprovado, aprovado.id + ':v' + aprovado.versao);
  return sucesso_({ id: aprovado.id, versao: aprovado.versao, revisao: aprovado.revisao, documento: aprovado });
}
function enviarAprovacao_(dados, perfil) {
  const doc = lerDocumentos_('tracos').find(t => t.id === dados.id && t.versao === dados.versao);
  if (!doc) return falha_('NAO_ENCONTRADO', 'Traço não encontrado.');
  if (!podeUnidade_(perfil, doc.unidade)) return falha_('SEM_PERMISSAO', 'Unidade não autorizada.');
  if (doc.status !== 'rascunho') return falha_('VALIDACAO', 'Somente rascunhos podem ser enviados para aprovação.');
  if (Number(dados.revisao) !== Number(doc.revisao)) return falha_('CONFLITO_REVISAO', 'Revisão diferente.', { atual: doc });
  const erros = validarTracoServidor_(doc);
  if (erros.length) return falha_('VALIDACAO', 'Há erros no traço.', { campos: erros });
  const enviado = { ...doc, status: 'em_teste', revisao: doc.revisao + 1 };
  gravarDocumento_('tracos', enviado, enviado.id + ':v' + enviado.versao);
  return sucesso_({ id: enviado.id, versao: enviado.versao, revisao: enviado.revisao, documento: enviado });
}
function excluirCusto_(dados, perfil) {
  if (perfil.papel !== 'admin') return falha_('SEM_PERMISSAO', 'Exclusão exige admin.');
  const doc = lerDocumentos_('custos').find(d => d.id === dados.id);
  if (!doc || !podeUnidade_(perfil, doc.unidade)) return falha_('NAO_ENCONTRADO', 'Custo não encontrado.');
  if (dados.confirmacao !== doc.nomeProduto) return falha_('VALIDACAO', 'Digite o nome do produto para confirmar.');
  const sh = documentosAba_('custos');
  const cell = sh.getRange(2, 1, sh.getLastRow() - 1, 1).createTextFinder(doc.id).matchEntireCell(true).findNext();
  if (cell) sh.deleteRow(cell.getRow());
  return sucesso_({ id: doc.id, versao: doc.versao || 1, revisao: doc.revisao || 1 });
}

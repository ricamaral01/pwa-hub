const API_VERSAO = '2.0.0';
const ERROS = ['NAO_AUTENTICADO', 'SEM_PERMISSAO', 'VALIDACAO', 'CONFLITO_REVISAO', 'NAO_ENCONTRADO', 'LIMITE', 'INTERNO'];

function doGet() { return json_({ ok: true, versao: API_VERSAO }); }
function json_(valor) { return ContentService.createTextOutput(JSON.stringify(valor)).setMimeType(ContentService.MimeType.JSON); }
function falha_(codigo, mensagem, detalhe) { return { ok: false, erro: { codigo, mensagem, ...(detalhe ? { detalhe } : {}) }, servidorEm: new Date().toISOString() }; }
function sucesso_(dados) { return { ok: true, dados, servidorEm: new Date().toISOString() }; }

function doPost(e) {
  try {
    const req = JSON.parse(e && e.postData && e.postData.contents || '{}');
    if (!req.acao || !req.requestId || !req.token) return json_(falha_('NAO_AUTENTICADO', 'Ação, identificação e sessão são obrigatórias.'));
    const usuario = verificarToken(req.token);
    if (!usuario) return json_(falha_('NAO_AUTENTICADO', 'Sessão inválida ou expirada.'));
    const perfil = perfilUsuario_(usuario);
    if (!perfil || !perfil.ativo) return json_(falha_('SEM_PERMISSAO', 'Usuário sem acesso à Dosagem v2.'));
    const acao = String(req.acao);
    if (!podeAcao_(perfil, acao)) return json_(falha_('SEM_PERMISSAO', 'Permissão insuficiente.'));
    const unidade = req.dados && req.dados.unidade;
    if (unidade && !podeUnidade_(perfil, unidade)) return json_(falha_('SEM_PERMISSAO', 'Unidade não autorizada.'));
    if (/\.listar$|\.obter$/.test(acao)) return json_(executarLeitura_(acao, req.dados || {}, perfil));
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) return json_(falha_('LIMITE', 'Servidor ocupado. Tente novamente.'));
    try {
      const anterior = requisicaoAnterior_(req.requestId);
      if (anterior) return json_(anterior);
      const resposta = executarGravacao_(acao, req.dados || {}, perfil);
      if (resposta.ok) registrarRequisicao_(req.requestId, resposta);
      return json_(resposta);
    } finally { lock.releaseLock(); }
  } catch (err) {
    return json_(falha_('INTERNO', 'Falha interna no serviço.', { mensagem: String(err && err.message || err) }));
  }
}

function podeAcao_(perfil, acao) {
  if (perfil.papel === 'admin') return true;
  if (acao === 'usuarios.listar') return true;
  if (acao === 'custos.excluir' || acao.indexOf('usuarios.') === 0 || acao.indexOf('importacao.') === 0) return false;
  if (acao === 'tracos.aprovar') return perfil.papel === 'engenheiro';
  if (acao.indexOf('tracos.') === 0 || acao.indexOf('materiais.') === 0 || acao.indexOf('fornecedores.') === 0 || acao.indexOf('ensaios.') === 0 || acao.indexOf('custos.') === 0) return perfil.papel === 'engenheiro' || perfil.papel === 'laboratorio';
  return false;
}
function podeUnidade_(perfil, unidade) { return perfil.papel === 'admin' || perfil.unidades.indexOf(unidade) !== -1; }

function executarLeitura_(acao, dados, perfil) {
  if (acao === 'usuarios.listar') return sucesso_(lerUsuarios_().filter(u => perfil.papel === 'admin' || u.email === perfil.email));
  const tipo = acao.split('.')[0];
  if (['tracos', 'materiais', 'fornecedores', 'ensaios', 'custos'].indexOf(tipo) < 0) return falha_('NAO_ENCONTRADO', 'Ação desconhecida.');
  const todos = lerDocumentos_(tipo).filter(d => podeUnidade_(perfil, d.unidade));
  if (acao.endsWith('.obter')) {
    const achado = todos.find(d => d.id === dados.id && (!dados.versao || d.versao === dados.versao));
    return achado ? sucesso_(achado) : falha_('NAO_ENCONTRADO', 'Registro não encontrado.');
  }
  return sucesso_(todos.filter(d => !dados.unidade || d.unidade === dados.unidade));
}

function executarGravacao_(acao, dados, perfil) {
  if (acao === 'tracos.salvarVersao') return salvarTraco_(dados, perfil);
  if (acao === 'tracos.enviarAprovacao') return enviarAprovacao_(dados, perfil);
  if (acao === 'tracos.aprovar') return aprovarTraco_(dados, perfil);
  if (acao === 'importacao.legado') return importarLegado_(dados, perfil);
  if (acao === 'importacao.documentos') return importarDocumentos_(dados, perfil);
  if (acao === 'usuarios.salvar') return salvarUsuario_(dados);
  const tipo = acao.split('.')[0];
  if (['materiais', 'fornecedores', 'ensaios', 'custos'].indexOf(tipo) < 0) return falha_('NAO_ENCONTRADO', 'Ação desconhecida.');
  if (acao === 'custos.excluir') return excluirCusto_(dados, perfil);
  if (acao !== tipo + '.salvar') return falha_('NAO_ENCONTRADO', 'Ação desconhecida.');
  if (!dados.id || !dados.unidade || !podeUnidade_(perfil, dados.unidade)) return falha_('VALIDACAO', 'ID e unidade são obrigatórios.');
  if (tipo === 'materiais' || tipo === 'fornecedores') dados.status = dados.status === 'inativo' ? 'inativo' : dados.status || 'ativo';
  const doc = { ...dados, alteradoPor: perfil.email, alteradoEm: new Date().toISOString() };
  gravarDocumento_(tipo, doc, doc.id);
  return sucesso_({ id: doc.id, versao: Number(doc.versao) || 1, revisao: Number(doc.revisao) || 1, documento: doc });
}

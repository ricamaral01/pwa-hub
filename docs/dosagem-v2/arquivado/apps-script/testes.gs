// Execute testesRodar_ no editor, com PLANILHA_ID configurado para uma planilha v2 de teste.
function testesRodar_() {
  const resultados = [];
  function checar(nome, fn) {
    try { fn(); resultados.push({ nome, passou: true }); }
    catch (e) { resultados.push({ nome, passou: false, erro: String(e) }); }
  }
  function exigir(condicao, mensagem) { if (!condicao) throw new Error(mensagem); }
  checar('Token inválido', function () { exigir(verificarToken('token-invalido') === null, 'Token aceito.'); });
  checar('Papel insuficiente', function () {
    exigir(!podeAcao_({ papel: 'laboratorio' }, 'tracos.aprovar'), 'Laboratório aprovou.');
    exigir(!podeAcao_({ papel: 'engenheiro' }, 'usuarios.salvar'), 'Engenheiro geriu usuários.');
  });
  checar('Validação física', function () {
    const t = testeTraco_();
    exigir(validarTracoServidor_(t).length === 0, 'Traço base inválido.');
    t.itens[0].massaEspecificaKgDm3 = 0;
    exigir(validarTracoServidor_(t).length > 0, 'Densidade zero aceita.');
  });
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('Não foi possível obter lock dos testes.');
  try {
    checar('RequestId repetido', function () {
      const id = 'teste-' + Utilities.getUuid();
      const resposta = sucesso_({ id: id, versao: 1, revisao: 1 });
      registrarRequisicao_(id, resposta);
      exigir(JSON.stringify(requisicaoAnterior_(id)) === JSON.stringify(resposta), 'Resposta idempotente divergente.');
      const sh = aba_('requisicoes', ['requestId', 'resposta', 'em']);
      const cell = sh.getRange(2, 1, sh.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
      if (cell) sh.deleteRow(cell.getRow());
    });
    checar('Conflito de revisão', function () {
      const t = testeTraco_();
      const perfil = { email: 'teste@local.invalid', papel: 'admin', unidades: ['*'] };
      const primeiro = salvarTraco_(t, perfil);
      exigir(primeiro.ok, 'Primeira gravação falhou.');
      const doc = primeiro.dados.documento;
      const segunda = salvarTraco_({ ...doc, revisao: 0 }, perfil);
      exigir(!segunda.ok && segunda.erro.codigo === 'CONFLITO_REVISAO', 'Conflito não detectado.');
      const sh = documentosAba_('tracos');
      const cell = sh.getRange(2, 1, sh.getLastRow() - 1, 1).createTextFinder(t.id + ':v1').matchEntireCell(true).findNext();
      if (cell) sh.deleteRow(cell.getRow());
    });
    checar('Importação em simulação', function () {
      const props = PropertiesService.getScriptProperties();
      if (!props.getProperty('LEGADO_DOSAGEM_ID')) throw new Error('Configure LEGADO_DOSAGEM_ID para executar.');
      const r = importarLegado_({ simulacao: true }, { papel: 'admin', email: 'teste@local.invalid', unidades: ['*'] });
      exigir(r.ok, 'Simulação falhou.');
    });
  } finally { lock.releaseLock(); }
  Logger.log(JSON.stringify(resultados));
  return resultados;
}

function testeTraco_() {
  return {
    id: Utilities.getUuid(), nome: 'Teste automático', unidade: 'teste', revisao: 0,
    objetivo: { fckMPa: 40, sdMPa: 4 }, arIncorporadoPct: 1.5,
    itens: [
      { id: Utilities.getUuid(), nome: 'Cimento', categoria: 'cimento', massaKgM3: 350, massaEspecificaKgDm3: 3.1 },
      { id: Utilities.getUuid(), nome: 'Água', categoria: 'agua', massaKgM3: 175, massaEspecificaKgDm3: 1 }
    ]
  };
}

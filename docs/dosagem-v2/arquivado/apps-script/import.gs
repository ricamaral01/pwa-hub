function importarLegado_(dados, perfil) {
  if (perfil.papel !== 'admin') return falha_('SEM_PERMISSAO', 'Importação exige admin.');
  const props = PropertiesService.getScriptProperties();
  const fontes = [
    ['dosagem', props.getProperty('LEGADO_DOSAGEM_ID'), ['CartasTraco', 'Página1', 'Experimental']],
    ['custos', props.getProperty('LEGADO_CUSTOS_ID'), ['custo']],
    ['fornecedores', props.getProperty('LEGADO_FORNECEDORES_ID'), ['fornecedor', 'ensaios_granulometria']]
  ];
  const amostras = [], avisos = [];
  let lidos = 0, convertidos = 0, gravados = 0;
  fontes.forEach(([tipo, id, abas]) => {
    if (!id) { avisos.push('ID da planilha ' + tipo + ' não configurado.'); return; }
    const ss = SpreadsheetApp.openById(id);
    abas.forEach(nome => {
      const sh = ss.getSheetByName(nome);
      if (!sh || sh.getLastRow() < 2) return;
      const rows = sh.getDataRange().getValues();
      const headers = rows.shift().map(String);
      rows.forEach((row, index) => {
        lidos++;
        const antigoId = String(row[0] || tipo + ':' + nome + ':' + (index + 2));
        const source = Object.fromEntries(headers.map((h, i) => [h, row[i]]));
        const convertido = converterLinhaLegada_(tipo, nome, antigoId, row, source, dados.unidadePadrao);
        if (!convertido) { avisos.push(nome + '/' + antigoId + ': requer conversão manual.'); return; }
        convertidos++;
        if (amostras.length < 5) amostras.push({ origem: nome, antigoId, convertido });
        if (dados.efetivar === true) {
          const existente = lerDocumentos_(convertido.tipo).find(d => d.origem === 'legado' && d.idLegado === antigoId);
          if (!existente) { gravarDocumento_(convertido.tipo, convertido.documento, convertido.documento.id + (convertido.tipo === 'tracos' ? ':v1' : '')); gravados++; }
        }
      });
    });
  });
  return sucesso_({ simulacao: dados.efetivar !== true, lidos, convertidos, gravados, avisos, amostras });
}
function converterLinhaLegada_(tipo, aba, antigoId, row, source, unidadePadrao) {
  const id = 'legado:' + tipo + ':' + aba + ':' + antigoId;
  const unidade = String(unidadePadrao || 'campinas');
  if (aba === 'CartasTraco') {
    const categorias = [
      ['cimento', 'Cimento', row[19], row[40]], ['adicao', 'Adição', row[20], row[41]],
      ['areia', 'Areia natural', row[21], row[42]],
      ['areia', 'Areia industrial', row[22], row[43]], ['brita', 'Brita 0', row[23], row[44]],
      ['brita', 'Brita 1/2', row[24], row[45]], ['agua', 'Água', row[25], 1],
      ['aditivo', 'Aditivo 1', Number(row[26]) - (Number(row[27]) || 0), row[46]],
      ['aditivo', 'Aditivo 2', row[27], row[47]]
    ];
    const itens = categorias.filter(x => Number(x[2]) > 0).map((x, i) => ({ id: id + ':' + i, categoria: x[0], nome: x[1], massaKgM3: Number(x[2]), massaEspecificaKgDm3: Number(x[3]) || 0 }));
    if (itens.some(i => i.massaEspecificaKgDm3 <= 0)) return null;
    return { tipo: 'tracos', documento: { id, origem: 'legado', idLegado: antigoId, codigo: '', nome: String(row[2] || antigoId), unidade: String(row[4] || unidade), versao: 1, revisao: 1, status: 'rascunho', metodo: 'manual', objetivo: { fckMPa: Number(row[16]) || 0, sdMPa: 4, classe: 'II', estrutura: 'armado', abatimentoMm: Number(row[17]) || 0, toleranciaMm: 20 }, itens, arIncorporadoPct: Number(row[29]) || 0, normalizarPara1m3: false, experimentais: [], auditoria: { criadoPor: 'importacao', criadoEm: new Date().toISOString(), alteradoPor: 'importacao', alteradoEm: new Date().toISOString() }, dadosOriginais: source } };
  }
  if (aba === 'custo') return { tipo: 'custos', documento: { id, origem: 'legado', idLegado: antigoId, unidade: String(row[6] || unidade), nomeProduto: String(row[2] || ''), tipoMaterial: row[3], chaveMCC: row[4], fornecedor: row[5], versao: Number(row[7]) || 1, revisao: 1, unidadeMedida: row[8], preco: Number(row[9]) || 0, icmsPct: Number(row[10]) || 0, frete: Number(row[12]) || 0, custoLiq: Number(row[16]) || 0, ativo: String(row[17]).toLowerCase() !== 'não', dadosOriginais: source } };
  if (aba === 'fornecedor') return { tipo: 'fornecedores', documento: { id, origem: 'legado', idLegado: antigoId, unidade, nome: String(row[1] || ''), contato: String(row[2] || ''), ativo: true, versao: 1, revisao: 1, dadosOriginais: source } };
  return null;
}
function importarDocumentos_(dados, perfil) {
  if (perfil.papel !== 'admin') return falha_('SEM_PERMISSAO', 'Importação exige admin.');
  if (!Array.isArray(dados.documentos) || dados.documentos.length > 100) return falha_('LIMITE', 'Envie até 100 documentos por vez.');
  const amostras = [], avisos = [];
  let convertidos = 0, gravados = 0;
  dados.documentos.forEach((d, index) => {
    const convertido = converterDocumentoCliente_(d, dados.unidadePadrao);
    if (!convertido) { avisos.push('Documento ' + (index + 1) + ' não convertido.'); return; }
    convertidos++;
    if (amostras.length < 5) amostras.push(convertido);
    if (dados.efetivar === true && podeUnidade_(perfil, convertido.unidade) && !lerDocumentos_('tracos').some(t => t.idLegado === convertido.idLegado)) { gravarDocumento_('tracos', convertido, convertido.id + ':v1'); gravados++; }
  });
  return sucesso_({ simulacao: dados.efetivar !== true, lidos: dados.documentos.length, convertidos, gravados, avisos, amostras });
}
function converterDocumentoCliente_(c, unidadePadrao) {
  if (!c || !c.id) return null;
  const id = 'legado:local:' + String(c.id);
  const spec = [['cim', 'cimento', 'Cimento', 'rhoCim'], ['adic', 'adicao', 'Adição', 'rhoAdic'], ['an', 'areia', 'Areia natural 1', 'rhoAn'], ['an2', 'areia', 'Areia natural 2', 'rhoAn2'], ['ai', 'areia', 'Areia industrial', 'rhoAi'], ['b0', 'brita', 'Brita 0', 'rhoB0'], ['b1', 'brita', 'Brita 1/2', 'rhoB1'], ['agua', 'agua', 'Água', null], ['adit', 'aditivo', 'Aditivo 1', 'rhoAdit'], ['adit2', 'aditivo', 'Aditivo 2', 'rhoAdit2']];
  const itens = spec.filter(x => Number(c[x[0]]) > 0).map((x, i) => ({ id: id + ':' + i, categoria: x[1], nome: x[2], massaKgM3: x[0] === 'an' && Number(c.an2) > 0 ? Number(c.an) - Number(c.an2) : Number(c[x[0]]), massaEspecificaKgDm3: x[3] ? Number(c[x[3]]) || 0 : 1 }));
  if (itens.some(i => i.massaEspecificaKgDm3 <= 0)) return null;
  const now = new Date().toISOString();
  return { id, idLegado: String(c.id), origem: 'legado', codigo: '', nome: String(c.tracoNome || c.nome || c.id), unidade: String(c.unidade || unidadePadrao || 'campinas'), versao: 1, revisao: 1, status: 'rascunho', metodo: 'manual', objetivo: { fckMPa: Number(c.fck) || 0, sdMPa: 4, classe: 'II', estrutura: 'armado', abatimentoMm: Number(c.flow) || 0, toleranciaMm: 20 }, itens, arIncorporadoPct: Number(c.ar) || 0, normalizarPara1m3: false, experimentais: [], auditoria: { criadoPor: 'importacao', criadoEm: now, alteradoPor: 'importacao', alteradoEm: now }, dadosOriginais: c };
}

// Rotas propostas dentro desta instalação. Calculadas a partir deste script para
// funcionar em /unificado/ na VPS e na raiz do servidor local de avaliação.
const UNIFICADO_BASE = new URL('../', document.currentScript.src);
const PCP_BASE = new URL('pcp/', UNIFICADO_BASE);
const MAPA_BASE = new URL('mapa/', UNIFICADO_BASE);
const LAB_BASE = new URL('laboratorio/', UNIFICADO_BASE);
const QUALITY_BASE = new URL('qualidade/', UNIFICADO_BASE);
const USINAS_BASE = new URL('usinas/', UNIFICADO_BASE);
const SUPRIMENTOS_BASE = new URL('suprimentos/', UNIFICADO_BASE);

const MENU_CONFIG = {
  planejamento: {
    label: 'Planejamento',
    groups: [
      { items: [
        { id: 'dashboard', label: 'Dashboard', path: '/pages/dashboard/' },
        { id: 'comparacao', label: 'Programado vs Realizado', path: '/pages/comparacao/' }
      ] },
      { label: 'Programação', items: [
        { id: 'programacao12', label: 'Setor 1 e 2', path: '/pages/programacao-alex/' },
        { id: 'programacao34', label: 'Setor 3 e 4', path: '/pages/programacao/' },
        { id: 'circular3', label: 'Circular Setor 3', path: '/pages/programacao-circular-s3/' },
        { id: 'dt4', label: 'DT Setor 4', path: '/pages/programacao-circular-s4/' },
        { id: 'programacaoFinal', label: 'Programação Final', path: '/pages/programacao-final/' }
      ] },
      { label: 'Relatórios de Programação', items: [
        { id: 'relatorio12', label: 'Setor 1 e 2', path: '/pages/relatorio-producao/' },
        { id: 'relatorio3', label: 'Setor 3', path: '/pages/relatorio-programacao-s3/' },
        { id: 'relatorio4', label: 'Setor 4', path: '/pages/relatorio-programacao-s4/' }
      ] },
      { label: 'Etiquetas', items: [
        { id: 'etiquetas', label: 'Padrão', path: '/pages/etiquetas/' },
        { id: 'etiquetasSc', label: 'SC-Prod.', path: '/pages/etiquetas-sc/' },
        { id: 'etiquetasArmaduras', label: 'Armaduras', path: '/pages/etiquetas-armaduras/' }
      ] },
      { label: 'Acompanhamento', items: [
        { id: 'pcpDiario', label: 'PCP Diário', path: '/pages/pcp-diario/' },
        { id: 'acompMensal', label: 'Acompanhamento Mensal', path: '/pages/acompanhamento-mensal/' },
        { id: 'acompMensal34', label: 'Acompanhamento Mensal Setor 3 e 4', path: '/pages/acompanhamento-mensal-setor-34/' },
        { id: 'apontamentoMega', label: 'Apontamento Mega', path: '/pages/apontamento-mega/' },
        { id: 'fechamentoDiarioPcp', label: 'Fechamento Diário', path: '/pages/fechamento-diario/' }
      ] },
      { label: 'Produção e apoio', items: [
        { id: 'producaoPcp', label: 'Produção PCP', path: '/pages/producao/' },
        { id: 'maodeobra', label: 'Mão de Obra', path: '/pages/maodeobra/' },
        { id: 'maodeobraRateio', label: 'Rateio de Mão de Obra', path: '/pages/maodeobra-rateio/' },
        { id: 'formasPorSetor', label: 'Formas por Setor', path: '/pages/formas-por-setor/' },
        { id: 'testeProgramacao', label: 'Teste Programação', path: '/pages/teste-programacao/' }
      ] }
    ]
  },
  producao: {
    label: 'Produção',
    groups: [
      { label: 'Campinas · Produção', items: [
        { id: 'liberacao', mono: 'PL', label: 'Produção / Liberação', path: '/index.html', screen: 'LIBERACAO' },
        { id: 'setor1', mono: 'P1', label: 'Setor 1', path: '/index.html', screen: 'LIBERACAO_S1' },
        { id: 'setor2', mono: 'P2', label: 'Setor 2', path: '/index.html', screen: 'LIBERACAO_S2' },
        { id: 'setor3', mono: 'P3', label: 'Setor 3', path: '/index.html', screen: 'LIBERACAO_S3' },
        { id: 'setor4', mono: 'P4', label: 'Setor 4', path: '/index.html', screen: 'LIBERACAO_S4' },
        { id: 'mandril', mono: 'MC', label: 'Mandril Circular', path: '/index.html', screen: 'MANDRIL_CIRCULAR' }
      ] },
      { label: 'Campinas · Montagem', items: [
        { id: 'inspecao', mono: 'MI', label: 'Inspeção Setor 3 e 4', path: '/index.html', screen: 'INSPECAO' },
        { id: 'montagem', mono: 'MP', label: 'Montagem Postes', path: '/index.html', screen: 'MONTAGEM_POSTES' },
        { id: 'sequencia', mono: 'S3', label: 'Sequência Setor 3', path: '/index.html', screen: 'SEQUENCIA_S3' }
      ] },
      { label: 'Campinas · Controle', items: [
        { id: 'relatorioMapa', mono: 'RE', label: 'Relatório Enc. Produção', path: '/index.html', screen: 'RELATORIO' },
        { id: 'historico', mono: 'HI', label: 'Histórico', path: '/index.html', screen: 'HISTORICO' },
        { id: 'acmpConcretagem', mono: 'CC', label: 'Acmp. Concretagem', path: '/index.html', screen: 'ACMP_CONCRETAGEM' },
        { id: 'manutencao', mono: 'MF', label: 'Manutenção Formas', path: '/index.html', screen: 'RELATORIO_MANUTENCAO' },
        { id: 'tratativa', mono: 'TD', label: 'Tratativa Defeitos', path: '/index.html', screen: 'TRATATIVA_DEFEITOS' },
        { id: 'fechamentoDiario', label: 'Fechamento diário', path: '/unificado/relatorios/fechamento-diario/' }
      ] },
      { label: 'Campinas · Indicadores', items: [
        { id: 'dashMontagem', mono: 'DM', label: 'Dashboard Montagem', path: '/index.html', screen: 'MONTAGEM_INDICADORES' },
        { id: 'dashDefeitos', mono: 'DF', label: 'Dashboard Defeitos', path: '/index.html', screen: 'DASHBOARD_DEFEITOS' },
        { id: 'produtividade', mono: 'CO', label: 'Dashboard Concretagem Matriz', path: '/index.html', screen: 'PROD_ANALISE' },
        { id: 'tvFormas', mono: 'TV', label: 'Painel TV — Formas', path: '/unificado/tv/formas/', screen: 'TV_FORMAS' }
      ] },
      { label: 'Pederneiras', items: [
        { id: 'pdrApontamento', mono: 'AP', label: 'Apontamento do dia', path: 'apontamento', pederneiras: true },
        { id: 'pdrMaoDeObra', mono: 'MO', label: 'Mão de obra', path: 'mao-de-obra', pederneiras: true },
        { id: 'pdrMensal', mono: 'PM', label: 'Produção Pederneiras', path: 'mensal', pederneiras: true },
        { id: 'pdrIndicadores', mono: 'IN', label: 'Indicadores', path: 'indicadores', pederneiras: true },
        { id: 'pdrProdutos', mono: 'CP', label: 'Cadastro de produtos', path: 'produtos', pederneiras: true }
      ] }
    ]
  },
  qualidade: {
    label: 'Qualidade',
    groups: [{ label: 'Não conformidades', items: [
      { id:'qualidadePainel', label:'Painel', path:'' },
      { id:'qualidadeAbertura', label:'Abrir NC', path:'abrir' },
      { id:'qualidadeResultadosBancada', label:'Resultados de bancada', path:'resultados-bancada' },
      { id:'qualidadeCadastros', label:'Cadastros', path:'cadastros' }
    ] },
      { label: 'Certificados', items: [
        { id:'labCertificados', label:'Emitir certificado de qualidade', path:'/unificado/laboratorio/certificados-qualidade/' },
        { id:'labCertificadosHistorico', label:'Histórico de certificados', path:'/unificado/laboratorio/certificados-qualidade/?tab=historico', permissionId:'labCertificados' },
        { id:'labCertificadosCadastros', label:'Cadastros de certificados', path:'/unificado/laboratorio/certificados-qualidade/?tab=cadastros', permissionId:'labCertificados' },
        { id:'labTests', label:'Certificados de ensaios', path:'/unificado/laboratorio/novo/postes?tab=historico' }
      ] }]
  },
  usinas: {
    label: 'Usinas',
    groups: [{ label: 'Geral', items: [
      { id: 'usinasInicio', label: 'Cartas de traço', path: '' },
      { id: 'usinasCec', label: 'Controle estatístico', path: '?area=cec', permissionId: 'usinasInicio' },
      { id: 'usinasRelatorios', label: 'Relatórios gerenciais', path: '?area=relatorios', permissionId: 'usinasInicio' },
      { id: 'usinasEstoque', label: 'Controle de estoque', path: '?area=estoque', permissionId: 'usinasInicio' }
    ] }]
  },
  laboratorio: {
    label: 'Laboratório',
    groups: [
      { label: 'Corpos de Prova', items: [
        { id:'labCecEtiquetas', label:'Etiquetas QR', path:'cec/etiquetas/', permissionId:'labCec' },
        { id:'labCecLeitura', label:'Leitura de CP', path:'cec/leitura/', permissionId:'labCec' },
        { id:'labCecResultados', label:'Resultados dos corpos de prova', path:'cec/analise/resultado-cp.html', permissionId:'labCec' }
      ] },
      { label: 'Controle estatístico', items: [
        { id:'labCec', label:'Visão geral', path:'cec/' },
        { id:'labCecAnalise', label:'Análise estatística', path:'cec/analise/', permissionId:'labCec' },
        { id:'labCecRelatorio', label:'Relatório CEC', path:'cec/analise/relatorio.html', permissionId:'labCec' }
      ] },
      { label: 'Dosagem', items: [
        { id:'labDosagem', label:'Visão geral', path:'dosagem/' },
        { id:'labDosagemEmpacotamento', label:'Empacotamento', path:'dosagem/#/dosagem/empacotamento', permissionId:'labDosagem' },
        { id:'labDosagemVolume', label:'Volume', path:'dosagem/#/dosagem/volume', permissionId:'labDosagem' },
        { id:'labDosagemComparacao', label:'Comparação dos métodos', path:'dosagem/#/comparacao-metodos', permissionId:'labDosagem' },
        { id:'labDosagemTracos', label:'Traços', path:'dosagem/#/tracos', permissionId:'labDosagem' },
        { id:'labDosagemMateriais', label:'Materiais', path:'dosagem/#/materiais', permissionId:'labDosagem' },
        { id:'labDosagemFornecedores', label:'Fornecedores', path:'dosagem/#/fornecedores', permissionId:'labDosagem' },
        { id:'labDosagemEnsaios', label:'Ensaios', path:'dosagem/#/ensaios', permissionId:'labDosagem' },
        { id:'labDosagemFerramentas', label:'Ferramentas', path:'dosagem/#/ferramentas', permissionId:'labDosagem' },
        { id:'labDosagemCustos', label:'Custos', path:'dosagem/#/custos', permissionId:'labDosagem' },
        { id:'labDosagemReferencia', label:'Referência', path:'dosagem/#/referencia', permissionId:'labDosagem' },
        { id:'labDosagemProducao', label:'Produção', path:'dosagem/#/producao-r1', permissionId:'labDosagem' },
        { id:'labDosagemImportacao', label:'Importação', path:'dosagem/#/importacao-r1', permissionId:'labDosagem', dosagemAdmin:true },
        { id:'labDosagemConfig', label:'Configurações', path:'dosagem/#/config', permissionId:'labDosagem' }
      ] },
      { label: 'Concreto fresco', items: [
        { id:'labSlump', label:'Registro de slump / flow', path:'slump' }
      ] },
      { label: 'Usina de Campinas', items: [
        { id:'labUsinasRelatorios', label:'Relatórios e custos', path:'usinas-relatorios/' }
      ] },
      { label: 'Cura térmica', items: [
        { id:'labMonitor', label:'Monitoramento', path:'' },
        { id:'labHistory', label:'Histórico de medições', path:'?view=history' },
        { id:'labDevice', label:'Dispositivo', path:'?view=settings' }
      ] },
      { label: 'Postes', items: [
        { id:'labCertificados', label:'Certificados de qualidade', path:'certificados-qualidade/' },
        { id:'labPole', label:'Ensaio de postes', path:'novo/postes' },
        { id:'labAbsorption', label:'Absorção', path:'novo/postes?tab=absorcao' },
        { id:'labTests', label:'Histórico de ensaios', path:'novo/postes?tab=historico' },
        { id:'labRegisters', label:'Cadastros', path:'novo/postes?tab=cadastros' },
        { id:'labCriteria', label:'Critérios', path:'novo/postes?tab=criterios' }
      ] },
      { label: 'Cronoanálise', items: [
        { id:'cronoanalise.inicio', label:'Início', path:'cronoanalise' },
        { id:'cronoanalise.coletar', label:'Coletar', path:'cronoanalise/coletar' },
        { id:'cronoanalise.medicoes', label:'Medições', path:'cronoanalise/medicoes' },
        { id:'cronoanalise.catalogo', label:'Catálogo', path:'cronoanalise/catalogo' },
        { id:'cronoanalise.dimensionar', label:'Dimensionar', path:'cronoanalise/dimensionar' },
        { id:'cronoanalise.simular', label:'Simular', path:'cronoanalise/simular' },
        { id:'cronoanalise.metodologia', label:'Metodologia', path:'cronoanalise/metodologia' }
      ] },
      { label: 'Carta de traço', items: [
        { id:'labCartaTraco', label:'Carta de traço e MCC', path:'carta-traco/' }
      ] },
      { label: 'Administração', items: [
        { id:'labUsuarios', label:'Usuários', path:'novo/postes?tab=usuarios' }
      ] },
      { items: [{ id:'labHelp', label:'Como funciona', path:'?view=help' }] }
    ]
  },
  suprimentos: {
    label: 'Suprimentos',
    groups: [
      { label: 'Solicitações', items: [
        { id:'suprimentosPainel', label:'Painel', path:'painel/' },
        { id:'suprimentosSolicitacoes', label:'Solicitações', path:'solicitacoes/' },
        { id:'suprimentosNova', label:'Nova solicitação', path:'nova/' },
        { id:'suprimentosAlmoxarifado', label:'Almoxarifado', path:'almoxarifado/', futurePhase:'S2' },
        { id:'suprimentosInventario', label:'Inventário', path:'inventario/', futurePhase:'S2' }
      ] },
      { label: 'Compras', items: [
        { id:'suprimentosCotacoes', label:'Cotações e pedidos', path:'cotacoes/', futurePhase:'S3A' },
        { id:'suprimentosRecebimento', label:'Recebimento', path:'recebimento/', futurePhase:'S3B' },
        { id:'suprimentosFornecedores', label:'Fornecedores', path:'fornecedores/', futurePhase:'S3A' },
        { id:'suprimentosIndicadores', label:'Indicadores', path:'analises/', futurePhase:'S5' }
      ] },
      { label: 'Administração', items: [
        { id:'suprimentosCadastros', label:'Cadastros e alçadas', path:'cadastros/' }
      ] }
    ]
  }
};

const MENU_ITEMS = Object.fromEntries(Object.entries(MENU_CONFIG).flatMap(([module, value]) =>
  value.groups.flatMap(group => group.items.map(item => [item.id, {
    ...item,
    module,
    require: module === 'planejamento' ? (
      ['programacao12','programacao34','circular3','dt4','programacaoFinal',
       'relatorio12','relatorio3','relatorio4','etiquetas','etiquetasSc',
       'etiquetasArmaduras','acompMensal','acompMensal34','formasPorSetor'].includes(item.id) ? 'PCP' :
      ['pcpDiario','apontamentoMega','producaoPcp','fechamentoDiarioPcp','maodeobra','maodeobraRateio'].includes(item.id) ? 'PRODUCAO' :
      item.id === 'testeProgramacao' ? 'ADMIN' : null) : null,
    url: module === 'usinas'
      ? new URL(item.path, USINAS_BASE).href
      : module === 'suprimentos'
      ? new URL(item.path, SUPRIMENTOS_BASE).href
      : module === 'qualidade'
      ? new URL(item.path, QUALITY_BASE).href
      : module === 'laboratorio'
      ? new URL(item.path, LAB_BASE).href
      : module === 'planejamento'
      ? new URL(item.path.replace(/^\/pages\//, ''), PCP_BASE).href
      : item.pederneiras
      ? new URL(`producao/pederneiras/?tab=${encodeURIComponent(item.path)}`, UNIFICADO_BASE).href
      : item.id === 'tvFormas'
      ? new URL('tv/formas/', UNIFICADO_BASE).href
      : item.id === 'fechamentoDiario'
      ? new URL('relatorios/fechamento-diario/', UNIFICADO_BASE).href
      : new URL(`operacao/?tela=${encodeURIComponent(item.screen)}`, MAPA_BASE).href,
    available: true
  }]))
));

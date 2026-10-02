// Destinos atuais. O Mapa ainda não oferece URL para abrir uma tela interna.
const PCP_BASE = 'https://pcp.concretrack.com.br';
const MAPA_BASE = 'https://usina.concretrack.com.br/mapa-concretagem';

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
        { id: 'apontamentoMega', label: 'Apontamento Mega', path: '/pages/apontamento-mega/' }
      ] }
    ]
  },
  producao: {
    label: 'Produção',
    groups: [
      { label: 'Produção', items: [
        { id: 'liberacao', mono: 'PL', label: 'Produção / Liberação', path: '/index.html', screen: 'LIBERACAO' },
        { id: 'setor1', mono: 'P1', label: 'Setor 1', path: '/index.html', screen: 'LIBERACAO_S1' },
        { id: 'setor2', mono: 'P2', label: 'Setor 2', path: '/index.html', screen: 'LIBERACAO_S2' },
        { id: 'setor3', mono: 'P3', label: 'Setor 3', path: '/index.html', screen: 'LIBERACAO_S3' },
        { id: 'setor4', mono: 'P4', label: 'Setor 4', path: '/index.html', screen: 'LIBERACAO_S4' },
        { id: 'mandril', mono: 'MC', label: 'Mandril Circular', path: '/index.html', screen: 'MANDRIL_CIRCULAR' }
      ] },
      { label: 'Montagem', items: [
        { id: 'inspecao', mono: 'MI', label: 'Inspeção Setor 3 e 4', path: '/index.html', screen: 'INSPECAO' },
        { id: 'montagem', mono: 'MP', label: 'Montagem Postes', path: '/index.html', screen: 'MONTAGEM_POSTES' },
        { id: 'sequencia', mono: 'S3', label: 'Sequência Setor 3', path: '/index.html', screen: 'SEQUENCIA_S3' }
      ] },
      { label: 'Controle', items: [
        { id: 'relatorioMapa', mono: 'RE', label: 'Relatório Enc. Produção', path: '/index.html', screen: 'RELATORIO' },
        { id: 'historico', mono: 'HI', label: 'Histórico', path: '/index.html', screen: 'HISTORICO' },
        { id: 'acmpConcretagem', mono: 'CC', label: 'Acmp. Concretagem', path: '/index.html', screen: 'ACMP_CONCRETAGEM' },
        { id: 'manutencao', mono: 'MF', label: 'Manutenção Formas', path: '/index.html', screen: 'RELATORIO_MANUTENCAO' },
        { id: 'tratativa', mono: 'TD', label: 'Tratativa Defeitos', path: '/index.html', screen: 'TRATATIVA_DEFEITOS' }
      ] },
      { label: 'Indicadores', items: [
        { id: 'dashMontagem', mono: 'DM', label: 'Dashboard Montagem', path: '/index.html', screen: 'MONTAGEM_INDICADORES' },
        { id: 'dashDefeitos', mono: 'DF', label: 'Dashboard Defeitos', path: '/index.html', screen: 'DASHBOARD_DEFEITOS' },
        { id: 'produtividade', mono: 'PR', label: 'Produtividade', path: '/index.html', screen: 'PROD_ANALISE' }
      ] }
    ]
  }
};

const MENU_ITEMS = Object.fromEntries(Object.entries(MENU_CONFIG).flatMap(([module, value]) =>
  value.groups.flatMap(group => group.items.map(item => [item.id, { ...item, module, url: (module === 'planejamento' ? PCP_BASE : MAPA_BASE) + item.path }]))
));

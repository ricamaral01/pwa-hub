// Rotas reais da casca do Unificado; a seleção atual permanece em ?view=.
export type IconName =
  | 'calendar' | 'factory' | 'shield' | 'flask' | 'folder'
  | 'thermometer' | 'drop' | 'history' | 'database' | 'sliders'
  | 'help' | 'users' | 'post' | 'alert' | 'map' | 'doc';
export type NavBadge = { text: string; tone: 'live' | 'alert' };
export type NavItem = { id: string; label: string; href: string; icon: IconName; badge?: NavBadge };
export type NavSection = { title: string; items: NavItem[] };
export type NavModule = { id: string; label: string; color: string; icon: IconName; sections: NavSection[] };

export const MODULE_COLORS = {
  planejamento: '#5B8DEF', producao: '#F08A3C', qualidade: '#2FB38A',
  laboratorio: '#F2B705', usinas: '#168E9A', ged: '#9B7BF0', suprimentos: '#2DD4BF',
} as const;

type Entry = [id: string, label: string, route: string, icon: IconName, badge?: NavBadge];
const view = (route: string) => '/unificado/?view=' + encodeURIComponent(route);
const section = (title: string, entries: Entry[]): NavSection => ({
  title, items: entries.map(([id, label, route, icon, badge]) =>
    ({ id, label, href: view(route), icon, ...(badge ? { badge } : {}) })),
});
const p = (screen: string) => `mapa/operacao/?tela=${screen}`;

export const NAV_MODULES: NavModule[] = [
  { id:'planejamento', label:'Planejamento', color:MODULE_COLORS.planejamento, icon:'calendar', sections:[
    section('GERAL', [
      ['dashboard','Dashboard','pcp/dashboard/','map'],
      ['comparacao','Programado vs Realizado','pcp/comparacao/','sliders'],
    ]),
    section('PROGRAMAÇÃO', [
      ['programacao12','Setor 1 e 2','pcp/programacao-alex/','calendar'],
      ['programacao34','Setor 3 e 4','pcp/programacao/','calendar'],
      ['circular3','Circular Setor 3','pcp/programacao-circular-s3/','calendar'],
      ['dt4','DT Setor 4','pcp/programacao-circular-s4/','calendar'],
      ['programacaoFinal','Programação Final','pcp/programacao-final/','calendar'],
    ]),
    section('RELATÓRIOS DE PROGRAMAÇÃO', [
      ['relatorio12','Setor 1 e 2','pcp/relatorio-producao/','doc'],
      ['relatorio3','Setor 3','pcp/relatorio-programacao-s3/','doc'],
      ['relatorio4','Setor 4','pcp/relatorio-programacao-s4/','doc'],
    ]),
    section('ETIQUETAS', [
      ['etiquetas','Padrão','pcp/etiquetas/','doc'],
      ['etiquetasSc','SC-Prod.','pcp/etiquetas-sc/','doc'],
      ['etiquetasArmaduras','Armaduras','pcp/etiquetas-armaduras/','doc'],
    ]),
    section('ACOMPANHAMENTO', [
      ['pcpDiario','PCP Diário','pcp/pcp-diario/','history'],
      ['acompMensal','Acompanhamento Mensal','pcp/acompanhamento-mensal/','history'],
      ['acompMensal34','Acompanhamento Mensal Setor 3 e 4','pcp/acompanhamento-mensal-setor-34/','history'],
      ['apontamentoMega','Apontamento Mega','pcp/apontamento-mega/','database'],
      ['fechamentoDiarioPcp','Fechamento Diário','pcp/fechamento-diario/','doc'],
    ]),
    section('PRODUÇÃO E APOIO', [
      ['producaoPcp','Produção PCP','pcp/producao/','factory'],
      ['maodeobra','Mão de Obra','pcp/maodeobra/','users'],
      ['maodeobraRateio','Rateio de Mão de Obra','pcp/maodeobra-rateio/','users'],
      ['formasPorSetor','Formas por Setor','pcp/formas-por-setor/','database'],
      ['testeProgramacao','Teste Programação','pcp/teste-programacao/','sliders'],
    ]),
  ] },
  { id:'producao', label:'Produção', color:MODULE_COLORS.producao, icon:'factory', sections:[
    section('PRODUÇÃO', [
      ['liberacao','Produção / Liberação',p('LIBERACAO'),'factory'],
      ['setor1','Setor 1',p('LIBERACAO_S1'),'factory'],
      ['setor2','Setor 2',p('LIBERACAO_S2'),'factory'],
      ['setor3','Setor 3',p('LIBERACAO_S3'),'factory'],
      ['setor4','Setor 4',p('LIBERACAO_S4'),'factory'],
      ['mandril','Mandril Circular',p('MANDRIL_CIRCULAR'),'sliders'],
    ]),
    section('MONTAGEM', [
      ['inspecao','Inspeção Setor 3 e 4',p('INSPECAO'),'shield'],
      ['montagem','Montagem Postes',p('MONTAGEM_POSTES'),'post'],
      ['sequencia','Sequência Setor 3',p('SEQUENCIA_S3'),'history'],
    ]),
    section('CONTROLE', [
      ['relatorioMapa','Relatório Enc. Produção',p('RELATORIO'),'doc'],
      ['historico','Histórico',p('HISTORICO'),'history'],
      ['acmpConcretagem','Acmp. Concretagem',p('ACMP_CONCRETAGEM'),'sliders'],
      ['manutencao','Manutenção Formas',p('RELATORIO_MANUTENCAO'),'sliders'],
      ['tratativa','Tratativa Defeitos',p('TRATATIVA_DEFEITOS'),'alert'],
    ]),
    section('INDICADORES', [
      ['dashMontagem','Dashboard Montagem',p('MONTAGEM_INDICADORES'),'map'],
      ['dashDefeitos','Dashboard Defeitos',p('DASHBOARD_DEFEITOS'),'map'],
      ['produtividade','Dashboard Concretagem Matriz',p('PROD_ANALISE'),'map'],
      ['tvFormas','Painel TV — Formas','tv/formas/','map'],
    ]),
  ] },
  { id:'qualidade', label:'Qualidade', color:MODULE_COLORS.qualidade, icon:'shield', sections:[
    section('NÃO CONFORMIDADES', [
      ['qualidadePainel','Painel de RNCs','qualidade/','alert'],
      ['qualidadeAbertura','Abrir RNC','qualidade/abrir','doc'],
      ['qualidadeResultadosBancada','Resultados de bancada','qualidade/resultados-bancada','doc'],
      ['qualidadeCadastros','Cadastros','qualidade/cadastros','database'],
    ]),
  ] },
  { id:'laboratorio', label:'Laboratório', color:MODULE_COLORS.laboratorio, icon:'flask', sections:[
    section('DOSAGEM', [
      ['labDosagem','Visão geral','laboratorio/dosagem/','flask'],
      ['labDosagemEmpacotamento','Empacotamento','laboratorio/dosagem/#/dosagem/empacotamento','flask'],
      ['labDosagemVolume','Volume','laboratorio/dosagem/#/dosagem/volume','flask'],
      ['labDosagemComparacao','Comparação dos métodos','laboratorio/dosagem/#/comparacao-metodos','sliders'],
      ['labDosagemTracos','Traços','laboratorio/dosagem/#/tracos','doc'],
      ['labDosagemMateriais','Materiais','laboratorio/dosagem/#/materiais','database'],
      ['labDosagemFornecedores','Fornecedores','laboratorio/dosagem/#/fornecedores','database'],
      ['labDosagemEnsaios','Ensaios','laboratorio/dosagem/#/ensaios','flask'],
      ['labDosagemFerramentas','Ferramentas','laboratorio/dosagem/#/ferramentas','sliders'],
      ['labDosagemCustos','Custos','laboratorio/dosagem/#/custos','doc'],
      ['labDosagemReferencia','Referência','laboratorio/dosagem/#/referencia','help'],
      ['labDosagemProducao','Produção','laboratorio/dosagem/#/producao-r1','factory'],
      ['labDosagemImportacao','Importação','laboratorio/dosagem/#/importacao-r1','database'],
      ['labDosagemConfig','Configurações','laboratorio/dosagem/#/config','sliders'],
    ]),
    section('CONCRETO FRESCO', [
      ['labSlump','Registro de slump / flow','laboratorio/slump','thermometer'],
    ]),
    section('CURA TÉRMICA', [
      ['labMonitor','Monitoramento','laboratorio/','thermometer',{text:'AO VIVO',tone:'live'}],
      ['labHistory','Histórico de medições','laboratorio/?view=history','history'],
      ['labDevice','Dispositivo','laboratorio/?view=settings','sliders'],
    ]),
    section('POSTES', [
      ['labPole','Ensaio de postes','laboratorio/novo/postes','post'],
      ['labAbsorption','Absorção','laboratorio/novo/postes?tab=absorcao','drop'],
      ['labTests','Histórico de ensaios','laboratorio/novo/postes?tab=historico','history'],
      ['labRegisters','Cadastros','laboratorio/novo/postes?tab=cadastros','database'],
      ['labCriteria','Critérios','laboratorio/novo/postes?tab=criterios','sliders'],
    ]),
    section('CRONOANÁLISE', [
      ['cronoanalise.inicio','Início','laboratorio/cronoanalise','history'],
      ['cronoanalise.coletar','Coletar','laboratorio/cronoanalise/coletar','thermometer'],
      ['cronoanalise.medicoes','Medições','laboratorio/cronoanalise/medicoes','database'],
      ['cronoanalise.catalogo','Catálogo','laboratorio/cronoanalise/catalogo','sliders'],
      ['cronoanalise.dimensionar','Dimensionar','laboratorio/cronoanalise/dimensionar','factory'],
      ['cronoanalise.simular','Simular','laboratorio/cronoanalise/simular','map'],
      ['cronoanalise.metodologia','Metodologia','laboratorio/cronoanalise/metodologia','help'],
    ]),
  ] },
  { id:'usinas', label:'Usinas', color:MODULE_COLORS.usinas, icon:'factory', sections:[
    section('GERAL', [
      ['usinasInicio','Cartas de traço','usinas/','map'],
      ['usinasCec','Controle estatístico','usinas/?area=cec','database'],
      ['usinasRelatorios','Relatórios gerenciais','usinas/?area=relatorios','doc'],
      ['usinasEstoque','Controle de estoque','usinas/?area=estoque','factory'],
    ]),
  ] },
  { id:'ged', label:'GED', color:MODULE_COLORS.ged, icon:'folder', sections:[
    section('GESTÃO DOCUMENTAL', [
      ['ged-dashboard','Painel','ged/dashboard','map'],
      ['ged-documents','Documentos','ged/documents','doc'],
      ['ged-approvals','Aprovações','ged/approvals','shield'],
      ['ged-tasks','Tarefas','ged/tasks','calendar'],
      ['ged-calibrations','Calibrações','ged/calibrations','sliders'],
    ]),
  ] },
  { id:'suprimentos', label:'Suprimentos', color:MODULE_COLORS.suprimentos, icon:'database', sections:[
    section('SOLICITAÇÕES', [
      ['suprimentosPainel','Painel','suprimentos/painel/','map'],
      ['suprimentosSolicitacoes','Solicitações','suprimentos/solicitacoes/','doc'],
      ['suprimentosNova','Nova solicitação','suprimentos/nova/','post'],
      ['suprimentosAlmoxarifado','Almoxarifado','suprimentos/almoxarifado/','database'],
      ['suprimentosInventario','Inventário','suprimentos/inventario/','sliders'],
    ]),
    section('COMPRAS', [
      ['suprimentosCotacoes','Cotações e pedidos','suprimentos/cotacoes/','doc'],
      ['suprimentosRecebimento','Recebimento','suprimentos/recebimento/','post'],
      ['suprimentosFornecedores','Fornecedores','suprimentos/fornecedores/','users'],
      ['suprimentosIndicadores','Indicadores','suprimentos/analises/','map'],
    ]),
    section('ADMINISTRAÇÃO', [
      ['suprimentosCadastros','Cadastros e alçadas','suprimentos/cadastros/','sliders'],
    ]),
  ] },
];

export const FOOTER_ITEMS: NavItem[] = [
  {id:'usuarios',label:'Usuários',href:view(p('USUARIOS')),icon:'users'},
  {id:'reportProblem',label:'Relatar problema',href:'/unificado/testar/#relatar',icon:'alert'},
  {id:'labHelp',label:'Como funciona',href:view('laboratorio/?view=help'),icon:'help'},
];

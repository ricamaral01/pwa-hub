// Configuração do menu lateral — Modelo A (agrupado por seção).
// Ajuste módulos, seções e rotas aqui; o componente só renderiza.

export type IconName =
  | 'calendar' | 'factory' | 'shield' | 'flask' | 'folder'
  | 'thermometer' | 'drop' | 'history' | 'database' | 'sliders'
  | 'help' | 'users' | 'post' | 'alert' | 'map' | 'doc';

export type NavBadge = { text: string; tone: 'live' | 'alert' };

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: IconName;
  badge?: NavBadge;
};

export type NavSection = { title: string; items: NavItem[] };

export type NavModule = {
  id: string;
  label: string;
  color: string; // cor do módulo (bolinha, tile do seletor e destaque da tela ativa)
  icon: IconName;
  sections: NavSection[];
};

// Cores fixas por módulo. Laboratório = amarelo, diferente dos demais.
export const MODULE_COLORS = {
  planejamento: '#5B8DEF',
  producao: '#F08A3C',
  qualidade: '#2FB38A',
  laboratorio: '#F2B705',
  ged: '#9B7BF0',
} as const;

// ⚠ Rotas abaixo são exemplos. O Codex deve trocar pelas rotas reais do Unificado.
export const NAV_MODULES: NavModule[] = [
  {
    id: 'planejamento', label: 'Planejamento', color: MODULE_COLORS.planejamento, icon: 'calendar',
    sections: [
      { title: 'PROGRAMAÇÃO', items: [
        { id: 'pcp', label: 'PCP', href: '/planejamento', icon: 'calendar' },
      ] },
    ],
  },
  {
    id: 'producao', label: 'Produção', color: MODULE_COLORS.producao, icon: 'factory',
    sections: [
      { title: 'OPERAÇÃO', items: [
        { id: 'producao', label: 'Produção', href: '/producao', icon: 'factory' },
      ] },
    ],
  },
  {
    id: 'qualidade', label: 'Qualidade', color: MODULE_COLORS.qualidade, icon: 'shield',
    sections: [
      { title: 'GESTÃO', items: [
        { id: 'nc', label: 'Não conformidades', href: '/qualidade/nao-conformidades', icon: 'alert' },
      ] },
    ],
  },
  {
    id: 'laboratorio', label: 'Laboratório', color: MODULE_COLORS.laboratorio, icon: 'flask',
    sections: [
      { title: 'ENSAIOS', items: [
        { id: 'monitoramento', label: 'Monitoramento', href: '/laboratorio/monitoramento', icon: 'thermometer', badge: { text: 'AO VIVO', tone: 'live' } },
        { id: 'ensaio-postes', label: 'Ensaio de postes', href: '/laboratorio/ensaio-postes', icon: 'post' },
        { id: 'absorcao', label: 'Absorção', href: '/laboratorio/absorcao', icon: 'drop' },
        { id: 'historico', label: 'Histórico de ensaios', href: '/laboratorio/historico', icon: 'history' },
      ] },
      { title: 'CONFIGURAÇÃO', items: [
        { id: 'cadastros', label: 'Cadastros', href: '/laboratorio/cadastros', icon: 'database' },
        { id: 'criterios', label: 'Critérios', href: '/laboratorio/criterios', icon: 'sliders' },
      ] },
      { title: 'GED', items: [
        { id: 'ged-docs', label: 'Documentos e calibrações', href: '/ged', icon: 'folder' },
      ] },
    ],
  },
  {
    // GED integrado ao Unificado: sem menu próprio, sem RNC e sem Usuários.
    id: 'ged', label: 'GED', color: MODULE_COLORS.ged, icon: 'folder',
    sections: [
      { title: 'DOCUMENTOS', items: [
        { id: 'ged-documentos', label: 'Documentos', href: '/ged/documentos', icon: 'doc' },
        { id: 'ged-calibracoes', label: 'Calibrações', href: '/ged/calibracoes', icon: 'sliders' },
      ] },
    ],
  },
];

// Itens fixos do rodapé (valem para todos os módulos).
export const FOOTER_ITEMS: NavItem[] = [
  { id: 'como-funciona', label: 'Como funciona', href: '/como-funciona', icon: 'help' },
  { id: 'usuarios', label: 'Usuários', href: '/usuarios', icon: 'users' },
];

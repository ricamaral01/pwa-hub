export const RNC_STATUSES = [
  { value: 'ABERTA', label: 'Aberta' },
  { value: 'TRIAGEM_SGQ', label: 'Triagem SGQ' },
  { value: 'EM_ANALISE', label: 'Em Análise' },
  { value: 'PLANO_EM_EXECUCAO', label: 'Plano em Execução' },
  { value: 'AGUARDANDO_EFICACIA', label: 'Aguardando Eficácia' },
  { value: 'ENCERRADA', label: 'Encerrada' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'REABERTA', label: 'Reaberta' },
];

export const RNC_SEVERITIES = [
  { value: 'CRITICA', label: 'Crítica' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'BAIXA', label: 'Baixa' },
];

export const RNC_ORIGINS = [
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'PROCESSO_INTERNO', label: 'Processo Interno' },
  { value: 'FORNECEDOR', label: 'Fornecedor' },
  { value: 'AUDITORIA_INTERNA', label: 'Auditoria Interna' },
  { value: 'AUDITORIA_EXTERNA', label: 'Auditoria Externa' },
  { value: 'INSPECAO', label: 'Inspeção' },
  { value: 'SEGURANCA', label: 'Segurança' },
  { value: 'AMBIENTAL', label: 'Ambiental' },
  { value: 'RECLAMACAO', label: 'Reclamação' },
  { value: 'OUTRO', label: 'Outro' },
];

export const RNC_TYPES = [
  { value: 'PRODUTO', label: 'Produto' },
  { value: 'PROCESSO', label: 'Processo' },
  { value: 'SISTEMA_GESTAO', label: 'Sistema de Gestão' },
  { value: 'FORNECEDOR', label: 'Fornecedor' },
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'SEGURANCA', label: 'Segurança' },
  { value: 'AMBIENTAL', label: 'Ambiental' },
  { value: 'DOCUMENTAL', label: 'Documental' },
  { value: 'OUTRO', label: 'Outro' },
];

export const RNC_ROOT_CAUSE_METHODS = [
  { value: '5_PORQUES', label: '5 Porquês' },
  { value: 'ISHIKAWA_6M', label: 'Ishikawa 6M' },
  { value: 'PARETO', label: 'Pareto' },
  { value: 'ESTRATIFICACAO', label: 'Estratificação' },
  { value: 'FALHA_CLASSIFICADA', label: 'Falha Classificada' },
];

export const RNC_ACTION_TYPES = [
  { value: 'CONTENCAO', label: 'Contenção' },
  { value: 'CORRETIVA_IMEDIATA', label: 'Corretiva Imediata' },
  { value: 'CORRETIVA', label: 'Corretiva' },
  { value: 'PREVENTIVA', label: 'Preventiva' },
];

export const RNC_ACTION_STATUSES = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'ATRASADA', label: 'Atrasada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

export const RNC_STATUS_COLORS: Record<string, string> = {
  ABERTA: 'bg-blue-100 text-blue-700',
  TRIAGEM_SGQ: 'bg-indigo-100 text-indigo-700',
  EM_ANALISE: 'bg-purple-100 text-purple-700',
  PLANO_EM_EXECUCAO: 'bg-amber-100 text-amber-700',
  AGUARDANDO_EFICACIA: 'bg-orange-100 text-orange-700',
  ENCERRADA: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-gray-100 text-gray-700',
  REABERTA: 'bg-rose-100 text-rose-700',
};

export const TASK_STATUSES = [
  { value: 'ABERTA', label: 'Aberta' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'AGUARDANDO_TERCEIROS', label: 'Aguardando terceiros' },
  { value: 'CONCLUIDA', label: 'Concluida' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

export const TASK_PRIORITIES = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Critica' },
];

export const TASK_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  TASK_STATUSES.map((item) => [item.value, item.label])
);

export const TASK_PRIORITY_LABELS: Record<string, string> = Object.fromEntries(
  TASK_PRIORITIES.map((item) => [item.value, item.label])
);

export const TASK_STATUS_COLORS: Record<string, string> = {
  ABERTA: 'bg-blue-100 text-blue-700',
  EM_ANDAMENTO: 'bg-amber-100 text-amber-700',
  AGUARDANDO_TERCEIROS: 'bg-purple-100 text-purple-700',
  CONCLUIDA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-gray-100 text-gray-500',
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  BAIXA: 'bg-gray-100 text-gray-600',
  MEDIA: 'bg-sky-100 text-sky-700',
  ALTA: 'bg-orange-100 text-orange-700',
  CRITICA: 'bg-red-100 text-red-700',
};

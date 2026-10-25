export interface AreaMeta {
  value: string;
  label: string;
  prefix: string;
  placeholder: string;
}

export interface DocumentTypeMeta {
  value: string;
  label: string;
}

export const AREAS: AreaMeta[] = [
  { value: 'AEE', label: 'Armazenamento, Expedição e Entrega', prefix: 'AEE', placeholder: 'Ex: Fluxo de expedição de pedidos' },
  { value: 'COM', label: 'Compras', prefix: 'COM', placeholder: 'Ex: Procedimento de cotação de insumos' },
  { value: 'CQC', label: 'Controle Qualidade Concrefer', prefix: 'CQC', placeholder: 'Ex: Critérios de aprovação de lote' },
  { value: 'INJ', label: 'Injetoras', prefix: 'INJ', placeholder: 'Ex: Setup padrão de injetora' },
  { value: 'MAN', label: 'Manutenção', prefix: 'MAN', placeholder: 'Ex: Plano de manutenção preventiva' },
  { value: 'PCP', label: 'Planejamento e Controle de Produção', prefix: 'PCP', placeholder: 'Ex: Sequenciamento de ordens de produção' },
  { value: 'PJT', label: 'Projeto', prefix: 'PJT', placeholder: 'Ex: Diretriz de desenvolvimento de projeto' },
  { value: 'PRO', label: 'Produção', prefix: 'PRO', placeholder: 'Ex: Instrução de operação da linha' },
  { value: 'REC', label: 'Recebimento', prefix: 'REC', placeholder: 'Ex: Inspeção de recebimento de materiais' },
  { value: 'RHU', label: 'Recursos Humanos', prefix: 'RHU', placeholder: 'Ex: Fluxo de onboarding de colaboradores' },
  { value: 'SGA', label: 'Sistema de Gestão Ambiental', prefix: 'SGA', placeholder: 'Ex: Controle de resíduos e descarte' },
  { value: 'SGQ', label: 'Sistema de Gestão da Qualidade', prefix: 'SGQ', placeholder: 'Ex: Procedimento de auditoria interna' },
  { value: 'SST', label: 'Sistema de Gestão Seg. e Saúde do Trabalhador', prefix: 'SST', placeholder: 'Ex: Análise preliminar de risco' },
  { value: 'VEN', label: 'Comercial', prefix: 'VEN', placeholder: 'Ex: Política de atendimento comercial' },
];

export const DOCUMENT_TYPES: DocumentTypeMeta[] = [
  { value: 'DC', label: 'Documentos Concrefer (Outros)' },
  { value: 'DS', label: 'Desenho' },
  { value: 'FL', label: 'Formulários' },
  { value: 'IT', label: 'Instruções' },
  { value: 'LT', label: 'Listas' },
  { value: 'MP', label: 'Mapa de processo' },
  { value: 'MQ', label: 'Manual da Qualidade' },
  { value: 'PR', label: 'Procedimentos' },
  { value: 'TB', label: 'Tabelas' },
];

export const AREA_LABELS: Record<string, string> = {
  '': 'Todas as áreas',
  AEE: 'Armazenamento, Expedição e Entrega',
  COM: 'Compras',
  CQC: 'Controle Qualidade Concrefer',
  INJ: 'Injetoras',
  MAN: 'Manutenção',
  PCP: 'Planejamento e Controle de Produção',
  PJT: 'Projeto',
  PRO: 'Produção',
  REC: 'Recebimento',
  RHU: 'Recursos Humanos',
  SGA: 'Sistema de Gestão Ambiental',
  SGQ: 'Sistema de Gestão da Qualidade',
  SST: 'Sistema de Gestão Seg. e Saúde do Trabalhador',
  VEN: 'Comercial',
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  DC: 'Documentos Concrefer (Outros)',
  DS: 'Desenho',
  FL: 'Formulários',
  IT: 'Instruções',
  LT: 'Listas',
  MP: 'Mapa de processo',
  MQ: 'Manual da Qualidade',
  PR: 'Procedimentos',
  TB: 'Tabelas',
};

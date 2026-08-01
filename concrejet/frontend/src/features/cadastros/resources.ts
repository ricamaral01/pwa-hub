export type FieldType = 'text' | 'number' | 'date' | 'datetime-local' | 'checkbox' | 'textarea';

export interface CadastroField {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  readonly?: boolean;
}

export interface CadastroResource {
  slug: string;
  title: string;
  permission: string;
  fields: CadastroField[];
  columns: string[];
  supportsCancel?: boolean;
  appendOnly?: boolean;
}

export const cadastroResources: CadastroResource[] = [
  {
    slug: 'functions',
    title: 'Funcoes',
    permission: 'funcoes',
    fields: [
      { name: 'codigo', label: 'Codigo', required: true },
      { name: 'descricao', label: 'Descricao', required: true },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: ['codigo', 'descricao', 'ativo'],
  },
  {
    slug: 'collaborators',
    title: 'Colaboradores',
    permission: 'colaboradores',
    fields: [
      { name: 'matricula', label: 'Matricula', required: true },
      { name: 'nome', label: 'Nome', required: true },
      { name: 'funcaoId', label: 'Funcao ID', required: true },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: ['matricula', 'nome', 'funcaoId', 'ativo'],
  },
  {
    slug: 'machines',
    title: 'Maquinas',
    permission: 'maquinas',
    fields: [
      { name: 'unidadeId', label: 'Unidade ID', required: true },
      { name: 'codigo', label: 'Codigo', required: true },
      { name: 'nome', label: 'Nome', required: true },
      { name: 'modelo', label: 'Modelo' },
      { name: 'numeroSerie', label: 'Numero de serie' },
      { name: 'setor', label: 'Setor' },
      { name: 'capacidade', label: 'Capacidade', type: 'number' },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: ['codigo', 'nome', 'modelo', 'numeroSerie', 'setor', 'capacidade', 'ativo'],
  },
  {
    slug: 'operations',
    title: 'Operacoes',
    permission: 'operacoes',
    fields: [
      { name: 'codigo', label: 'Codigo', required: true },
      { name: 'descricao', label: 'Descricao', required: true },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: ['codigo', 'descricao', 'ativo'],
  },
  {
    slug: 'occurrence-types',
    title: 'Tipos de ocorrencia',
    permission: 'tipos_ocorrencia',
    fields: [
      { name: 'codigo', label: 'Codigo', required: true },
      { name: 'descricao', label: 'Descricao', required: true },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: ['codigo', 'descricao', 'ativo'],
  },
  {
    slug: 'suppliers',
    title: 'Fornecedores',
    permission: 'fornecedores',
    fields: [
      { name: 'nome', label: 'Nome', required: true },
      { name: 'documento', label: 'Documento', required: true },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: ['nome', 'documento', 'ativo'],
  },
  {
    slug: 'resins',
    title: 'Resinas',
    permission: 'resinas',
    fields: [
      { name: 'codigo', label: 'Codigo', required: true },
      { name: 'descricao', label: 'Descricao', required: true },
      { name: 'fabricante', label: 'Fabricante' },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: ['codigo', 'descricao', 'fabricante', 'ativo'],
  },
  {
    slug: 'resin-lots',
    title: 'Lotes de resina',
    permission: 'lotes_resina',
    fields: [
      { name: 'codigo', label: 'Codigo', required: true },
      { name: 'resinaId', label: 'Resina ID', required: true },
      { name: 'fornecedorId', label: 'Fornecedor ID', required: true },
      {
        name: 'quantidadeInicialKg',
        label: 'Quantidade inicial kg',
        type: 'number',
        required: true,
      },
      { name: 'dataRecebimento', label: 'Data de recebimento', type: 'date', required: true },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: ['codigo', 'resinaId', 'fornecedorId', 'quantidadeInicialKg', 'saldoAtualKg', 'ativo'],
  },
  {
    slug: 'items',
    title: 'Itens',
    permission: 'itens',
    fields: [
      { name: 'codigo', label: 'Codigo', required: true },
      { name: 'descricao', label: 'Descricao', required: true },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: ['codigo', 'descricao', 'ativo'],
  },
  {
    slug: 'molds',
    title: 'Moldes',
    permission: 'moldes',
    fields: [
      { name: 'codigo', label: 'Codigo', required: true },
      { name: 'descricao', label: 'Descricao', required: true },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: ['codigo', 'descricao', 'ativo'],
  },
  {
    slug: 'item-mold-configurations',
    title: 'Configuracoes item/molde',
    permission: 'configuracoes_item_molde',
    appendOnly: true,
    fields: [
      { name: 'itemId', label: 'Item ID', required: true },
      { name: 'moldeId', label: 'Molde ID', required: true },
      { name: 'pesoPecaG', label: 'Peso da peca g', type: 'number', required: true },
      {
        name: 'cicloPadraoSegundos',
        label: 'Ciclo padrao segundos',
        type: 'number',
        required: true,
      },
      { name: 'cavidades', label: 'Cavidades', type: 'number', required: true },
      { name: 'vigenciaInicio', label: 'Vigencia inicio', type: 'datetime-local', required: true },
      { name: 'motivoAlteracao', label: 'Motivo da alteracao', type: 'textarea' },
    ],
    columns: [
      'itemId',
      'moldeId',
      'pesoPecaG',
      'cicloPadraoSegundos',
      'cavidades',
      'versaoConfiguracao',
      'ativo',
    ],
  },
  {
    slug: 'production-orders',
    title: 'Ordens de producao',
    permission: 'ordens_producao',
    supportsCancel: true,
    fields: [
      { name: 'unidadeId', label: 'Unidade ID', required: true },
      { name: 'numero', label: 'Numero', required: true },
      { name: 'itemId', label: 'Item ID', required: true },
      { name: 'moldeId', label: 'Molde ID', required: true },
      {
        name: 'quantidadePlanejada',
        label: 'Quantidade planejada',
        type: 'number',
        required: true,
      },
      { name: 'dataInicioPlanejada', label: 'Inicio planejado', type: 'date', required: true },
      { name: 'dataFimPlanejada', label: 'Fim planejado', type: 'date' },
      { name: 'ativo', label: 'Ativo', type: 'checkbox' },
    ],
    columns: ['numero', 'itemId', 'moldeId', 'quantidadePlanejada', 'status', 'ativo'],
  },
];

export function findCadastroResource(slug: string | undefined): CadastroResource {
  return cadastroResources.find((resource) => resource.slug === slug) ?? cadastroResources[0];
}

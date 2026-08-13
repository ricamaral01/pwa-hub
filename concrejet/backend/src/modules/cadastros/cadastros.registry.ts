import { EntityTarget } from 'typeorm';
import { Maquina } from '../producao-base/entities/maquina.entity';
import {
  Colaborador,
  ConfiguracaoItemMolde,
  Fornecedor,
  Funcao,
  Item,
  LoteResina,
  Molde,
  Operacao,
  OrdemProducao,
  Resina,
  TipoOcorrencia,
} from './entities';

export type CadastroAction = 'consultar' | 'criar' | 'editar' | 'inativar' | 'reativar';

export interface CadastroResource {
  slug: string;
  label: string;
  permission: string;
  entity: EntityTarget<object>;
  required: string[];
  writable: string[];
  searchable: string[];
  readOnly?: boolean;
}

export const CADASTRO_RESOURCES: Record<string, CadastroResource> = {
  functions: {
    slug: 'functions',
    label: 'Funcoes',
    permission: 'funcoes',
    entity: Funcao,
    required: ['codigo', 'descricao'],
    writable: ['codigo', 'descricao', 'ativo'],
    searchable: ['codigo', 'descricao'],
  },
  collaborators: {
    slug: 'collaborators',
    label: 'Colaboradores',
    permission: 'colaboradores',
    entity: Colaborador,
    required: ['matricula', 'nome', 'funcaoId'],
    writable: ['matricula', 'nome', 'funcaoId', 'ativo'],
    searchable: ['matricula', 'nome'],
  },
  machines: {
    slug: 'machines',
    label: 'Maquinas',
    permission: 'maquinas',
    entity: Maquina,
    required: ['unidadeId', 'codigo', 'nome'],
    writable: [
      'unidadeId',
      'codigo',
      'nome',
      'modelo',
      'numeroSerie',
      'setor',
      'capacidade',
      'ativo',
    ],
    searchable: ['codigo', 'nome', 'modelo', 'numeroSerie', 'setor'],
  },
  operations: {
    slug: 'operations',
    label: 'Operacoes',
    permission: 'operacoes',
    entity: Operacao,
    required: ['codigo', 'descricao'],
    writable: ['codigo', 'descricao', 'ativo'],
    searchable: ['codigo', 'descricao'],
  },
  'occurrence-types': {
    slug: 'occurrence-types',
    label: 'Tipos de ocorrencia',
    permission: 'tipos_ocorrencia',
    entity: TipoOcorrencia,
    required: ['codigo', 'descricao'],
    writable: ['codigo', 'descricao', 'ativo'],
    searchable: ['codigo', 'descricao'],
  },
  suppliers: {
    slug: 'suppliers',
    label: 'Fornecedores',
    permission: 'fornecedores',
    entity: Fornecedor,
    required: ['nome', 'documento'],
    writable: ['nome', 'documento', 'ativo'],
    searchable: ['nome', 'documento'],
  },
  resins: {
    slug: 'resins',
    label: 'Resinas',
    permission: 'resinas',
    entity: Resina,
    required: ['codigo', 'descricao'],
    writable: ['codigo', 'descricao', 'fabricante', 'ativo'],
    searchable: ['codigo', 'descricao', 'fabricante'],
  },
  'resin-lots': {
    slug: 'resin-lots',
    label: 'Lotes de resina',
    permission: 'lotes_resina',
    entity: LoteResina,
    required: ['codigo', 'resinaId', 'origem', 'quantidadeInicialKg', 'dataRecebimento', 'status'],
    writable: [
      'codigo',
      'resinaId',
      'fornecedorId',
      'origem',
      'quantidadeInicialKg',
      'dataRecebimento',
      'validade',
      'custoPorKg',
      'status',
      'ativo',
    ],
    searchable: ['codigo', 'origem', 'status'],
  },
  items: {
    slug: 'items',
    label: 'Itens',
    permission: 'itens',
    entity: Item,
    required: ['codigo', 'descricao'],
    writable: ['codigo', 'descricao', 'ativo'],
    searchable: ['codigo', 'descricao'],
  },
  molds: {
    slug: 'molds',
    label: 'Moldes',
    permission: 'moldes',
    entity: Molde,
    required: ['codigo', 'descricao'],
    writable: ['codigo', 'descricao', 'ativo'],
    searchable: ['codigo', 'descricao'],
  },
  'item-mold-configurations': {
    slug: 'item-mold-configurations',
    label: 'Configuracoes item/molde',
    permission: 'configuracoes_item_molde',
    entity: ConfiguracaoItemMolde,
    required: [
      'itemId',
      'moldeId',
      'pesoPecaG',
      'cicloPadraoSegundos',
      'cavidades',
      'vigenciaInicio',
    ],
    writable: [
      'itemId',
      'moldeId',
      'pesoPecaG',
      'cicloPadraoSegundos',
      'cavidades',
      'vigenciaInicio',
      'motivoAlteracao',
    ],
    searchable: ['motivoAlteracao'],
    readOnly: true,
  },
  'production-orders': {
    slug: 'production-orders',
    label: 'Ordens de producao',
    permission: 'ordens_producao',
    entity: OrdemProducao,
    required: [
      'unidadeId',
      'numero',
      'itemId',
      'moldeId',
      'quantidadePlanejada',
      'dataInicioPlanejada',
    ],
    writable: [
      'unidadeId',
      'numero',
      'itemId',
      'moldeId',
      'quantidadePlanejada',
      'dataInicioPlanejada',
      'dataFimPlanejada',
      'ativo',
    ],
    searchable: ['numero'],
  },
};

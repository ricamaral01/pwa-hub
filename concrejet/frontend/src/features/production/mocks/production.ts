/**
 * Dados mock para desenvolvimento — Fase 1 Sprint 0.
 *
 * Estes dados substituem as chamadas de API que ainda não existem no backend.
 * Quando a Fase 1 do backend estiver pronta, remover este arquivo e usar
 * os hooks TanStack Query reais.
 *
 * Todos os tipos são importados de @/types/api para garantir compatibilidade.
 */

import type {
  Maquina,
  OrdemProducao,
  Item,
  Molde,
  Resina,
  LoteResina,
  TipoOcorrencia,
} from '@/types/api';

// ─────────────────────────────────────────────
// Máquinas
// ─────────────────────────────────────────────
export const MOCK_MAQUINAS: Maquina[] = [
  {
    id: 'maq-001',
    unidadeId: 'uni-001',
    codigo: 'INJ-01',
    nome: 'Injetora 1 — Arburg 420C',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00Z',
    atualizadoEm: '2026-01-01T00:00:00Z',
    versao: 1,
  },
  {
    id: 'maq-002',
    unidadeId: 'uni-001',
    codigo: 'INJ-02',
    nome: 'Injetora 2 — Engel E-Motion',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00Z',
    atualizadoEm: '2026-01-01T00:00:00Z',
    versao: 1,
  },
];

// ─────────────────────────────────────────────
// Itens
// ─────────────────────────────────────────────
export const MOCK_ITENS: Item[] = [
  {
    id: 'item-001',
    codigo: 'CAP-100',
    descricao: 'Tampa Rosca 28mm Azul',
    unidade: 'PÇ',
    ativo: true,
  },
  {
    id: 'item-002',
    codigo: 'CAP-200',
    descricao: 'Tampa Rosca 38mm Branca',
    unidade: 'PÇ',
    ativo: true,
  },
  {
    id: 'item-003',
    codigo: 'CAP-300',
    descricao: 'Tampa Rosca 45mm Verde',
    unidade: 'PÇ',
    ativo: true,
  },
  {
    id: 'item-004',
    codigo: 'COR-100',
    descricao: 'Corpo Frasco 100ml',
    unidade: 'PÇ',
    ativo: true,
  },
];

// ─────────────────────────────────────────────
// Moldes
// ─────────────────────────────────────────────
export const MOCK_MOLDES: Molde[] = [
  {
    id: 'mol-001',
    codigo: 'M-CAP-100-16',
    descricao: 'Molde Tampa 28mm 16 cavidades',
    cavidades: 16,
    itemId: 'item-001',
    ativo: true,
  },
  {
    id: 'mol-002',
    codigo: 'M-CAP-100-8',
    descricao: 'Molde Tampa 28mm 8 cavidades',
    cavidades: 8,
    itemId: 'item-001',
    ativo: true,
  },
  {
    id: 'mol-003',
    codigo: 'M-CAP-200-12',
    descricao: 'Molde Tampa 38mm 12 cavidades',
    cavidades: 12,
    itemId: 'item-002',
    ativo: true,
  },
  {
    id: 'mol-004',
    codigo: 'M-CAP-300-8',
    descricao: 'Molde Tampa 45mm 8 cavidades',
    cavidades: 8,
    itemId: 'item-003',
    ativo: true,
  },
  {
    id: 'mol-005',
    codigo: 'M-COR-100-4',
    descricao: 'Molde Corpo 100ml 4 cavidades',
    cavidades: 4,
    itemId: 'item-004',
    ativo: true,
  },
];

// ─────────────────────────────────────────────
// Ordens de Produção
// ─────────────────────────────────────────────
export const MOCK_ORDENS: OrdemProducao[] = [
  {
    id: 'op-001',
    numero: 'OP-2026-0481',
    itemId: 'item-001',
    item: MOCK_ITENS[0],
    quantidade: 50000,
    quantidadeProduzida: 12400,
    estado: 'aberta',
    criadoEm: '2026-07-28T08:00:00Z',
  },
  {
    id: 'op-002',
    numero: 'OP-2026-0482',
    itemId: 'item-002',
    item: MOCK_ITENS[1],
    quantidade: 30000,
    quantidadeProduzida: 0,
    estado: 'aberta',
    criadoEm: '2026-07-29T08:00:00Z',
  },
  {
    id: 'op-003',
    numero: 'OP-2026-0479',
    itemId: 'item-004',
    item: MOCK_ITENS[3],
    quantidade: 8000,
    quantidadeProduzida: 7200,
    estado: 'aberta',
    criadoEm: '2026-07-25T08:00:00Z',
  },
];

// ─────────────────────────────────────────────
// Resinas
// ─────────────────────────────────────────────
export const MOCK_RESINAS: Resina[] = [
  {
    id: 'res-001',
    codigo: 'PP-H350BF',
    descricao: 'Polipropileno Homopolímero H350BF',
    fornecedorId: 'forn-001',
    tipo: 'PP',
    ativo: true,
  },
  {
    id: 'res-002',
    codigo: 'PP-R250MFM',
    descricao: 'Polipropileno Random R250MFM',
    fornecedorId: 'forn-002',
    tipo: 'PP',
    ativo: true,
  },
  {
    id: 'res-003',
    codigo: 'PEAD-HD5502',
    descricao: 'Polietileno Alta Densidade HD5502',
    fornecedorId: 'forn-001',
    tipo: 'PEAD',
    ativo: true,
  },
];

// ─────────────────────────────────────────────
// Lotes de Resina
// ─────────────────────────────────────────────
export const MOCK_LOTES: LoteResina[] = [
  {
    id: 'lote-001',
    numero: 'L2026-0341',
    resinaId: 'res-001',
    resina: MOCK_RESINAS[0],
    fornecedor: 'Braskem S.A.',
    saldo: 850.5,
    estado: 'disponivel',
  },
  {
    id: 'lote-002',
    numero: 'L2026-0342',
    resinaId: 'res-001',
    resina: MOCK_RESINAS[0],
    fornecedor: 'Braskem S.A.',
    saldo: 0,
    estado: 'esgotado',
  },
  {
    id: 'lote-003',
    numero: 'L2026-0318',
    resinaId: 'res-002',
    resina: MOCK_RESINAS[1],
    fornecedor: 'Riopol Petroquímica',
    saldo: 1200.0,
    estado: 'disponivel',
  },
  {
    id: 'lote-004',
    numero: 'L2026-0299',
    resinaId: 'res-003',
    resina: MOCK_RESINAS[2],
    fornecedor: 'Braskem S.A.',
    saldo: 45.0,
    estado: 'bloqueado',
  },
];

// ─────────────────────────────────────────────
// Tipos de Ocorrência
// ─────────────────────────────────────────────
export const MOCK_TIPOS_OCORRENCIA: TipoOcorrencia[] = [
  {
    id: 'toc-001',
    codigo: 'MANUT-P',
    descricao: 'Manutenção Preventiva',
    tipo: 'P',
    exigeAcaoCorretiva: false,
    ativo: true,
  },
  {
    id: 'toc-002',
    codigo: 'SETUP',
    descricao: 'Setup / Troca de Molde',
    tipo: 'P',
    exigeAcaoCorretiva: false,
    ativo: true,
  },
  {
    id: 'toc-003',
    codigo: 'REFEIC',
    descricao: 'Refeição',
    tipo: 'P',
    exigeAcaoCorretiva: false,
    ativo: true,
  },
  {
    id: 'toc-004',
    codigo: 'MANUT-C',
    descricao: 'Manutenção Corretiva',
    tipo: 'NP',
    exigeAcaoCorretiva: true,
    ativo: true,
  },
  {
    id: 'toc-005',
    codigo: 'FALTA-M',
    descricao: 'Falta de Material/Resina',
    tipo: 'NP',
    exigeAcaoCorretiva: true,
    ativo: true,
  },
  {
    id: 'toc-006',
    codigo: 'FALHA-E',
    descricao: 'Falha Elétrica/Eletrônica',
    tipo: 'NP',
    exigeAcaoCorretiva: true,
    ativo: true,
  },
  {
    id: 'toc-007',
    codigo: 'QUALID',
    descricao: 'Problema de Qualidade',
    tipo: 'NP',
    exigeAcaoCorretiva: true,
    ativo: true,
  },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
export function getMoldesByItem(itemId: string): Molde[] {
  return MOCK_MOLDES.filter((m) => m.itemId === itemId && m.ativo);
}

export function getLotesDisponiveis(): LoteResina[] {
  return MOCK_LOTES.filter((l) => l.estado === 'disponivel');
}

export function getOrdensByMaquina(_maquinaId: string): OrdemProducao[] {
  // TODO: quando o backend existir, filtrar por maquinaId
  return MOCK_ORDENS.filter((o) => o.estado === 'aberta');
}

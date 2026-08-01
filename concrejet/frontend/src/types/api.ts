/**
 * Contratos de API — ConcreTrack Injeção
 *
 * Esta fase (Sprint 0) cobre apenas os endpoints existentes (Fase 0 do backend).
 * Os tipos de produção (item, molde, OP, apontamento, resina, lote) estão marcados
 * como planejados e virão na Fase 1 do backend.
 */

// ─────────────────────────────────────────────
// Utilitários base
// ─────────────────────────────────────────────
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  correlationId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─────────────────────────────────────────────
// Auth — endpoints existentes (Fase 0)
// ─────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  deveTrocarSenha: boolean;
}

export interface MeResponse {
  id: string;
  nome: string;
  email: string;
  empresaId: string;
  deveTrocarSenha: boolean;
  perfis: string[];
}

export interface ChangePasswordRequest {
  senhaAtual: string;
  novaSenha: string;
}

// ─────────────────────────────────────────────
// Health — endpoints existentes (Fase 0)
// ─────────────────────────────────────────────
export interface HealthResponse {
  status: 'ok';
}

export interface VersionResponse {
  name: string;
  version: string;
}

// ─────────────────────────────────────────────
// Máquina e Dispositivo — entidades existentes (Fase 0)
// ─────────────────────────────────────────────
export interface Maquina {
  id: string;
  unidadeId: string;
  codigo: string;
  nome: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  versao: number;
}

export interface Dispositivo {
  id: string;
  maquinaId: string | null;
  identificador: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  versao: number;
}

// ─────────────────────────────────────────────
// Login de operador — PLANEJADO (Fase 1 backend)
// POST /auth/login-operador
// ─────────────────────────────────────────────
export interface LoginOperadorRequest {
  matricula: string;
  pin: string; // 4-6 dígitos
  maquinaId: string;
}

export interface LoginOperadorResponse {
  operadorId: string;
  nome: string;
  matricula: string;
  maquinaId: string;
  turnoAtualId?: string;
}

// ─────────────────────────────────────────────
// Produção — PLANEJADOS (Fase 1 backend)
// ─────────────────────────────────────────────
export interface Item {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  ativo: boolean;
}

export interface Molde {
  id: string;
  codigo: string;
  descricao: string;
  cavidades: number;
  itemId: string;
  ativo: boolean;
}

export interface OrdemProducao {
  id: string;
  numero: string;
  itemId: string;
  item: Item;
  quantidade: number;
  quantidadeProduzida: number;
  estado: 'aberta' | 'em_andamento' | 'encerrada' | 'cancelada';
  criadoEm: string;
}

export interface Resina {
  id: string;
  codigo: string;
  descricao: string;
  fornecedorId: string;
  tipo: string;
  ativo: boolean;
}

export interface LoteResina {
  id: string;
  numero: string;
  resinaId: string;
  resina: Resina;
  fornecedor: string;
  saldo: number;
  estado: 'disponivel' | 'esgotado' | 'bloqueado';
}

export interface TipoOcorrencia {
  id: string;
  codigo: string;
  descricao: string;
  tipo: 'P' | 'NP'; // Planejada ou Não-Planejada
  exigeAcaoCorretiva: boolean;
  ativo: boolean;
}

// ─────────────────────────────────────────────
// Apontamento — PLANEJADO (Fase 1 backend)
// ─────────────────────────────────────────────
export interface CriarApontamentoRequest {
  maquinaId: string;
  operadorId: string;
  ordemProducaoId: string;
  moldeId: string;
  loteResinaId: string;
  inicioEm: string; // ISO 8601
  fimEm: string;
  pecasBoas: number;
  refugo: number;
  falhaPreenchimento: number;
  borra: number;
  galho: number;
  outrasPerdas: number;
  observacao?: string;
  idempotencyKey: string; // UUID gerado no cliente
}

export interface Apontamento {
  id: string;
  maquinaId: string;
  operadorId: string;
  ordemProducaoId: string;
  moldeId: string;
  loteResinaId: string;
  inicioEm: string;
  fimEm: string;
  pecasBoas: number;
  refugo: number;
  falhaPreenchimento: number;
  borra: number;
  galho: number;
  outrasPerdas: number;
  perdasTotal: number;
  percentualPerda: number;
  estado: 'rascunho' | 'concluido' | 'cancelado';
  versao: number;
  criadoEm: string;
}

export interface RegistrarOcorrenciaRequest {
  apontamentoId: string;
  tipoOcorrenciaId: string;
  inicioEm: string;
  fimEm?: string;
  acaoCorretiva?: string;
  observacao?: string;
  idempotencyKey: string;
}

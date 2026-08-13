import { apiGet, apiPost } from './client';
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  ChangePasswordRequest,
  HealthResponse,
  VersionResponse,
} from '@/types/api';

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) => apiPost<LoginResponse>('/auth/login', data),
  logout: () => apiPost<{ status: 'ok' }>('/auth/logout'),
  me: () => apiGet<MeResponse>('/auth/me'),
  changePassword: (data: ChangePasswordRequest) =>
    apiPost<{ status: 'ok' }>('/auth/change-password', data),
};

// ─── Health / Version ─────────────────────────────────────────────────────
export const healthApi = {
  check: () => apiGet<HealthResponse>('/health'),
  version: () => apiGet<VersionResponse>('/version'),
};

// ─── PLANEJADO (Fase 1 backend) ───────────────────────────────────────────
// Os seguintes serviços só existirão quando o backend da Fase 1 estiver pronto.
// Por enquanto, as telas operacionais usam mocks tipados (src/mocks/).

/*
export const maquinasApi = {
  getById: (id: string) => apiGet<Maquina>(`/maquinas/${id}`),
  getAtivas: () => apiGet<Maquina[]>('/maquinas?ativo=true'),
};

export const ordensProdApi = {
  getAbertas: (maquinaId: string) =>
    apiGet<OrdemProducao[]>(`/ordens-producao?maquinaId=${maquinaId}&estado=aberta`),
};

export const lotesApi = {
  getDisponiveis: () => apiGet<LoteResina[]>('/lotes?estado=disponivel'),
};

export const apontamentosApi = {
  criar: (data: CriarApontamentoRequest) =>
    apiPost<Apontamento>('/apontamentos', data),
  concluir: (id: string) =>
    apiPost<Apontamento>(`/apontamentos/${id}/concluir`),
};
*/

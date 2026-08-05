import { apiGet, apiPost } from './client';
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  ChangePasswordRequest,
  HealthResponse,
  VersionResponse,
  FaceReadinessResponse,
} from '@/types/api';

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) => apiPost<LoginResponse>('/auth/login', data),
  logout: () => apiPost<{ status: 'ok' }>('/auth/logout'),
  me: () => apiGet<MeResponse>('/auth/me'),
  changePassword: (data: ChangePasswordRequest) =>
    apiPost<{ status: 'ok' }>('/auth/change-password', data),
  operatorLogin: (data: { matricula: string; pin: string; dispositivoId: string }) =>
    apiPost<{
      token: string;
      expiraEm: string;
      operador: { id: string; matricula: string; nome: string };
      dispositivo: { id: string; maquinaId: string };
    }>('/auth/operator-login', data),
  operatorFaceChallenge: (data: { dispositivoId: string }) =>
    apiPost<{ challengeId: string; expiresAt: string; sequence: string[] }>(
      '/auth/operator-face/challenge',
      data,
    ),
  operatorFaceLogin: (data: {
    challengeId: string;
    dispositivoId: string;
    embedding: number[];
    qualidade: number;
    liveness: { valid: boolean; steps: string[]; frames: number; faces: number };
    model: { nome: string; versao: string; dimensao: number };
  }) =>
    apiPost<{
      resultado: 'confirmado';
      token: string;
      expiraEm: string;
      operador: { id: string; matricula: string; nome: string };
      dispositivo: { id: string; maquinaId: string };
    }>('/auth/operator-face-login', data),
  faceReadiness: () => apiGet<FaceReadinessResponse>('/biometrics/face/readiness'),
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

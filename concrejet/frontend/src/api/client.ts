import axios, { type AxiosInstance, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Cliente Axios centralizado — ConcreTrack Injeção
 *
 * Regras:
 * - Toda chamada de API deve passar por este cliente (nunca fetch direto em componentes).
 * - Correlation ID é gerado por request e adicionado ao header x-correlation-id.
 * - Erros 401 redirecionam para login (exceto o próprio endpoint de login).
 * - Cookies são incluídos automaticamente (withCredentials: true) para o JWT httpOnly.
 */

const BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // inclui cookie JWT httpOnly
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Interceptor de request ───────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  // Correlation ID por request — rastreabilidade ponta a ponta
  const correlationId = uuidv4();
  config.headers['x-correlation-id'] = correlationId;
  return config;
});

// ─── Interceptor de response ──────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    // 401 — sessão expirada ou inválida
    if (status === 401) {
      const url = error.config?.url ?? '';
      const isLoginEndpoint = url.includes('/auth/login');
      if (!isLoginEndpoint) {
        // Redireciona para login sem perder estado local (IndexedDB persiste)
        window.dispatchEvent(new CustomEvent('concretrack:session-expired'));
      }
    }

    return Promise.reject(error);
  },
);

// ─── Helpers tipados ──────────────────────────────────────────────────────
export async function apiGet<T>(url: string): Promise<T> {
  const response = await apiClient.get<T>(url);
  return response.data;
}

export async function apiPost<T, D = unknown>(url: string, data?: D): Promise<T> {
  const response = await apiClient.post<T>(url, data);
  return response.data;
}

export async function apiPatch<T, D = unknown>(url: string, data?: D): Promise<T> {
  const response = await apiClient.patch<T>(url, data);
  return response.data;
}

export function isApiError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

export function getApiErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (typeof data?.message === 'string') return data.message;
    if (error.code === 'ECONNABORTED') return 'Tempo limite de conexão esgotado.';
    if (!error.response) return 'Sem conexão com o servidor.';
  }
  return 'Erro inesperado. Tente novamente.';
}

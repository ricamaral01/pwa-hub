import { apiGet, apiPatch, apiPost } from '@/api/client';

export interface CadastroListResponse {
  data: CadastroRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export type CadastroRecord = Record<string, string | number | boolean | null | undefined>;
export type CadastroPayload = Record<string, string | number | boolean>;

export async function listCadastros(resource: string, q: string, ativo: string) {
  const params = new URLSearchParams({ page: '1', limit: '50' });
  if (q) params.set('q', q);
  if (ativo) params.set('ativo', ativo);
  return apiGet<CadastroListResponse>(`/${resource}?${params.toString()}`);
}

export async function createCadastro(resource: string, data: CadastroPayload) {
  return apiPost<CadastroRecord, CadastroPayload>(`/${resource}`, data);
}

export async function updateCadastro(resource: string, id: string, data: CadastroPayload) {
  return apiPatch<CadastroRecord, CadastroPayload>(`/${resource}/${id}`, data);
}

export async function inactivateCadastro(resource: string, id: string) {
  return apiPatch<CadastroRecord>(`/${resource}/${id}/inactivate`);
}

export async function reactivateCadastro(resource: string, id: string) {
  return apiPatch<CadastroRecord>(`/${resource}/${id}/reactivate`);
}

export async function cancelProductionOrder(id: string, justificativa: string) {
  return apiPatch<CadastroRecord, { justificativa: string }>(`/production-orders/${id}/cancel`, {
    justificativa,
  });
}

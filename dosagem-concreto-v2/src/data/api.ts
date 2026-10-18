import { getToken, onExpirada } from './authAdapter';
export type CodigoErro = 'NAO_AUTENTICADO' | 'SEM_PERMISSAO' | 'VALIDACAO' | 'CONFLITO_REVISAO' | 'NAO_ENCONTRADO' | 'LIMITE' | 'INTERNO';
export class ApiErro extends Error { constructor(public codigo: CodigoErro, mensagem: string, public detalhe?: unknown) { super(mensagem); } }
export interface Resposta<T> { ok: boolean; dados?: T; erro?: { codigo: CodigoErro; mensagem: string; detalhe?: unknown }; servidorEm: string }
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
export function apiConfigurada() { return !!apiUrl; }
export async function chamarApi<T>(acao: string, dados: unknown, requestId: string = crypto.randomUUID(), retry = true): Promise<T> {
  if (!apiUrl) throw new ApiErro('LIMITE', 'API v2 ainda não configurada. O rascunho permanece local.');
  const token = await getToken();
  if (!token) throw new ApiErro('NAO_AUTENTICADO', 'Faça login no Hub para enviar ao servidor.');
  const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ acao, token, requestId, dados }), redirect: 'follow' });
  if (!response.ok) throw new ApiErro('INTERNO', `Falha HTTP ${response.status}.`);
  const body = await response.json() as Resposta<T>;
  if (!body.ok || !body.dados) {
    if (body.erro?.codigo === 'NAO_AUTENTICADO' && retry) { const refreshed = await onExpirada(); if (refreshed) return chamarApi<T>(acao, dados, requestId, false); }
    throw new ApiErro(body.erro?.codigo || 'INTERNO', body.erro?.mensagem || 'Falha na API.', body.erro?.detalhe);
  }
  return body.dados;
}

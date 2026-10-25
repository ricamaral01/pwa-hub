export type CodigoErro = 'NAO_AUTENTICADO' | 'SEM_PERMISSAO' | 'VALIDACAO' | 'CONFLITO_REVISAO' | 'NAO_ENCONTRADO' | 'LIMITE' | 'INTERNO';
export class ApiErro extends Error { constructor(public codigo: CodigoErro, mensagem: string, public detalhe?: unknown) { super(mensagem); } }
export interface Resposta<T> { ok: boolean; dados?: T; erro?: { codigo: CodigoErro; mensagem: string; detalhe?: unknown }; servidorEm: string }
const apiUrl = window.__DOSAGEM_NATIVE__ ? '/unificado/laboratorio/dosagem/api/v1/rpc' :
  (import.meta.env.VITE_API_URL as string | undefined) || '/api/v1/rpc';
export function apiConfigurada() { return !!apiUrl; }
export async function chamarApi<T>(acao: string, dados: unknown, requestId: string = crypto.randomUUID(), retry = true): Promise<T> {
  if (!apiUrl) throw new ApiErro('LIMITE', 'API v2 ainda não configurada. O rascunho permanece local.');
  const response = await fetch(apiUrl, { method: 'POST', credentials: 'same-origin', headers: { 'X-Requested-With': 'dosagem', 'Content-Type': 'application/json', 'Idempotency-Key': requestId }, body: JSON.stringify({ acao, requestId, dados }), redirect: 'follow' });
  const body = await response.json() as Resposta<T>;
  if (!body.ok || !body.dados) {
    if (body.erro?.codigo === 'NAO_AUTENTICADO' && retry) {
      sessionStorage.setItem('dosagem-retorno', location.pathname + location.hash);
      location.assign(window.__DOSAGEM_NATIVE__ ? '/unificado/login.html' : '/auth/login/');
    }
    throw new ApiErro(body.erro?.codigo || 'INTERNO', body.erro?.mensagem || 'Falha na API.', body.erro?.detalhe);
  }
  if (!response.ok) throw new ApiErro('INTERNO', `Falha HTTP ${response.status}.`);
  return body.dados;
}

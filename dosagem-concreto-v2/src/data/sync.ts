import { ApiErro, chamarApi } from './api';
import { atualizarFila, enfileirar, listarFila, removerFila } from './db';
export type SaveStatus = 'rascunho_local' | 'sem_rede' | 'pendente' | 'enviando' | 'salvo_servidor' | 'conflito' | 'erro';
export interface Confirmacao { id: string; versao: number; revisao: number; documento?: unknown }
const listeners = new Set<(s: SaveStatus, mensagem?: string) => void>();
export function observarStatus(fn: (s: SaveStatus, mensagem?: string) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
function informar(s: SaveStatus, mensagem?: string) { listeners.forEach(fn => fn(s, mensagem)); }
export async function salvarNaFila(acao: string, dados: unknown): Promise<Confirmacao | null> {
  const requestId = crypto.randomUUID();
  await enfileirar({ requestId, acao, dados, tentativas: 0, proximaTentativa: Date.now(), criadoEm: new Date().toISOString() });
  informar(navigator.onLine ? 'pendente' : 'sem_rede');
  if (!navigator.onLine) return null;
  return sincronizarItem(requestId);
}
async function sincronizarItem(requestId: string): Promise<Confirmacao | null> {
  const item = (await listarFila()).find(i => i.requestId === requestId);
  if (!item) return null;
  informar('enviando');
  try {
    const resposta = await chamarApi<Confirmacao>(item.acao, item.dados, item.requestId);
    if (!resposta.id || !Number.isInteger(resposta.versao) || !Number.isInteger(resposta.revisao)) throw new ApiErro('INTERNO', 'Servidor não confirmou ID, versão e revisão.');
    await removerFila(requestId);
    informar('salvo_servidor');
    if (resposta.documento) window.dispatchEvent(new CustomEvent('dosagem:sincronizado', { detail: resposta }));
    return resposta;
  } catch (e) {
    const error = e as ApiErro;
    if (error.codigo === 'CONFLITO_REVISAO') { informar('conflito', error.message); throw error; }
    if (error.codigo === 'SEM_PERMISSAO' || error.codigo === 'VALIDACAO' || error.codigo === 'NAO_AUTENTICADO') { informar('erro', error.message); throw error; }
    const tentativas = item.tentativas + 1;
    await atualizarFila({ ...item, tentativas, proximaTentativa: Date.now() + Math.min(60_000, 2_000 * 2 ** (tentativas - 1)) });
    informar(navigator.onLine ? 'pendente' : 'sem_rede', error.message);
    return null;
  }
}
export async function sincronizarFila() { if (!navigator.onLine) return; for (const item of await listarFila()) if (item.proximaTentativa <= Date.now()) { try { await sincronizarItem(item.requestId); } catch { /* ação manual necessária */ } } }
export function iniciarSincronizacao() { window.addEventListener('online', sincronizarFila); void sincronizarFila(); const timer = window.setInterval(sincronizarFila, 5000); return () => { window.removeEventListener('online', sincronizarFila); window.clearInterval(timer); }; }

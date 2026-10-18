import { openDB } from 'idb';
const db = openDB('concretrack-dosagem-v2', 1, { upgrade(database) { database.createObjectStore('cache'); database.createObjectStore('rascunhos'); database.createObjectStore('outbox', { keyPath: 'requestId' }); } });
export interface FilaItem { requestId: string; acao: string; dados: unknown; tentativas: number; proximaTentativa: number; criadoEm: string }
export async function guardarRascunho(id: string, valor: unknown) { await (await db).put('rascunhos', valor, id); }
export async function lerRascunho<T>(id: string): Promise<T | undefined> { return (await db).get('rascunhos', id); }
export async function listarRascunhos<T>(): Promise<T[]> { return (await db).getAll('rascunhos'); }
export async function guardarCache(chave: string, valor: unknown) { await (await db).put('cache', { valor, em: new Date().toISOString() }, chave); }
export async function lerCache<T>(chave: string): Promise<{ valor: T; em: string } | undefined> { return (await db).get('cache', chave); }
export async function enfileirar(item: FilaItem) { await (await db).put('outbox', item); }
export async function listarFila(): Promise<FilaItem[]> { return (await db).getAll('outbox'); }
export async function atualizarFila(item: FilaItem) { await (await db).put('outbox', item); }
export async function removerFila(requestId: string) { await (await db).delete('outbox', requestId); }

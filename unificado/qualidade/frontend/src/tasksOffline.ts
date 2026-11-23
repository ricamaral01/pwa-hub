import { ApiError, request } from './api';

type QueuedAction = { id?: number; userId: string; path: string; method: 'POST'|'PATCH'; body: string; createdAt: number };
const DB_NAME = 'concrefer-quality-tasks';
const STORE = 'pending-actions';
const SNAPSHOTS = 'task-snapshots';

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown) => { if (!settled) { settled = true; clearTimeout(timer); reject(error); } };
    const timer = window.setTimeout(() => fail(new Error('O armazenamento local não respondeu. Feche outras abas de Tarefas e tente novamente.')), 4000);
    const open = indexedDB.open(DB_NAME, 2);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(STORE))
        open.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      if (!open.result.objectStoreNames.contains(SNAPSHOTS))
        open.result.createObjectStore(SNAPSHOTS, { keyPath: 'key' });
    };
    open.onsuccess = () => { if (settled) { open.result.close(); return; } settled = true; clearTimeout(timer); resolve(open.result); };
    open.onerror = () => fail(open.error);
    open.onblocked = () => fail(new Error('O armazenamento local está ocupado em outra aba. Feche outras abas de Tarefas e tente novamente.'));
  });
}

async function transaction<T>(storeName: string, mode: IDBTransactionMode, run: (store: IDBObjectStore, done: (value: T) => void) => void): Promise<T> {
  const db = await database();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    let result: T;
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('A gravação local foi interrompida. Tente novamente.')); };
    run(tx.objectStore(storeName), value => { result = value; });
  });
}

export async function queuedCount(userId: string): Promise<number> {
  return transaction(STORE, 'readonly', (store, done) => {
    const get = store.getAll();
    get.onsuccess = () => done((get.result as QueuedAction[]).filter(item => item.userId === userId).length);
  });
}

export async function requestOrQueue<T>(userId: string, path: string, method: 'POST'|'PATCH', payload: unknown): Promise<{data:T|null;queued:boolean}> {
  const body = JSON.stringify(payload);
  try {
    return {data:await request<T>(path, {method, body}), queued:false};
  } catch (error) {
    if (error instanceof ApiError) throw error;
    await transaction(STORE, 'readwrite', (store, done) => {
      const put = store.add({userId, path, method, body, createdAt:Date.now()} satisfies QueuedAction);
      put.onsuccess = () => done(undefined);
    });
    return {data:null,queued:true};
  }
}

async function syncPendingUnlocked(userId: string): Promise<{sent:number;conflicts:number;remaining:number}> {
  const queued = await transaction<QueuedAction[]>(STORE, 'readonly', (store, done) => {
    const get = store.getAll(); get.onsuccess = () => done(get.result as QueuedAction[]);
  });
  let sent = 0, conflicts = 0;
  const versions = new Map<string,number>();
  for (const item of queued.filter(value => value.userId === userId).sort((a,b) => a.createdAt-b.createdAt)) {
    try {
      const taskId = item.path.match(/^\/tarefas\/([a-f\d-]{36})(?:\/|$)/i)?.[1];
      const body = JSON.parse(item.body) as Record<string,unknown>;
      if(taskId && versions.has(taskId) && typeof body.versao==='number') body.versao=versions.get(taskId)!;
      const result = await request<Record<string,unknown>>(item.path, {method:item.method, body:JSON.stringify(body)});
      if(taskId && typeof result.versao==='number') versions.set(taskId,result.versao);
      else if(taskId && item.path.endsWith('/comentarios')) {
        const updated=await request<{versao:number}>(`/tarefas/${taskId}`);
        versions.set(taskId,updated.versao);
      }
      sent++;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) conflicts++;
      else break;
    }
    await transaction(STORE, 'readwrite', (store, done) => {
      const remove = store.delete(item.id!); remove.onsuccess = () => done(undefined);
    });
  }
  return {sent,conflicts,remaining:await queuedCount(userId)};
}

export async function syncPending(userId: string): Promise<{sent:number;conflicts:number;remaining:number}> {
  if(navigator.locks) return navigator.locks.request(`concrefer-tarefas-sync:${userId}`,
    () => syncPendingUnlocked(userId));
  return syncPendingUnlocked(userId);
}

export async function saveTaskSnapshot<T>(userId: string, query: string, value: T): Promise<void> {
  await transaction(SNAPSHOTS, 'readwrite', (store, done) => {
    const put=store.put({key:`${userId}:${query}`,updatedAt:Date.now(),value});
    put.onsuccess=()=>done(undefined);
  });
}

export async function loadTaskSnapshot<T>(userId: string, query: string): Promise<{value:T;updatedAt:number}|null> {
  return transaction(SNAPSHOTS, 'readonly', (store, done) => {
    const get=store.get(`${userId}:${query}`);
    get.onsuccess=()=>done(get.result?{value:get.result.value as T,updatedAt:get.result.updatedAt}:null);
  });
}

const NAME = 'cronoanalise';
const VERSION = 1;
type Store = 'cronometros_ativos' | 'fila_envio' | 'contexto' | 'pessoas_por_atividade';

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, VERSION);
    request.onupgradeneeded = () => {
      for (const name of ['cronometros_ativos', 'fila_envio', 'contexto', 'pessoas_por_atividade']) {
        if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(name: Store, mode: IDBTransactionMode,
  execute: (store: IDBObjectStore, done: (value: T) => void) => void): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(name, mode);
    let value: T;
    tx.oncomplete = () => { db.close(); resolve(value); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    execute(tx.objectStore(name), result => { value = result; });
  });
}

export const cache = {
  read<T>(name: Store, key: IDBValidKey): Promise<T | undefined> {
    return transaction(name, 'readonly', (store, done) => {
      const request = store.get(key);
      request.onsuccess = () => done(request.result as T | undefined);
    });
  },
  all<T>(name: Store): Promise<T[]> {
    return transaction(name, 'readonly', (store, done) => {
      const request = store.getAll();
      request.onsuccess = () => done(request.result as T[]);
    });
  },
  put<T>(name: Store, key: IDBValidKey, value: T): Promise<void> {
    return transaction(name, 'readwrite', (store, done) => {
      store.put(value, key);
      done(undefined);
    });
  },
  remove(name: Store, key: IDBValidKey): Promise<void> {
    return transaction(name, 'readwrite', (store, done) => {
      store.delete(key);
      done(undefined);
    });
  }
};

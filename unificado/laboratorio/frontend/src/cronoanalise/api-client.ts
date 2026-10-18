export const API = '/unificado/laboratorio/api/laboratorio/cronoanalise';

export async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(API + path, {
    ...init, cache: 'no-store', credentials: 'same-origin',
    headers: {'Content-Type': 'application/json', ...init.headers}
  });
  if (!response.ok) {
    let body: {mensagem?: string; detail?: string} = {};
    try { body = await response.json(); } catch { /* HTTP body may be empty */ }
    throw new Error(body.mensagem || body.detail || `Erro HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const send = <T>(path: string, body: unknown, method = 'POST') =>
  call<T>(path, {method, body: JSON.stringify(body)});

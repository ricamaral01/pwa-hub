import type { Traco } from '../core/model';

export async function getUsuario(): Promise<{ email: string; nome: string; trocarSenha?: boolean } | null> {
  try {
    const response = await fetch(window.__DOSAGEM_NATIVE__ ? '/unificado/laboratorio/dosagem/api/v1/auth/sessao' : '/api/v1/auth/sessao', { credentials: 'same-origin' });
    if (!response.ok) return null;
    const user = await response.json() as { email: string; nome: string; trocarSenha?: boolean };
    return user.email ? user : null;
  } catch { return null; }
}

export async function onExpirada(rascunho?: Traco) {
  if (rascunho && !window.__DOSAGEM_NATIVE__) localStorage.setItem('dosagem-v2-resgate', JSON.stringify(rascunho));
  sessionStorage.setItem('dosagem-retorno', location.pathname + location.hash);
  location.assign(window.__DOSAGEM_NATIVE__ ? '/unificado/login.html' : '/auth/login/');
  return null;
}

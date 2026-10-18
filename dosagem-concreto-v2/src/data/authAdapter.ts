import type { Traco } from '../core/model';
type Session = { access_token: string; user?: { email?: string; user_metadata?: { full_name?: string; name?: string } } };
declare global { interface Window { ConcretrackAuth?: { session: () => Promise<Session | null>; client: { auth: { refreshSession: () => Promise<{ data: { session: Session | null } }> } } }; CONCRETRACK_USER?: { email?: string; name?: string } } }
export async function getToken(): Promise<string | null> { try { return (await window.ConcretrackAuth?.session())?.access_token ?? null; } catch { return null; } }
export async function getUsuario(): Promise<{ email: string; nome: string } | null> { try { const s = await window.ConcretrackAuth?.session(); return s?.user?.email ? { email: s.user.email, nome: s.user.user_metadata?.full_name || s.user.user_metadata?.name || s.user.email } : null; } catch { return null; } }
export async function onExpirada(rascunho?: Traco) {
  if (rascunho) localStorage.setItem('dosagem-v2-resgate', JSON.stringify(rascunho));
  try { const { data } = await window.ConcretrackAuth!.client.auth.refreshSession(); if (data.session) return data.session.access_token; } catch { /* redireciona abaixo */ }
  location.assign('/login.html?next=' + encodeURIComponent(location.pathname + location.hash));
  return null;
}

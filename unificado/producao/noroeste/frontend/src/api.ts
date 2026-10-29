const BASE = '/unificado/pcp/api/producao/noroeste';

async function token() {
  let value = localStorage.getItem('pcp_token');
  if (value) return value;
  const response = await fetch('/unificado/mapa/api/unified/pcp-session', {credentials:'same-origin',cache:'no-store'});
  if (!response.ok) throw new Error('Sua conta precisa de acesso ao Planejamento para abrir Noroeste.');
  const session = await response.json();
  if (!session.access_token) throw new Error('Sessão de produção indisponível. Entre novamente.');
  value = session.access_token;
  localStorage.setItem('pcp_token', value!);
  if (session.usuario) localStorage.setItem('pcp_user', JSON.stringify(session.usuario));
  return value!;
}

export async function api<T>(path:string, init:RequestInit={}) : Promise<T> {
  const bearer = await token();
  const headers:Record<string,string> = {Authorization:`Bearer ${bearer}`};
  if (init.body && !(init.body instanceof FormData)) headers['Content-Type']='application/json';
  const response = await fetch(BASE+path, {...init,headers:{...headers,...init.headers},cache:'no-store'});
  if (response.status===401) localStorage.removeItem('pcp_token');
  if (!response.ok) {
    let detail = `Falha ${response.status}`;
    try {const payload=await response.json(); detail=typeof payload.detail==='string'?payload.detail:detail;} catch { /* response without JSON */ }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export function send<T>(path:string, method:'POST'|'PUT'|'PATCH', payload:unknown) {
  return api<T>(path,{method,body:JSON.stringify(payload)});
}

export async function download(path:string, fallback:string) {
  const bearer = await token();
  const response = await fetch(BASE+path,{headers:{Authorization:`Bearer ${bearer}`},cache:'no-store'});
  if (!response.ok) throw new Error(`Exportação indisponível (${response.status})`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=fallback; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),30_000);
}

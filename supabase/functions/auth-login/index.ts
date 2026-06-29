import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { adminClient, cors, json, requestMeta } from '../_shared/security.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  const admin = adminClient();
  const meta = requestMeta(req);
  try {
    const { email, password } = await req.json();
    const identifier = String(email || '').trim().toLowerCase();
    let normalized = identifier;
    if (!identifier.includes('@')) {
      const { data: profile } = await admin.from('users_app').select('email').eq('username',identifier).maybeSingle();
      normalized = profile?.email || `${identifier}@invalid.local`;
    }
    const encoder = new TextEncoder();
    const hash = async (v: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(v)))).map(b=>b.toString(16).padStart(2,'0')).join('');
    const identifierHash = await hash(identifier);
    const ipHash = await hash(meta.ip_address || 'unknown');
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await admin.from('login_attempts').select('*', { count:'exact', head:true }).eq('identifier_hash',identifierHash).eq('ip_hash',ipHash).eq('success',false).gte('attempted_at',since);
    if ((count || 0) >= 5) return json({ error:'Muitas tentativas. Aguarde 15 minutos.' }, 429);

    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth:{ persistSession:false } });
    const { data, error } = await client.auth.signInWithPassword({ email:normalized, password:String(password || '') });
    let profile = null;
    if (!error && data.user) {
      const response = await admin.from('users_app').select('*').eq('id',data.user.id).single(); profile = response.data;
    }
    const success = !error && !!profile?.is_active;
    await admin.from('login_attempts').insert({ identifier_hash:identifierHash, ip_hash:ipHash, success });
    await admin.from('login_logs').insert({ user_id:data.user?.id || null, email:normalized, event_type:'login', success, ...meta });
    if (!success) return json({ error:'Credenciais inválidas ou usuário inativo.' }, 401);
    return json({ session:data.session, user:profile });
  } catch (_) { return json({ error:'Não foi possível processar o login.' }, 400); }
});

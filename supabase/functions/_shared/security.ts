import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') || 'https://usina.concretrack.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

export const adminClient = () => createClient(
  Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export const userClient = (authorization: string) => createClient(
  Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
  { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } }
);

export function passwordValid(password: string) {
  return typeof password === 'string' && password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^\w\s]/.test(password);
}

export async function requireMaster(req: Request) {
  const authorization = req.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) throw new Error('UNAUTHORIZED');
  const client = userClient(authorization);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error('UNAUTHORIZED');
  const admin = adminClient();
  const { data: profile } = await admin.from('users_app').select('*').eq('id', user.id).eq('is_active', true).single();
  if (!profile || profile.access_level !== 'master') throw new Error('FORBIDDEN');
  return { user, profile, admin };
}

export const requestMeta = (req: Request) => ({
  ip_address: (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null,
  user_agent: (req.headers.get('user-agent') || '').slice(0, 500) || null,
});

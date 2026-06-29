import { cors, json, passwordValid, requestMeta, requireMaster } from '../_shared/security.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error:'Método não permitido.' }, 405);
  try {
    const { user, admin } = await requireMaster(req);
    const body = await req.json(); const action = body.action; const meta = requestMeta(req);
    if (action === 'list') {
      const { data, error } = await admin.from('users_app').select('id,full_name,username,email,access_level,is_active,first_login,mfa_required,created_at,updated_at').order('full_name');
      if (error) throw error; return json({ users:data });
    }
    if (action === 'create') {
      if (!passwordValid(body.password)) return json({ error:'A senha deve ter 12 caracteres, maiúscula, minúscula, número e símbolo.' }, 400);
      const { data, error } = await admin.auth.admin.createUser({ email:String(body.email).toLowerCase(), password:body.password, email_confirm:true, user_metadata:{ username:body.username, full_name:body.full_name } });
      if (error || !data.user) throw error;
      const { error:profileError } = await admin.from('users_app').insert({ id:data.user.id, full_name:body.full_name, username:body.username, email:body.email, access_level:body.access_level, is_active:body.is_active !== false, first_login:true, created_by:user.id });
      if (profileError) { await admin.auth.admin.deleteUser(data.user.id); throw profileError; }
      await admin.from('login_logs').insert({ user_id:data.user.id,email:body.email,event_type:'user_created',success:true,details:{created_by:user.id},...meta });
      return json({ ok:true, id:data.user.id }, 201);
    }
    if (action === 'update') {
      const allowed = { full_name:body.full_name, username:body.username, access_level:body.access_level, is_active:body.is_active, mfa_required:!!body.mfa_required };
      if (body.email) { const { error:authError } = await admin.auth.admin.updateUserById(body.id,{email:String(body.email).toLowerCase(),email_confirm:true}); if(authError) throw authError; }
      Object.assign(allowed,{email:String(body.email).toLowerCase()});
      const { error } = await admin.from('users_app').update(allowed).eq('id',body.id); if (error) throw error;
      await admin.from('login_logs').insert({ user_id:body.id,event_type:'user_updated',success:true,details:{updated_by:user.id},...meta }); return json({ok:true});
    }
    if (action === 'reset_password') {
      if (!passwordValid(body.password)) return json({error:'Senha provisória fraca.'},400);
      const { error } = await admin.auth.admin.updateUserById(body.id,{password:body.password}); if(error) throw error;
      await admin.from('users_app').update({first_login:true}).eq('id',body.id);
      await admin.from('login_logs').insert({user_id:body.id,event_type:'password_reset',success:true,details:{reset_by:user.id},...meta}); return json({ok:true});
    }
    return json({error:'Ação inválida.'},400);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return json({error:message==='UNAUTHORIZED'?'Sessão inválida.':message==='FORBIDDEN'?'Acesso exclusivo para Master.':'Erro ao processar usuário.'}, message==='FORBIDDEN'?403:401);
  }
});

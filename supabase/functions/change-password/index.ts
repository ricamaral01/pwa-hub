import { cors, json, passwordValid, requestMeta, userClient, adminClient } from '../_shared/security.ts';
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
  if(req.method!=='POST') return json({error:'Método não permitido.'},405);
  const authorization=req.headers.get('Authorization')||'';
  try {
    const {password}=await req.json(); if(!passwordValid(password)) return json({error:'Use 12 caracteres com maiúscula, minúscula, número e símbolo.'},400);
    const client=userClient(authorization); const {data:{user},error:userError}=await client.auth.getUser(); if(userError||!user) return json({error:'Sessão inválida.'},401);
    const admin=adminClient(); const {error}=await admin.auth.admin.updateUserById(user.id,{password}); if(error) throw error;
    await admin.from('users_app').update({first_login:false}).eq('id',user.id);
    await admin.from('login_logs').insert({user_id:user.id,email:user.email,event_type:'password_changed',success:true,...requestMeta(req)});
    return json({ok:true});
  } catch(_){return json({error:'Não foi possível alterar a senha.'},400)}
});

(function(){
  'use strict';
  const cfg=window.CONCRETRACK_AUTH_CONFIG;
  if(!cfg||!window.supabase) throw new Error('Configuração de autenticação indisponível.');
  const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  const base=`${cfg.supabaseUrl}/functions/v1`;
  async function call(name,body,token){
    const response=await fetch(`${base}/${name}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.supabaseAnonKey,...(token?{'Authorization':`Bearer ${token}`}:{})},body:JSON.stringify(body)});
    const data=await response.json().catch(()=>({})); if(!response.ok) throw new Error(data.error||'Erro de comunicação.'); return data;
  }
  async function context(){const {data,error}=await client.rpc('my_access_context');if(error||!data?.user) throw new Error('Perfil não autorizado.');return data}
  async function session(){const {data}=await client.auth.getSession();return data.session}
  async function logout(){await client.auth.signOut({scope:'local'});sessionStorage.clear();location.replace('/login.html')}
  window.ConcretrackAuth={client,call,context,session,logout};
})();

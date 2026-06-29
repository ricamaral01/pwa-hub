import { createClient } from '@supabase/supabase-js';
const required=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','MASTER_EMAIL','MASTER_NAME','MASTER_USERNAME','MASTER_TEMP_PASSWORD'];
const missing=required.filter(k=>!process.env[k]);
if(missing.length){console.error(`Variáveis ausentes: ${missing.join(', ')}`);console.error('Defina-as no ambiente. Nenhuma senha deve ser gravada em arquivos ou no histórico do shell.');process.exit(1)}
const password=process.env.MASTER_TEMP_PASSWORD;
if(password.length<12||!/[a-z]/.test(password)||!/[A-Z]/.test(password)||!/\d/.test(password)||!/[^\w\s]/.test(password)){console.error('MASTER_TEMP_PASSWORD não atende à política mínima.');process.exit(1)}
const supabase=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const {count,error:countError}=await supabase.from('users_app').select('*',{count:'exact',head:true});if(countError)throw countError;if(count>0){console.error('O seed só pode criar o primeiro usuário. Já existem usuários cadastrados.');process.exit(1)}
const {data,error}=await supabase.auth.admin.createUser({email:process.env.MASTER_EMAIL.toLowerCase(),password,email_confirm:true,user_metadata:{full_name:process.env.MASTER_NAME,username:process.env.MASTER_USERNAME}});if(error)throw error;
const {error:profileError}=await supabase.from('users_app').insert({id:data.user.id,full_name:process.env.MASTER_NAME,username:process.env.MASTER_USERNAME,email:process.env.MASTER_EMAIL.toLowerCase(),access_level:'master',is_active:true,first_login:true});if(profileError){await supabase.auth.admin.deleteUser(data.user.id);throw profileError}
await supabase.from('login_logs').insert({user_id:data.user.id,email:process.env.MASTER_EMAIL,event_type:'user_created',success:true,details:{source:'seed-master'}});
console.log(`Usuário Master criado com segurança: ${process.env.MASTER_USERNAME}. A troca de senha será exigida no primeiro acesso.`);

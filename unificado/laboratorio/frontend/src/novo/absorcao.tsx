import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../styles.css';
import './postes.css';
import {PreviewShell} from './Shell';
import PreviewAbsorptionModule from './PreviewAbsorptionModule';

type User={username:string;role:string};

function App(){
 const [user,setUser]=useState<User|null>(null);
 const [loading,setLoading]=useState(true);
 const [login,setLogin]=useState({username:'',password:''});
 const [message,setMessage]=useState('');
 useEffect(()=>{let active=true;fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'})
  .then(async response=>{if(!response.ok)throw new Error('Acesso não autenticado.');return response.json() as Promise<User>})
  .then(value=>{if(active)setUser(value)}).catch(()=>{}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false}},[]);
 async function doLogin(event:React.FormEvent){event.preventDefault();try{
  const response=await fetch('/api/auth/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(login)});
  const value=await response.json();if(!response.ok)throw new Error(value.detail||'Não foi possível entrar.');
  setUser(value as User);setLogin({username:'',password:''});setMessage('');
 }catch(error){setMessage((error as Error).message)}}
 const logout=async()=>{await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'});setUser(null)};
 const shell=(children:React.ReactNode)=>
  <PreviewShell area="concreto" page="Absorção de concreto" active="absorcao" user={user?`${user.username} · ${user.role}`:undefined} role={user?.role} context={<span className="preview-chip">ABNT NBR 8451-4 · variação &lt; 0,2%</span>} onLogout={user?logout:undefined}>{children}</PreviewShell>;
 if(loading)return shell(<div className="authShell">Carregando…</div>);
 if(!user)return shell(<div className="authShell"><form className="loginCard" onSubmit={doLogin}><h1>Entrar na aplicação</h1><label className="field"><span>Usuário</span><input className="input" autoComplete="username" value={login.username} onChange={e=>setLogin({...login,username:e.target.value})}/></label><label className="field"><span>Senha</span><input className="input" type="password" autoComplete="current-password" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})}/></label>{message&&<p className="warning" role="alert">{message}</p>}<button className="btn primary" type="submit">Entrar</button></form></div>);
 return shell(<><div className="pv-page-heading"><div><h1>Absorção de água</h1><p>Registre as pesagens, confira a constância da massa seca e imprima o relatório de cada ensaio salvo.</p></div></div>{message&&<p className="warning" role="status">{message}</p>}<PreviewAbsorptionModule notify={setMessage} initialId={new URLSearchParams(location.search).get('sheet')}/></>);
}

createRoot(document.getElementById('root')!).render(<App/>);

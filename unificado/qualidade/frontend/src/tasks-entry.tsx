import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import Tasks from './Tasks';
import { type Context } from './api';
import { taskRead } from './taskRead';

function TaskApp() {
  const [ctx,setContext]=useState<Context|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  const embedded=window.self!==window.top;
  useEffect(()=>{
    const controller=new AbortController();setError('');
    void taskRead<Context>('/contexto',controller.signal).then(value=>{if(!controller.signal.aborted)setContext(value)}).catch(err=>{if(!controller.signal.aborted)setError((err as Error).message)});
    return()=>controller.abort();
  },[retry]);
  if(!ctx)return <main className="solo"><h1>Tarefas</h1>{error?<><p role="alert">{error}</p><button onClick={()=>setRetry(value=>value+1)}>Tentar novamente</button></>:<p role="status">Carregando suas tarefas…</p>}</main>;
  return <div className={`quality-app tasks-page-active${embedded?' embedded':''}`}>
    {!embedded&&<header className="top"><a href="/unificado/" className="brand"><span className="mark">C</span><span>ConcreTrack <small>· Tarefas</small></span></a><span>{ctx.user.name}</span></header>}
    <div className="body"><main className="content"><Tasks ctx={ctx} unit={ctx.active_unit||ctx.last_unit||ctx.units[0]?.codigo||''} go={path=>{location.href=`/unificado/qualidade${path}`}}/></main></div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<TaskApp/>);

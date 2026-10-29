import {useEffect,useMemo,useState} from 'react';
import {api} from './api';
import {cached,flush,pending,sendOrQueue} from './offline';
import type {Day,Labor,Month,Product} from './types';
import {fmt,number,todayISO} from './types';
import './styles.css';import './pwa.css';

type View='hoje'|'lancar'|'revisar';
const today=todayISO();
export function PwaProduction(){
  const [view,setView]=useState<View>('hoje');const [date,setDate]=useState(today);
  const [products,setProducts]=useState<Product[]>([]);const [day,setDay]=useState<Day|null>(null);
  const [labor,setLabor]=useState<Labor|null>(null);const [month,setMonth]=useState<Month|null>(null);
  const [qty,setQty]=useState<Record<number,number>>({});const [family,setFamily]=useState('Mais produzidos');
  const [search,setSearch]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  const [queueCount,setQueueCount]=useState(pending().length);
  const load=async(target:string)=>{try{const [p,d,l,m]=await Promise.all([
    cached<{produtos:Product[]}>('/produtos'),cached<Day>(`/apontamentos/${target}`),
    cached<Labor>(`/mao-de-obra/${target}`),cached<Month>(`/mensal?mes=${target.slice(0,7)}`)]);
    setProducts(p.produtos);setDay(d);setLabor(l);setMonth(m);
    setQty(Object.fromEntries(d.itens.map(item=>[item.produto_id,item.quantidade])));
  }catch(error){setMessage((error as Error).message);}};
  useEffect(()=>{void load(date);},[date]);
  useEffect(()=>{const update=()=>setQueueCount(pending().length);const sync=()=>{void flush().then(count=>{update();if(count){setMessage(`${count} lançamento(s) sincronizado(s).`);void load(date);}}).catch(e=>setMessage(`Sincronização pendente: ${e.message}`));};
    window.addEventListener('online',sync);window.addEventListener('noroeste-queue',update);if(navigator.onLine)sync();
    if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
    return()=>{window.removeEventListener('online',sync);window.removeEventListener('noroeste-queue',update);};},[date]);
  const total=Object.values(qty).reduce((sum,value)=>sum+number(value),0),people=number(labor?.homens);
  const missing=products.filter(p=>number(qty[p.id])>0&&p.volume_m3===null).length;
  const volume=missing?null:products.reduce((sum,p)=>sum+number(qty[p.id])*number(p.volume_m3),0);
  const top=useMemo(()=>new Set((month?.dias.flatMap(d=>d.itens)||[]).reduce((acc,item)=>{
    acc.set(item.produto_id,(acc.get(item.produto_id)||0)+item.quantidade);return acc;
  },new Map<number,number>()).entries()),[month]);
  const topIds=new Set(top.size?[...top].sort((a,b)=>b[1]-a[1]).slice(0,15).map(([id])=>id):products.filter(p=>p.ativo).slice(0,15).map(p=>p.id));
  const families=['Mais produzidos',...new Set(products.map(p=>p.familia)),'Todos'];
  const visible=products.filter(p=>p.ativo&&(family==='Todos'||family==='Mais produzidos'&&topIds.has(p.id)||p.familia===family)&&
    [p.descricao,p.cod_pro,p.cod_sma,p.letra].join(' ').toLowerCase().includes(search.toLowerCase()));
  const change=(id:number,delta:number)=>setQty(current=>({...current,[id]:Math.max(0,Math.floor(number(current[id])+delta))}));
  const submit=async()=>{setBusy(true);setMessage('');try{const payload={itens:Object.entries(qty).filter(([,value])=>number(value)>0).map(([id,value])=>({produto_id:Number(id),quantidade:number(value)})),acao:'enviar',origem:'pwa'};
    const result=await sendOrQueue<Day>(`/apontamentos/${date}`,'PUT',payload);
    if(result){setDay(result);await load(date);setMessage('Apontamento enviado.');}else setMessage('Sem conexão. Lançamento guardado neste aparelho para sincronizar.');setView('hoje');
  }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}};
  const confirm=async()=>{setBusy(true);try{if(pending().length)throw new Error('Sincronize os lançamentos pendentes antes de confirmar.');
    await api(`/apontamentos/${date}/confirmar`,{method:'POST'});await load(date);setMessage('Dia confirmado.');
  }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}};
  const repeat=async()=>{setBusy(true);try{if(!navigator.onLine)throw new Error('Repetir ontem requer conexão.');
    await api(`/apontamentos/${date}/repetir-ontem?origem=pwa`,{method:'POST'});await load(date);setMessage('Último dia com produção copiado.');
  }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}};
  return <main className="mobile-app"><header className="mobile-head"><span className="eyebrow">CONCREFER · NOROESTE</span><h1>Produção</h1><p>{!navigator.onLine?'Sem conexão · registros disponíveis no aparelho':queueCount?`${queueCount} lançamento(s) aguardando sincronização`:'Apontamento do dia'}</p></header>
    <nav className="mobile-tabs"><button aria-current={view==='hoje'?'page':undefined} onClick={()=>setView('hoje')}>Hoje</button><button aria-current={view==='lancar'?'page':undefined} onClick={()=>setView('lancar')}>Lançar</button><button aria-current={view==='revisar'?'page':undefined} onClick={()=>setView('revisar')}>Revisar e enviar</button></nav>
    {message&&<div className="mobile-message" role="status">{message}</div>}
    {view==='hoje'&&<div className="mobile-content"><div className="mobile-date"><label>Data<input type="date" max={today} value={date} onChange={e=>setDate(e.target.value)}/></label><span className={`badge ${day?.status==='confirmado'?'success':'info'}`}>{day?.status||'rascunho'}</span></div>
      <div className="mobile-hero"><span>Postes produzidos</span><strong>{fmt(day?.postes)}</strong><small>Meta mensal {fmt(month?.meta_total)} · acumulado {fmt(month?.postes)}</small></div>
      <div className="mobile-metrics"><div><span>Homens</span><strong>{fmt(people,2)}</strong></div><div><span>Postes / homem</span><strong>{fmt(people?number(day?.postes)/people:null,2)}</strong></div><div><span>Volume</span><strong>{fmt(day?.volume_m3,3)} m³</strong></div><div><span>Liberação prevista</span><strong>{day?.liberacao_prevista?.slice(8)}/{day?.liberacao_prevista?.slice(5,7)}</strong></div></div>
      {number(day?.postes)>0&&!people&&<p className="mobile-alert">Mão de obra ausente: confirme após o lançamento da equipe.</p>}
      <button className="button primary full" onClick={()=>setView('lancar')}>Ajustar produção</button><button className="button success full" disabled={busy||day?.status!=='enviado'||!people||!!queueCount} onClick={confirm}>Confirmar dia</button></div>}
    {view==='lancar'&&<div className="mobile-content mobile-entry"><div className="mobile-date"><label>Data<input type="date" max={today} value={date} onChange={e=>setDate(e.target.value)}/></label><button className="button" disabled={busy||day?.status==='confirmado'} onClick={repeat}>Repetir ontem</button></div><input className="mobile-search" placeholder="Buscar produto ou código" aria-label="Buscar produto" value={search} onChange={e=>setSearch(e.target.value)}/><div className="family-tabs">{families.map(item=><button key={item} className={family===item?'active':''} onClick={()=>setFamily(item)}>{item}</button>)}</div>
      {visible.map(p=><article className="mobile-product" key={p.id}><div><span className="eyebrow">{p.familia} · {p.cod_pro||'sem código'}</span><h3>{p.descricao}</h3><small>{p.letra?`Letra ${p.letra} · `:''}{p.cod_sma||''}</small></div><div className="mobile-stepper"><button aria-label={`Diminuir ${p.descricao}`} disabled={day?.status==='confirmado'} onClick={()=>change(p.id,-1)}>−</button><input aria-label={`Quantidade ${p.descricao}`} type="number" min="0" step="1" disabled={day?.status==='confirmado'} value={number(qty[p.id])} onChange={e=>setQty(current=>({...current,[p.id]:Math.max(0,Math.floor(Number(e.target.value)||0))}))}/><button aria-label={`Aumentar ${p.descricao}`} disabled={day?.status==='confirmado'} onClick={()=>change(p.id,1)}>+</button></div></article>)}
      <div className="mobile-bottom"><div><strong>{fmt(total)} postes</strong><span>{fmt(people,2)} homens · {fmt(people?total/people:null,2)} postes/homem</span></div><button className="button primary" onClick={()=>setView('revisar')}>Revisar →</button></div></div>}
    {view==='revisar'&&<div className="mobile-content"><h2>Revisar apontamento</h2><p>{new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR',{dateStyle:'long'})}</p><div className="mobile-hero"><span>Total</span><strong>{fmt(total)} postes</strong><small>{fmt(volume,3)} m³ · {fmt(people?total/people:null,2)} postes/homem</small></div>
      {missing>0&&<p className="mobile-alert">{missing} produto(s) sem volume. O m³ fica pendente.</p>}{total>0&&!people&&<p className="mobile-alert">Mão de obra pendente. O dia poderá ser enviado, mas não confirmado.</p>}
      <div className="mobile-review">{products.filter(p=>number(qty[p.id])>0).map(p=><div key={p.id}><span>{p.descricao}</span><strong>{fmt(qty[p.id])}</strong></div>)}</div><button className="button primary full" disabled={busy||day?.status==='confirmado'} onClick={submit}>Enviar apontamento</button><button className="button full" onClick={()=>setView('lancar')}>Voltar e ajustar</button></div>}
  </main>;
}

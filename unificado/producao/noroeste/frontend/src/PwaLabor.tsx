import {useEffect,useState} from 'react';
import {api} from './api';import {cached,flush,pending,sendOrQueue} from './offline';
import type {Area,Day,Labor} from './types';import {fmt,number,todayISO} from './types';
import './styles.css';import './pwa.css';

export function PwaLabor(){
  const [date,setDate]=useState(todayISO());const [labor,setLabor]=useState<Labor|null>(null);
  const [production,setProduction]=useState<Day|null>(null);const [areas,setAreas]=useState<Area[]>([]);
  const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [queueCount,setQueueCount]=useState(pending().length);
  const load=async(target:string)=>{try{const [l,p]=await Promise.all([cached<Labor>(`/mao-de-obra/${target}`),cached<Day>(`/apontamentos/${target}`)]);
    setLabor(l);setProduction(p);setAreas(l.areas);
  }catch(e){setMessage((e as Error).message);}};
  useEffect(()=>{void load(date);},[date]);
  useEffect(()=>{const update=()=>setQueueCount(pending().length);const sync=()=>{void flush().then(count=>{update();if(count){setMessage(`${count} lançamento(s) sincronizado(s).`);void load(date);}}).catch(e=>setMessage(`Sincronização pendente: ${e.message}`));};
    window.addEventListener('online',sync);window.addEventListener('noroeste-queue',update);if(navigator.onLine)sync();
    if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
    return()=>{window.removeEventListener('online',sync);window.removeEventListener('noroeste-queue',update);};},[date]);
  const total=areas.reduce((sum,a)=>sum+number(a.homens),0),mod=areas.filter(a=>a.tipo==='MOD').reduce((sum,a)=>sum+number(a.homens),0);
  const change=(id:number,delta:number)=>setAreas(current=>current.map(a=>a.atividade_id===id?{...a,homens:Math.max(0,Math.round((number(a.homens)+delta)*100)/100)}:a));
  const save=async()=>{setBusy(true);setMessage('');try{const payload={areas:areas.filter(a=>a.ativo).map(a=>({atividade_id:a.atividade_id,homens:a.homens,observacao:a.observacao})),origem:'pwa'};
    const result=await sendOrQueue<Labor>(`/mao-de-obra/${date}`,'PUT',payload);
    if(result){await load(date);setMessage('Mão de obra salva.');}else setMessage('Sem conexão. Equipe guardada neste aparelho para sincronizar.');
  }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}};
  const confirm=async()=>{setBusy(true);try{if(pending().length)throw new Error('Sincronize os lançamentos pendentes antes de confirmar.');
    await api(`/mao-de-obra/${date}/confirmar`,{method:'POST'});await load(date);setMessage('Mão de obra confirmada.');
  }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}};
  const repeat=async()=>{setBusy(true);try{if(!navigator.onLine)throw new Error('Repetir ontem requer conexão.');
    await api(`/mao-de-obra/${date}/repetir-ontem?origem=pwa`,{method:'POST'});await load(date);setMessage('Último dia de equipe copiado.');
  }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}};
  return <main className="mobile-app"><header className="mobile-head"><span className="eyebrow">CONCREFER · NOROESTE</span><h1>Mão de obra</h1><p>{!navigator.onLine?'Sem conexão · registros disponíveis no aparelho':queueCount?`${queueCount} lançamento(s) aguardando sincronização`:'Equipe de produção'}</p></header>
    {message&&<div className="mobile-message" role="status">{message}</div>}
    <div className="mobile-content mobile-entry"><div className="mobile-date"><label>Data<input type="date" max={todayISO()} value={date} onChange={e=>setDate(e.target.value)}/></label><span className={`badge ${labor?.confirmado_em?'success':'info'}`}>{labor?.confirmado_em?'Confirmado':'Em lançamento'}</span></div>
    <div className="mobile-labor-summary"><div><span>Total</span><strong>{fmt(total,2)}</strong></div><div><span>MOD</span><strong>{fmt(mod,2)}</strong></div><div><span>MOI</span><strong>{fmt(total-mod,2)}</strong></div></div>
    <div className="mobile-inline"><span>Postes / homem</span><strong>{fmt(total?number(production?.postes)/total:null,2)}</strong><small>{fmt(production?.postes)} postes</small></div>
    <button className="button full" disabled={busy||Boolean(labor?.confirmado_em)} onClick={repeat}>Repetir último dia</button>
    {!areas.length&&<p className="mobile-alert">Áreas MOD/MOI aguardam classificação e cadastro. Não é possível lançar equipe ainda.</p>}
    {areas.filter(a=>a.ativo).map(area=><article className="mobile-product labor-product" key={area.atividade_id}><div><span className={`badge ${area.tipo==='MOD'?'info':'muted'}`}>{area.tipo}</span><h3>{area.descricao}</h3></div><div className="mobile-stepper"><button aria-label={`Diminuir ${area.descricao}`} disabled={Boolean(labor?.confirmado_em)} onClick={()=>change(area.atividade_id,-.01)}>−</button><input aria-label={`Homens em ${area.descricao}`} type="number" min="0" step="0.01" value={number(area.homens)} disabled={Boolean(labor?.confirmado_em)} onChange={e=>setAreas(current=>current.map(a=>a.atividade_id===area.atividade_id?{...a,homens:Math.max(0,Number(e.target.value))}:a))}/><button aria-label={`Aumentar ${area.descricao}`} disabled={Boolean(labor?.confirmado_em)} onClick={()=>change(area.atividade_id,.01)}>+</button></div><label>Observação<input value={area.observacao||''} disabled={Boolean(labor?.confirmado_em)} onChange={e=>setAreas(current=>current.map(a=>a.atividade_id===area.atividade_id?{...a,observacao:e.target.value}:a))}/></label></article>)}
    <div className="mobile-actions"><button className="button primary full" disabled={busy||Boolean(labor?.confirmado_em)||!areas.length} onClick={save}>Enviar · salvar lançamentos</button><button className="button success full" disabled={busy||Boolean(labor?.confirmado_em)||!labor?.salvo_em||!!queueCount} onClick={confirm}>Confirmar mão de obra</button></div></div>
  </main>;
}

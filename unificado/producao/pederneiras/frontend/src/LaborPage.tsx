import {useEffect,useState} from 'react';
import {api,send} from './api';
import type {Area,Day,Labor,Month} from './types';
import {fmt,minusDay,number,todayISO} from './types';

export function LaborPage({notify}:{notify:(message:string)=>void}){
  const requested=new URLSearchParams(location.search).get('date');
  const [date,setDate]=useState(requested&&requested<=todayISO()?requested:todayISO());
  const [labor,setLabor]=useState<Labor|null>(null);const [yesterday,setYesterday]=useState<Labor|null>(null);const [production,setProduction]=useState<Day|null>(null);
  const [month,setMonth]=useState<Month|null>(null);const [areas,setAreas]=useState<Area[]>([]);
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [settings,setSettings]=useState(false);
  const load=async(target:string)=>{setError('');try{const [l,y,p,m]=await Promise.all([
    api<Labor>(`/mao-de-obra/${target}`),api<Labor>(`/mao-de-obra/${minusDay(target)}`),api<Day>(`/apontamentos/${target}`),api<Month>(`/mensal?mes=${target.slice(0,7)}`)]);
    setLabor(l);setYesterday(y);setProduction(p);setMonth(m);setAreas(l.areas);
  }catch(e){setError((e as Error).message);}};
  useEffect(()=>{void load(date);},[date]);
  const change=(id:number,field:'homens'|'observacao',value:number|string)=>setAreas(current=>current.map(a=>a.atividade_id===id?{...a,[field]:value}:a));
  const total=areas.reduce((sum,a)=>sum+number(a.homens),0);
  const mod=areas.filter(a=>a.tipo==='MOD').reduce((sum,a)=>sum+number(a.homens),0);
  const ratio=total?number(production?.postes)/total:null;
  const save=async()=>{setBusy(true);setError('');try{
    await send<Labor>(`/mao-de-obra/${date}`,'PUT',{areas:areas.filter(a=>a.ativo).map(a=>({atividade_id:a.atividade_id,homens:a.homens,observacao:a.observacao})),origem:'desktop'});
    await load(date);notify('Mão de obra salva.');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const confirm=async()=>{setBusy(true);setError('');try{await api<Labor>(`/mao-de-obra/${date}/confirmar`,{method:'POST'});await load(date);notify('Mão de obra confirmada.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const repeat=async()=>{setBusy(true);setError('');try{await api<Labor>(`/mao-de-obra/${date}/repetir-ontem`,{method:'POST'});await load(date);notify('Último dia de mão de obra copiado.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const saveArea=async(area:Area)=>{setBusy(true);setError('');try{await send(`/areas/${area.atividade_id}`,'PATCH',{
    descricao:area.descricao,tipo:area.tipo,ordem:area.ordem,ativo:area.ativo});await load(date);notify('Área atualizada.');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const addArea=async()=>{const name=prompt('Nome da nova área');if(!name?.trim())return;setBusy(true);setError('');try{
    await send('/areas','POST',{descricao:name.trim(),tipo:'MOD',ordem:areas.length+1,ativo:true});
    await load(date);notify('Área criada. Confira e ajuste sua classificação MOD/MOI.');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <div className="page-grid"><div className="wide side-stack">
    <section className="panel"><div className="panel-heading"><div><span className="eyebrow">EQUIPE DO DIA</span><h2>Mão de obra por área</h2><p>Enviar salva os lançamentos. Confirmar conclui o registro do dia.</p></div><span className={`badge ${labor?.confirmado_em?'success':'muted'}`}>{labor?.confirmado_em?'Confirmado':'Em lançamento'}</span></div>
      <div className="toolbar"><label className="inline-field">Data<input type="date" max={todayISO()} value={date} onChange={e=>setDate(e.target.value)}/></label><button className="button" disabled={busy||Boolean(labor?.confirmado_em)} onClick={repeat}>Repetir último dia</button><button className="button ghost" onClick={()=>setSettings(!settings)}>{settings?'Fechar áreas':'Configurar áreas'}</button></div>
      {areas.length===0?<div className="empty-inline">As áreas ainda não foram classificadas. Aguardando a definição MOD/MOI para iniciar lançamentos.</div>:
        <div className="area-list">{areas.filter(a=>a.ativo).map(area=><div className="area-card" key={area.atividade_id}><div><strong>{area.descricao}</strong><span className={`badge ${area.tipo==='MOD'?'info':'muted'}`}>{area.tipo}</span><small>Ontem: {fmt(yesterday?.areas.find(a=>a.atividade_id===area.atividade_id)?.homens,2)}</small></div><label>Homens hoje<div className="stepper"><button disabled={Boolean(labor?.confirmado_em)} aria-label={`Diminuir ${area.descricao}`} onClick={()=>change(area.atividade_id,'homens',Math.max(0,number(area.homens)-.25))}>−</button><input type="number" min="0" step="0.25" value={number(area.homens)} disabled={Boolean(labor?.confirmado_em)} onChange={e=>change(area.atividade_id,'homens',Math.max(0,Number(e.target.value)))}/><button disabled={Boolean(labor?.confirmado_em)} aria-label={`Aumentar ${area.descricao}`} onClick={()=>change(area.atividade_id,'homens',number(area.homens)+.25)}>+</button></div></label><label>Observação<input value={area.observacao||''} disabled={Boolean(labor?.confirmado_em)} onChange={e=>change(area.atividade_id,'observacao',e.target.value)}/></label></div>)}</div>}
      {settings&&<section className="area-settings"><div className="panel-heading"><div><h3>Cadastro de áreas</h3><p>Classificação editável por supervisor.</p></div><button className="button" onClick={addArea}>+ Área</button></div>{areas.map(area=><div className="area-setting" key={area.atividade_id}><input aria-label="Nome da área" value={area.descricao} onChange={e=>setAreas(current=>current.map(a=>a.atividade_id===area.atividade_id?{...a,descricao:e.target.value}:a))}/><select aria-label={`Classificação de ${area.descricao}`} value={area.tipo} onChange={e=>setAreas(current=>current.map(a=>a.atividade_id===area.atividade_id?{...a,tipo:e.target.value as Area['tipo']}:a))}><option>MOD</option><option>MOI</option></select><button className="button" disabled={busy} onClick={()=>saveArea(area)}>Salvar</button></div>)}</section>}
    </section>
    <section className="panel"><span className="eyebrow">MÊS</span><h2>Áreas × dias com produção</h2><div className="table-scroll"><table><thead><tr><th>Área</th>{month?.dias.map(day=><th key={day.data}>{day.data.slice(8)}</th>)}</tr></thead><tbody>{areas.map(area=><tr key={area.atividade_id}><th>{area.descricao}</th>{month?.dias.map(day=><td key={day.data}>{fmt(day.areas.find(a=>a.atividade_id===area.atividade_id)?.homens,2)}</td>)}</tr>)}<tr className="total-row"><th>Total</th>{month?.dias.map(day=><td key={day.data}>{fmt(day.homens,2)}</td>)}</tr><tr className="total-row"><th>Postes / homem</th>{month?.dias.map(day=><td key={day.data}>{fmt(day.postes_homem,2)}</td>)}</tr></tbody></table></div></section>
    </div><aside className="side-stack"><section className="panel sticky"><span className="eyebrow">RESUMO</span><h2>Equipe e produtividade</h2><div className="metric-stack"><div><span>Homens</span><strong>{fmt(total,2)}</strong></div><div><span>MOD</span><strong>{fmt(mod,2)}</strong></div><div><span>MOI</span><strong>{fmt(total-mod,2)}</strong></div><div><span>Postes / homem</span><strong>{fmt(ratio,2)}</strong></div></div><p className="footnote">Postes produzidos: {fmt(production?.postes)}</p><div className="button-column"><button className="button primary full" disabled={busy||Boolean(labor?.confirmado_em)||!areas.length} onClick={save}>Enviar · salvar lançamentos</button><button className="button success full" disabled={busy||Boolean(labor?.confirmado_em)||!labor?.salvo_em} onClick={confirm}>Confirmar mão de obra</button></div></section></aside>
    {error&&<div className="toast error" role="alert">{error}</div>}
  </div>;
}

import {useEffect,useMemo,useState} from 'react';
import {api,send} from './api';
import type {Day,Labor,Month,Product} from './types';
import {fmt,minusDay,number,todayISO} from './types';

export function DayPage({products,notify}:{products:Product[];notify:(message:string)=>void}){
  const requested=new URLSearchParams(location.search).get('date');
  const [date,setDate]=useState(requested&&requested<=todayISO()?requested:todayISO());
  const [day,setDay]=useState<Day|null>(null);const [labor,setLabor]=useState<Labor|null>(null);
  const [yesterday,setYesterday]=useState<Day|null>(null);const [month,setMonth]=useState<Month|null>(null);
  const [reference,setReference]=useState<{dias:number;medias:Record<string,number>}|null>(null);
  const [qty,setQty]=useState<Record<number,number>>({});const [search,setSearch]=useState('');
  const [family,setFamily]=useState('Mais produzidos');const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');const [loading,setLoading]=useState(true);
  const load=async(target:string)=>{setLoading(true);setError('');try{
    const [d,l,y,m,r]=await Promise.all([
      api<Day>(`/apontamentos/${target}`),api<Labor>(`/mao-de-obra/${target}`),
      api<Day>(`/apontamentos/${minusDay(target)}`),api<Month>(`/mensal?mes=${target.slice(0,7)}`),
      api<{dias:number;medias:Record<string,number>}>(`/apontamentos/${target}/referencia`),
    ]);
    setDay(d);setLabor(l);setYesterday(y);setMonth(m);setReference(r);
    setQty(Object.fromEntries(d.itens.map(item=>[item.produto_id,item.quantidade])));
  }catch(e){setError((e as Error).message);}finally{setLoading(false);}};
  useEffect(()=>{void load(date);},[date]);
  const monthly=useMemo(()=>{const counts=new Map<number,number>();month?.dias.forEach(d=>d.itens.forEach(i=>counts.set(i.produto_id,(counts.get(i.produto_id)||0)+i.quantidade)));return counts;},[month]);
  const top=useMemo(()=>new Set((monthly.size?[...monthly.entries()].sort((a,b)=>b[1]-a[1]).slice(0,15).map(([id])=>id):products.filter(p=>p.ativo).slice(0,15).map(p=>p.id))),[monthly,products]);
  const families=['Mais produzidos',...new Set(products.map(p=>p.familia)),'Todos'];
  const visible=products.filter(product=>product.ativo&&
    (family==='Todos'||family==='Mais produzidos'&&top.has(product.id)||product.familia===family)&&
    [product.descricao,product.cod_pro,product.cod_sma,product.letra].join(' ').toLowerCase().includes(search.toLowerCase()));
  const total=Object.values(qty).reduce((sum,value)=>sum+number(value),0);
  const missing=products.filter(product=>number(qty[product.id])>0&&product.volume_m3===null).length;
  const volume=missing?null:products.reduce((sum,product)=>sum+number(qty[product.id])*number(product.volume_m3),0);
  const people=number(labor?.homens);
  const perPerson=people?total/people:null;
  const postProducts=products.filter(product=>product.familia.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()!=='acessorios');
  const missingWeight=postProducts.some(product=>number(qty[product.id])>0&&product.peso_unitario_kg===null);
  const kgPerPerson=people&&!missingWeight?postProducts.reduce((sum,product)=>sum+number(qty[product.id])*number(product.peso_unitario_kg),0)/people:null;
  const outliers=reference&&reference.dias>=5?products.filter(product=>{
    const mean=reference.medias[String(product.id)]||0,current=number(qty[product.id]);
    return current>0&&mean>=3&&Math.abs(current-mean)>=3&&(current>mean*1.5||current<mean*.5);
  }):[];
  const setQuantity=(id:number,value:number)=>setQty(current=>({...current,[id]:Math.max(0,Math.floor(value||0))}));
  const save=async(action:'rascunho'|'enviar')=>{setBusy(true);setError('');try{
    const data=await send<Day>(`/apontamentos/${date}`,'PUT',{
      itens:Object.entries(qty).filter(([,value])=>number(value)>0).map(([id,value])=>({produto_id:Number(id),quantidade:number(value)})),
      acao:action,origem:'desktop',
    });setDay(data);notify(action==='enviar'?'Apontamento enviado.':'Rascunho salvo com auditoria.');await load(date);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const confirm=async()=>{setBusy(true);setError('');try{const data=await api<Day>(`/apontamentos/${date}/confirmar`,{method:'POST'});setDay(data);notify('Dia confirmado.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const repeat=async()=>{setBusy(true);setError('');try{await api<Day>(`/apontamentos/${date}/repetir-ontem`,{method:'POST'});await load(date);notify('Último dia com produção copiado para o rascunho.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <div className="page-grid">
    <section className="panel wide">
      <div className="panel-heading"><div><span className="eyebrow">LANÇAMENTO DIÁRIO</span><h2>Produtos produzidos</h2><p>Informe quantidades inteiras. Use Tab para passar ao próximo produto.</p></div><span className={`badge ${day?.status==='confirmado'?'success':day?.status==='enviado'?'info':'muted'}`}>{day?.status||'rascunho'}</span></div>
      <div className="toolbar"><label className="inline-field">Data<input type="date" max={todayISO()} value={date} onChange={e=>setDate(e.target.value)}/></label><input className="search" placeholder="Buscar produto, código ou letra" aria-label="Buscar produto" value={search} onChange={e=>setSearch(e.target.value)}/><button className="button" disabled={busy||day?.status==='confirmado'} onClick={repeat}>Repetir último dia</button></div>
      <div className="family-tabs" role="group" aria-label="Família dos produtos">{families.map(item=><button key={item} className={family===item?'active':''} onClick={()=>setFamily(item)}>{item}</button>)}</div>
      {loading?<div className="empty-inline">Carregando lançamentos...</div>:<div className="table-scroll"><table className="entry-table"><thead><tr><th>Letra</th><th>Produto</th><th>Códigos</th><th>Ontem</th><th>Hoje</th><th>Mês</th></tr></thead><tbody>{visible.map(product=>{
        const prev=yesterday?.itens.find(item=>item.produto_id===product.id)?.quantidade||0;
        const current=number(qty[product.id]);return <tr key={product.id} className={current!==prev?'changed':''}><td>{product.letra||'—'}</td><td><strong>{product.descricao}</strong><small>{product.familia}</small></td><td>{product.cod_pro||'—'} / {product.cod_sma||'—'}</td><td>{prev||'—'}</td><td><div className="stepper"><button aria-label={`Diminuir ${product.descricao}`} disabled={day?.status==='confirmado'} onClick={()=>setQuantity(product.id,current-1)}>−</button><input aria-label={`Hoje: ${product.descricao}`} type="number" min="0" step="1" value={current} disabled={day?.status==='confirmado'} onChange={e=>setQuantity(product.id,Number(e.target.value))}/><button aria-label={`Aumentar ${product.descricao}`} disabled={day?.status==='confirmado'} onClick={()=>setQuantity(product.id,current+1)}>+</button></div></td><td>{monthly.get(product.id)||'—'}</td></tr>;
      })}</tbody></table>{visible.length===0&&<div className="empty-inline">Nenhum produto neste filtro.</div>}</div>}
    </section>
    <aside className="side-stack"><section className="panel sticky"><span className="eyebrow">RESUMO DO DIA</span><h2>{new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})}</h2>
      <div className="metric-stack"><div><span>Postes</span><strong>{fmt(total)}</strong></div><div><span>Homens</span><strong>{fmt(people,2)}</strong></div><div><span>Postes / homem</span><strong>{fmt(perPerson,2)}</strong><small>Meta {fmt(month?.meta?.meta_postes_homem,1)}</small></div><div><span>kg / homem</span><strong>{fmt(kgPerPerson,2)}</strong></div><div><span>Volume</span><strong>{fmt(volume,3)} m³</strong></div><div><span>Variação vs ontem</span><strong>{fmt(total-(yesterday?.postes||0))}</strong></div></div>
      {missing>0&&<p className="alert-line">{missing} produto(s) sem volume por peça. O m³ permanece pendente.</p>}
      {total>0&&!people&&<p className="alert-line">Mão de obra ausente: confirmação bloqueada.</p>}
      {outliers.length>0&&<p className="alert-line">Fora do padrão dos últimos {reference?.dias} dias: {outliers.slice(0,3).map(p=>p.descricao).join(', ')}{outliers.length>3?' e outros':''}.</p>}
      <p className="footnote">Liberação prevista: {day?.liberacao_prevista?new Date(`${day.liberacao_prevista}T12:00:00`).toLocaleDateString('pt-BR'):'—'}</p>
      <div className="button-column"><button className="button primary full" disabled={busy||day?.status==='confirmado'} onClick={()=>save('enviar')}>Revisar e enviar</button><button className="button full" disabled={busy||day?.status==='confirmado'} onClick={()=>save('rascunho')}>Salvar rascunho</button><button className="button success full" disabled={busy||day?.status!=='enviado'||!people} onClick={confirm}>Confirmar dia</button></div></section></aside>
    {error&&<div className="toast error" role="alert">{error}</div>}
  </div>;
}

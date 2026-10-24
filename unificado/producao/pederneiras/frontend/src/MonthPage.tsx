import {useEffect,useMemo,useState} from 'react';
import {api,download,send} from './api';
import type {Day,Month,Product} from './types';
import {fmt,monthISO,todayISO} from './types';

type Cell={day:string;product:Product;quantity:number};
export function MonthPage({products,notify}:{products:Product[];notify:(message:string)=>void}){
  const [month,setMonth]=useState(monthISO());const [data,setData]=useState<Month|null>(null);
  const [filter,setFilter]=useState<'com'|'todos'>('com');const [search,setSearch]=useState('');
  const [editing,setEditing]=useState<Cell|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const load=async(target:string)=>{setError('');try{setData(await api<Month>(`/mensal?mes=${target}`));}catch(e){setError((e as Error).message);}};
  useEffect(()=>{void load(month);},[month]);
  const quantities=useMemo(()=>new Map(data?.dias.flatMap(day=>day.itens.map(item=>[`${item.produto_id}:${day.data}`,item.quantidade] as const))||[]),[data]);
  const totals=useMemo(()=>new Map(products.map(product=>[product.id,(data?.dias||[]).reduce((sum,day)=>sum+(quantities.get(`${product.id}:${day.data}`)||0),0)])),[products,data,quantities]);
  const visible=products.filter(product=>(filter==='todos'||(totals.get(product.id)||0)>0)&&
    [product.descricao,product.cod_pro,product.cod_sma,product.familia].join(' ').toLowerCase().includes(search.toLowerCase()));
  const saveCell=async()=>{if(!editing||!data)return;setBusy(true);setError('');try{
    const source=data.dias.find(day=>day.data===editing.day);
    if(!source||source.status==='confirmado')throw new Error('Dia confirmado. Solicite reabertura ao supervisor.');
    const items=new Map(source.itens.map(item=>[item.produto_id,item.quantidade]));
    items.set(editing.product.id,Math.max(0,Math.floor(editing.quantity)));
    await send<Day>(`/apontamentos/${editing.day}`,'PUT',{itens:[...items].map(([produto_id,quantidade])=>({produto_id,quantidade})),acao:source.status==='enviado'?'enviar':'rascunho',origem:'desktop'});
    setEditing(null);await load(month);notify('Célula atualizada com auditoria.');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const exportFile=async(type:'pdf'|'xlsx')=>{setBusy(true);setError('');try{await download(`/exportar/lt-pro-04.${type}?mes=${month}`,`LT-PRO-04-${month}.${type}`);}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <div className="side-stack">
    <section className="kpi-grid"><article className="kpi"><span>Produzido no mês</span><strong>{fmt(data?.postes)}</strong><small>Meta {fmt(data?.meta_total)} postes</small></article><article className="kpi"><span>Dias com produção</span><strong>{fmt(data?.dias_producao)}</strong><small>Média {fmt(data?.media_postes_dia,1)} postes/dia</small></article><article className="kpi"><span>Postes / homem</span><strong>{fmt(data?.postes_homem,2)}</strong><small>Meta {fmt(data?.meta?.meta_postes_homem,1)}</small></article><article className="kpi"><span>Volume</span><strong>{fmt(data?.volume_m3,3)} <em>m³</em></strong><small>{data?.produtos_sem_volume||0} produto(s) sem volume</small></article><article className={`kpi ${(data?.pendencias.length||0)>0?'warn':''}`}><span>Pendências</span><strong>{fmt(data?.pendencias.length)}</strong><small>Dias com produção sem mão de obra</small></article></section>
    <section className="panel"><div className="panel-heading"><div><span className="eyebrow">MATRIZ MENSAL</span><h2>Produção por produto e dia</h2><p>Somente dias com produção até hoje. Clique em uma célula de dia aberto para editar.</p></div><span className="badge">{data?.dias.length||0} dias</span></div>
      <div className="toolbar"><label className="inline-field">Mês<input type="month" max={todayISO().slice(0,7)} value={month} onChange={e=>setMonth(e.target.value)}/></label><input className="search" placeholder="Buscar produto ou código" aria-label="Buscar produto" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Filtro de produtos" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}><option value="com">Com produção</option><option value="todos">Todos</option></select><div className="button-row"><button className="button" disabled={busy} onClick={()=>exportFile('pdf')}>Exportar PDF</button><button className="button" disabled={busy} onClick={()=>exportFile('xlsx')}>Exportar Excel</button></div></div>
      <div className="matrix-wrap"><table className="matrix"><thead><tr><th>Produto</th><th>Cód. Pro</th>{data?.dias.map(day=><th key={day.data} className={new Date(`${day.data}T12:00:00`).getDay()%6===0?'weekend':''}>{day.data.slice(8)}<small>{new Date(`${day.data}T12:00:00`).toLocaleDateString('pt-BR',{weekday:'short'})}</small></th>)}<th>Total</th></tr></thead><tbody>{visible.map(product=><tr key={product.id}><th title={product.descricao}>{product.descricao}</th><td>{product.cod_pro||'—'}</td>{data?.dias.map(day=>{const quantity=quantities.get(`${product.id}:${day.data}`)||0;return <td key={day.data} className={quantity?'has-value':''}><button className="cell-button" disabled={day.status==='confirmado'} title={day.status==='confirmado'?'Dia confirmado':'Editar quantidade'} onClick={()=>setEditing({day:day.data,product,quantity})}>{quantity||'·'}</button></td>;})}<td className="total-cell">{totals.get(product.id)||'—'}</td></tr>)}</tbody><tfoot>{([['Total postes','postes'],['Homens','homens'],['MOD','mod'],['MOI','moi'],['Postes / homem','postes_homem'],['m³','volume_m3']] as const).map(([label,key])=><tr key={key}><th>{label}</th><td></td>{data?.dias.map(day=><td key={day.data}>{fmt(day[key],key==='postes'?0:2)}</td>)}<td>{key==='postes'?fmt(data?.postes):key==='homens'?fmt(data?.homens,2):'—'}</td></tr>)}</tfoot></table>{!data?.dias.length&&<div className="empty-inline">Ainda não há produção registrada neste mês.</div>}</div>
    </section>
    {editing&&<div className="modal-backdrop" role="presentation" onClick={()=>setEditing(null)}><div className="modal" role="dialog" aria-modal="true" aria-label="Editar produção" onClick={event=>event.stopPropagation()}><span className="eyebrow">CORREÇÃO AUDITADA</span><h2>{editing.product.descricao}</h2><p>{new Date(`${editing.day}T12:00:00`).toLocaleDateString('pt-BR')}</p><label>Quantidade produzida<input autoFocus type="number" min="0" step="1" value={editing.quantity} onChange={e=>setEditing({...editing,quantity:Number(e.target.value)})}/></label><div className="button-row"><button className="button ghost" onClick={()=>setEditing(null)}>Cancelar</button><button className="button primary" disabled={busy} onClick={saveCell}>Salvar alteração</button></div></div></div>}
    {error&&<div className="toast error" role="alert">{error}</div>}
  </div>;
}

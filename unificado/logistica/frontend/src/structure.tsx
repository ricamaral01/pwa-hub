import React,{useState,useEffect} from 'react';
import {fmt,api,monthLabel} from './api';
type Any=any;
export const screens=[
 ['painel','Painel Km/Evento','Indicadores, evolução e ranking','logisticaPainel','Km/Evento'],
 ['correcoes','Correções e exclusões','Falsos alarmes e exclusões por mês','logisticaCorrecoes','Km/Evento'],
 ['fechamento','Fechamento trimestral','Conferência dos três meses','logisticaFechamento','Km/Evento'],
 ['premiacao','Premiação','Avaliações e classificação oficial · restrito','logisticaPremiacao','Km/Evento'],
 ['meses','Meses e importação','Relatório geral e fechamento mensal','logisticaMeses','Km/Evento'],
 ['metas','Metas','Planejamento por trimestre e unidade','logisticaMetas','Km/Evento'],
 ['motoristas','Motoristas','Unidade, participação e vínculo Cobli','logisticaMotoristas','Cadastros'],
 ['ajudantes','Ajudantes','Cadastro de pessoas e unidades','logisticaAjudantes','Cadastros'],
 ['mapeamento-cobli','Mapeamento Cobli','Grupos, unidades e pendências','logisticaCobli','Cadastros']];
export function ModuleHome({ctx,go,search,setSearch}:Any){
 const allowed=screens.filter(s=>ctx.screens.includes(s[3]));
 const engine=(window as any).UnificadoBusca;
 const response=engine?.search(search,{moduleId:'logistica'});
 const explanation=search.trim()?engine?.explanation?.(response):'';
 const matches=new Set(response?.results.map((row:Any)=>row.id)||[]);
 const found=allowed.filter(s=>!search.trim()||matches.has(s[3]));
 return <><section className="lg-home-intro"><h2>Acesso rápido</h2><p>Encontre uma ferramenta ou navegue pelas seções da Logística.</p><label>Buscar tela<input type="search" aria-label="Buscar tela na Logística" placeholder="Nome da tela ou atividade" value={search} onChange={e=>setSearch(e.target.value)}/></label></section>{explanation&&found.length>0&&<p className="uni-search-inline-feedback" role="status">{explanation}</p>}{['Km/Evento','Cadastros'].map(group=>{const list=found.filter(s=>s[4]===group);return list.length>0&&<section className="lg-home-section" key={group}><h2>{group}</h2><div className="lg-tools">{list.map(([path,label,description,id])=><button className="lg-tool" key={id} onClick={()=>go(path)}><strong>{label}</strong><small>{description}</small>{path==='premiacao'&&<span className="lg-badge">Acesso restrito</span>}</button>)}</div></section>})}{!found.length&&<p className="lg-empty">Nenhuma tela encontrada.</p>}</>;
}
export function QuarterTargets({data,canEdit,busy,unit,run,refresh}:Any){
 const [pending,setPending]=useState<Any>(null);
 useEffect(()=>setPending(null),[unit,refresh,data.ano]);
 const quarters=Array.from(new Set<string>(data.rows.map((r:Any)=>r.trimestre)));
 return <><p className="lg-alert">Padrões por trimestre: 250 / 320 / 380 / 450 km/evento. Meses já fechados e exceções históricas são preservados. O próximo ano também pode ser planejado.</p>{quarters.map(t=>{
  const items=data.rows.filter((r:Any)=>r.trimestre===t),state=data.trimestres?.find((r:Any)=>r.trimestre===t),closed=items.every((r:Any)=>r.fechado);
  return <section className="lg-card lg-quarter-target" key={t} aria-label={'Metas '+t}>
   <div className="lg-card-head"><h3>{t.slice(-1)}º trimestre / {t.slice(0,4)}</h3><span className={'lg-badge '+(closed?'good':'warn')}>{closed?'Encerrado · somente leitura':'Planejamento disponível'}</span></div>
   <form key={refresh+'-'+unit+'-'+t} onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);run(()=>api('/trimestres/'+t+'/metas',unit,'PUT',{versao_trimestre:state?.versao,motivo:f.get('motivo'),rows:items.map((r:Any)=>({unidade_id:r.unidade_id,versao:r.versao,meta:Number(f.get('meta_'+r.unidade_id))}))}),'Metas do trimestre salvas. Meses fechados preservados.')}}>
    <div className="lg-table-wrap"><table><thead><tr><th>Unidade</th><th>Padrão</th><th>Meta planejada</th><th>Metas mensais preservadas</th></tr></thead><tbody>{items.map((r:Any)=><tr key={r.unidade_id}><td>{r.unidade}</td><td>{fmt(r.padrao)}</td><td><input aria-label={'Meta '+r.unidade+' '+t} name={'meta_'+r.unidade_id} type="number" min="1" max="10000000" step="1" defaultValue={r.override??r.padrao} required disabled={busy||closed||!canEdit}/></td><td>{r.meses.length?r.meses.map((m:Any)=><small key={m.competencia}>{monthLabel(m.competencia)}: {fmt(m.meta)} {m.status==='fechado'?'· congelada':''}</small>):'Sem importação ainda'}{r.excecoes.length>0&&<small className="lg-attention">Exceções históricas preservadas</small>}</td></tr>)}</tbody></table></div>
    {canEdit&&!closed&&<><label>Motivo do ajuste<input name="motivo" required maxLength={1000} placeholder="Descreva o planejamento ou revisão"/></label><button className="primary" disabled={busy||Boolean(pending)}>Salvar metas do trimestre</button></>}
   </form>
   <footer className="lg-quarter-controls"><small>Controle das metas do trimestre em todas as unidades. Meses fechados e premiações aprovadas permanecem preservados. Somente administradores podem reabrir ou fechar.</small>
    <div className="lg-actions"><button type="button" disabled={busy||!data.pode_gerenciar_trimestres||!closed||Boolean(pending)} onClick={()=>setPending({t,action:'reabrir',versao:state?.versao})}>Reabrir trimestre</button><button type="button" className="lg-quarter-close" disabled={busy||!data.pode_gerenciar_trimestres||closed||Boolean(pending)} onClick={()=>setPending({t,action:'fechar',versao:state?.versao})}>Fechar trimestre</button></div>
    {pending?.t===t&&<form className="lg-quarter-confirm" onSubmit={e=>{e.preventDefault();const reason=new FormData(e.currentTarget).get('motivo');run(async()=>{await api('/trimestres/'+t+'/metas/'+pending.action,unit,'POST',{versao:pending.versao,motivo:reason});setPending(null)},pending.action==='fechar'?'Trimestre fechado. Metas bloqueadas para edição.':'Trimestre reaberto para edição das metas.')}}>
     <h4>{pending.action==='fechar'?'Fechar':'Reabrir'} {t}</h4><p>{pending.action==='fechar'?'As metas deste trimestre ficarão somente leitura em todas as unidades.':'As metas deste trimestre poderão ser ajustadas novamente. Meses já fechados continuarão congelados.'} A ação ficará registrada no histórico.</p>
     <label>Motivo {pending.action==='fechar'?'do fechamento':'da reabertura'}<textarea name="motivo" required maxLength={1000} autoFocus disabled={busy}/></label>
     <div className="lg-actions"><button type="button" disabled={busy} onClick={()=>setPending(null)}>Cancelar</button><button className="primary" disabled={busy}>{pending.action==='fechar'?'Confirmar fechamento do trimestre':'Confirmar reabertura do trimestre'}</button></div>
    </form>}
   </footer>
  </section>
 })}</>;
}
export function ApprovalChecklist({data}:Any){return data.status!=='aprovada'&&<section className="lg-card"><h3>O que falta para aprovar</h3>{data.pendencias?.length?<div className="lg-people">{data.pendencias.map((p:Any)=><article key={p.unidade_id+p.competencia}><strong>{monthLabel(p.competencia)} · {p.unidade}</strong><span className="lg-badge warn">{p.status==='sem_dados'?'Importar dados':'Conferir e fechar mês'}</span></article>)}</div>:<p>Os meses das unidades exibidas estão fechados.</p>}{!data.parametros.confirmado&&<p className="lg-alert warn">Conferir e salvar os parâmetros do trimestre.</p>}{!data.pode_aprovar&&<p className="lg-alert warn">A aprovação exige Todas e acesso ao consolidado completo.</p>}</section>}
export function CobliMapping({rows,pending,canEdit,busy,onEdit,onNew}:Any){return <><section className="lg-card"><h3>Grupo Cobli → unidade</h3><div className="lg-table-wrap"><table><thead><tr><th>Grupo no relatório</th><th>Unidade</th><th>Situação</th><th>Ação</th></tr></thead><tbody>{rows.map((r:Any)=><tr key={r.id}><td>{r.grupo}</td><td>{r.unidade}</td><td>{r.ativo?'Ativo':'Inativo'}</td><td><button disabled={!canEdit||busy} onClick={()=>onEdit(r)}>Editar mapeamento</button></td></tr>)}</tbody></table></div></section><section className="lg-card"><h3>Grupos sem mapeamento</h3><p>Linhas desses grupos não entram na produção dos indicadores. Motoristas com unidade fixada manualmente mantêm seu vínculo.</p>{pending.length?pending.map((p:Any)=><div className="lg-alert warn" key={p.grupo}><strong>{p.grupo}</strong> · Sem mapeamento <button className="lg-map-pending" disabled={!canEdit||busy} onClick={()=>onNew(p.grupo)}>Vincular unidade</button></div>):<p>Nenhum grupo pendente identificado nas importações disponíveis.</p>}</section></>}

export function MigrationSummary({unit}:Any){
 const [data,setData]=useState<Any>(null);useEffect(()=>{let active=true;api('/migracoes',unit).then(d=>{if(active)setData(d.rows.find((r:Any)=>r.origem==='backup_localstorage_2026-11-13.json')?.resultado)}).catch(()=>{});return()=>{active=false}},[unit]);
 return data&&<section className="lg-card"><h3>Backup v7 · carga conciliada</h3><p>Dados recuperados com auditoria. Fechamentos existentes preservados; nenhuma aprovação financeira automática.</p><div className="lg-mini-kpis">{[['Competências por unidade recuperadas',data.meses_recuperados],['Registros recuperados',data.registros_novos],['Registros existentes preservados',data.registros_existentes_preservados],['Avaliações de motoristas',data.avaliacoes_motoristas],['Conflitos para revisão',data.conflitos_para_revisao]].map(([label,value])=><span key={label}>{label}: <b>{value}</b></span>)}</div><p>O backup fornecido não contém cadastro nem avaliações de ajudantes. Inclua os ajudantes em Cadastros → Ajudantes e lance as notas reais na Premiação.</p></section>
}

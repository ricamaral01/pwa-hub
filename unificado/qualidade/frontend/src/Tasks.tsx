import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, request, type Context } from './api';
import { requestOrQueue, syncPending, queuedCount, saveTaskSnapshot, loadTaskSnapshot } from './tasksOffline';
import './tasks.css';
import { taskRead } from './taskRead';
import { TaskModal } from './TaskModal';

export type Task = {
  public_id: string; titulo: string; notas: string | null; responsavel_nome?: string;
  status: 'a_fazer'|'em_andamento'|'aguardando'|'concluida'|'cancelada';
  motivo_status: string | null; prioridade: number; prazo: string | null;
  prazo_dia_inteiro: boolean; lembrete_em: string | null; recorrencia: string | null;
  lista_id: number | null; responsavel_id: string; criado_por_id: string | null;
  origem_modulo: string; origem_tipo: string | null; origem_id: string | null;
  origem_rotulo: string | null; origem_url: string | null; conclusao_pela_origem: boolean;
  unidade_codigo: string; versao: number; criado_em: string; atualizado_em: string;
};
type Activity = {id:number;tipo:string;ator_id:string|null;dados:Record<string,unknown>;criado_em:string};
type Detail = Task & {subtarefas:{id:number;titulo:string;concluida:boolean;ordem:number}[];comentarios:{id:number;autor_id:string;texto:string;criado_em:string}[];anexos:{id:number;nome:string}[];atividade:Activity[]};
type Counts = {hoje:number;atrasadas:number;proximas:number;todas:number;concluidas_hoje:number;novas:number;origens:Record<string,number>;listas:Record<string,number>};
type List = {id:number;nome:string;cor:string;compartilhada:boolean};
type View = 'hoje'|'atrasadas'|'proximas'|'todas'|'concluidas';
const originLabels:Record<string,string> = {ged:'GED',nc:'Não conformidades',laboratorio:'Laboratório',pcp:'PCP',suprimentos:'Suprimentos',reclamacoes:'Reclamações'};
const originClass:Record<string,string> = {ged:'ged',nc:'nc',laboratorio:'lab',pcp:'pcp',suprimentos:'sup',reclamacoes:'rec'};
const statusLabels:Record<string,string> = {a_fazer:'A fazer',em_andamento:'Em andamento',aguardando:'Aguardando',concluida:'Concluída',cancelada:'Cancelada'};
const statusColors:Record<string,string> = {a_fazer:'#8E8E93',em_andamento:'#007AFF',aguardando:'#FF9500',concluida:'#34C759',cancelada:'#C7C7CC'};
const countLabels:Record<View,string> = {hoje:'Hoje',atrasadas:'Atrasadas',proximas:'Próximas',todas:'Todas',concluidas:'Concluídas'};
const smartViews = ['hoje','atrasadas','proximas','todas'] as const;
const dateLabel = (s:string|null) => s ? new Date(s).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}) : 'Sem prazo';
const hourLabel = (s:string|null) => s ? new Date(s).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '';
const isLate = (task:Task) => !!task.prazo && (task.prazo_dia_inteiro
  ? new Date(task.prazo).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}) < new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'})
  : new Date(task.prazo).getTime() < Date.now()) && !['concluida','cancelada'].includes(task.status);
const initials = (s:string) => s.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
const originHref = (url:string) => `/unificado/?view=${encodeURIComponent(url.replace(/^\/unificado\//,''))}`;
const openOrigin = (url:string) => { window.open(originHref(url),'_top'); };

export function OrigemBadge({task}:{task:Task}) {
  if(task.origem_modulo==='manual')return null;
  return <span className={`task-origin task-origin-${originClass[task.origem_modulo]||'manual'}`}><span aria-hidden="true">{task.origem_modulo==='ged'?'▤':task.origem_modulo==='laboratorio'?'⚗':task.origem_modulo==='suprimentos'?'▣':task.origem_modulo==='pcp'?'▦':task.origem_modulo==='nc'?'△':'◻'}</span>{originLabels[task.origem_modulo]||task.origem_modulo}{task.origem_tipo?` · ${task.origem_tipo.replaceAll('_',' ')}`:''}</span>;
}
export function StatusBadge({status}:{status:Task['status']}) {return <span className="task-status"><span className="task-dot" style={{background:statusColors[status]}}/>{statusLabels[status]}</span>}
export function PrazoBadge({task}:{task:Task}) {if(!task.prazo)return null;return <span className={`task-due ${isLate(task)?'late':new Date(task.prazo).toDateString()===new Date().toDateString()?'today':'next'}`}><span aria-hidden="true">◷</span>{isLate(task)?`Atrasada · ${dateLabel(task.prazo)}`:dateLabel(task.prazo)} {!task.prazo_dia_inteiro&&hourLabel(task.prazo)}{task.recorrencia&&' ↻'}</span>}
export function PrioridadeBadge({priority}:{priority:number}) {return priority>0?<span className="task-priority" aria-label={`Prioridade ${priority}`}>{'!'.repeat(priority)}</span>:null}
export function ContadorBadge({value}:{value:number}) {return value>0?<span className="task-new-badge" aria-label={`${value} novas`}>{value}</span>:null}

export function TarefaLinha({task,selected,currentUser,onOpen,onComplete,onSnooze,busy=false}:{task:Task;selected:boolean;currentUser:{id:string;name:string};onOpen:()=>void;onComplete:()=>void;onSnooze:()=>void;busy?:boolean}) {
  const startX=useRef(0);
  const [actions,setActions]=useState(false);
  return <div className={`task-row${selected?' selected':''}${task.status==='cancelada'?' cancelled':''}`}
    onTouchStart={e=>{startX.current=e.touches[0].clientX}} onTouchEnd={e=>{const dx=e.changedTouches[0].clientX-startX.current;if(dx < -70)setActions(true);if(dx > 70)setActions(false)}}>
    <button className={`task-check${task.conclusao_pela_origem?' task-origin-action':''}`} disabled={busy||['concluida','cancelada'].includes(task.status)} title={task.conclusao_pela_origem?'Abrir no módulo para resolver':'Concluir tarefa'} aria-label={task.conclusao_pela_origem?'Abrir ação no módulo de origem':'Concluir tarefa'} onClick={onComplete}>{busy?'…':task.status==='concluida'?'✓':task.conclusao_pela_origem?'↗':''}</button>
    <button className="task-row-main" onClick={onOpen}>
      <span className="task-row-title">{task.titulo}</span><span className="task-row-meta"><OrigemBadge task={task}/><StatusBadge status={task.status}/><PrazoBadge task={task}/><PrioridadeBadge priority={task.prioridade}/></span>
    </button><span className="task-avatar" title={task.responsavel_nome|| (task.responsavel_id===currentUser.id?currentUser.name:task.responsavel_id)}>{initials(task.responsavel_nome|| (task.responsavel_id===currentUser.id?currentUser.name:task.responsavel_id))}</span>
    {actions&&<span className="task-swipe-actions"><button onClick={()=>{onSnooze();setActions(false)}}>Adiar</button>{!task.conclusao_pela_origem&&<button onClick={()=>{onComplete();setActions(false)}}>Concluir</button>}</span>}
  </div>;
}
export function TarefaCartao({task,onOpen,onMove}:{task:Task;onOpen:()=>void;onMove:(status:Task['status'])=>void}) {
  return <button className="task-board-card" onClick={onOpen} draggable onDragStart={e=>e.dataTransfer.setData('text/task-id',task.public_id)}
    onKeyDown={e=>{if(e.key==='ArrowRight')onMove('em_andamento')}}>
    <strong>{task.titulo}</strong><span className="task-row-meta"><OrigemBadge task={task}/><PrazoBadge task={task}/><PrioridadeBadge priority={task.prioridade}/></span>
    {task.status==='aguardando'&&task.motivo_status&&<small>{task.motivo_status}</small>}
  </button>;
}

export function TarefaDetalhe({task,currentUser,onClose,onStatus,onComment,onSubtask,onToggleSubtask,onSnooze,busy=false}:{task:Detail;busy?:boolean;currentUser:{id:string;name:string};onClose:()=>void;onStatus:(status:Task['status'],motivo?:string)=>void;onComment:(text:string)=>Promise<boolean>;onSubtask:(text:string)=>Promise<boolean>;onToggleSubtask:(id:number,concluida:boolean)=>void;onSnooze:()=>void}) {
  const [comment,setComment]=useState(''),[sub,setSub]=useState('');
  return <aside className="task-detail" aria-label="Detalhe da tarefa" aria-busy={busy}>
    <div className="task-detail-head"><span>Detalhes</span><button onClick={onClose} aria-label="Fechar detalhe">×</button></div>
    <fieldset className="task-detail-fields" disabled={busy}><div className="task-detail-body"><div className="task-detail-title"><button className="task-check" aria-label={task.conclusao_pela_origem?'Abrir ação no módulo de origem':'Concluir tarefa'} onClick={()=>{if(task.conclusao_pela_origem){if(task.origem_url)openOrigin(task.origem_url)}else onStatus('concluida')}}/><h2>{task.titulo}</h2></div><div className="task-detail-badges"><OrigemBadge task={task}/><StatusBadge status={task.status}/><PrazoBadge task={task}/><PrioridadeBadge priority={task.prioridade}/></div>
      {task.notas&&<p>{task.notas}</p>}
      <label className="task-status-select">Status<select aria-label="Alterar status da tarefa" value={task.status} onChange={event=>onStatus(event.target.value as Task['status'])}>{Object.entries(statusLabels).filter(([key])=>!task.conclusao_pela_origem||key!=='concluida'||task.status==='concluida').map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>{task.conclusao_pela_origem&&<p className="task-origin-help">Esta ação é resolvida no módulo de origem. Use “Abrir no módulo”.</p>}<dl><div><dt>Prazo</dt><dd>{task.prazo?`${dateLabel(task.prazo)} ${hourLabel(task.prazo)}`:'Sem prazo'}</dd></div><div><dt>Responsável</dt><dd>{task.responsavel_nome|| (task.responsavel_id===currentUser.id?currentUser.name:task.responsavel_id)}</dd></div><div><dt>Prioridade</dt><dd>{['Nenhuma','Baixa','Média','Alta'][task.prioridade]}</dd></div></dl>
      {task.origem_url&&<section className="task-linked"><h3>Vinculado a</h3><div className="task-link-card"><span className="task-link-icon" aria-hidden="true">▤</span><strong>{task.origem_rotulo||originLabels[task.origem_modulo]}</strong><a className="task-origin-link" href={originHref(task.origem_url)} target="_top">Abrir no módulo ›</a></div></section>}
      <section><h3>Subtarefas <span>{task.subtarefas.filter(x=>x.concluida).length}/{task.subtarefas.length}</span></h3>{task.subtarefas.map(s=><button className="task-sub" key={s.id} onClick={()=>onToggleSubtask(s.id,!s.concluida)} aria-label={`${s.concluida?'Reabrir':'Concluir'} ${s.titulo}`}><span>{s.concluida?'✓':'○'}</span><span className={s.concluida?'done':''}>{s.titulo}</span></button>)}<form onSubmit={async e=>{e.preventDefault();if(sub.trim()&&await onSubtask(sub))setSub('')}}><input aria-label="Nova subtarefa" placeholder="Adicionar subtarefa" value={sub} onChange={e=>setSub(e.target.value)}/><button type="submit" disabled={!sub.trim()}>Adicionar</button></form></section>
      {task.anexos.length>0&&<section><h3>Anexos</h3>{task.anexos.map(a=><p key={a.id}><a href={`/unificado/qualidade/api/tarefas/${task.public_id}/anexos/${a.id}`}>{a.nome}</a></p>)}</section>}
      <section><h3>Atividade</h3>{task.atividade.map(a=><p className="task-activity" key={a.id}><strong>{a.ator_id||'Sistema'}</strong> · {a.tipo.toLowerCase().replaceAll('_',' ')}<small>{new Date(a.criado_em).toLocaleString('pt-BR')}</small></p>)}</section>
      <section className="task-comments"><h3>Comentários</h3>{task.comentarios.map(c=><p className="task-activity" key={c.id}><strong>{c.autor_id}</strong> · {c.texto}</p>)}<form onSubmit={async e=>{e.preventDefault();if(comment.trim()&&await onComment(comment))setComment('')}}><input aria-label="Novo comentário" placeholder="Comentar…" value={comment} onChange={e=>setComment(e.target.value)}/><button type="submit" disabled={!comment.trim()} aria-label="Enviar comentário">↑</button></form></section>
    </div><div className="task-detail-actions">{task.origem_url&&<a href={originHref(task.origem_url)} target="_top">Abrir no módulo</a>}{!['concluida','cancelada'].includes(task.status)&&<button onClick={onSnooze}>Adiar para amanhã</button>}{!task.conclusao_pela_origem&&task.status!=='concluida'&&task.status!=='cancelada'&&<button onClick={()=>onStatus('concluida')}>Concluir</button>}</div></fieldset>
  </aside>;
}

export function NovaTarefaSheet({unit,user,userName,onClose,onCreated}:{unit:string;user:string;userName?:string;onClose:()=>void;onCreated:(queued:boolean)=>void}) {
  const [title,setTitle]=useState(''),[notes,setNotes]=useState(''),[due,setDue]=useState(''),[priority,setPriority]=useState(0),[responsible,setResponsible]=useState(user),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [reminder,setReminder]=useState(''),[recurrence,setRecurrence]=useState(''),[origin,setOrigin]=useState(''),[originSearch,setOriginSearch]=useState(''),[links,setLinks]=useState<{id:string;rotulo:string;url:string}[]>([]),[linked,setLinked]=useState<{id:string;rotulo:string;url:string}|null>(null);
  const [photo,setPhoto]=useState<File|null>(null);
  const idempotencyKey=useRef(crypto.randomUUID());
  useEffect(()=>{if(origin!=='nc'||originSearch.trim().length<2){setLinks([]);return}const controller=new AbortController();const timer=setTimeout(()=>{void taskRead<{rows:{id:string;rotulo:string;url:string}[]}>(`/tarefas/vinculos/buscar?tipo=nc&q=${encodeURIComponent(originSearch)}`,controller.signal).then(value=>{if(!controller.signal.aborted)setLinks(value.rows)}).catch(()=>{if(!controller.signal.aborted)setLinks([])})},250);return()=>{clearTimeout(timer);controller.abort()}},[origin,originSearch]);
  const save=async(e:React.FormEvent)=>{
    e.preventDefault();setBusy(true);setError('');
    try {
      const payload={titulo:title,notas:notes||null,unidade_codigo:unit,responsavel_id:responsible,
        prioridade:priority,prazo:due?new Date(due).toISOString():null,
        lembrete_em:reminder?new Date(reminder).toISOString():null,recorrencia:recurrence||null,
        chave_idempotencia:idempotencyKey.current,
        ...(linked?{origem_modulo:origin,origem_id:linked.id,origem_rotulo:linked.rotulo,origem_url:linked.url}:{})};
      if(photo&&!navigator.onLine)throw new Error('Conecte-se para enviar a foto com a tarefa.');
      const result=photo
        ? {data:await request<Task>('/tarefas',{method:'POST',body:JSON.stringify(payload)}),queued:false}
        : await requestOrQueue<Task>(user,'/tarefas','POST',payload);
      if(photo&&result.data){const body=new FormData();body.append('file',photo);
        await request(`/tarefas/${result.data.public_id}/anexos?versao=${result.data.versao}`,{method:'POST',body});}
      onCreated(result.queued);onClose();
    }catch(err){setError((err as Error).message)}finally{setBusy(false)}
  };
  return <TaskModal title="Nova tarefa" onClose={onClose} busy={busy}><form className="task-sheet" onSubmit={save} aria-label="Nova tarefa">
    <div className="task-sheet-head"><button type="button" disabled={busy} onClick={onClose}>Cancelar</button><strong>Nova tarefa</strong><button type="submit" disabled={busy||!title.trim()}>{busy?'Salvando…':'Criar tarefa'}</button></div>
    <label>Título<input autoFocus value={title} onChange={e=>setTitle(e.target.value)} maxLength={200} required placeholder="O que precisa ser feito?"/></label>
    <label>Notas<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Adicionar notas"/></label>
    <div className="task-sheet-fields"><label>Prazo<input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)}/></label><label>Prioridade<select value={priority} onChange={e=>setPriority(Number(e.target.value))}><option value={0}>Nenhuma</option><option value={1}>Baixa</option><option value={2}>Média</option><option value={3}>Alta</option></select></label></div>
    <details className="task-advanced"><summary>Mais opções · responsável, lembrete, repetição e anexos</summary><label>Responsável <small>(seu usuário por padrão)</small><input value={responsible} onChange={e=>setResponsible(e.target.value)} required/></label><div className="task-sheet-fields"><label>Lembrete<input type="datetime-local" value={reminder} onChange={e=>setReminder(e.target.value)}/></label><label>Repetir<select value={recurrence} onChange={e=>setRecurrence(e.target.value)}><option value="">Não repetir</option><option value="FREQ=DAILY">Diariamente</option><option value="FREQ=WEEKLY">Semanalmente</option><option value="FREQ=MONTHLY">Mensalmente</option></select></label></div>
    <label>Anexar foto<input type="file" accept="image/*" capture="environment" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></label>
    <fieldset><legend>Vincular a um registro</legend><select aria-label="Tipo de registro" value={origin} onChange={e=>{setOrigin(e.target.value);setLinked(null);setOriginSearch('')}}><option value="">Sem vínculo</option><option value="nc">Não conformidade</option></select>{origin==='nc'&&<><input aria-label="Buscar registro" placeholder="Buscar NC" value={originSearch} onChange={e=>setOriginSearch(e.target.value)}/>{links.map(link=><button type="button" key={link.id} onClick={()=>{setLinked(link);setOriginSearch(link.rotulo);setLinks([])}}>{link.rotulo}</button>)}{linked&&<small>Vinculado a {linked.rotulo}</small>}</>}</fieldset>
    </details><p>Responsável: <strong>{responsible===user?(userName||'Você'):responsible}</strong></p>{error&&<p role="alert" className="task-error">{error}</p>}
  </form></TaskModal>;
}

type NotificationRow = {id:number;tipo:string;titulo:string;corpo:string;url:string;criado_em:string;vista_em:string|null};
const notificationLabels:Record<string,string> = {atribuida:'Tarefa atribuída',mencao:'Menção',comentario:'Comentário',atrasada:'Atrasada',lembrete:'Lembrete',resumo_diario:'Resumo diário'};
function TaskNotifications() {
  const [open,setOpen]=useState(false),[rows,setRows]=useState<NotificationRow[]>([]),[count,setCount]=useState(0);
  const [prefs,setPrefs]=useState<Record<string,boolean>|null>(null),[error,setError]=useState('');
  const [settings,setSettings]=useState(false);
  const refresh=useCallback(async()=>{try{const data=await request<{rows:NotificationRow[];novas:number}>('/tarefas/notificacoes');setRows(data.rows);setCount(data.novas)}catch{/* keep last count */}},[]);
  useEffect(()=>{void refresh();const timer=setInterval(()=>void refresh(),60000);return()=>clearInterval(timer)},[refresh]);
  const toggle=async()=>{setOpen(value=>!value);if(!open){void refresh();try{setPrefs(await request<Record<string,boolean>>('/tarefas/notificacoes/preferencias'))}catch{/* show center */}}};
  const activatePush=async()=>{
    try{
      if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))
        throw new Error('Push não disponível neste dispositivo.');
      const permission=await Notification.requestPermission();
      if(permission!=='granted')throw new Error('Permissão de notificações não concedida.');
      const {public_key}=await request<{public_key:string}>('/tarefas/notificacoes/vapid-key');
      const reg=await navigator.serviceWorker.ready;
      let subscription=await reg.pushManager.getSubscription();
      if(!subscription){const raw=atob(public_key.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-public_key.length%4)%4));
        const key=Uint8Array.from(raw,char=>char.charCodeAt(0));
        subscription=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});}
      await request('/tarefas/notificacoes/subscriptions',{method:'POST',body:JSON.stringify(subscription.toJSON())});
      setError('Avisos no dispositivo ativados.');
    }catch(err){setError((err as Error).message)}
  };
  const updatePreference=async(kind:string,value:boolean)=>{
    if(!prefs)return;const next={...prefs,[kind]:value};setPrefs(next);
    try{await request('/tarefas/notificacoes/preferencias',{method:'PUT',body:JSON.stringify(next)})}
    catch(err){setPrefs(prefs);setError((err as Error).message)}
  };
  return <div className="tasks-notifications">
    <button className="tasks-bell" type="button" aria-label={`Notificações${count?` · ${count} novas`:''}`} aria-expanded={open} onClick={()=>void toggle()}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>{count>0&&<ContadorBadge value={count}/>}</button>
    {open&&<section className="tasks-notifications-panel" aria-label="Notificações de tarefas">
      <header><strong>Notificações</strong><button type="button" onClick={()=>setSettings(value=>!value)} aria-label="Preferências de notificação">⚙</button></header>
      {settings?<div className="tasks-notification-settings"><button type="button" onClick={()=>void activatePush()}>Ativar avisos neste dispositivo</button>{prefs&&Object.entries(notificationLabels).map(([kind,label])=><label key={kind}><input type="checkbox" checked={prefs[kind]??true} onChange={event=>void updatePreference(kind,event.target.checked)}/>{label}</label>)}</div>
        :<div className="tasks-notification-list">{rows.length?rows.map(row=><a key={row.id} className={row.vista_em?'':'unread'} href={row.url} target="_top" onClick={()=>void request(`/tarefas/notificacoes/${row.id}/vista`,{method:'POST'})}><strong>{row.titulo}</strong><span>{row.corpo}</span><small>{new Date(row.criado_em).toLocaleString('pt-BR')}</small></a>):<p>Nenhuma notificação.</p>}</div>}
      {error&&<p role="status" className="tasks-notification-message">{error}</p>}
    </section>}
  </div>;
}

export default function Tasks({ctx,unit,go}:{ctx:Context;unit:string;go:(path:string)=>void}) {
  const [view,setView]=useState<View>('hoje'),[origin,setOrigin]=useState(''),[list,setList]=useState<number|null>(null),[search,setSearch]=useState(''),[mode,setMode]=useState<'lista'|'quadro'>('lista');
  const [rows,setRows]=useState<Task[]>([]),[counts,setCounts]=useState<Counts|null>(null),[lists,setLists]=useState<List[]>([]),[selected,setSelected]=useState<Detail|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[showNew,setShowNew]=useState(false),[toast,setToast]=useState('');
  const [mobileHome,setMobileHome]=useState(false);
  const [querySearch,setQuerySearch]=useState(''),[statusFilter,setStatusFilter]=useState('');
  const [cursor,setCursor]=useState<number|null>(null),[loadingMore,setLoadingMore]=useState(false);
  const [opening,setOpening]=useState<Task|null>(null),[detailError,setDetailError]=useState('');
  const [actionError,setActionError]=useState(''),[busy,setBusy]=useState<Set<string>>(new Set());
  const [showList,setShowList]=useState(false),[listName,setListName]=useState(''),[listBusy,setListBusy]=useState(false);
  const [waiting,setWaiting]=useState<Task|null>(null),[reason,setReason]=useState('');
  const readController=useRef<AbortController|null>(null),detailController=useRef<AbortController|null>(null);
  const pending=useRef(new Set<string>()),pageCache=useRef(new Map<string,{rows:Task[];proximo_cursor?:number|null}>());
  const metadata=useRef<{counts:Counts|null;lists:List[]}>({counts:null,lists:[]});
  const [metaRevision,setMetaRevision]=useState(0);
  const [syncLabel,setSyncLabel]=useState('');
  const [undoTask,setUndoTask]=useState<{task:Task;status:Task['status']}|null>(null);
  const canUse=ctx.user.id==='user-ricardo'||ctx.user.actions.includes('qualidade.tarefas');
  useEffect(()=>{const timer=setTimeout(()=>setQuerySearch(search.trim()),250);return()=>clearTimeout(timer)},[search]);
  useEffect(()=>{
    if(!canUse)return;
    const controller=new AbortController();
    void Promise.allSettled([taskRead<Counts>('/tarefas/contadores',controller.signal),taskRead<{rows:List[]}>('/tarefas/listas',controller.signal)]).then(([summary,myLists])=>{
      if(controller.signal.aborted)return;
      if(summary.status==='fulfilled'){setCounts(summary.value);metadata.current.counts=summary.value}
      if(myLists.status==='fulfilled'){setLists(myLists.value.rows);metadata.current.lists=myLists.value.rows}
    });
    return()=>controller.abort();
  },[canUse,ctx.user.id,metaRevision]);
  const query=useMemo(()=>{
    const params=new URLSearchParams({visao:view});
    if(origin)params.set('origem',origin);
    if(list)params.set('lista_id',String(list));
    if(querySearch)params.set('busca',querySearch);
    if(statusFilter)params.set('status',statusFilter);
    return params.toString();
  },[view,origin,list,querySearch,statusFilter]);
  const load=useCallback(async()=>{
    if(!canUse)return;
    readController.current?.abort();const controller=new AbortController();readController.current=controller;
    setLoading(true);setLoadingMore(false);setError('');
    const cacheKey=query,cached=pageCache.current.get(cacheKey);
    setRows(cached?.rows||[]);setCursor(cached?.proximo_cursor??null);
    try{
      const tasks=await taskRead<{rows:Task[];proximo_cursor?:number|null}>(`/tarefas?${query}`,controller.signal);
      if(controller.signal.aborted)return;
      setRows(tasks.rows);setCursor(tasks.proximo_cursor??null);pageCache.current.set(cacheKey,tasks);
      void saveTaskSnapshot(ctx.user.id,cacheKey,{...tasks,...metadata.current}).catch(()=>{});
    }catch(err){
      if(controller.signal.aborted)return;
      if(err instanceof ApiError){setError(err.message)}
      else try{
        const cached=await loadTaskSnapshot<{rows:Task[];counts:Counts|null;lists:List[];proximo_cursor?:number|null}>(ctx.user.id,cacheKey);
        if(controller.signal.aborted)return;
        if(!cached){setError('Sem conexão e sem dados salvos para esta visão.');}
        else{
          setRows(cached.value.rows);setCursor(cached.value.proximo_cursor??null);if(cached.value.counts)setCounts(cached.value.counts);if(cached.value.lists?.length)setLists(cached.value.lists);
          setSyncLabel(`Sem conexão · dados de ${new Date(cached.updatedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`);
        }
      }catch{setError((err as Error).message)}
    }finally{if(!controller.signal.aborted)setLoading(false)}
  },[query,canUse,ctx.user.id]);
  const closeDetail=useCallback(()=>{detailController.current?.abort();setSelected(null);setOpening(null);setDetailError('')},[]);
  useEffect(()=>()=>detailController.current?.abort(),[]);
  useEffect(()=>{closeDetail();void load();return()=>readController.current?.abort()},[load,closeDetail]);
  useEffect(()=>{const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!showNew&&!waiting&&!showList)closeDetail()};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)},[showNew,waiting,showList,closeDetail]);
  const open=async(task:Task)=>{
    detailController.current?.abort();const controller=new AbortController();detailController.current=controller;
    setOpening(task);setSelected(null);setDetailError('');
    try{const value=await taskRead<Detail>(`/tarefas/${task.public_id}`,controller.signal);if(controller.signal.aborted)return;setSelected(value);setOpening(null);void request(`/tarefas/${task.public_id}/vista`,{method:'POST'}).catch(()=>{})}
    catch(err){if(!controller.signal.aborted)setDetailError((err as Error).message)}
  };
  const loadMore=async()=>{
    if(cursor===null||loadingMore||loading)return;
    const controller=readController.current;setLoadingMore(true);
    try{
      const next=await taskRead<{rows:Task[];proximo_cursor?:number|null}>(`/tarefas?${query}&cursor=${cursor}`,controller?.signal);
      if(controller?.signal.aborted)return;
      setRows(old=>{const unique=new Map(old.map(task=>[task.public_id,task]));next.rows.forEach(task=>unique.set(task.public_id,task));const page={rows:[...unique.values()],proximo_cursor:next.proximo_cursor};pageCache.current.set(query,page);void saveTaskSnapshot(ctx.user.id,query,{...page,...metadata.current}).catch(()=>{});return page.rows});setCursor(next.proximo_cursor??null);
    }catch(err){if(!controller?.signal.aborted)setError((err as Error).message)}finally{if(!controller?.signal.aborted)setLoadingMore(false)}
  };
  const loadRef=useRef(load);
  loadRef.current=load;
  useEffect(()=>{
    const synchronize=async()=>{
      try {
        const result=await syncPending(ctx.user.id);
        if(result.conflicts)setToast(`${result.conflicts} alteração não sincronizada: o servidor tinha uma versão mais recente.`);
        else if(result.sent)setToast(`${result.sent} alteração sincronizada${result.sent===1?'':'s'}.`);
        setSyncLabel(result.remaining?`${result.remaining} pendente${result.remaining===1?'':'s'} para sincronizar`:
          `Sincronizado às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`);
        if(result.sent||result.conflicts){pageCache.current.clear();setMetaRevision(value=>value+1);void loadRef.current();}
      }catch{setSyncLabel('Sem conexão');}
    };
    void synchronize();window.addEventListener('online',synchronize);
    return()=>window.removeEventListener('online',synchronize);
  },[ctx.user.id]);
  const mutate=async(task:Task,path:string,payload:Record<string,unknown>)=>{
    if(pending.current.has(task.public_id))return null;
    pending.current.add(task.public_id);setBusy(new Set(pending.current));setActionError('');
    try {
      if(task.conclusao_pela_origem&&path==='/status'&&payload.status==='concluida')
        throw new Error('Conclua a ação no módulo de origem.');
      const result=await requestOrQueue<Task>(ctx.user.id,`/tarefas/${task.public_id}${path}`,'POST',
        {versao:task.versao,...payload});
      pageCache.current.clear();
      if(result.queued){
        const changed={...task,...(path==='/status'?{status:payload.status as Task['status']}:
          path==='/adiar'?{prazo:new Date(Date.now()+86400000).toISOString()}:{} )};
        setRows(old=>old.map(row=>row.public_id===task.public_id?changed:row).filter(row=>view==='todas'||view==='concluidas'||!['concluida','cancelada'].includes(row.status)));
        setToast('Alteração salva sem conexão. Será sincronizada ao reconectar.');
        setSyncLabel(`${await queuedCount(ctx.user.id)} pendente(s) para sincronizar`);
        if(selected?.public_id===task.public_id)closeDetail();
        if(waiting?.public_id===task.public_id)setWaiting(null);
        return null;
      }
      const changed=result.data!;
      setRows(old=>old.map(row=>row.public_id===task.public_id?changed:row));
      if(selected?.public_id===task.public_id)void open(changed);
      setMetaRevision(value=>value+1);void load();return changed;
    }catch(err){setActionError((err as Error).message);pageCache.current.clear();void load();return null}
    finally{pending.current.delete(task.public_id);setBusy(new Set(pending.current))}
  };
  const complete=async(task:Task)=>{
    if(pending.current.has(task.public_id)||['concluida','cancelada'].includes(task.status))return;
    if(task.conclusao_pela_origem){if(task.origem_url)openOrigin(task.origem_url);else void open(task);return}
    const result=mutate(task,'/status',{status:'concluida'});
    const changed=await result;
    if(changed){setUndoTask({task:changed,status:task.status});setToast('Tarefa concluída.');}
  };
  useEffect(()=>{if(toast!=='Tarefa concluída.')setUndoTask(null);if(!toast)return;const timer=setTimeout(()=>{setToast('');setUndoTask(null)},7000);return()=>clearTimeout(timer)},[toast]);
  const move=(task:Task,status:Task['status'])=>{if(status==='aguardando'){setWaiting(task);setReason('');return}if(status==='concluida'&&task.conclusao_pela_origem){void open(task);return}void mutate(task,'/status',{status})};
  const createList=async(event:React.FormEvent)=>{event.preventDefault();if(listBusy||!listName.trim())return;setListBusy(true);setActionError('');try{await request('/tarefas/listas',{method:'POST',body:JSON.stringify({nome:listName.trim(),cor:'#007AFF'})});setMetaRevision(value=>value+1);setShowList(false);setToast('Lista criada.')}catch(err){setActionError((err as Error).message)}finally{setListBusy(false)}};
  const clearFilters=()=>{setSearch('');setQuerySearch('');setOrigin('');setList(null);setStatusFilter('')};
  const detailWrite=async(path:string,payload:Record<string,unknown>,method:'POST'|'PATCH'='POST'):Promise<boolean>=>{
    if(!selected||pending.current.has(selected.public_id))return false;
    const task=selected;pending.current.add(task.public_id);setBusy(new Set(pending.current));setActionError('');
    try{
      const result=await requestOrQueue(ctx.user.id,`/tarefas/${task.public_id}${path}`,method,{versao:task.versao,...payload});
      if(result.queued){setToast('Alteração salva sem conexão. Será sincronizada ao reconectar.');setSyncLabel(`${await queuedCount(ctx.user.id)} pendente(s) para sincronizar`);closeDetail()}
      else {void open(task);pageCache.current.clear();setMetaRevision(value=>value+1);void load()}
      return true;
    }catch(err){setActionError((err as Error).message);return false}
    finally{pending.current.delete(task.public_id);setBusy(new Set(pending.current))}
  };
  const today=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  const grouped=useMemo(()=>({atrasadas:rows.filter(isLate),rest:rows.filter(x=>!isLate(x))}),[rows]);
  if(!canUse)return <div className="tasks-denied"><h1>Tarefas</h1><p>Acesso ainda não liberado para este usuário.</p><button onClick={()=>go('/')}>Voltar para Qualidade</button></div>;
  return <div className={`tasks-app tasks-fluid${selected||opening?'':' tasks-no-detail'}${mobileHome?' mobile-home':''}`}>

    <aside className="tasks-sidebar" aria-label="Navegação de tarefas"><div className="tasks-crumb">Organização do trabalho</div><h2>Tarefas</h2>
      <div className="tasks-smart">{smartViews.map((key,i)=><button key={key} className={view===key?'active':''} onClick={()=>{setView(key);setOrigin('');setList(null);setStatusFilter('')}}><span className={`tasks-smart-icon smart-${key}`}>{['☼','◷','▦','☷'][i]}</span><b>{counts?.[key]??'—'}</b><span>{countLabels[key]}</span></button>)}</div>
      <h3>Origem</h3><nav>{Object.entries(originLabels).map(([key,name])=><button key={key} className={origin===key?'active':''} onClick={()=>{setOrigin(key);setList(null);setView('todas');setStatusFilter('')}}><span className={`task-origin task-origin-${originClass[key]}`}>{name.slice(0,2)}</span>{name}<span className="tasks-nav-count">{counts?.origens[key]||0}</span></button>)}</nav>
      <h3>Minhas listas</h3><nav>{lists.map(item=><button key={item.id} className={list===item.id?'active':''} onClick={()=>{setList(item.id);setOrigin('');setView('todas');setStatusFilter('')}}><span className="tasks-list-dot" style={{background:item.cor}}/>{item.nome}<span className="tasks-nav-count">{counts?.listas[String(item.id)]||0}</span></button>)}</nav>
      <button className="tasks-add-list" onClick={()=>{setListName('');setActionError('');setShowList(true)}}>＋ Nova lista</button>
    </aside>
    {mobileHome&&<section className="tasks-mobile-home" aria-label="Início de Tarefas"><div className="tasks-mobile-home-top"><button onClick={()=>go('/')}>‹ Qualidade</button><button aria-label="Mais opções" onClick={()=>{setMobileHome(false);setView('todas');setStatusFilter('')}}>···</button></div><h1>Tarefas</h1><p>Escolha uma visão para acompanhar suas tarefas.</p><div className="tasks-mobile-smart">{smartViews.map((key,i)=><button key={key} onClick={()=>{setView(key);setOrigin('');setList(null);setStatusFilter('');setMobileHome(false)}}><span className={`tasks-smart-icon smart-${key}`}>{['☼','◷','▦','☷'][i]}</span><b>{counts?.[key]??'—'}</b><span>{countLabels[key]}</span></button>)}</div><h2>Origem</h2><nav className="tasks-mobile-origin">{Object.entries(originLabels).map(([key,name])=><button key={key} onClick={()=>{setOrigin(key);setList(null);setView('todas');setStatusFilter('');setMobileHome(false)}}><span className={`task-origin task-origin-${originClass[key]}`}>{name.slice(0,2)}</span><span>{key==='ged'?'Documentos (GED)':name}</span><span className="tasks-nav-count">{counts?.origens[key]||0}</span></button>)}</nav><h2>Minhas listas</h2><nav className="tasks-mobile-lists">{lists.map(item=><button key={item.id} onClick={()=>{setList(item.id);setOrigin('');setView('todas');setStatusFilter('');setMobileHome(false)}}><span className="tasks-list-dot" style={{background:item.cor}}/>{item.nome}<span className="tasks-nav-count">{counts?.listas[String(item.id)]||0}</span></button>)}</nav></section>}
    <main className="tasks-center"><div className="tasks-mobile-top"><button onClick={()=>{setMobileHome(true);closeDetail()}}>‹ Visões e listas</button><button aria-label="Mais opções" onClick={()=>{setView('todas');setStatusFilter('')}}>···</button></div>
      <header className="tasks-title"><div><h1>{origin?originLabels[origin]:list?lists.find(x=>x.id===list)?.nome:countLabels[view]}</h1><p>{today} · {rows.length} tarefa{rows.length===1?'':'s'}{cursor!==null?' carregadas':''}</p></div><TaskNotifications/><button className="tasks-new" onClick={()=>setShowNew(true)}>＋ Nova tarefa</button></header>
      <div className="tasks-controls">
        <label className="tasks-main-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Buscar tarefas" placeholder="Buscar pelo título ou pelas notas" value={search} onChange={event=>setSearch(event.target.value)}/>{search&&<button aria-label="Limpar busca" onClick={()=>setSearch('')}>×</button>}</label>
        <div className="tasks-filter-row"><label>Visão<select aria-label="Visão de tarefas" value={view} onChange={event=>{setView(event.target.value as View);setStatusFilter('')}}>{Object.entries(countLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
          <label>Módulo<select aria-label="Filtrar por módulo" value={origin} onChange={event=>{setOrigin(event.target.value);setList(null)}}><option value="">Todos os módulos</option>{Object.entries(originLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
          {lists.length>0&&<label>Lista<select aria-label="Filtrar por lista" value={list??''} onChange={event=>setList(event.target.value?Number(event.target.value):null)}><option value="">Todas as listas</option>{lists.map(item=><option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>}
          <label>Status<select aria-label="Filtrar por status" value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option value="">Todos os status</option>{Object.entries(statusLabels).filter(([key])=>view==='todas'||(view==='concluidas'?key==='concluida':!['concluida','cancelada'].includes(key))).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        </div>
      </div>
      <div className="tasks-toolbar"><div className="tasks-segment"><button className={mode==='lista'?'active':''} aria-pressed={mode==='lista'} onClick={()=>setMode('lista')}>Lista</button><button className={mode==='quadro'?'active':''} aria-pressed={mode==='quadro'} onClick={()=>setMode('quadro')}>Quadro</button></div><div className="tasks-toolbar-actions">{(search||origin||list||statusFilter)&&<button onClick={clearFilters}>Limpar filtros</button>}<button disabled={loading} onClick={()=>{setMetaRevision(value=>value+1);void load()}}>↻ Atualizar</button></div></div>
      {loading&&rows.length>0&&<p className="tasks-refreshing" role="status">Atualizando tarefas…</p>}
      {actionError&&<p className="task-error" role="alert">{actionError}<button aria-label="Fechar aviso" onClick={()=>setActionError('')}>×</button></p>}
      {syncLabel&&<p className="tasks-sync" role="status">{syncLabel}</p>}{error&&<p className="task-error" role="alert">{error}<button onClick={()=>void load()}>Tentar novamente</button></p>}{loading&&rows.length===0?<div className="tasks-skeleton" role="status" aria-label="Carregando tarefas">Carregando tarefas…</div>:rows.length===0?<div className="tasks-empty"><span aria-hidden="true">✓</span><h2>{search||origin||list||statusFilter?'Nenhuma tarefa com estes filtros':view==='hoje'?'Tudo em dia por aqui':'Nenhuma tarefa nesta visão'}</h2><p>{search||origin||list||statusFilter?'Tente outro termo ou remova os filtros.':'As tarefas desta visão aparecerão aqui.'}</p>{(search||origin||list||statusFilter)?<button onClick={clearFilters}>Limpar filtros</button>:<button onClick={()=>setShowNew(true)}>Criar tarefa</button>}</div>:mode==='lista'?<div className="tasks-rows">
        {grouped.atrasadas.length>0&&<><h2 className="tasks-overdue-heading">Atrasadas <span>{grouped.atrasadas.length}</span></h2>{grouped.atrasadas.map(task=><TarefaLinha key={task.public_id} task={task} currentUser={ctx.user} selected={(selected||opening)?.public_id===task.public_id} busy={busy.has(task.public_id)} onOpen={()=>void open(task)} onComplete={()=>complete(task)} onSnooze={()=>void mutate(task,'/adiar',{opcao:'amanha'})}/>)}</>}
        {grouped.rest.length>0&&<><h2>{origin||list||search?'Resultados':countLabels[view]} <span>{grouped.rest.length}</span></h2>{grouped.rest.map(task=><TarefaLinha key={task.public_id} task={task} currentUser={ctx.user} selected={(selected||opening)?.public_id===task.public_id} busy={busy.has(task.public_id)} onOpen={()=>void open(task)} onComplete={()=>complete(task)} onSnooze={()=>void mutate(task,'/adiar',{opcao:'amanha'})}/>)}</>}
        {view==='hoje'&&<button className="tasks-completed-link" onClick={()=>setView('concluidas')}>› &nbsp; Concluídas hoje · {counts?.concluidas_hoje??0}</button>}
        <button className="tasks-add-row" onClick={()=>setShowNew(true)}>⊕ &nbsp; Adicionar tarefa</button>
      </div>:<div className="tasks-board">{(['a_fazer','em_andamento','aguardando','concluida'] as Task['status'][]).map(status=><section key={status} onDragOver={e=>e.preventDefault()} onDrop={e=>{const id=e.dataTransfer.getData('text/task-id');const task=rows.find(x=>x.public_id===id);if(task)move(task,status)}}><h2>{statusLabels[status]} <span>{rows.filter(x=>x.status===status).length}</span></h2>{rows.filter(x=>x.status===status).map(task=><TarefaCartao key={task.public_id} task={task} onOpen={()=>void open(task)} onMove={s=>move(task,s)}/>)}</section>)}</div>}
      {cursor!==null&&<button className="tasks-load-more" disabled={loadingMore||loading} onClick={()=>void loadMore()}>{loadingMore?'Carregando mais…':'Carregar mais tarefas'}</button>}
    </main>
    {opening&&<aside className="task-detail task-detail-loading" aria-label="Detalhe da tarefa" aria-busy={!detailError}><div className="task-detail-head"><span>Detalhes</span><button aria-label="Fechar detalhe" onClick={closeDetail}>×</button></div><div className="task-detail-body"><h2>{opening.titulo}</h2>{detailError?<div role="alert"><p>{detailError}</p><button onClick={()=>void open(opening)}>Tentar novamente</button></div>:<p role="status">Carregando detalhes…</p>}</div></aside>}
    {selected&&<TarefaDetalhe task={selected} currentUser={ctx.user} busy={busy.has(selected.public_id)} onClose={closeDetail} onStatus={status=>move(selected,status)} onSnooze={()=>void mutate(selected,'/adiar',{opcao:'amanha'})} onComment={text=>detailWrite('/comentarios',{texto:text})} onSubtask={text=>detailWrite('/subtarefas',{titulo:text})} onToggleSubtask={(id,concluida)=>{void detailWrite(`/subtarefas/${id}`,{concluida},'PATCH')}}/>}
    {showNew&&<NovaTarefaSheet unit={unit} user={ctx.user.id} userName={ctx.user.name} onClose={()=>setShowNew(false)} onCreated={queued=>{if(queued){setToast('Tarefa salva sem conexão. Será sincronizada ao reconectar.');void queuedCount(ctx.user.id).then(n=>setSyncLabel(`${n} pendente(s) para sincronizar`))}else {setMetaRevision(value=>value+1);pageCache.current.clear();void load()}}}/> }
    {showList&&<TaskModal title="Nova lista" onClose={()=>setShowList(false)} busy={listBusy}><form className="task-sheet task-small-sheet" onSubmit={event=>void createList(event)}><h2>Nova lista</h2><label>Nome da lista<input autoFocus required maxLength={100} value={listName} onChange={event=>setListName(event.target.value)} placeholder="Ex.: Pendências da semana"/></label>{actionError&&<p role="alert">{actionError}</p>}<div className="task-modal-actions"><button type="button" disabled={listBusy} onClick={()=>setShowList(false)}>Cancelar</button><button disabled={listBusy||!listName.trim()}>{listBusy?'Criando…':'Criar lista'}</button></div></form></TaskModal>}
    {waiting&&<TaskModal title="Aguardar tarefa" onClose={()=>setWaiting(null)} busy={busy.has(waiting.public_id)}><form className="task-sheet task-small-sheet" onSubmit={async event=>{event.preventDefault();if(!reason.trim()||busy.has(waiting.public_id))return;const changed=await mutate(waiting,'/status',{status:'aguardando',motivo:reason.trim()});if(changed)setWaiting(null)}}><h2>Colocar em espera</h2><p>{waiting.titulo}</p><label>O que falta para continuar?<textarea autoFocus required value={reason} onChange={event=>setReason(event.target.value)}/></label>{actionError&&<p role="alert">{actionError}</p>}<div className="task-modal-actions"><button type="button" disabled={busy.has(waiting.public_id)} onClick={()=>setWaiting(null)}>Cancelar</button><button disabled={busy.has(waiting.public_id)||!reason.trim()}>Confirmar espera</button></div></form></TaskModal>}
    {toast&&<div className="tasks-toast" role="status">{toast}{undoTask&&<button onClick={()=>{const previous=undoTask;setUndoTask(null);setToast('');void mutate(previous.task,'/status',{status:previous.status})}}>Desfazer</button>}<button aria-label="Fechar mensagem" onClick={()=>setToast('')}>×</button></div>}
    <div className="tasks-mobile-footer"><button onClick={()=>setShowNew(true)}>⊕ Nova tarefa</button>{mobileHome?<button onClick={()=>{setListName('');setActionError('');setShowList(true)}}>Adicionar lista</button>:<button onClick={()=>{setMobileHome(true);closeDetail()}}>Visões e listas</button>}</div>
  </div>;
}

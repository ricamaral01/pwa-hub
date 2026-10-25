import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { can, Catalogs, Context, Detail, Nc, patch, post, put, request, API } from './api';
import './style.css';
import PoleResults from './PoleResults';

const steps = ['REGISTRADA', 'CONTENCAO', 'ANALISE_CAUSA', 'PLANO_ACAO', 'VERIFICACAO_EFICACIA', 'ENCERRAMENTO', 'ENCERRADA'];
const labels: Record<string, string> = { RASCUNHO: 'Rascunho', REGISTRADA: 'Registrada', CONTENCAO: 'Contenção', ANALISE_CAUSA: 'Análise de causa', PLANO_ACAO: 'Plano de ação', VERIFICACAO_EFICACIA: 'Verificação de eficácia', ENCERRAMENTO: 'Encerramento', ENCERRADA: 'Encerrada', CANCELADA: 'Cancelada' };
const detailFieldNames = { impacto:'Impacto', evidencias_texto:'Evidências', processo_texto:'Processo', fornecedor_texto:'Fornecedor', cliente_texto:'Cliente', pedido_texto:'Pedido' };
const actionTypeNames: Record<string,string> = { CONTENCAO:'Contenção', CORRETIVA_IMEDIATA:'Correção imediata', CORRETIVA:'Corretiva', PREVENTIVA:'Preventiva' };
const eventNames: Record<string,string> = { RASCUNHO:'Rascunho', REGISTRO:'Registro', TRIAR:'Triagem', CONTENCAO:'Contenção', CONCESSAO_APROVADA:'Concessão aprovada', CAUSA_EDITADA:'Causa editada', ACAO_CRIADA:'Ação criada', ACAO_CONCLUIDA:'Ação concluída', ACAO_EDITADA:'Ação editada', ACAO_CANCELADA:'Ação cancelada', EFICACIA:'Verificação de eficácia', ACOMPANHAMENTO_EFICACIA:'Acompanhamento da eficácia', NOVA_RNC_VINCULADA:'Nova RNC vinculada', NUMERO_RENOMEADO:'Número renumerado', FORMULARIO_ATUALIZADO:'Formulário atualizado', ENCERRAMENTO_PREPARADO:'Encerramento preparado', ENCERRAR:'Encerramento', COMENTARIO:'Comentário', VINCULO:'Vínculo', DOCUMENTO_REF:'Documento de referência', ANEXO:'Anexo', IMPORTACAO:'Importação', PENDENCIA_CLIENTE:'Pendência de comunicação ao cliente', CLIENTE_NOTIFICADO:'Cliente notificado' };
const dateBR = (value: string | null | undefined) => value ? (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : new Date(value).toLocaleDateString('pt-BR')) : '—';
const q = (values: Record<string, string | undefined>) => new URLSearchParams(Object.entries(values).filter((x): x is [string, string] => Boolean(x[1]))).toString();

function App() {
  const embedded = window.self !== window.top;
  const [ctx, setCtx] = useState<Context | null>(null);
  const [error, setError] = useState('');
  const [path, setPath] = useState(location.pathname.replace('/unificado/qualidade', '') || '/');
  const [unit, setUnit] = useState('');
  useEffect(() => {
    request<Context>('/contexto').then(value => { setCtx(value); setUnit(value.active_unit || value.last_unit || value.units[0]?.codigo || ''); }).catch(err => setError(err.message));
    const pop = () => setPath(location.pathname.replace('/unificado/qualidade', '') || '/');
    addEventListener('popstate', pop); return () => removeEventListener('popstate', pop);
  }, []);
  const go = (to: string) => { history.pushState({}, '', `/unificado/qualidade${to}`); setPath(to); scrollTo(0, 0); };
  if (error && !ctx) return <main className="solo"><h1>Qualidade</h1><p role="alert">{error}</p><a href="/unificado/">Voltar ao Unificado</a></main>;
  if (!ctx) return <main className="solo">Carregando Qualidade…</main>;
  const company = ctx.units.find(x => x.codigo === unit)?.empresa_id || ctx.companies[0]?.id || '';
  const unitControl = <label className="unit-select">Unidade <select value={unit} onChange={e => setUnit(e.target.value)}>{ctx.units.map(x => <option value={x.codigo} key={x.codigo}>{x.nome}</option>)}</select></label>;
  return <div className={`quality-app${embedded ? ' embedded' : ''}`}>
    {!embedded && <header className="top"><a href="/unificado/" className="brand"><span className="mark">C</span><span>ConcreTrack <small>· Qualidade</small></span></a><span>{ctx.user.name}</span></header>}
    <div className="body">{!embedded && <nav className="rail" aria-label="Qualidade"><button onClick={() => go('/')}>Não conformidades</button><button onClick={() => go('/abrir')}>Abrir RNC</button><button onClick={() => go('/resultados-bancada')}>Resultados de bancada</button>{can(ctx, 'qualidade.nc.cadastros') && <button onClick={() => go('/cadastros')}>Cadastros</button>}<a href="/unificado/">← Unificado</a></nav>}
      <main className="content">
        {path === '/' ? <Dashboard ctx={ctx} unit={unit} company={company} go={go} unitControl={unitControl}/> : path === '/abrir' ? <Opening ctx={ctx} unit={unit} company={company} go={go} unitControl={unitControl}/> : path === '/resultados-bancada' ? <PoleResults go={go}/> : path.startsWith('/nc/') ? <Treatment ctx={ctx} id={path.slice(4)} go={go} unitControl={unitControl}/> : path === '/cadastros' ? <CatalogPage ctx={ctx} company={company} unit={unit} unitControl={unitControl}/> : <p>Página não encontrada.</p>}
      </main>
    </div>
  </div>;
}

function Dashboard({ ctx, unit, company, go, unitControl }: { ctx: Context; unit: string; company: string; go: (path: string) => void; unitControl: React.ReactNode }) {
  const [rows, setRows] = useState<Nc[]>([]), [summary, setSummary] = useState<{ abertas: number; em_atraso: number; aguardando_eficacia: number; minhas_pendencias: Nc[]; reincidentes_12_meses: number } | null>(null);
  const [filter, setFilter] = useState('abertas'), [search, setSearch] = useState(''), [error, setError] = useState('');
  useEffect(() => { if (!company) return; Promise.all([request<{items: Nc[]}>(`/nc?${q({ company, unit })}`), request<typeof summary>(`/painel?${q({ company, unit })}`)]).then(([list, panel]) => { setRows(list.items); setSummary(panel); }).catch(err => setError(err.message)); }, [company, unit]);
  const filtered = rows.filter(n => (filter === 'abertas' ? !['ENCERRADA','CANCELADA','RASCUNHO'].includes(n.status) : filter === 'minhas' ? summary?.minhas_pendencias.some(x => x.id === n.id) : filter === 'atraso' ? n.em_atraso : filter === 'eficacia' ? n.status === 'VERIFICACAO_EFICACIA' : true) && `${n.numero} ${n.titulo}`.toLowerCase().includes(search.toLowerCase()));
  return <><div className="heading"><div><small>Qualidade · ISO 9001 · 8.7 e 10.2</small><h1>RNCs · Não conformidades</h1></div><div className="heading-actions">{unitControl}{can(ctx, 'qualidade.nc.abrir') && <button className="primary" onClick={() => go('/abrir')}>+ Abrir RNC</button>}</div></div>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="kpis">{[['Abertas', summary?.abertas], ['Em atraso', summary?.em_atraso], ['Aguardando eficácia', summary?.aguardando_eficacia], ['Reincidentes · 12 meses', summary?.reincidentes_12_meses]].map(([label, value]) => <div className="card kpi" key={label}><span>{label}</span><strong>{value ?? '—'}</strong></div>)}</div>
    <div className="filters">{[['abertas','Todas abertas'],['minhas','Minhas pendências'],['atraso','Em atraso'],['eficacia','Aguardando eficácia'],['todas','Todas']].map(([key, label]) => <button key={key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{label}</button>)}<input aria-label="Buscar RNC" placeholder="Buscar número ou título" value={search} onChange={e => setSearch(e.target.value)}/></div>
    <div className="card table-wrap dashboard-table"><table><thead><tr><th>RNC</th><th>Unidade</th><th>Etapa</th><th>Responsável</th><th>Prazo</th></tr></thead><tbody>{filtered.map(n => <tr key={n.id} onClick={() => go(`/nc/${n.id}`)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && go(`/nc/${n.id}`)}><td data-label="RNC"><strong>{n.numero || 'Número gerado ao registrar'}</strong><br/>{n.titulo}{n.legado && <span className="badge">Migrada do GED</span>}</td><td data-label="Unidade">{n.unidade_codigo}</td><td data-label="Etapa"><span className="status">{labels[n.status]}</span><div className="progress"><span style={{width:`${Math.max(0, steps.indexOf(n.status)) / (steps.length - 1) * 100}%`}}/></div></td><td data-label="Responsável">{n.responsavel_id || '—'}</td><td data-label="Prazo" className={n.em_atraso ? 'late' : ''}>{dateBR(n.prazo_final)}</td></tr>)}</tbody></table>{!filtered.length && <p className="empty">Nenhuma RNC encontrada para este filtro.</p>}</div>
  </>;
}

function Opening({ ctx, unit, company, go, unitControl }: { ctx: Context; unit: string; company: string; go: (path: string) => void; unitControl: React.ReactNode }) {
  const [catalog, setCatalog] = useState<Catalogs | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [pcpSectors, setPcpSectors] = useState<{id:string;codigo:string;nome:string}[]>([]);
  const [pcpProducts, setPcpProducts] = useState<{id:string;codigo:string;nome:string;setor_id:string|null}[]>([]);
  const lab = new URLSearchParams(location.search);
  const fromLab = lab.get('lab_ensaio');
  const [form, setForm] = useState({ titulo: fromLab ? `Ensaio de laboratório reprovado · amostra ${lab.get('amostra') || ''}` : '', descricao: fromLab ? `Ensaio ${fromLab} reprovado. ${lab.get('produto') || ''}` : '', origem_id:'', tipo_id:'', gravidade_id:'', area_emissora_id:'', local_id:'', atividade_id:'', emitente_nome:ctx.user.name, data_emissao:new Date().toISOString().slice(0,10), identificacao_texto:'', numero_anterior_texto:'', requisito_texto:'', envolvidos_funcoes:'', causas_provaveis:'', equipe_texto:'', sistematica_adequada:false, sistematica_seguida:false, poka_yoke_possivel:false, alterar_documentos:false, documentos_alterar_texto:'', verificar_eficacia_a_partir:'', setor_pcp_id:'', produto_pcp_id:'', produto_texto:lab.get('produto') || '', lote_texto:lab.get('lote') || '', data_deteccao:new Date().toISOString().slice(0,16), cliente_afetado:false, impacto:'', evidencias_texto:'', processo_texto:'', fornecedor_texto:'', cliente_texto:'', pedido_texto:'', data_ocorrencia:'' });
  const [photo, setPhoto] = useState<File | null>(null), [mobile, setMobile] = useState(false);
  useEffect(() => { if (company && unit) request<Catalogs>(`/catalogos?${q({ company, unit })}`).then(value => { setCatalog(value); if (fromLab) { const origin = value.origem.find(x => x.codigo === 'ENSAIO_LABORATORIO'); if (origin) setForm(f => ({...f, origem_id:origin.id})); } }).catch(err => setError(err.message)); }, [company, unit]);
  useEffect(() => { Promise.all([request<typeof pcpSectors>('/integracoes/pcp/setores'), request<typeof pcpProducts>('/integracoes/pcp/produtos')]).then(([sectors, products]) => { setPcpSectors(sectors); setPcpProducts(products); if (fromLab) { const product = lab.get('produto') || ''; const match = products.find(x => x.codigo === product || x.nome === product); if (match) setForm(f => ({...f, setor_pcp_id:match.setor_id || '', produto_pcp_id:match.id})); } }).catch(err => setError(err.message)); }, []);
  const set = (key: keyof typeof form, value: string | boolean) => setForm(f => ({ ...f, [key]: value }));
  async function save(register: boolean) {
    setBusy(true); setError('');
    try {
      const payload = { ...form, empresa_id: company, unidade_codigo: unit, origem_id: form.origem_id || null, tipo_id: form.tipo_id || null, gravidade_id: form.gravidade_id || null, area_emissora_id: form.area_emissora_id || null, local_id:form.local_id || null, atividade_id:form.atividade_id || null, setor_pcp_id: form.setor_pcp_id || null, produto_pcp_id: form.produto_pcp_id || null, data_deteccao: form.data_deteccao ? new Date(form.data_deteccao).toISOString() : null, data_ocorrencia: form.data_ocorrencia ? new Date(form.data_ocorrencia).toISOString() : null, verificar_eficacia_a_partir:form.verificar_eficacia_a_partir || null };
      const draft = await post<{id: string}>('/nc/rascunhos', payload);
      if (register) await post(`/nc/${draft.id}/registrar`, { mobile });
      if (photo) { const body = new FormData(); body.append('file', photo); await request(`/nc/${draft.id}/anexos`, { method:'POST', body }); }
      go(`/nc/${draft.id}`);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  return <><button className="back" onClick={() => go('/')}>← RNCs</button><div className="heading"><div><h1>Nova RNC</h1><small>Número sorteado ao registrar · {ctx.user.name}</small></div><div className="heading-actions">{unitControl}</div></div>
    <div className="mode"><button className={!mobile ? 'selected' : ''} onClick={() => setMobile(false)}>Abertura completa</button><button className={mobile ? 'selected' : ''} onClick={() => setMobile(true)}>Abertura rápida</button></div>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="form-grid"><div className="form-main">
      <section className="card"><h2>1 · O que aconteceu?</h2>{!mobile && <><label>Título<input value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Descreva a ocorrência em uma linha"/></label><label>Origem<select value={form.origem_id} onChange={e => set('origem_id', e.target.value)}><option value="">Selecione</option>{catalog?.origem.map(x => <option value={x.id} key={x.id}>{x.nome}</option>)}</select></label></>}
        <label>Descrever o problema<textarea rows={mobile ? 5 : 4} value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="O que aconteceu?"/></label><div className="cols"><label>Área emitente<select value={form.area_emissora_id} onChange={e => set('area_emissora_id', e.target.value)}><option value="">Selecione</option>{catalog?.area.map(x => <option value={x.id} key={x.id}>{x.nome}</option>)}</select></label><label>Local<select value={form.local_id} onChange={e => set('local_id', e.target.value)}><option value="">Selecione</option>{catalog?.local.map(x => <option value={x.id} key={x.id}>{x.nome}</option>)}</select></label><label>Atividade<select value={form.atividade_id} onChange={e => set('atividade_id', e.target.value)}><option value="">Selecione</option>{catalog?.atividade.map(x => <option value={x.id} key={x.id}>{x.nome}</option>)}</select></label></div>
        {!mobile && <><div className="cols"><label>Processo emitente<input value={form.processo_texto} onChange={e=>set('processo_texto',e.target.value)}/></label><label>Nome do emitente<input value={form.emitente_nome} onChange={e=>set('emitente_nome',e.target.value)}/></label><label>Data da emissão<input type="date" value={form.data_emissao} onChange={e=>set('data_emissao',e.target.value)}/></label><label>Identificação<input value={form.identificacao_texto} onChange={e=>set('identificacao_texto',e.target.value)}/></label><label>Item normativo<input value={form.requisito_texto} onChange={e=>set('requisito_texto',e.target.value)}/></label><label>Nº da RNC anterior<input value={form.numero_anterior_texto} onChange={e=>set('numero_anterior_texto',e.target.value)}/></label></div><label>Evidência objetiva<textarea value={form.evidencias_texto} onChange={e=>set('evidencias_texto',e.target.value)}/></label></>}
        {!mobile && <><div className="cols"><label>Setor PCP<select value={form.setor_pcp_id} onChange={e => setForm(f => ({...f,setor_pcp_id:e.target.value,produto_pcp_id:''}))}><option value="">Selecione</option>{pcpSectors.map(x=><option key={x.id} value={x.id}>{x.codigo} · {x.nome}</option>)}</select></label><label>Produto PCP<select value={form.produto_pcp_id} onChange={e => set('produto_pcp_id',e.target.value)}><option value="">Selecione</option>{pcpProducts.filter(x=>!form.setor_pcp_id || x.setor_id===form.setor_pcp_id).map(x=><option key={x.id} value={x.id}>{x.codigo} · {x.nome}</option>)}</select></label></div>{fromLab && <label>Produto descrito no ensaio<input value={form.produto_texto} onChange={e=>set('produto_texto',e.target.value)}/></label>}<div className="cols"><label>Lote<input value={form.lote_texto} onChange={e => set('lote_texto', e.target.value)}/></label><label>Data de detecção<input type="datetime-local" value={form.data_deteccao} onChange={e => set('data_deteccao', e.target.value)}/></label></div></>}
        <label>Foto ou evidência<input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" capture="environment" onChange={e => setPhoto(e.target.files?.[0] || null)}/></label>
      </section>
      {!mobile && <><section className="card"><h2>2 · Classificação</h2><div className="cols"><label>Gravidade<select value={form.gravidade_id} onChange={e => set('gravidade_id', e.target.value)}><option value="">Qualidade define na triagem</option>{catalog?.gravidade.map(x => <option value={x.id} key={x.id}>{x.nome}</option>)}</select></label><label>Tipo<select value={form.tipo_id} onChange={e => set('tipo_id', e.target.value)}><option value="">Qualidade define na triagem</option>{catalog?.tipo.map(x => <option value={x.id} key={x.id}>{x.nome}</option>)}</select></label></div><label className="check"><input type="checkbox" checked={form.cliente_afetado} onChange={e => set('cliente_afetado', e.target.checked)}/> Produto chegou ao cliente — criar pendência de notificação</label></section>
      <section className="card"><h2>3 · Ação imediata</h2><p>Após registrar, a contenção é documentada na tratativa. Uma concessão exige aprovação própria.</p></section>
      <details className="card"><summary>Mais detalhes</summary><div className="cols">{(['impacto','fornecedor_texto','cliente_texto','pedido_texto'] as const).map(key => <label key={key}>{detailFieldNames[key]}<input value={form[key]} onChange={e => set(key, e.target.value)}/></label>)}</div></details></>}
      {mobile && <section className="card"><label className="check"><input type="checkbox"/> Material segregado ou identificado</label><p className="hint">A Qualidade completa classificação e responsável.</p></section>}
      <div className="actions"><button disabled={busy} onClick={() => save(false)}>Salvar rascunho</button><button disabled={busy || !can(ctx, 'qualidade.nc.abrir')} className="primary" onClick={() => save(true)}>{busy ? 'Salvando…' : 'Registrar RNC'}</button></div>
    </div><aside className="card iso"><h3>Conformidade ISO desta RNC</h3><p>✓ Natureza da ocorrência · 10.2.2 a</p><p>○ Contenção · 8.7</p><p>○ Causa e ação · 10.2.1</p><p>○ Eficácia e encerramento · 10.2.1</p></aside></div>
  </>;
}

function Treatment({ ctx, id, go, unitControl }: { ctx: Context; id: string; go: (path: string) => void; unitControl: React.ReactNode }) {
  const [detail, setDetail] = useState<Detail | null>(null), [catalog, setCatalog] = useState<Catalogs | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [users, setUsers] = useState<{id:string;name:string}[]>([]);
  const [triage, setTriage] = useState({ origem_id:'', gravidade_id:'', tipo_id:'', area_responsavel_id:'', responsavel_id:'', prazo_final:'' });
  const [containment, setContainment] = useState({ disposicao_id:'', descricao:'', aprovador_id:'', responsavel_texto:'', prazo:'' });
  const [cause, setCause] = useState({ metodo:'5_PORQUES', problema:'', causa_raiz:'', pode_ocorrer_outro_local:false, outro_local_descricao:'', porques:['','','','',''] });
  const [action, setAction] = useState({ tipo:'CORRETIVA', o_que:'', por_que:'', onde:'', quem_id:'', quando:'', como:'', quanto:'' });
  const [efficacy, setEfficacy] = useState({ criterio:'', resultado:'EFICAZ', notas:'' });
  const [followup, setFollowup] = useState({ data:new Date().toISOString().slice(0,10), evidencia:'' });
  const [closure, setClosure] = useState({ atualizar_riscos:false, justificativa_riscos:'', revisar_documento:false, justificativa_documento:'', treinamento:false, conclusao:'' });
  const [comment, setComment] = useState('');
  const [documentCode, setDocumentCode] = useState(''), [documentRole, setDocumentRole] = useState('REQUISITO');
  const refresh = () => request<Detail>(`/nc/${id}`).then(value => { setDetail(value); return value; });
  useEffect(() => { refresh().then(value => request<Catalogs>(`/catalogos?${q({company:String((value.nc as unknown as {empresa_id:string}).empresa_id),unit:value.nc.unidade_codigo})}`).then(setCatalog)).catch(err => setError(err.message)); fetch('/unificado/mapa/api/unified/quality-users',{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('Diretório indisponível'))).then((data:{users:{id:string;name:string}[]})=>setUsers(data.users)).catch(()=>setUsers([])); }, [id]);
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); setError(''); try { await fn(); await refresh(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } };
  if (!detail) return <main>{error ? <p role="alert" className="error">{error}</p> : 'Carregando RNC…'}</main>;
  const n = detail.nc;
  return <><button className="back" onClick={() => go('/')}>← RNCs</button><div className="heading"><div><small>{n.numero || 'Número sorteado ao registrar'} · {n.unidade_codigo} {n.legado && <span className="badge">Migrada do GED</span>}</small><h1>{n.titulo || 'Ocorrência sem título'}</h1></div><div className="heading-actions">{unitControl}<a className="button" href={`${API}/nc/${id}/pdf`} target="_blank" rel="noreferrer">RNC - Eletrônico</a></div></div>
    {error && <p role="alert" className="error">{error}</p>}{detail.campos_pendentes.length > 0 && <div className="notice">Campos pendentes da migração: {detail.campos_pendentes.join(', ')}</div>}{detail.cliente_pendente && <div className="notice">Cliente afetado: comunicação pendente. {can(ctx,'qualidade.nc.tratar') && <button onClick={() => { const motivo=window.prompt('Informe referência da comunicação ao cliente'); if(motivo) void run(() => post(`/nc/${id}/confirmar-notificacao-cliente`,{motivo})); }}>Registrar comunicação</button>}</div>}
    <div className="steps">{steps.slice(0,6).map((s,i) => <div key={s} className={steps.indexOf(n.status) >= i ? 'done' : ''}><b>{i+1}</b><span>{labels[s]}</span></div>)}</div>
    <div className="form-grid"><div className="form-main">
      <section className="card"><h2>Resumo da RNC</h2><p>{n.descricao}</p><p>Status: <strong>{labels[n.status]}</strong> · Prazo: {dateBR(n.prazo_final)}</p>{n.status === 'RASCUNHO' && <div className="actions"><button disabled={busy} className="primary" onClick={() => run(() => post(`/nc/${id}/registrar`, {mobile: true}))}>Registrar RNC</button><button disabled={busy} onClick={() => run(() => post(`/nc/${id}/descartar`, {motivo:'rascunho descartado'}))}>Descartar rascunho</button></div>}</section>
      <RncFormFields nc={n} catalog={catalog} busy={busy} editable={can(ctx,'qualidade.nc.tratar') && !['ENCERRADA','CANCELADA'].includes(n.status)} run={run}/>
      {n.status === 'REGISTRADA' && can(ctx,'qualidade.nc.triar') && <section className="card"><h2>Triagem</h2><div className="cols"><label>Origem<select value={triage.origem_id} onChange={e => setTriage({...triage,origem_id:e.target.value})}><option value="">Selecione ou mantenha atual</option>{catalog?.origem.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></label><label>Gravidade<select value={triage.gravidade_id} onChange={e => setTriage({...triage,gravidade_id:e.target.value})}><option value="">Selecione</option>{catalog?.gravidade.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></label><label>Tipo<select value={triage.tipo_id} onChange={e => setTriage({...triage,tipo_id:e.target.value})}><option value="">Selecione</option>{catalog?.tipo.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></label><label>Área responsável<select value={triage.area_responsavel_id} onChange={e => setTriage({...triage,area_responsavel_id:e.target.value})}><option value="">Selecione</option>{catalog?.area.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></label><label>Responsável<select value={triage.responsavel_id} onChange={e => setTriage({...triage,responsavel_id:e.target.value})}><option value="">Selecione</option>{users.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Prazo final<input type="date" value={triage.prazo_final} onChange={e => setTriage({...triage,prazo_final:e.target.value})}/></label></div><button disabled={busy} className="primary" onClick={() => run(() => post(`/nc/${id}/triagem`, {...triage,origem_id:triage.origem_id || null}))}>Concluir triagem</button></section>}
      {n.status === 'CONTENCAO' && can(ctx,'qualidade.nc.tratar') && <section className="card"><h2>Ações de contenção / provisória</h2><label>Disposição<select value={containment.disposicao_id} onChange={e => setContainment({...containment,disposicao_id:e.target.value})}><option value="">Selecione</option>{catalog?.disposicao.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></label><label>O que foi feito?<textarea value={containment.descricao} onChange={e => setContainment({...containment,descricao:e.target.value})}/></label><div className="cols"><label>Responsável<input value={containment.responsavel_texto} onChange={e=>setContainment({...containment,responsavel_texto:e.target.value})}/></label><label>Prazo<input type="date" value={containment.prazo} onChange={e=>setContainment({...containment,prazo:e.target.value})}/></label></div>{catalog?.disposicao.find(x=>x.id===containment.disposicao_id)?.codigo==='CONCESSAO' && <label>Aprovador da concessão<select value={containment.aprovador_id} onChange={e=>setContainment({...containment,aprovador_id:e.target.value})}><option value="">Selecione</option>{users.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}<div className="actions"><button disabled={busy} onClick={() => run(() => post(`/nc/${id}/contencoes`,{...containment,prazo:containment.prazo||null,aprovador_id:containment.aprovador_id||null}))}>Adicionar contenção</button><button disabled={busy} className="primary" onClick={() => run(() => post(`/nc/${id}/concluir-contencao`))}>Concluir contenção</button></div>{detail.nc_contencao.map(x => <p key={String(x.id)}>{String(x.descricao)} {can(ctx,'qualidade.nc.aprovar_concessao') && !x.concessao_aprovada_em && <button onClick={() => run(() => post(`/nc/${id}/contencoes/${x.id}/aprovar-concessao`))}>Aprovar concessão</button>}</p>)}</section>}
      {n.status === 'ANALISE_CAUSA' && can(ctx,'qualidade.nc.tratar') && <section className="card"><h2>Análise de causa</h2><div className="tabs"><button className={cause.metodo==='5_PORQUES'?'selected':''} onClick={() => setCause({...cause,metodo:'5_PORQUES'})}>5 Porquês</button><button className={cause.metodo==='ISHIKAWA_6M'?'selected':''} onClick={() => setCause({...cause,metodo:'ISHIKAWA_6M'})}>Ishikawa 6M</button></div><label>Problema<input value={cause.problema} onChange={e => setCause({...cause,problema:e.target.value})}/></label>{cause.metodo==='5_PORQUES' && cause.porques.map((why,i) => <label key={i}>{i+1}º Por quê?<input value={why} onChange={e => setCause({...cause,porques:cause.porques.map((x,j) => j===i?e.target.value:x)})}/></label>)}<label>Causa raiz<textarea value={cause.causa_raiz} onChange={e => setCause({...cause,causa_raiz:e.target.value})}/></label><label className="check"><input type="checkbox" checked={cause.pode_ocorrer_outro_local} onChange={e => setCause({...cause,pode_ocorrer_outro_local:e.target.checked})}/> Pode ocorrer em outro lugar?</label>{cause.pode_ocorrer_outro_local && <label>Onde?<input value={cause.outro_local_descricao} onChange={e => setCause({...cause,outro_local_descricao:e.target.value})}/></label>}<div className="actions"><button disabled={busy} onClick={() => run(() => put(`/nc/${id}/causa`,{...cause,porques:cause.porques.filter(Boolean)}))}>Salvar causa</button><button disabled={busy} className="primary" onClick={() => run(() => post(`/nc/${id}/concluir-causa`))}>Concluir análise</button></div></section>}
      {n.status === 'PLANO_ACAO' && can(ctx,'qualidade.nc.tratar') && <section className="card"><h2>Plano de ação · 5W2H</h2>{detail.nc_acao.map(x => <ActionItem key={String(x.id)} item={x} ncId={id} busy={busy} run={run}/>)}<div className="cols"><label>Tipo<select value={action.tipo} onChange={e => setAction({...action,tipo:e.target.value})}>{['CONTENCAO','CORRETIVA_IMEDIATA','CORRETIVA','PREVENTIVA'].map(x => <option key={x} value={x}>{actionTypeNames[x]}</option>)}</select></label><label>O quê<input value={action.o_que} onChange={e => setAction({...action,o_que:e.target.value})}/></label><label>Quem<select value={action.quem_id} onChange={e => setAction({...action,quem_id:e.target.value})}><option value="">Selecione</option>{users.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Quando<input type="date" value={action.quando} onChange={e => setAction({...action,quando:e.target.value})}/></label><label>Por quê<input value={action.por_que} onChange={e => setAction({...action,por_que:e.target.value})}/></label><label>Onde<input value={action.onde} onChange={e => setAction({...action,onde:e.target.value})}/></label><label>Como<input value={action.como} onChange={e => setAction({...action,como:e.target.value})}/></label><label>Quanto<input type="number" value={action.quanto} onChange={e => setAction({...action,quanto:e.target.value})}/></label></div><div className="actions"><button disabled={busy} onClick={() => run(() => post(`/nc/${id}/acoes`,{...action,quando:action.quando || null,quanto:action.quanto ? Number(action.quanto):null,quem_id:action.quem_id || null}))}>+ Ação</button><button disabled={busy} className="primary" onClick={() => run(() => post(`/nc/${id}/concluir-plano`))}>Concluir plano</button></div></section>}
      {(n.status === 'VERIFICACAO_EFICACIA' || detail.nc_eficacia_acompanhamento.length > 0 || detail.nc_eficacia.length > 0) && <section className="card">
        <h2>Acompanhamento da eficácia da solução</h2>
        <p>Registre cada observação. O verificador deve ser diferente dos executores das ações.</p>
        <div className="table-wrap followup-table"><table><thead><tr><th>Data</th><th>Evidência</th><th>Verificador</th></tr></thead><tbody>
          {detail.nc_eficacia_acompanhamento.map(x=><tr key={String(x.id)}><td data-label="Data">{dateBR(String(x.data))}</td><td data-label="Evidência">{String(x.evidencia)}</td><td data-label="Verificador">{String(x.verificador_id)}</td></tr>)}
        </tbody></table>{!detail.nc_eficacia_acompanhamento.length && <p className="empty">Nenhum acompanhamento registrado.</p>}</div>
        {n.status === 'VERIFICACAO_EFICACIA' && can(ctx,'qualidade.nc.verificar_eficacia') && <>
          <div className="cols"><label>Data<input type="date" value={followup.data} onChange={e=>setFollowup({...followup,data:e.target.value})}/></label><label>Evidência<input value={followup.evidencia} onChange={e=>setFollowup({...followup,evidencia:e.target.value})}/></label></div>
          <button disabled={busy||!followup.evidencia.trim()} onClick={()=>run(async()=>{await post(`/nc/${id}/eficacia/acompanhamento`,followup);setFollowup({...followup,evidencia:''});})}>Adicionar linha</button>
          <div className="cols"><label>Critério<input value={efficacy.criterio} onChange={e => setEfficacy({...efficacy,criterio:e.target.value})}/></label><label>Resultado<select value={efficacy.resultado} onChange={e => setEfficacy({...efficacy,resultado:e.target.value})}><option value="EFICAZ">Eficaz</option><option value="NAO_EFICAZ">Não eficaz · abrir nova RNC vinculada</option></select></label></div>
          <label>Notas<textarea value={efficacy.notas} onChange={e => setEfficacy({...efficacy,notas:e.target.value})}/></label><button disabled={busy} className="primary" onClick={() => run(() => post(`/nc/${id}/eficacia`,efficacy))}>Registrar verificação</button>
        </>}
        {detail.nc_eficacia.map(x => <p key={String(x.id)}>Rodada {String(x.rodada)} · {(String(x.resultado)==='NAO_EFICAZ'?'Não eficaz':'Eficaz')} · {String(x.notas || '')}</p>)}
        {detail.nc_vinculo.filter(x=>x.tipo==='INEFICACIA').map(x=><p key={String(x.id)}><strong>Nova RNC vinculada:</strong> <button className="linklike" onClick={()=>go(`/nc/${x.nc_relacionada_id}`)}>{String(x.numero_relacionado||x.nc_relacionada_id)}</button></p>)}
      </section>}
      {n.status === 'ENCERRAMENTO' && <section className="card"><h2>Encerramento</h2>{can(ctx,'qualidade.nc.tratar') && <><label className="check"><input type="checkbox" checked={closure.atualizar_riscos} onChange={e => setClosure({...closure,atualizar_riscos:e.target.checked})}/> Atualizar riscos e oportunidades?</label><label>Justificativa dos riscos<input value={closure.justificativa_riscos} onChange={e => setClosure({...closure,justificativa_riscos:e.target.value})}/></label><label className="check"><input type="checkbox" checked={closure.revisar_documento} onChange={e => setClosure({...closure,revisar_documento:e.target.checked})}/> Revisar documento do SGQ?</label><label>Justificativa do documento<input value={closure.justificativa_documento} onChange={e => setClosure({...closure,justificativa_documento:e.target.value})}/></label><label className="check"><input type="checkbox" checked={closure.treinamento} onChange={e => setClosure({...closure,treinamento:e.target.checked})}/> Treinar equipe?</label><label>Conclusão<textarea value={closure.conclusao} onChange={e => setClosure({...closure,conclusao:e.target.value})}/></label><button disabled={busy} onClick={() => run(() => put(`/nc/${id}/encerramento`,closure))}>Salvar decisão</button></>}{can(ctx,'qualidade.nc.encerrar') && <button disabled={busy} className="primary" onClick={() => run(() => post(`/nc/${id}/encerrar`))}>Aprovar encerramento</button>}</section>}
      <section className="card"><h2>Documentos GED</h2><p>Consulte o código no <a href="/unificado/ged/documents/" target="_blank" rel="noreferrer">GED</a> e registre a referência usada nesta RNC.</p>{detail.nc_documento_ref.map(x=><p key={String(x.id)}>{String(x.papel)==='A_REVISAR'?'Revisar documento':'Requisito'} · {String(x.codigo)}{x.revisao?` · rev. ${x.revisao}`:''}</p>)}{can(ctx,'qualidade.nc.tratar')&&<div className="cols"><label>Código do documento<input value={documentCode} onChange={e=>setDocumentCode(e.target.value)}/></label><label>Finalidade<select value={documentRole} onChange={e=>setDocumentRole(e.target.value)}><option value="REQUISITO">Requisito</option><option value="A_REVISAR">Revisar documento</option></select></label><button disabled={busy||!documentCode.trim()} onClick={()=>run(async()=>{await post(`/nc/${id}/documentos`,{codigo:documentCode,papel:documentRole});setDocumentCode('');})}>Vincular documento</button></div>}</section>
      <section className="card"><h2>Anexos</h2>{detail.nc_anexo.map(x => <p key={String(x.id)}><a href={`${API}/nc/${id}/anexos/${x.id}`}>{String(x.nome_original)}</a></p>)}<label>Adicionar evidência<input type="file" onChange={e => { const file=e.target.files?.[0]; if(file){ const data=new FormData();data.append('file',file);run(() => request(`/nc/${id}/anexos`,{method:'POST',body:data})); } }}/></label></section>
    </div><aside><section className="card"><h3>Resumo</h3><p>Unidade: {n.unidade_codigo}</p><p>Responsável: {n.responsavel_id || '—'}</p><p>Prazo: {dateBR(n.prazo_final)}</p></section><section className="card"><h3>Histórico · imutável</h3>{detail.nc_evento.map(x => <p key={String(x.id)}><strong>{eventNames[String(x.tipo)] || String(x.tipo).replaceAll('_',' ')}</strong>{Boolean(x.descricao)&&<><br/>{String(x.descricao)}</>}<br/><small>{String(x.autor_texto || '')} · {dateBR(String(x.ocorrido_em))}</small></p>)}</section><section className="card"><h3>Comentários</h3>{detail.nc_comentario.map(x => <p key={String(x.id)}>{String(x.texto)}</p>)}<textarea value={comment} onChange={e => setComment(e.target.value)}/><button disabled={busy} onClick={() => run(async () => { await post(`/nc/${id}/comentarios`,{texto:comment}); setComment(''); })}>Comentar</button></section></aside></div>
  </>;
}

function RncFormFields({nc, catalog, busy, editable, run}:{nc:Nc;catalog:Catalogs|null;busy:boolean;editable:boolean;run:(fn:()=>Promise<unknown>)=>Promise<void>}) {
  const yn=(value:boolean|null|undefined)=>value===true?'sim':value===false?'nao':'';
  const [form,setForm]=useState({
    processo_texto:nc.processo_texto||'', emitente_nome:nc.emitente_nome||'',
    data_emissao:nc.data_emissao?.slice(0,10)||'', identificacao_texto:nc.identificacao_texto||'',
    numero_anterior_texto:nc.numero_anterior_texto||'', requisito_texto:nc.requisito_texto||'',
    descricao:nc.descricao||'', evidencias_texto:nc.evidencias_texto||'',
    local_id:nc.local_id||'', atividade_id:nc.atividade_id||'',
    data_ocorrencia:nc.data_ocorrencia?.slice(0,16)||'',
    envolvidos_funcoes:nc.envolvidos_funcoes||'', causas_provaveis:nc.causas_provaveis||'',
    equipe_texto:nc.equipe_texto||'', sistematica_adequada:yn(nc.sistematica_adequada),
    sistematica_seguida:yn(nc.sistematica_seguida), poka_yoke_possivel:yn(nc.poka_yoke_possivel),
    alterar_documentos:yn(nc.alterar_documentos), documentos_alterar_texto:nc.documentos_alterar_texto||'',
    verificar_eficacia_a_partir:nc.verificar_eficacia_a_partir?.slice(0,10)||''
  });
  const set=(name:keyof typeof form,value:string)=>setForm(previous=>({...previous,[name]:value}));
  const yesNo=(name:keyof typeof form,label:string)=><label>{label}<select value={form[name]} onChange={e=>set(name,e.target.value)}><option value="">Não informado</option><option value="sim">Sim</option><option value="nao">Não</option></select></label>;
  const save=()=>run(()=>patch(`/nc/${nc.id}/formulario`,{
    ...form,
    local_id:form.local_id||null, atividade_id:form.atividade_id||null,
    data_emissao:form.data_emissao||null,
    data_ocorrencia:form.data_ocorrencia?new Date(form.data_ocorrencia).toISOString():null,
    verificar_eficacia_a_partir:form.verificar_eficacia_a_partir||null,
    sistematica_adequada:form.sistematica_adequada?form.sistematica_adequada==='sim':null,
    sistematica_seguida:form.sistematica_seguida?form.sistematica_seguida==='sim':null,
    poka_yoke_possivel:form.poka_yoke_possivel?form.poka_yoke_possivel==='sim':null,
    alterar_documentos:form.alterar_documentos?form.alterar_documentos==='sim':null
  }));
  return <section className="card rnc-form-fields"><h2>FL-SGQ-07 · dados do formulário</h2>
    <fieldset disabled={!editable||busy}>
      <div className="cols"><label>Processo emitente<input value={form.processo_texto} onChange={e=>set('processo_texto',e.target.value)}/></label><label>Nome do emitente<input value={form.emitente_nome} onChange={e=>set('emitente_nome',e.target.value)}/></label><label>Data da emissão<input type="date" value={form.data_emissao} onChange={e=>set('data_emissao',e.target.value)}/></label><label>Identificação<input value={form.identificacao_texto} onChange={e=>set('identificacao_texto',e.target.value)}/></label><label>Item normativo<input value={form.requisito_texto} onChange={e=>set('requisito_texto',e.target.value)}/></label><label>Nº da RNC anterior<input value={form.numero_anterior_texto} onChange={e=>set('numero_anterior_texto',e.target.value)}/></label></div>
      <label>Descrever o problema<textarea rows={3} value={form.descricao} onChange={e=>set('descricao',e.target.value)}/></label>
      <label>Evidência objetiva<textarea rows={2} value={form.evidencias_texto} onChange={e=>set('evidencias_texto',e.target.value)}/></label>
      <h3>Análise do problema</h3><div className="cols"><label>Onde ocorreu? · Local<select value={form.local_id} onChange={e=>set('local_id',e.target.value)}><option value="">Selecione</option>{catalog?.local.map(x=><option value={x.id} key={x.id}>{x.nome}</option>)}</select></label><label>Quando ocorreu? · Data<input type="datetime-local" value={form.data_ocorrencia} onChange={e=>set('data_ocorrencia',e.target.value)}/></label><label>Como ocorreu? · Atividade<select value={form.atividade_id} onChange={e=>set('atividade_id',e.target.value)}><option value="">Selecione</option>{catalog?.atividade.map(x=><option value={x.id} key={x.id}>{x.nome}</option>)}</select></label><label>Quem estava envolvido? · Funções<input value={form.envolvidos_funcoes} onChange={e=>set('envolvidos_funcoes',e.target.value)}/></label><label>Causas prováveis<input value={form.causas_provaveis} onChange={e=>set('causas_provaveis',e.target.value)}/></label><label>Equipe<input value={form.equipe_texto} onChange={e=>set('equipe_texto',e.target.value)}/></label>{yesNo('sistematica_adequada','A sistemática utilizada é adequada?')}{yesNo('sistematica_seguida','A sistemática documentada está sendo seguida?')}</div>
      <h3>Ação corretiva</h3><div className="cols">{yesNo('poka_yoke_possivel','É possível implantar POKA YOKE?')}{yesNo('alterar_documentos','É necessário alterar documentos/formulários?')}<label>Documentos/formulários a alterar<input value={form.documentos_alterar_texto} onChange={e=>set('documentos_alterar_texto',e.target.value)}/></label><label>Verificar eficácia a partir de<input type="date" value={form.verificar_eficacia_a_partir} onChange={e=>set('verificar_eficacia_a_partir',e.target.value)}/></label></div>
    </fieldset>{editable&&<button className="primary" disabled={busy} onClick={save}>Salvar dados do formulário</button>}
  </section>;
}

function ActionItem({item, ncId, busy, run}:{item:Record<string,unknown>;ncId:string;busy:boolean;run:(fn:()=>Promise<unknown>)=>Promise<void>}) {
  const [evidence,setEvidence]=useState(''), [reason,setReason]=useState('');
  const closed = item.status === 'CONCLUIDA' || item.status === 'CANCELADA';
  return <details className="action-detail"><summary><strong>{String(item.o_que)}</strong><span>{String(item.quem_id || 'Sem executor')} · {dateBR(String(item.quando || ''))} · {String(item.status)}</span></summary>
    <div className="cols"><p><strong>Por quê:</strong> {String(item.por_que || '—')}</p><p><strong>Onde:</strong> {String(item.onde || '—')}</p><p><strong>Como:</strong> {String(item.como || '—')}</p><p><strong>Quanto:</strong> {item.quanto ? String(item.quanto) : '—'}</p></div>
    {!closed && <div><label>Evidência da conclusão<input value={evidence} onChange={e=>setEvidence(e.target.value)}/></label><button disabled={busy || !evidence.trim()} onClick={()=>run(()=>post(`/nc/${ncId}/acoes/${item.id}/concluir`,{evidencia:evidence}))}>Concluir ação</button><label>Motivo do cancelamento<input value={reason} onChange={e=>setReason(e.target.value)}/></label><button disabled={busy || !reason.trim()} onClick={()=>run(()=>post(`/nc/${ncId}/acoes/${item.id}/cancelar`,{motivo:reason}))}>Cancelar ação</button></div>}
  </details>;
}

type AdminRow = {id:string;codigo:string;nome:string;ativo:boolean;prazo_causa_dias?:number|null;prazo_final_dias?:number|null;acao_corretiva_obrigatoria?:boolean;corretiva_se_recorrente?:boolean};
type ContactRow = {usuario_id:string;email:string;ativo:boolean};
const catalogNames: Record<string,string> = {
  origem:'Origem', tipo:'Tipo', area:'Área', local:'Local', atividade:'Atividade', disposicao:'Disposição',
  gravidade:'Gravidade', contatos:'Contatos'
};

function CatalogPage({ctx, company, unit, unitControl}:{ctx:Context;company:string;unit:string;unitControl:React.ReactNode}) {
  const [name,setName]=useState('origem');
  const [rows,setRows]=useState<AdminRow[]>([]), [contacts,setContacts]=useState<ContactRow[]>([]);
  const [users,setUsers]=useState<{id:string;name:string}[]>([]);
  const [editing,setEditing]=useState(''), [showForm,setShowForm]=useState(false);
  const [code,setCode]=useState(''), [label,setLabel]=useState('');
  const [causeDays,setCauseDays]=useState(''), [finalDays,setFinalDays]=useState('');
  const [correctiveRequired,setCorrectiveRequired]=useState(false), [correctiveRecurrent,setCorrectiveRecurrent]=useState(false);
  const [contactUser,setContactUser]=useState(''), [email,setEmail]=useState('');
  const [error,setError]=useState(''), [busy,setBusy]=useState(false);
  const allowed=can(ctx,'qualidade.nc.cadastros');
  const refresh=()=>name==='contatos'
    ? request<ContactRow[]>('/cadastros/contatos/usuarios').then(setContacts).catch(err=>setError(err.message))
    : request<AdminRow[]>(`/cadastros/${name}?${q({company})}`).then(setRows).catch(err=>setError(err.message));
  useEffect(()=>{void refresh();},[name,company]);
  useEffect(()=>{fetch('/unificado/mapa/api/unified/quality-users',{credentials:'same-origin',cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('Diretório indisponível')))
    .then((data:{users:{id:string;name:string}[]})=>setUsers(data.users||[])).catch(()=>setUsers([]));},[]);
  const sortedRows=[...rows].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  const sortedContacts=[...contacts].sort((a,b)=>(users.find(u=>u.id===a.usuario_id)?.name||a.usuario_id)
    .localeCompare(users.find(u=>u.id===b.usuario_id)?.name||b.usuario_id,'pt-BR'));
  const resetForm=()=>{setEditing('');setShowForm(false);setCode('');setLabel('');setContactUser('');setEmail('');setCauseDays('');setFinalDays('');setCorrectiveRequired(false);setCorrectiveRecurrent(false);};
  const chooseTab=(next:string)=>{setName(next);setError('');resetForm();};
  const editItem=(item:AdminRow)=>{setEditing(item.id);setCode(item.codigo);setLabel(item.nome);setCauseDays(String(item.prazo_causa_dias??''));setFinalDays(String(item.prazo_final_dias??''));setCorrectiveRequired(Boolean(item.acao_corretiva_obrigatoria));setCorrectiveRecurrent(Boolean(item.corretiva_se_recorrente));setShowForm(true);};
  const editContact=(item:ContactRow)=>{setEditing(item.usuario_id);setContactUser(item.usuario_id);setEmail(item.email);setShowForm(true);};
  const run=async(fn:()=>Promise<unknown>)=>{setBusy(true);setError('');try{await fn();resetForm();await refresh();}catch(err){setError((err as Error).message);}finally{setBusy(false);}};
  const policy=name==='gravidade'?{prazo_causa_dias:Number(causeDays),prazo_final_dias:Number(finalDays),acao_corretiva_obrigatoria:correctiveRequired,corretiva_se_recorrente:correctiveRecurrent}:{};
  const saveItem=()=>run(()=>editing
    ? patch(`/cadastros/${name}/${editing}`,{codigo:code.trim(),nome:label.trim(),...policy})
    : post(`/cadastros/${name}`,{empresa_id:company,unidade_codigo:unit,codigo:code.trim(),nome:label.trim(),...policy}));
  const saveContact=()=>run(()=>editing
    ? patch(`/cadastros/contatos/usuarios/${editing}`,{email:email.trim()})
    : put(`/cadastros/contatos/usuarios/${contactUser}`,{email:email.trim()}));
  return <>
    <div className="heading"><div><small>Qualidade · Configurações</small><h1>Cadastros da Qualidade</h1></div><div className="heading-actions">{unitControl}</div></div>
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="tabs" role="tablist" aria-label="Cadastros">{Object.entries(catalogNames).map(([key,title])=>
      <button role="tab" aria-selected={name===key} className={name===key?'selected':''}
        onClick={()=>chooseTab(key)} key={key}>{title}</button>)}</div>
    <div className="catalog-container">
      <div className="catalog-toolbar"><div><h2>{catalogNames[name]}</h2><p>{name==='contatos'
        ? 'Contatos usados nas notificações da Qualidade.'
        : 'Itens disponíveis para classificação e tratativa de RNCs.'}</p></div>
        {allowed&&<button className="primary" onClick={()=>{resetForm();setShowForm(true);}}>
          Novo item</button>}</div>
      {showForm&&allowed&&<section className="card catalog-form"><h3>{editing?'Editar item':'Novo item'}</h3>
        {name==='contatos'?<div className="cols"><label>Usuário<select value={contactUser} disabled={Boolean(editing)}
          onChange={e=>setContactUser(e.target.value)}><option value="">Selecione</option>{users.map(x=>
          <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>E-mail
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label></div>
          :<div className="cols"><label>Nome<input value={label} onChange={e=>setLabel(e.target.value)}/></label>
          <label>Código<input value={code} onChange={e=>setCode(e.target.value)}/></label></div>}
        {name==='gravidade'&&<><div className="cols"><label>Prazo para análise da causa (dias)
          <input type="number" min="0" value={causeDays} onChange={e=>setCauseDays(e.target.value)}/></label>
          <label>Prazo final (dias)<input type="number" min="0" value={finalDays} onChange={e=>setFinalDays(e.target.value)}/></label></div>
          <label className="check"><input type="checkbox" checked={correctiveRequired} onChange={e=>setCorrectiveRequired(e.target.checked)}/> Ação corretiva obrigatória</label>
          <label className="check"><input type="checkbox" checked={correctiveRecurrent} onChange={e=>setCorrectiveRecurrent(e.target.checked)}/> Ação corretiva se houver recorrência</label></>}
        <div className="actions"><button className="primary" disabled={busy||(
          name==='contatos'?!contactUser||!email.trim():!label.trim()||!code.trim()||(name==='gravidade'&&(!causeDays||!finalDays||Number(causeDays)<0||Number(finalDays)<0)))}
          onClick={name==='contatos'?saveContact:saveItem}>Salvar</button><button onClick={resetForm}>Cancelar</button></div>
      </section>}
      <div className="card table-wrap catalog-table"><table><thead><tr>
        <th>Nome</th><th>Código</th><th>Situação</th><th>Ações</th>
      </tr></thead><tbody>{name==='contatos'?sortedContacts.map(item=><tr key={item.usuario_id}>
        <td data-label="Nome"><strong>{users.find(u=>u.id===item.usuario_id)?.name||item.usuario_id}</strong></td>
        <td data-label="Código"><span className="secondary-code">{item.email}</span></td>
        <td data-label="Situação"><span className={`state-badge ${item.ativo?'active':'inactive'}`}>{item.ativo?'Ativo':'Inativo'}</span></td>
        <td data-label="Ações" className="row-actions">{allowed&&<><button disabled={busy} onClick={()=>editContact(item)}>Editar</button>
          <button disabled={busy} onClick={()=>run(()=>patch(`/cadastros/contatos/usuarios/${item.usuario_id}`,{ativo:!item.ativo}))}>
            {item.ativo?'Inativar':'Ativar'}</button></>}</td>
      </tr>):sortedRows.map(item=><tr key={item.id}>
        <td data-label="Nome"><strong>{item.nome}</strong></td>
        <td data-label="Código"><span className="secondary-code">{item.codigo}</span></td>
        <td data-label="Situação"><span className={`state-badge ${item.ativo?'active':'inactive'}`}>{item.ativo?'Ativo':'Inativo'}</span></td>
        <td data-label="Ações" className="row-actions">{allowed&&<><button disabled={busy} onClick={()=>editItem(item)}>Editar</button>
          <button disabled={busy} onClick={()=>run(()=>patch(`/cadastros/${name}/${item.id}`,{ativo:!item.ativo}))}>
            {item.ativo?'Inativar':'Ativar'}</button></>}</td>
      </tr>)}</tbody></table>
      {name==='contatos'?!sortedContacts.length&&<p className="empty">Nenhum contato cadastrado.</p>
        :!sortedRows.length&&<p className="empty">Nenhum item cadastrado.</p>}</div>
    </div>
  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);



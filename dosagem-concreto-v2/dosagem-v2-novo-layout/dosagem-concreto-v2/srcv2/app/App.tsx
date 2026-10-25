import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { HashRouter, Link, useLocation, useNavigate } from 'react-router-dom';
import type { Traco } from '../core/model';
import { calcularTraco } from '../core/calc/metodoManual';
import { validarTraco } from '../core/validate';
import { formatDinheiro, formatNumero, formatData } from '../core/units';
import { chamarApi, apiConfigurada } from '../data/api';
import { listarRascunhos, guardarCache, lerCache } from '../data/db';
import { iniciarSincronizacao, observarStatus, type SaveStatus } from '../data/sync';
import { Button, EmptyState, Pill, type Tone } from '../ui/components';
import { Icon } from '../ui/icons';
import { AppLayout, useLayoutMode, useUsuario } from './layout';
import { Editor, novoTraco } from './Editor';
import { Recipe41Page } from '../features/Recipe41Page';
import { ImportacaoRelease1 } from '../features/ImportacaoRelease1';
import { ProducaoRelease1 } from '../features/ProducaoRelease1';
import { MateriaisPage, FornecedoresPage, EnsaiosPage, FerramentasPage, CustosPage, ReferenciaPage, ConfigPage } from '../features/pages';
import './home.css';

function Heading({ title, subtitle, action, eyebrow }: { title: string; subtitle: string; action?: ReactNode; eyebrow?: string }) { return <div className="ct-page-heading"><div>{eyebrow && <p className="ct-eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{subtitle}</p></div>{action}</div>; }

const metodoLabel = (m: string) => ({ principal_abrams: 'Empacotamento', alternativo_concrefer: 'Volume', manual: 'Manual', cientifica: 'Científica', teor_argamassa: 'Teor de argamassa' } as Record<string, string>)[m] ?? m;
const aguardando = (t: Traco) => t.status === 'em_teste' && t.revisao > 0;
function statusView(t: Traco): { tone: Tone; label: string } {
  if (t.revisao === 0 && t.status === 'rascunho') return { tone: 'mute', label: 'Rascunho local' };
  if (aguardando(t)) return { tone: 'info', label: 'Aguardando parecer' };
  return ({ rascunho: { tone: 'mute', label: 'Rascunho' }, em_teste: { tone: 'warn', label: 'Em teste' }, aprovado: { tone: 'ok', label: 'Aprovado' }, inativo: { tone: 'mute', label: 'Inativo' } } as Record<string, { tone: Tone; label: string }>)[t.status] ?? { tone: 'mute', label: t.status };
}
function saudacao() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
function safeCalc(t: Traco) { try { return calcularTraco(t); } catch { return null; } }

function Home({ tracos, onNew, onOpen }: { tracos: Traco[]; onNew: () => void; onOpen: (id: string) => void }) {
  const user = useUsuario();
  const recentes = [...tracos].sort((a, b) => b.auditoria.alteradoEm.localeCompare(a.auditoria.alteradoEm)).slice(0, 5);
  const emTeste = tracos.filter(t => t.status === 'em_teste').length;
  const espera = tracos.filter(aguardando).length;
  const locais = tracos.filter(t => t.revisao === 0).length;
  const aprovados = tracos.filter(t => t.status === 'aprovado').map(safeCalc).filter((r): r is NonNullable<typeof r> => !!r && Number.isFinite(r.custoRsM3) && r.custoRsM3 > 0);
  const custoMedio = aprovados.length ? aprovados.reduce((s, r) => s + r.custoRsM3, 0) / aprovados.length : null;
  const pendencias = tracos.filter(t => t.status !== 'aprovado' && t.status !== 'inativo')
    .map(t => ({ t, erros: (() => { try { return validarTraco(t).filter(p => p.nivel === 'erro'); } catch { return []; } })() }))
    .filter(x => x.erros.length).slice(0, 4);
  const resumo = [espera ? `${espera} aguardando seu parecer` : '', emTeste ? `${emTeste} em teste` : '', pendencias.length ? `${pendencias.length} com pendências` : ''].filter(Boolean).join(' · ') || 'Nada pendente agora. Comece um traço novo ou revise os recentes.';
  return <div className="ct-home">
    <Heading eyebrow={`${saudacao()}${user?.nome ? `, ${user.nome.split(' ')[0]}` : ''}`} title="O que precisa de você hoje" subtitle={resumo}
      action={<div className="ct-row"><Link className="ct-button ct-button--secondary" to="/tracos">Ver traços</Link><Button onClick={onNew}><Icon name="mais" size={18} strokeWidth={2.4}/>Novo traço</Button></div>}/>
    {!apiConfigurada() && <div className="ct-alert ct-alert--aviso"><Icon name="alerta" size={18}/>API v2 ainda não configurada. O editor funciona com rascunhos locais; gravação no servidor depende do deploy.</div>}
    <section className="ct-kpis" aria-label="Resumo">
      <div className="ct-kpi-tile"><small>Aguardando aprovação</small><strong>{espera}</strong><span>Traços em teste já sincronizados</span></div>
      <div className="ct-kpi-tile"><small>Traços em teste</small><strong>{emTeste}</strong><span>Aguardando resultados ou revisão</span></div>
      <div className="ct-kpi-tile"><small>Rascunhos locais</small><strong>{locais}</strong><span>Ainda sem confirmação do servidor</span></div>
      <div className="ct-kpi-tile"><small>Custo médio aprovado</small><strong>{custoMedio == null ? '—' : formatDinheiro(custoMedio)}</strong><span>{custoMedio == null ? 'Nenhum traço aprovado com custo' : `por m³ · ${aprovados.length} traço(s)`}</span></div>
    </section>
    {recentes.length > 0 && <div className="ct-resume"><div><small>CONTINUAR DE ONDE PAROU</small><strong>{recentes[0].nome || 'Traço sem nome'}</strong><span>{recentes[0].codigo || 'Rascunho local'} · v{recentes[0].versao || 'nova'} · {formatData(recentes[0].auditoria.alteradoEm)}</span></div><Button variant="accent" onClick={() => onOpen(recentes[0].id)}>Continuar<Icon name="seta" size={16}/></Button></div>}
    <div className="ct-home-cols">
      <div className="ct-home-stack">
        <div className="ct-methods">
          <article className="ct-method-card">
            <div className="ct-method-viz" aria-hidden="true"><svg viewBox="0 0 260 70" width="100%" height="70"><path d="M8 62 C60 60 90 40 130 28 S210 10 252 8" fill="none" stroke="#0A1530" strokeWidth="2" strokeDasharray="4 4"/><path d="M8 64 C55 62 95 46 132 30 S205 14 252 9" fill="none" stroke="#DB0A40" strokeWidth="2.5"/></svg></div>
            <h2>Dosagem por empacotamento</h2>
            <p>Abrams, teor de argamassa e ajuste das proporções das areias pela curva granulométrica.</p>
            <div className="ct-method-foot"><span>Método principal</span><Link className="ct-link" to="/dosagem/empacotamento">Abrir módulo de empacotamento</Link></div>
          </article>
          <article className="ct-method-card">
            <div className="ct-method-viz" aria-hidden="true"><div className="ct-method-bar"><span style={{ flex: 351, background: '#0A1530' }}/><span style={{ flex: 200, background: '#5B7BD5' }}/><span style={{ flex: 296, background: '#FFC906' }}/><span style={{ flex: 370, background: '#9AA6BD' }}/><span style={{ flex: 20, background: '#E1E6EF' }}/></div></div>
            <h2>Dosagem por volume</h2>
            <p>Método Concrefer da planilha Rica v4, com frações volumétricas dos agregados.</p>
            <div className="ct-method-foot"><span>Método alternativo</span><Link className="ct-link" to="/dosagem/volume">Abrir módulo por volume</Link></div>
          </article>
        </div>
        <section className="ct-card">
          <div className="ct-card-head"><h2>Traços recentes</h2><Link className="ct-link" to="/tracos">Ver todos</Link></div>
          {recentes.length ? <div className="ct-table-wrap"><table className="ct-table"><thead><tr><th>Traço</th><th>Método</th><th className="num">fck</th><th className="num">a/c</th><th className="num">Custo/m³</th><th>Situação</th><th><span className="ct-sr">Ações</span></th></tr></thead><tbody>{recentes.map(t => { const r = safeCalc(t); const s = statusView(t); return <tr key={t.id}><td className="ct-cell-name"><strong>{t.nome || 'Sem nome'}</strong><small>{t.unidade || '—'} · v{t.versao || '—'}</small></td><td>{metodoLabel(t.metodo)}</td><td className="num">{formatNumero(t.objetivo.fckMPa, 0)} MPa</td><td className="num">{r ? formatNumero(r.relacaoAguaCimento, 3) : '—'}</td><td className="num">{r ? formatDinheiro(r.custoRsM3) : '—'}</td><td><Pill tone={s.tone}>{s.label}</Pill></td><td><Button variant="ghost" size="sm" onClick={() => onOpen(t.id)}>Abrir</Button></td></tr>; })}</tbody></table></div>
            : <EmptyState title="Nenhum traço recente" description="Crie um traço para começar a dosagem." action={<Button onClick={onNew}>+ Novo traço</Button>}/>}
        </section>
      </div>
      <div className="ct-home-stack">
        <section className="ct-card">
          <div className="ct-card-head"><h2>Pendências</h2>{pendencias.length ? <Pill tone="crit">{pendencias.length} traço(s)</Pill> : <Pill tone="ok">Em dia</Pill>}</div>
          {pendencias.length ? <ul className="ct-pend">{pendencias.map(({ t, erros }) => <li key={t.id}><Icon name="erro" size={18} strokeWidth={2.2}/><div><button type="button" className="ct-pend-link" onClick={() => onOpen(t.id)}>{t.nome || 'Traço sem nome'}</button><span>{erros[0].mensagem}{erros.length > 1 ? ` (+${erros.length - 1})` : ''}</span></div></li>)}</ul>
            : <p className="ct-muted" style={{ margin: 0, fontSize: '.875rem' }}>Nenhum traço aberto com erro de preenchimento.</p>}
        </section>
        <section className="ct-card">
          <div className="ct-card-head"><h2>Atalhos</h2></div>
          <div className="ct-shortcuts">
            <Link to="/ensaios"><Icon name="ensaios"/>Registrar ensaio</Link>
            <Link to="/comparacao-metodos"><Icon name="curva"/>Comparar métodos</Link>
            <Link to="/custos"><Icon name="custos"/>Custos</Link>
            <Link to="/ferramentas"><Icon name="ferramentas"/>Ferramentas</Link>
          </div>
        </section>
      </div>
    </div>
  </div>;
}

const filtros: { id: string; label: string; test: (t: Traco) => boolean }[] = [
  { id: 'todos', label: 'Todos', test: () => true },
  { id: 'rascunho', label: 'Rascunhos', test: t => t.status === 'rascunho' },
  { id: 'em_teste', label: 'Em teste', test: t => t.status === 'em_teste' },
  { id: 'aprovado', label: 'Aprovados', test: t => t.status === 'aprovado' }
];
function Tracos({ tracos, onNew, onOpen }: { tracos: Traco[]; onNew: () => void; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState('todos'); const [q, setQ] = useState(''); const [metodo, setMetodo] = useState('todos'); const [ordem, setOrdem] = useState('recentes');
  const lista = useMemo(() => {
    const base = tracos.filter(t => (filtros.find(f => f.id === filter)?.test(t) ?? true) && (metodo === 'todos' || t.metodo === metodo) && `${t.nome} ${t.codigo} ${t.unidade}`.toLowerCase().includes(q.toLowerCase()))
      .map(t => ({ t, r: safeCalc(t) }));
    return base.sort((a, b) => ordem === 'custo' ? (a.r?.custoRsM3 ?? Infinity) - (b.r?.custoRsM3 ?? Infinity) : ordem === 'fck' ? b.t.objetivo.fckMPa - a.t.objetivo.fckMPa : b.t.auditoria.alteradoEm.localeCompare(a.t.auditoria.alteradoEm));
  }, [tracos, filter, q, metodo, ordem]);
  const metodos = [...new Set(tracos.map(t => t.metodo))];
  return <div>
    <Heading eyebrow="Engenharia" title="Traços" subtitle="Versões, situação e custo de cada traço." action={<Button onClick={onNew}><Icon name="mais" size={18} strokeWidth={2.4}/>Novo traço</Button>}/>
    <div className="ct-filter-chips" role="group" aria-label="Situação">{filtros.map(f => <button key={f.id} type="button" className={`ct-filter-chip${filter === f.id ? ' active' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}<b>{tracos.filter(f.test).length}</b></button>)}</div>
    <div className="ct-filter-bar">
      <div className="ct-field ct-filter-search"><label htmlFor="tracos-busca" className="ct-sr">Buscar traço</label><div className="ct-input-box"><span className="ct-unit" aria-hidden="true"><Icon name="busca" size={16}/></span><input id="tracos-busca" value={q} onChange={e => setQ(e.target.value)} placeholder="Nome, código ou unidade"/></div></div>
      <div className="ct-field"><label htmlFor="tracos-metodo" className="ct-sr">Método</label><select id="tracos-metodo" value={metodo} onChange={e => setMetodo(e.target.value)}><option value="todos">Todos os métodos</option>{metodos.map(m => <option key={m} value={m}>{metodoLabel(m)}</option>)}</select></div>
      <div className="ct-field"><label htmlFor="tracos-ordem" className="ct-sr">Ordenar</label><select id="tracos-ordem" value={ordem} onChange={e => setOrdem(e.target.value)}><option value="recentes">Alterados recentemente</option><option value="custo">Menor custo/m³</option><option value="fck">Maior fck</option></select></div>
    </div>
    {lista.length ? <div className="ct-trace-list">
      <div className="ct-trace-head" aria-hidden="true"><span>Traço</span><span>Método</span><span className="num">fck</span><span className="num">a/c</span><span className="num">Custo/m³</span><span>Situação</span><span>Alterado</span><span/></div>
      {lista.map(({ t, r }) => { const s = statusView(t); return <article className="ct-card ct-trace-row" key={t.id}>
        <div className="ct-cell-name"><strong>{t.nome || 'Sem nome'}</strong><small>{t.codigo || 'Local'} · v{t.versao || 'nova'} · {t.unidade || '—'}</small></div>
        <span className="ct-trace-method" data-label="Método">{metodoLabel(t.metodo)}</span>
        <span className="num" data-label="fck">{formatNumero(t.objetivo.fckMPa, 0)} MPa</span>
        <span className="num" data-label="a/c">{r ? formatNumero(r.relacaoAguaCimento, 3) : '—'}</span>
        <span className="num" data-label="Custo/m³">{r ? formatDinheiro(r.custoRsM3) : 'Custo não calculado'}</span>
        <span><Pill tone={s.tone}>{s.label}</Pill></span>
        <span className="ct-muted ct-trace-date" data-label="Alterado">{formatData(t.auditoria.alteradoEm)}</span>
        <Button variant="ghost" size="sm" onClick={() => onOpen(t.id)}>Abrir</Button>
      </article>; })}
    </div> : <EmptyState title="Nenhum traço encontrado" description="Ajuste os filtros ou crie um traço." action={<Button onClick={onNew}>+ Novo traço</Button>}/>}
  </div>;
}

const titles: Record<string, string> = { '/dosagem/empacotamento': 'Dosagem por empacotamento', '/dosagem/volume': 'Dosagem por volume', '/dosagem41': 'Dosagem 4.1', '/comparacao-metodos': 'Comparação dos métodos', '/tracos': 'Traços', '/materiais': 'Materiais', '/fornecedores': 'Fornecedores', '/ensaios': 'Ensaios', '/ferramentas': 'Ferramentas', '/custos': 'Custos', '/referencia': 'Referência', '/config': 'Configurações', '/producao-r1': 'Produção', '/importacao-r1': 'Importação' };
function InnerApp() { const location=useLocation(),navigate=useNavigate(); const [mode,preference,setPreference]=useLayoutMode(); const [tracos,setTracos]=useState<Traco[]>([]); const [status,setStatus]=useState<SaveStatus>('rascunho_local'); const [message,setMessage]=useState(''); const [loading,setLoading]=useState(true); const persist=useCallback((t:Traco)=>setTracos(list=>[t,...list.filter(x=>x.id!==t.id)]),[]); useEffect(()=>{void (async()=>{const local=await listarRascunhos<Traco>();setTracos(local);setLoading(false);try{const server=await chamarApi<Traco[]>('tracos.listar',{});await guardarCache('tracos',server);setTracos(list=>[...server,...list.filter(l=>!server.some(s=>s.id===l.id))])}catch{const cached=await lerCache<Traco[]>('tracos');if(cached)setTracos(list=>[...cached.valor,...list.filter(l=>!cached.valor.some(s=>s.id===l.id))])}})();const unsubscribe=observarStatus((s,m)=>{setStatus(s);setMessage(m||'')});const stop=iniciarSincronizacao();return()=>{unsubscribe();stop()}},[]); const onNew=()=>{const t=novoTraco();persist(t);navigate(`/traco/${t.id}`)}; const onOpen=(id:string)=>navigate(`/traco/${id}`); const path=location.pathname; const title=path.startsWith('/traco/')?'Editor de traço':titles[path]??'Início'; const id=path.startsWith('/traco/')?path.split('/')[2]:''; const active=tracos.find(t=>t.id===id); return <AppLayout mode={mode} title={title} saveStatus={status} saveMessage={message} counts={{ tracos: tracos.length }}>{loading?<div className="ct-card">Carregando rascunhos…</div>:path==='/'?<Home tracos={tracos} onNew={onNew} onOpen={onOpen}/>:path==='/tracos'?<Tracos tracos={tracos} onNew={onNew} onOpen={onOpen}/>:path==='/dosagem/empacotamento'?<Recipe41Page key="packing" fixedMethod="principal_abrams" layout={mode}/>:path==='/dosagem/volume'?<Recipe41Page key="volume" fixedMethod="alternativo_concrefer" layout={mode}/>:path==='/dosagem41'?<LegacyDosagemRedirect/>:path==='/comparacao-metodos'?<Recipe41Page layout={mode}/>:path.startsWith('/traco/')?(active?<Editor initial={active} onPersist={persist} status={status} statusMessage={message}/>:<EmptyState title="Traço não encontrado" description="Volte à lista de traços." action={<Button onClick={()=>navigate('/tracos')}>Ver traços</Button>}/>):path==='/materiais'?<MateriaisPage/>:path==='/fornecedores'?<FornecedoresPage/>:path==='/ensaios'?<EnsaiosPage/>:path==='/ferramentas'?<FerramentasPage/>:path==='/custos'?<CustosPage/>:path==='/referencia'?<ReferenciaPage/>:path==='/producao-r1'?<ProducaoRelease1/>:path==='/importacao-r1'?<ImportacaoRelease1/>:path==='/config'?<ConfigPage preference={preference} setPreference={setPreference}/>:<Home tracos={tracos} onNew={onNew} onOpen={onOpen}/>}</AppLayout>; }
export function App() { return <HashRouter><InnerApp/></HashRouter>; }
function LegacyDosagemRedirect() { const navigate = useNavigate(); useEffect(() => { navigate('/dosagem/empacotamento', { replace: true }); }, [navigate]); return null; }

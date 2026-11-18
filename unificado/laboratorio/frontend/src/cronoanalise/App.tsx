import {useCallback, useEffect, useState} from 'react';
import {call, send} from './api-client';
import {cache} from './storage';
import {Activity, Queued, Stat, version} from './models';
import {Collect} from './Collect';
import {Catalog, Dimension, Measurements, Simulation} from './Pages';
import './cronoanalise.css';

const base = '/unificado/laboratorio/cronoanalise';
const routes = ['inicio', 'coletar', 'medicoes', 'catalogo', 'dimensionar', 'simular', 'metodologia'] as const;
type Route = typeof routes[number];
const labels: Record<Route, string> = {
  inicio: 'Início', coletar: 'Coletar', medicoes: 'Medições', catalogo: 'Catálogo',
  dimensionar: 'Dimensionar', simular: 'Simular', metodologia: 'Metodologia'
};
const readRoute = (): Route => {
  const part = location.pathname.replace(/\/$/, '').slice(base.length).replace(/^\//, '');
  return routes.includes(part as Route) ? part as Route : 'inicio';
};

export function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [allowedRoutes, setAllowedRoutes] = useState<Route[]>([readRoute()]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<Record<string, Stat>>({});
  const [queue, setQueue] = useState<Queued[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [activeTimers, setActiveTimers] = useState(0);
  const [lastSimulation, setLastSimulation] = useState<Record<string, unknown> | null>(null);
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 5500); };
  const navigate = (next: Route) => {
    if (!allowedRoutes.includes(next)) return;
    history.pushState({}, '', next === 'inicio' ? base : `${base}/${next}`);
    setRoute(next);
  };
  useEffect(() => {
    void fetch('/unificado/mapa/api/unified/screen-access/me', {
      credentials: 'same-origin', cache: 'no-store'
    }).then(async response => {
      if (!response.ok) return;
      const result = await response.json() as {screens?: string[]};
      const granted = new Set(result.screens || []);
      setAllowedRoutes(routes.filter(item => granted.has(`cronoanalise.${item}`)));
    }).catch(() => {});
  }, []);
  useEffect(() => {
    const back = () => setRoute(readRoute());
    const connectivity = () => setOnline(navigator.onLine);
    addEventListener('popstate', back); addEventListener('online', connectivity); addEventListener('offline', connectivity);
    return () => { removeEventListener('popstate', back); removeEventListener('online', connectivity); removeEventListener('offline', connectivity); };
  }, []);
  useEffect(() => { void cache.all<Queued>('fila_envio').then(setQueue); }, []);
  useEffect(() => { void cache.all('cronometros_ativos').then(active => setActiveTimers(active.length)); }, []);
  useEffect(() => {
    if (!online || route === 'metodologia') return;
    void Promise.all([call<Activity[]>('/atividades'), call<Record<string, Stat>>('/estatisticas')])
      .then(([items, statistics]) => { setActivities(items); setStats(statistics); setError('');
        void cache.put('contexto', 'catalogo', items); void cache.put('contexto', 'estatisticas', statistics);
      }).catch(err => setError((err as Error).message));
    void call<Record<string, unknown>[]>('/simulacoes')
      .then(items => setLastSimulation(items[0] || null)).catch(() => {});
  }, [online, refresh, route]);
  useEffect(() => {
    if (online) return;
    void Promise.all([cache.read<Activity[]>('contexto', 'catalogo'), cache.read<Record<string, Stat>>('contexto', 'estatisticas')])
      .then(([items, statistics]) => { if (items) setActivities(items); if (statistics) setStats(statistics); });
  }, [online]);
  const sync = useCallback(async () => {
    if (!navigator.onLine || sending || !queue.length) return;
    setSending(true);
    try {
      const response = await send<{gravadas: string[]; ja_existiam: string[]; rejeitadas: {id: string; motivo: string}[]}>(
        '/medicoes/lote', {medicoes: queue.map(item => item.medicao)});
      const accepted = new Set([...response.gravadas, ...response.ja_existiam]);
      for (const id of accepted) await cache.remove('fila_envio', id);
      const rejected = Object.fromEntries(response.rejeitadas.map(item => [item.id, item.motivo]));
      for (const entry of queue.filter(item => rejected[item.id])) {
        await cache.put('fila_envio', entry.id, {...entry, erro: rejected[entry.id]});
      }
      setQueue(previous => previous.filter(item => !accepted.has(item.id)).map(item =>
        rejected[item.id] ? {...item, erro: rejected[item.id]} : item));
      if (accepted.size) setRefresh(value => value + 1);
    } catch (err) { setError((err as Error).message); }
    finally { setSending(false); }
  }, [online, queue, sending]);
  useEffect(() => {
    if (queue.some(item => !item.erro) && online) void sync();
  }, [queue, online]);
  const total = Object.values(stats).reduce((sum, item) => sum + (item.n || 0), 0);
  const sufficient = Object.values(stats).filter(item => item.n >= (item.n_necessario || 10)).length;
  return <div className="cr-app">
    <div className="cr-top"><div><p className="cr-eyebrow">LABORATÓRIO / ESTUDO DE TEMPOS</p><h1>Cronoanálise</h1><p className="cr-subtitle">Medição, dimensionamento e simulação da produção de postes</p></div>
      <button className={`cr-sync ${!online ? 'offline' : sending ? 'sending' : ''}`} onClick={() => setQueueOpen(true)}>
        <span className="cr-dot"/>{!online ? `Sem conexão · ${queue.length} no aparelho` : sending ? `${queue.length} enviando…` : `Sincronizado · ${queue.length}`}</button></div>
    {notice && <div className="cr-notice" role="status">{notice}</div>}
    {error && <div className="cr-error" role="alert">{error}<button onClick={() => {setError(''); setRefresh(value => value + 1);}}>Tentar novamente</button></div>}
    {route === 'inicio' && <div className="cr-page"><div className="cr-kpis">
      <div className="cr-kpi"><span>Medições válidas</span><strong>{total}</strong><small>registros para análise</small></div>
      <div className="cr-kpi"><span>Amostra suficiente</span><strong>{sufficient}<small> / {activities.length || 40}</small></strong><small>atividades prontas</small></div>
      <div className="cr-kpi"><span>Cronômetros ativos</span><strong>{activeTimers}</strong><small>{activeTimers ? 'em andamento' : 'nenhum iniciado'}</small></div>
      <div className="cr-kpi navy"><span>Última simulação</span><strong>{lastSimulation ? new Date(String(lastSimulation.criado_em)).toLocaleDateString('pt-BR') : '—'}</strong><small>{lastSimulation ? String(lastSimulation.nota || 'rodada salva') : 'nenhuma rodada salva'}</small></div>
    </div><div className="cr-home-grid"><section className="cr-card"><div className="cr-card-head"><div><p className="cr-eyebrow">ACESSO RÁPIDO</p><h2>O que deseja fazer?</h2></div></div><div className="cr-shortcuts">
      {(['coletar', 'dimensionar', 'simular', 'metodologia'] as Route[]).filter(item => allowedRoutes.includes(item)).map(item => <button key={item} onClick={() => navigate(item)}><span className="cr-short-icon">{item === 'coletar' ? '◷' : item === 'dimensionar' ? '◫' : item === 'simular' ? '▥' : 'ⓘ'}</span><b>{labels[item]}</b><small>{item === 'coletar' ? 'Registrar tempos no pátio' : item === 'dimensionar' ? 'Calcular equipe necessária' : item === 'simular' ? 'Projetar o dia de produção' : 'Entender as fórmulas'}</small></button>)}</div></section>
      <section className="cr-card"><div className="cr-card-head"><div><p className="cr-eyebrow">PRIORIDADE DE COLETA</p><h2>Onde a amostra mais falta</h2></div></div>{activities.length ? <div className="cr-priority">{activities.map(item => ({item, missing: Math.max(0, (stats[item.codigo]?.n_necessario || 10) - (stats[item.codigo]?.n || 0))})).sort((a,b) => b.missing - a.missing).slice(0,7).map(({item, missing}) => <div key={item.codigo}><span className="cr-code">{item.codigo}</span><span>{item.nome}</span><strong>{missing} faltam</strong></div>)}</div> : <p className="cr-empty">O catálogo aparece após a primeira sincronização.</p>}</section></div>
      <section className="cr-card"><div className="cr-card-head"><div><p className="cr-eyebrow">PRODUÇÃO</p><h2>Fim por sequência</h2></div><button className="cr-link" onClick={() => navigate('simular')}>Abrir simulação →</button></div><p className="cr-empty">Execute e salve uma simulação para comparar as sequências.</p></section></div>}
    {route === 'coletar' && <Collect activities={activities} stats={stats} setQueue={setQueue} notify={notify} onActive={setActiveTimers}/>}
    {route === 'medicoes' && <Measurements activities={activities} notify={notify} refresh={() => setRefresh(value => value + 1)}/>}
    {route === 'catalogo' && <Catalog activities={activities} notify={notify} refresh={() => setRefresh(value => value + 1)}/>}
    {route === 'dimensionar' && <Dimension activities={activities} notify={notify}/>}
    {route === 'simular' && <Simulation activities={activities} notify={notify}/>}
    {route === 'metodologia' && <iframe className="cr-method" title="Metodologia e memória de cálculo" src={`${base}/metodologia-conteudo.html`}/>}
    {queueOpen && <div className="cr-overlay" onClick={() => setQueueOpen(false)}><aside className="cr-drawer" onClick={event => event.stopPropagation()}><div className="cr-card-head"><div><p className="cr-eyebrow">SINCRONIZAÇÃO</p><h2>Fila offline</h2></div><button className="cr-close" aria-label="Fechar" onClick={() => setQueueOpen(false)}>×</button></div><p>{queue.length} medição(ões) guardada(s) neste aparelho.</p>{queue.length ? queue.map(item => <div className="cr-queue-row" key={item.id}><strong>{item.medicao.atividade_codigo}</strong><span>{new Date(item.medicao.inicio).toLocaleString('pt-BR')}</span>{item.erro && <small>{item.erro}</small>}</div>) : <p className="cr-empty">Nenhuma medição pendente.</p>}<button className="cr-btn cr-red" disabled={!online || sending || !queue.length} onClick={() => void sync()}>Reenviar agora</button><p className="cr-muted">Versão {version}</p></aside></div>}
    <nav className="cr-bottom-nav" aria-label="Navegação Cronoanálise">{(['inicio', 'coletar', 'medicoes', 'simular'] as Route[]).filter(item => allowedRoutes.includes(item)).map(item => <button key={item} className={route === item ? 'active' : ''} onClick={() => navigate(item)}>{labels[item]}</button>)}</nav>
  </div>;
}

import {useEffect, useMemo, useRef, useState} from 'react';
import {API, call, send} from './api-client';
import {Activity, Process, stages} from './models';
import type {Layout, SimulationConfig, Summary, TimeCatalog, WorkerInput} from './engine-types';

const number = (value: number | undefined | null, digits = 1) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('pt-BR', {maximumFractionDigits: digits, minimumFractionDigits: digits}) : '—';
const date = (value: string) => new Date(value).toLocaleString('pt-BR');
const field = (label: string, value: string | number | boolean, onChange: (value: string) => void, type = 'text') =>
  <label key={label}>{label}<input type={type} value={String(value)} onChange={event => onChange(event.target.value)}/></label>;

interface SavedMeasurement {
  id: string; inicio: string; fim: string; atividade_codigo: string; processo: Process;
  setor: number | null; forma: string | null; tipo_poste: string | null; pessoas: number;
  duracao_s: number; distancia_m: number | null; valido: boolean; invalid_motivo: string | null;
  cronometrista_nome: string | null; observacao: string | null;
  pausas?: {inicio: string; fim: string; motivo: string}[];
  auditoria?: {em: string; usuario_id: string; acao: string; justificativa?: string}[];
}

export function Measurements({activities, notify, refresh}: {activities: Activity[]; notify: (s: string) => void; refresh: () => void}) {
  const [items, setItems] = useState<SavedMeasurement[]>([]);
  const [selected, setSelected] = useState<SavedMeasurement | null>(null);
  const [process, setProcess] = useState('');
  const [code, setCode] = useState('');
  const [sector, setSector] = useState('');
  const [valid, setValid] = useState('');
  const [day, setDay] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const query = useMemo(() => {
    const params = new URLSearchParams({limite: '100'});
    if (process) params.set('processo', process);
    if (code) params.set('atividade', code);
    if (sector) params.set('setor', sector);
    if (valid) params.set('valido', valid);
    if (day) {params.set('de', new Date(day + 'T00:00:00').toISOString()); params.set('ate', new Date(day + 'T23:59:59').toISOString());}
    return params;
  }, [process, code, sector, valid, day]);
  const reload = async (append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(query);
      if (append && cursor) params.set('cursor', cursor);
      const result = await call<{medicoes: SavedMeasurement[]; proximo_cursor: string | null}>(`/medicoes?${params}`);
      setItems(previous => append ? [...previous, ...result.medicoes] : result.medicoes);
      setCursor(result.proximo_cursor);
    } catch (err) {notify((err as Error).message);} finally {setLoading(false);}
  };
  useEffect(() => { void reload(); }, [query]);
  const inspect = async (id: string) => {
    try { setSelected(await call<SavedMeasurement>(`/medicoes/${id}`)); }
    catch (err) {notify((err as Error).message);}
  };
  const mutate = async (action: 'invalidar' | 'restaurar') => {
    if (!selected) return;
    if (action === 'invalidar' && !reason.trim()) {notify('Informe o motivo da invalidação.'); return;}
    try {
      await send(`/medicoes/${selected.id}/${action}`, action === 'invalidar' ? {motivo: reason} : {});
      await reload(); await inspect(selected.id); refresh(); setReason('');
      notify(action === 'invalidar' ? 'Medição invalidada.' : 'Medição restaurada.');
    } catch (err) {notify((err as Error).message);}
  };
  const download = (format: 'csv' | 'xlsx') => {
    const params = new URLSearchParams(query); params.delete('limite');
    location.href = `${API}/medicoes/exportar.${format}?${params}`;
  };
  const importCsv = async (file: File) => {
    try {
      const response = await fetch(`${API}/medicoes/importar-prototipo`, {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: {'Content-Type': 'text/csv; charset=utf-8'}, body: await file.text()
      });
      const outcome = await response.json();
      if (!response.ok) throw new Error(outcome.mensagem || `Erro HTTP ${response.status}`);
      notify(`${outcome.gravadas.length} gravada(s), ${outcome.ja_existiam.length} já existente(s), ${outcome.rejeitadas.length} rejeitada(s).`);
      await reload(); refresh();
    } catch (err) {notify((err as Error).message);}
  };
  return <section className="cr-card cr-page"><div className="cr-card-head"><div><p className="cr-eyebrow">BANCO DE MEDIÇÕES</p><h2>Medições</h2></div><div className="cr-actions"><label className="cr-btn cr-light cr-file-label">Importar CSV<input type="file" accept=".csv,text/csv" onChange={event => {const file = event.target.files?.[0]; if (file) void importCsv(file); event.target.value = '';}}/></label><button className="cr-btn cr-light" onClick={() => download('csv')}>Exportar CSV</button><button className="cr-btn cr-light" onClick={() => download('xlsx')}>Exportar XLSX</button></div></div>
    <div className="cr-filters"><select aria-label="Etapa" value={process} onChange={event => setProcess(event.target.value)}><option value="">Todas as etapas</option>{Object.entries(stages).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select aria-label="Atividade" value={code} onChange={event => setCode(event.target.value)}><option value="">Todas as atividades</option>{activities.filter(item => !process || item.processo === process).map(item => <option key={item.codigo} value={item.codigo}>{item.codigo} · {item.nome}</option>)}</select><select aria-label="Setor" value={sector} onChange={event => setSector(event.target.value)}><option value="">Todos os setores</option>{[1,2,3,4].map(n => <option key={n}>{n}</option>)}</select><input aria-label="Dia" type="date" value={day} onChange={event => setDay(event.target.value)}/><select aria-label="Situação" value={valid} onChange={event => setValid(event.target.value)}><option value="">Todas</option><option value="true">Válidas</option><option value="false">Invalidadas</option></select></div>
    <div className="cr-table-scroll"><table><thead><tr><th>Início</th><th>Código</th><th>Etapa</th><th>Setor</th><th>Forma</th><th>Pessoas</th><th>Duração</th><th>Situação</th><th></th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td>{date(item.inicio)}</td><td className="cr-code">{item.atividade_codigo}</td><td>{stages[item.processo]}</td><td>{item.setor || '—'}</td><td>{item.forma || '—'}</td><td>{item.pessoas}</td><td className="cr-mono">{number(item.duracao_s / 60, 2)} min</td><td><span className={`cr-sample ${item.valido ? 'good' : 'crit'}`}>{item.valido ? 'Válida' : 'Invalidada'}</span></td><td><button className="cr-link" onClick={() => void inspect(item.id)}>Detalhes</button></td></tr>)}</tbody></table>{!items.length && <p className="cr-empty">Nenhuma medição encontrada. Inicie a coleta para registrar tempos.</p>}</div>
    {cursor && <button className="cr-btn cr-light" disabled={loading} onClick={() => void reload(true)}>Carregar mais</button>}
    {selected && <div className="cr-overlay" onClick={() => setSelected(null)}><aside className="cr-drawer" onClick={event => event.stopPropagation()}><div className="cr-card-head"><div><p className="cr-eyebrow">DETALHE E HISTÓRICO</p><h2>{selected.atividade_codigo}</h2></div><button className="cr-close" onClick={() => setSelected(null)} aria-label="Fechar">×</button></div><dl className="cr-details"><dt>Início</dt><dd>{date(selected.inicio)}</dd><dt>Fim</dt><dd>{date(selected.fim)}</dd><dt>Duração efetiva</dt><dd>{number(selected.duracao_s / 60, 2)} min</dd><dt>Setor / forma</dt><dd>{selected.setor || '—'} / {selected.forma || '—'}</dd><dt>Poste</dt><dd>{selected.tipo_poste || '—'}</dd><dt>Cronometrista</dt><dd>{selected.cronometrista_nome || '—'}</dd><dt>Observação</dt><dd>{selected.observacao || '—'}</dd></dl><h3>Pausas</h3>{selected.pausas?.length ? selected.pausas.map((pause, index) => <p key={index}>{date(pause.inicio)}–{date(pause.fim)} · {pause.motivo}</p>) : <p className="cr-muted">Sem pausas.</p>}<h3>Auditoria</h3>{selected.auditoria?.map((entry, index) => <p key={index}>{date(entry.em)} · {entry.acao} · {entry.usuario_id}</p>)}{selected.valido ? <><label>Motivo da invalidação<textarea value={reason} onChange={event => setReason(event.target.value)}/></label><button className="cr-btn cr-red" onClick={() => void mutate('invalidar')}>Invalidar</button></> : <><p className="cr-error">{selected.invalid_motivo}</p><button className="cr-btn cr-green" onClick={() => void mutate('restaurar')}>Restaurar</button></>}</aside></div>}
  </section>;
}

export function Catalog({activities, notify, refresh}: {activities: Activity[]; notify: (s: string) => void; refresh: () => void}) {
  const [process, setProcess] = useState<Process>('desforma');
  const [editing, setEditing] = useState<Activity | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const exists = activities.some(item => item.codigo === editing.codigo);
      const {codigo, processo, nome, tipo, pessoas_padrao, estimativa_min,
        por_cacamba, ponto_inicio, ponto_fim, ordem, ativo} = editing;
      await send(exists ? `/atividades/${editing.codigo}` : '/atividades',
        {codigo, processo, nome, tipo, pessoas_padrao, estimativa_min,
          por_cacamba, ponto_inicio, ponto_fim, ordem, ativo}, exists ? 'PUT' : 'POST');
      notify('Catálogo atualizado e auditado.'); setEditing(null); refresh();
    } catch (err) {notify((err as Error).message);} finally {setBusy(false);}
  };
  return <section className="cr-card cr-page"><div className="cr-card-head"><div><p className="cr-eyebrow">PADRÃO DE COLETA</p><h2>Catálogo de atividades</h2></div><div className="cr-actions"><span className="cr-count">{activities.length}</span><button className="cr-btn cr-light" onClick={() => setEditing({codigo:'', processo:process, nome:'', tipo:'trabalho', pessoas_padrao:1, estimativa_min:1, por_cacamba:false, ponto_inicio:'', ponto_fim:'', ordem:activities.length + 1, ativo:true})}>Nova atividade</button></div></div><div className="cr-pills">{(Object.keys(stages) as Process[]).map(item => <button key={item} className={process === item ? 'selected' : ''} onClick={() => setProcess(item)}>{stages[item]}</button>)}</div><div className="cr-table-scroll"><table><thead><tr><th>Código</th><th>Atividade</th><th>Tipo</th><th>Pessoas</th><th>Estimativa</th><th>Por caçamba</th><th>Ativa</th><th></th></tr></thead><tbody>{activities.filter(item => item.processo === process).map(item => <tr key={item.codigo}><td className="cr-code">{item.codigo}</td><td>{item.nome}</td><td>{item.tipo}</td><td>{item.pessoas_padrao}</td><td>{number(Number(item.estimativa_min), 2)} min</td><td>{item.por_cacamba ? 'Sim' : 'Não'}</td><td>{item.ativo ? 'Sim' : 'Não'}</td><td><button className="cr-link" onClick={() => setEditing({...item})}>Editar</button></td></tr>)}</tbody></table>{!activities.length && <p className="cr-empty">O catálogo aparece quando houver conexão com o Laboratório.</p>}</div>{editing && <div className="cr-overlay" onClick={() => setEditing(null)}><aside className="cr-drawer" onClick={event => event.stopPropagation()}><div className="cr-card-head"><div><p className="cr-eyebrow">ATIVIDADE</p><h2>{editing.codigo || 'Nova atividade'}</h2></div><button className="cr-close" onClick={() => setEditing(null)}>×</button></div><div className="cr-form">{!activities.some(item => item.codigo === editing.codigo) && field('Código', editing.codigo, value => setEditing({...editing, codigo:value.toUpperCase()}))}{field('Nome', editing.nome, value => setEditing({...editing, nome: value}))}<label>Etapa<select value={editing.processo} onChange={event => setEditing({...editing, processo: event.target.value as Process})}>{Object.entries(stages).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Tipo<select value={editing.tipo} onChange={event => setEditing({...editing, tipo: event.target.value})}><option value="trabalho">Trabalho</option><option value="deslocamento">Deslocamento</option><option value="espera">Espera</option></select></label>{field('Pessoas padrão', editing.pessoas_padrao, value => setEditing({...editing, pessoas_padrao: Number(value)}), 'number')}{field('Estimativa (min)', editing.estimativa_min, value => setEditing({...editing, estimativa_min: Number(value)}), 'number')}{field('Começa quando', editing.ponto_inicio, value => setEditing({...editing, ponto_inicio: value}))}{field('Termina quando', editing.ponto_fim, value => setEditing({...editing, ponto_fim: value}))}<label><input type="checkbox" checked={editing.por_cacamba} onChange={event => setEditing({...editing, por_cacamba: event.target.checked})}/> Por caçamba</label><label><input type="checkbox" checked={editing.ativo} onChange={event => setEditing({...editing, ativo: event.target.checked})}/> Ativa</label></div><button disabled={busy} className="cr-btn cr-red" onClick={() => void save()}>Salvar atividade</button></aside></div>}</section>;
}

interface DimensionResult {
  formas: number; cacambas: number; N_arred: number; N: number; takt: number; HM: number;
  capacidade: number; etapas: Record<string, number>;
  atividades: {codigo: string; processo: Process; n: number; fonte: string; pessoas: number;
    ritmo: number; freq: number; TO: number; TN: number; TP: number; HMf: number}[];
  alertas: {codigo: string; tipo: string}[];
}
export function Dimension({activities, notify}: {activities: Activity[]; notify: (s: string) => void}) {
  const [params, setParams] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<DimensionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState(false);
  useEffect(() => { void call<Record<string, unknown>>('/dimensionamento/parametros').then(setParams).catch(err => notify((err as Error).message)); }, []);
  const calculate = async () => {
    setBusy(true);
    try {
      if (changed) await send('/dimensionamento/parametros', {dados: params}, 'PUT');
      setResult(await call<DimensionResult>('/dimensionamento/resultado')); setChanged(false);
    } catch (err) {notify((err as Error).message);} finally {setBusy(false);}
  };
  const set = (key: string, value: string) => {setParams({...params, [key]: Number(value)}); setChanged(true);};
  const over = (code: string, key: string, value: number | boolean) => {
    const current = (params.over || {}) as Record<string, Record<string, unknown>>;
    setParams({...params, over: {...current, [code]: {...current[code], [key]: value}}}); setChanged(true);
  };
  return <div className="cr-page cr-dimension"><section className="cr-card"><div className="cr-card-head"><div><p className="cr-eyebrow">CÁLCULO DE PESSOAS</p><h2>Parâmetros</h2></div></div><div className="cr-form">{[
    ['turno', 'Expediente (min)'], ['intervalos', 'Intervalos (min)'], ['demanda', 'Demanda (formas/dia)'],
    ['disponiveis', 'Pessoas hoje'], ['tolPes', 'Tolerância pessoal (%)'], ['tolFad', 'Fadiga (%)'],
    ['tolEsp', 'Espera (%)'], ['eta', 'Eficiência (%)'], ['conf', 'Confiança z'],
    ['erro', 'Erro desejado (%)'], ['outl', 'Regra de anormais (desvios)']
  ].map(([key, label]) => field(label, String(params[key] ?? ''), value => set(key, value), 'number'))}</div><button className="cr-btn cr-red" disabled={busy} onClick={() => void calculate()}>{busy ? 'Calculando…' : 'Calcular dimensionamento'}</button></section>
    <div className="cr-dimension-results">{result ? <><section className="cr-highlight"><p>Equipe necessária</p><strong>{result.N_arred}</strong><span>pessoas · cálculo contínuo {number(result.N, 1)}</span></section>{result.atividades.some(item => item.fonte === 'estimativa') && <p className="cr-warn">Estimativa: há atividades sem amostra suficiente. Os tempos previstos serão substituídos pelas médias medidas após a coleta.</p>}<div className="cr-kpis"><div className="cr-kpi"><span>Takt time</span><strong>{number(result.takt, 2)}</strong><small>min/forma</small></div><div className="cr-kpi"><span>Conteúdo de trabalho</span><strong>{number(result.HM, 1)}</strong><small>homem-min/forma</small></div><div className="cr-kpi"><span>Capacidade atual</span><strong>{number(result.capacidade, 0)}</strong><small>formas/dia</small></div></div><section className="cr-card"><h2>Carga por etapa</h2>{Object.entries(result.etapas).map(([key, value]) => <div className="cr-stage-load" key={key}><span>{stages[key as Process]}</span><div><i style={{width: `${Math.min(100, value / result.HM * 100)}%`}}/></div><strong>{number(value, 1)} HM</strong></div>)}</section></> : <section className="cr-card cr-empty">Ajuste os parâmetros e calcule para ver a equipe necessária, a carga de cada etapa e os alertas.</section>}</div>
    <section className="cr-card cr-span"><div className="cr-card-head"><div><p className="cr-eyebrow">MEMÓRIA DE CÁLCULO</p><h2>Atividades</h2></div></div><div className="cr-table-scroll"><table><thead><tr><th>Usar</th><th>Código</th><th>Etapa</th><th>n</th><th>TO</th><th>Fonte</th><th>Pessoas</th><th>Ritmo %</th><th>TN</th><th>TP</th><th>Frequência</th><th>HM/forma</th></tr></thead><tbody>{activities.map(item => {const row = result?.atividades.find(value => value.codigo === item.codigo); const current = ((params.over || {}) as Record<string, Record<string, unknown>>)[item.codigo] || {}; return <tr key={item.codigo}><td><input type="checkbox" checked={Boolean(current.usar ?? item.tipo !== 'espera')} onChange={event => over(item.codigo, 'usar', event.target.checked)}/></td><td className="cr-code">{item.codigo}</td><td>{stages[item.processo]}</td><td>{row?.n ?? '—'}</td><td>{number(row?.TO, 2)}</td><td>{row?.fonte || '—'}</td><td>{row?.pessoas ?? item.pessoas_padrao}</td><td><input className="cr-table-input" type="number" value={String(current.ritmo ?? 100)} onChange={event => over(item.codigo, 'ritmo', Number(event.target.value))}/></td><td>{number(row?.TN, 2)}</td><td>{number(row?.TP, 2)}</td><td><input className="cr-table-input" type="number" step="0.01" value={String(current.freq ?? (item.por_cacamba ? row?.freq ?? 1 : 1))} onChange={event => over(item.codigo, 'freq', Number(event.target.value))}/></td><td>{number(row?.HMf, 2)}</td></tr>;})}</tbody></table></div>{result?.alertas.length ? <p className="cr-warn">{result.alertas.length} alerta(s) de amostra ou takt. Revise as linhas da tabela.</p> : null}</section>
  </div>;
}

type SimulationTab = 'base' | 'sequencias' | 'layout' | 'tempos' | 'historico';
type WorkerOutput = {id: string; type: 'progress' | 'done' | 'error'; completed?: number; total?: number; result?: unknown; message?: string};
interface LayoutApiRow {setor: number; distancia_monovia_m: number; filas: number; formas_por_fila: number; primeira_forma_m: number; ultima_forma_m: number; lancamento_min_por_forma: number; regra_cacambas: string; corredor_m: number | null; setor_montagem_m: number | null}
function toLayout(rows: LayoutApiRow[]): Layout {
  return Object.fromEntries(rows.map(row => [row.setor, {dm: Number(row.distancia_monovia_m), filas: row.filas,
    nf: row.formas_por_fila, d1: Number(row.primeira_forma_m), dn: Number(row.ultima_forma_m),
    tl: Number(row.lancamento_min_por_forma), regra: row.regra_cacambas,
    cor: row.corredor_m === null ? '' : Number(row.corredor_m),
    dest: row.setor_montagem_m === null ? '' : Number(row.setor_montagem_m)}])) as Layout;
}
const simulationFields: [string, string, string][] = [
  ['dias','Dias','number'],['nMont','Equipe montagem','number'],['nPinos','Equipe pinos','number'],
  ['vCarr','Velocidade carrinho (m/min)','number'],['vVazia','Velocidade vazio (m/min)','number'],
  ['vMono','Velocidade monovia (m/min)','number'],['hDesforma','Início desforma','time'],
  ['hConcIni','Início concretagem','time'],['hMontIni','Início montagem','time'],
  ['hExtraIni','Hora extra a partir de','time'],['hFim','Fim expediente','time'],
  ['hPinosIni','Início pinos','time'],['hPinosFim','Fim pinos','time'],
  ['curaH','Cura (h)','number'],['pinosH','Pinos (h)','number'],
  ['probReprov','Reprovação (%)','number'],['retrabalho','Retrabalho (min)','number']
];
const metric = (summary: Summary | undefined, key: Exclude<keyof Summary, 'recursos' | 'timeline'>) => {
  const value = summary?.[key];
  return value && !Array.isArray(value) ? `${number(value.m, 1)} ± ${number(value.h, 1)}` : '—';
};
export function Simulation({activities, notify}: {activities: Activity[]; notify: (s: string) => void}) {
  const [tab, setTab] = useState<SimulationTab>('base');
  const [base, setBase] = useState<SimulationConfig | null>(null);
  const [scenario, setScenario] = useState<SimulationConfig | null>(null);
  const [layoutRows, setLayoutRows] = useState<LayoutApiRow[]>([]);
  const [times, setTimes] = useState<TimeCatalog>({});
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [kind, setKind] = useState<'base' | 'sequences' | 'compare'>('base');
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [reps, setReps] = useState(100);
  const [scenarioName, setScenarioName] = useState('Cenário de estudo');
  const workerRef = useRef<Worker | null>(null);
  useEffect(() => {
    void Promise.all([call<SimulationConfig>('/simulacao/config'), call<LayoutApiRow[]>('/simulacao/layout'),
      call<TimeCatalog>('/simulacao/tempos'), call<Record<string, unknown>[]>('/simulacoes')])
      .then(([cfg, rows, catalog, past]) => {setBase(cfg); setScenario({...cfg}); setLayoutRows(rows); setTimes(catalog); setHistory(past);})
      .catch(err => notify((err as Error).message));
    return () => workerRef.current?.terminate();
  }, []);
  const run = (next: typeof kind) => {
    if (!base || !scenario || layoutRows.length !== 4) {notify('Carregue a configuração e os quatro setores.'); return;}
    workerRef.current?.terminate();
    const worker = new Worker(new URL('./engine.worker.ts', import.meta.url), {type: 'module'});
    workerRef.current = worker; setRunning(true); setProgress(0); setKind(next);
    const id = crypto.randomUUID();
    worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
      if (event.data.id !== id) return;
      if (event.data.type === 'progress') setProgress(Math.round(100 * (event.data.completed || 0) / (event.data.total || 1)));
      if (event.data.type === 'done') {setResult(event.data.result); setRunning(false); worker.terminate();}
      if (event.data.type === 'error') {notify(event.data.message || 'Falha na simulação.'); setRunning(false); worker.terminate();}
    };
    const job: WorkerInput = {id, kind: next, replicacoes: reps, base,
      scenario: next === 'compare' ? scenario : undefined, layout: toLayout(layoutRows), times};
    worker.postMessage(job);
  };
  const save = async () => {
    if (!result || !base) return;
    try {
      await send('/simulacoes', {tipo: kind === 'sequences' ? 'sequencias' : 'base_cenario',
        replicacoes: reps, entradas: {base, scenario: kind === 'compare' ? scenario : null,
          layout: layoutRows, tempos: times}, resultado: result, motor_versao: 'engine-ts-1.0.0', nota: scenarioName});
      setHistory(await call<Record<string, unknown>[]>('/simulacoes'));
      notify('Rodada salva no Laboratório.');
    } catch (err) {notify((err as Error).message);}
  };
  const saveLayout = async () => {
    try {setLayoutRows(await send<LayoutApiRow[]>('/simulacao/layout', layoutRows.map(row => ({
      setor: row.setor, distancia_monovia_m: row.distancia_monovia_m,
      filas: row.filas, formas_por_fila: row.formas_por_fila,
      primeira_forma_m: row.primeira_forma_m, ultima_forma_m: row.ultima_forma_m,
      lancamento_min_por_forma: row.lancamento_min_por_forma,
      regra_cacambas: row.regra_cacambas, corredor_m: row.corredor_m,
      setor_montagem_m: row.setor_montagem_m
    })), 'PUT')); notify('Layout salvo.');}
    catch (err) {notify((err as Error).message);}
  };
  const summary = result as Summary | null;
  const comparison = result as {base: Summary; scenario: Summary; difference: Summary} | null;
  const sequences = result as {entries: {policy: {setor: string; dentro: string}; summary: Summary}[]; recommendation: {setor: string; dentro: string} | null} | null;
  const daySummary = kind === 'compare' ? comparison?.scenario : kind === 'base' ? summary : null;
  return <div className="cr-page"><section className="cr-card"><div className="cr-card-head"><div><p className="cr-eyebrow">FÁBRICA DE POSTES</p><h2>Simular</h2></div><div className="cr-actions"><label>Replicações <input className="cr-small-input" type="number" min="1" max="1000" value={reps} onChange={event => setReps(Math.max(1, Math.min(1000, Number(event.target.value))))}/></label><button className="cr-btn cr-red" disabled={running || !base || !scenario || layoutRows.length !== 4} onClick={() => run(tab === 'sequencias' ? 'sequences' : 'compare')}>{running ? 'Simulando…' : tab === 'sequencias' ? 'Comparar 6 sequências' : 'Rodar cenário'}</button></div></div><div className="cr-tabs">{([['base','Base × cenário'],['sequencias','Sequências'],['layout','Layout'],['tempos','Tempos'],['historico','Histórico']] as [SimulationTab,string][]).map(([key,label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</div>{running && <div className="cr-progress"><i style={{width: `${progress}%`}}/>{progress}%</div>}
      {tab === 'base' && base && scenario && <><div className="cr-scenario-head"><label>Nome do cenário<input value={scenarioName} onChange={event => setScenarioName(event.target.value)}/></label><button className="cr-btn cr-light" onClick={() => run('base')}>Rodar apenas a base</button></div><div className="cr-compare-grid"><div><h3>Base atual</h3><div className="cr-form">{simulationFields.map(([key,label]) => field(label, base[key], () => {}, key.includes('h') && key.startsWith('h') ? 'time' : key === 'dias' ? 'number' : 'text'))}</div></div><div><h3>Cenário</h3><div className="cr-form">{simulationFields.map(([key,label,type]) => <label key={key} className={scenario[key] !== base[key] ? 'cr-different' : ''}>{label}<input type={type} value={String(scenario[key])} onChange={event => setScenario({...scenario, [key]: type === 'number' ? Number(event.target.value) : event.target.value})}/></label>)}</div></div></div></>}
      {tab === 'sequencias' && <p className="cr-muted">As seis combinações usam os mesmos sorteios. A recomendação privilegia concluir todas as formas com menos hora extra.</p>}
      {tab === 'layout' && <><div className="cr-table-scroll"><table><thead><tr><th>Setor</th><th>Dist. monovia</th><th>Filas</th><th>Formas/fila</th><th>Primeira forma</th><th>Última forma</th><th>Lançamento min</th><th>Regra caçambas</th></tr></thead><tbody>{layoutRows.map((row,index) => <tr key={row.setor}><td>S{row.setor}</td>{(['distancia_monovia_m','filas','formas_por_fila','primeira_forma_m','ultima_forma_m','lancamento_min_por_forma','regra_cacambas'] as (keyof LayoutApiRow)[]).map(key => <td key={key}><input className="cr-table-input" value={String(row[key] ?? '')} onChange={event => setLayoutRows(previous => previous.map((item,i) => i === index ? {...item,[key]: key === 'regra_cacambas' ? event.target.value : Number(event.target.value)} : item))}/></td>)}</tr>)}</tbody></table></div><button className="cr-btn cr-light" onClick={() => void saveLayout()}>Salvar layout</button></>}
      {tab === 'tempos' && <div className="cr-table-scroll"><table><thead><tr><th>Atividade</th><th>Etapa</th><th>Origem</th><th>n</th><th>Média min</th><th>CV</th></tr></thead><tbody>{activities.map(item => <tr key={item.codigo}><td><span className="cr-code">{item.codigo}</span> {item.nome}</td><td>{stages[item.processo]}</td><td><span className={`cr-sample ${times[item.codigo]?.fonte === 'medido' ? 'good' : 'warn'}`}>{times[item.codigo]?.fonte || 'estimativa'}</span></td><td>{times[item.codigo]?.n || 0}</td><td>{number(times[item.codigo]?.media, 2)}</td><td>{number((times[item.codigo]?.cv || 0) * 100, 1)}%</td></tr>)}</tbody></table></div>}
      {tab === 'historico' && <div className="cr-table-scroll"><table><thead><tr><th>Data</th><th>Tipo</th><th>Replicações</th><th>Versão</th><th>Nota</th></tr></thead><tbody>{history.map(item => <tr key={String(item.id)}><td>{date(String(item.criado_em))}</td><td>{String(item.tipo)}</td><td>{String(item.replicacoes)}</td><td>{String(item.motor_versao)}</td><td>{String(item.nota || '—')}</td></tr>)}</tbody></table>{!history.length && <p className="cr-empty">Nenhuma simulação salva. Rode um cenário para iniciar o histórico.</p>}</div>}
    </section>
    {result !== null && <section className="cr-card"><div className="cr-card-head"><div><p className="cr-eyebrow">RESULTADO DA RODADA</p><h2>{kind === 'sequences' ? 'Comparação de sequências' : 'Resumo de produção'}</h2></div><button className="cr-btn cr-green" onClick={() => void save()}>Salvar rodada</button></div>
      {kind === 'sequences' && sequences ? <div className="cr-table-scroll"><table><thead><tr><th>Ordem dos setores</th><th>Dentro do setor</th><th>Fim concretagem</th><th>Hora extra</th><th>Formas concluídas</th></tr></thead><tbody>{sequences.entries.map((entry,index) => <tr key={index} className={entry.policy.setor === sequences.recommendation?.setor && entry.policy.dentro === sequences.recommendation?.dentro ? 'cr-recommended' : ''}><td>{entry.policy.setor}</td><td>{entry.policy.dentro}</td><td>{metric(entry.summary,'fimConc')}</td><td>{metric(entry.summary,'extra')}</td><td>{metric(entry.summary,'nConc')}</td></tr>)}</tbody></table></div> : <><div className="cr-kpis"><div className="cr-kpi"><span>Fim da concretagem · IC 95%</span><strong>{metric(kind === 'compare' ? comparison?.scenario : summary || undefined,'fimConc')}</strong></div><div className="cr-kpi"><span>Fim da montagem</span><strong>{metric(kind === 'compare' ? comparison?.scenario : summary || undefined,'fimMont')}</strong></div><div className="cr-kpi"><span>Hora extra</span><strong>{metric(kind === 'compare' ? comparison?.scenario : summary || undefined,'extra')}</strong></div><div className="cr-kpi"><span>Última forma liberada</span><strong>{metric(kind === 'compare' ? comparison?.scenario : summary || undefined,'fimLivre')}</strong></div></div>{kind === 'compare' && comparison && <p className="cr-info">Diferença para a base no fim da concretagem: {metric(comparison.difference,'fimConc')} min.</p>}<div className="cr-kpis"><div className="cr-kpi"><span>Espera acabamento</span><strong>{metric(kind === 'compare' ? comparison?.scenario : summary || undefined,'acab')}</strong></div><div className="cr-kpi"><span>Pinos fora do horário</span><strong>{metric(kind === 'compare' ? comparison?.scenario : summary || undefined,'pinosLate')}</strong></div><div className="cr-kpi"><span>Interferência</span><strong>{metric(kind === 'compare' ? comparison?.scenario : summary || undefined,'inter')}</strong></div></div><h3>Ocupação por recurso</h3>{(kind === 'compare' ? comparison?.scenario : summary)?.recursos.map((resource,index) => <div key={index} className="cr-stage-load"><span>{resource.name}</span><div><i className={resource.util.m > 0.85 ? 'over' : ''} style={{width: `${Math.min(100, resource.util.m * 100)}%`}}/></div><strong>{number(resource.util.m * 100, 0)}%</strong></div>)}</>}
      {daySummary?.timeline && <div className="cr-timeline"><h3>Linha do tempo por setor</h3><div className="cr-table-scroll"><table><thead><tr><th>Setor</th><th>Desforma</th><th>Montagem</th><th>Concretagem</th><th>Pinos</th></tr></thead><tbody>{[1,2,3,4].map(sector => <tr key={sector}><td>S{sector}</td>{['desforma','montagem','concretagem','pinos'].map(step => {const minutes = daySummary.timeline[String(sector)]?.[step]?.m; return <td key={step} className="cr-mono">{Number.isFinite(minutes) ? `${String(Math.floor(minutes / 60)).padStart(2,'0')}:${String(Math.floor(minutes % 60)).padStart(2,'0')}` : '—'}</td>;})}</tr>)}</tbody></table></div></div>}
    </section>}
  </div>;
}

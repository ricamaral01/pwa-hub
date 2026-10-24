import {useEffect, useState} from 'react';
import {cache} from './storage';
import {Activity, Context, Measurement, Pause, Process, Queued, Stat, Timer, initialContext, stages, version} from './models';

const reasons = ['Aguardando material', 'Aguardando ponte', 'Interferência', 'Pausa operacional', 'Outro'];
const iso = (value: number) => new Date(value).toISOString();
const seconds = (a: string, b: string) => Math.max(0, (Date.parse(b) - Date.parse(a)) / 1000);
const formatted = (value: number) => {
  const whole = Math.floor(Math.max(0, value));
  return `${String(Math.floor(whole / 3600)).padStart(2, '0')}:${String(Math.floor(whole % 3600 / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
};
function elapsed(timer: Timer, now: number): number {
  const gross = (now - Date.parse(timer.inicio)) / 1000;
  const stopped = timer.pausas.reduce((sum, pause) => sum + seconds(pause.inicio, pause.fim), 0);
  const current = timer.pausa_inicio ? (now - Date.parse(timer.pausa_inicio)) / 1000 : 0;
  return Math.max(0, gross - stopped - current);
}

export function Collect({activities, stats, setQueue, notify, onActive}: {
  activities: Activity[]; stats: Record<string, Stat>;
  setQueue: React.Dispatch<React.SetStateAction<Queued[]>>; notify: (message: string) => void;
  onActive: (count: number) => void;
}) {
  const [context, setContext] = useState<Context>(initialContext);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [people, setPeople] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());
  const [distance, setDistance] = useState<Record<string, string>>({});
  const [observation, setObservation] = useState<Record<string, string>>({});
  const [discard, setDiscard] = useState<string | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});

  useEffect(() => {
    void Promise.all([
      cache.read<Context>('contexto', 'atual'),
      cache.all<Timer>('cronometros_ativos'),
      cache.read<Record<string, number>>('pessoas_por_atividade', 'atual')
    ]).then(([saved, active, values]) => {
      if (saved) setContext(saved);
      setTimers(active);
      if (values) setPeople(values);
    });
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => { void cache.put('contexto', 'atual', context); }, [context]);
  useEffect(() => { void cache.put('pessoas_por_atividade', 'atual', people); }, [people]);
  useEffect(() => { onActive(timers.length); }, [timers.length, onActive]);
  useEffect(() => {
    if (!('wakeLock' in navigator) || !timers.some(timer => !timer.pausa_inicio)) return;
    let released = false;
    let lock: WakeLockSentinel | undefined;
    void navigator.wakeLock.request('screen').then(value => {
      if (released) void value.release(); else lock = value;
    }).catch(() => {});
    return () => { released = true; void lock?.release(); };
  }, [timers]);

  const update = (timer: Timer) => {
    setTimers(previous => previous.map(item => item.id === timer.id ? timer : item));
    void cache.put('cronometros_ativos', timer.id, timer);
  };
  const start = (activity: Activity) => {
    if (!context.setor || !context.forma.trim() || !context.tipo_poste.trim() ||
        !context.cronometrista_nome.trim()) {
      notify('Informe setor, forma, tipo de poste e cronometrista antes de iniciar.');
      return;
    }
    const timer: Timer = {
      id: crypto.randomUUID(), atividade_codigo: activity.codigo, atividade_nome: activity.nome,
      inicio: iso(Date.now()), pausas: [], pessoas: people[activity.codigo] || activity.pessoas_padrao,
      contexto: {...context}
    };
    setTimers(previous => [timer, ...previous]);
    void cache.put('cronometros_ativos', timer.id, timer);
  };
  const pause = (timer: Timer) => {
    const motive = reason[timer.id];
    if (!motive) { notify('Escolha o motivo da pausa.'); return; }
    update({...timer, pausa_inicio: iso(Date.now()), pausa_motivo: motive});
  };
  const resume = (timer: Timer) => {
    if (!timer.pausa_inicio || !timer.pausa_motivo) return;
    update({...timer, pausas: [...timer.pausas,
      {inicio: timer.pausa_inicio, fim: iso(Date.now()), motivo: timer.pausa_motivo}],
      pausa_inicio: undefined, pausa_motivo: undefined});
  };
  const finish = async (timer: Timer) => {
    const activity = activities.find(item => item.codigo === timer.atividade_codigo);
    const meters = distance[timer.id] ? Number(distance[timer.id].replace(',', '.')) : null;
    if (activity?.tipo === 'deslocamento' && (!meters || meters <= 0)) {
      notify('Informe a distância percorrida para este deslocamento.'); return;
    }
    const end = iso(Date.now());
    const pauses: Pause[] = timer.pausa_inicio ? [...timer.pausas, {
      inicio: timer.pausa_inicio, fim: end, motivo: timer.pausa_motivo || 'Pausa operacional'
    }] : timer.pausas;
    const measurement: Measurement = {
      id: timer.id, atividade_codigo: timer.atividade_codigo,
      setor: timer.contexto.setor ? Number(timer.contexto.setor) : null,
      forma: timer.contexto.forma || null, tipo_poste: timer.contexto.tipo_poste || null,
      equipamento: timer.contexto.equipamento || null, batelada: timer.contexto.batelada || null,
      cronometrista_nome: timer.contexto.cronometrista_nome || null,
      pessoas: timer.pessoas, inicio: timer.inicio, fim: end,
      bruta_s: seconds(timer.inicio, end),
      duracao_s: Math.max(0, seconds(timer.inicio, end) - pauses.reduce((sum, p) => sum + seconds(p.inicio, p.fim), 0)),
      pausas: pauses, distancia_m: meters, observacao: observation[timer.id] || null,
      dispositivo_id: localStorage.getItem('crono_dispositivo') || 'web', app_versao: version
    };
    const entry: Queued = {id: measurement.id, medicao: measurement};
    await cache.put('fila_envio', entry.id, entry);
    setQueue(previous => [...previous, entry]);
    await cache.remove('cronometros_ativos', timer.id);
    setTimers(previous => previous.filter(item => item.id !== timer.id));
    notify(navigator.onLine ? 'Medição salva. Sincronizando…' : 'Medição salva no aparelho.');
  };
  const drop = async (timer: Timer) => {
    if (discard !== timer.id) { setDiscard(timer.id); return; }
    await cache.remove('cronometros_ativos', timer.id);
    setTimers(previous => previous.filter(item => item.id !== timer.id));
    setDiscard(null);
  };

  const active = activities.filter(item => item.ativo && item.processo === context.processo);
  return <div className="cr-collect">
    <section className="cr-card cr-context">
      <div className="cr-card-head"><div><p className="cr-eyebrow">COLETA DE TEMPOS</p><h2>Contexto da medição</h2></div><span className="cr-muted">Preencha uma vez para os próximos cronômetros</span></div>
      <div className="cr-pills">{(Object.keys(stages) as Process[]).map(stage => <button key={stage}
        className={context.processo === stage ? 'selected' : ''}
        onClick={() => setContext({...context, processo: stage})}>{stages[stage]}</button>)}</div>
      <div className="cr-fields">
        <label>Setor<select value={context.setor} onChange={event => setContext({...context, setor: event.target.value})}><option value="">Selecionar</option>{[1, 2, 3, 4].map(n => <option key={n} value={n}>Setor {n}</option>)}</select></label>
        <label>Forma<input value={context.forma} onChange={event => setContext({...context, forma: event.target.value})} placeholder="Identificação" /></label>
        <label>Tipo de poste<input value={context.tipo_poste} onChange={event => setContext({...context, tipo_poste: event.target.value})} placeholder="Tipo" list="cr-tipos" /><datalist id="cr-tipos"><option value="Duplo T"/><option value="Circular"/></datalist></label>
        <label>Equipamento<input value={context.equipamento} onChange={event => setContext({...context, equipamento: event.target.value})} placeholder="Equipamento" /></label>
        <label>Batelada<input value={context.batelada} onChange={event => setContext({...context, batelada: event.target.value})} placeholder="Batelada" /></label>
        <label>Cronometrista<input value={context.cronometrista_nome} onChange={event => setContext({...context, cronometrista_nome: event.target.value})} placeholder="Nome" /></label>
      </div>
    </section>
    <div className="cr-collect-columns">
      <section className="cr-card"><div className="cr-card-head"><div><p className="cr-eyebrow">{stages[context.processo].toUpperCase()}</p><h2>Atividades</h2></div><span className="cr-count">{active.length}</span></div>
        {active.length ? <div className="cr-activity-list">{active.map(activity => {
          const stat = stats[activity.codigo];
          const n = stat?.n || 0; const needed = stat?.n_necessario || 10;
          return <article className="cr-activity" key={activity.codigo}>
            <div className="cr-activity-top"><strong className="cr-code">{activity.codigo}</strong><div><h3>{activity.nome}</h3><small>Início: {activity.ponto_inicio}<br/>Fim: {activity.ponto_fim}</small></div></div>
            <div className="cr-activity-bottom"><span className={`cr-sample ${n >= needed ? 'good' : n >= 10 ? 'warn' : 'crit'}`}>{n}/{needed} medições</span>
              <span className="cr-person"><button aria-label={`Menos pessoas em ${activity.codigo}`} onClick={() => setPeople({...people, [activity.codigo]: Math.max(1, (people[activity.codigo] || activity.pessoas_padrao) - 1)})}>−</button>{people[activity.codigo] || activity.pessoas_padrao}<button aria-label={`Mais pessoas em ${activity.codigo}`} onClick={() => setPeople({...people, [activity.codigo]: (people[activity.codigo] || activity.pessoas_padrao) + 1})}>+</button></span>
              <button className="cr-btn cr-green" onClick={() => start(activity)}>Iniciar</button></div>
          </article>;
        })}</div> : <p className="cr-empty">Nenhuma atividade ativa nesta etapa.</p>}
      </section>
      <section className="cr-card cr-running"><div className="cr-card-head"><div><p className="cr-eyebrow">TEMPO REAL</p><h2>Em andamento</h2></div><span className="cr-count">{timers.length}</span></div>
        {timers.length ? timers.map(timer => <article key={timer.id} className="cr-timer">
          <div className="cr-timer-title"><span className="cr-code">{timer.atividade_codigo}</span><strong>{timer.atividade_nome}</strong></div>
          <div className="cr-clock" aria-label="Tempo efetivo">{formatted(elapsed(timer, now))}</div>
          <p className="cr-muted">{timer.pausa_inicio ? 'Pausado' : 'Em andamento'} · {timer.pessoas} pessoa(s) · {timer.contexto.setor ? `Setor ${timer.contexto.setor}` : 'Setor não informado'}</p>
          {timer.finalizando ? <div className="cr-finish">
            <h3>Finalizar medição</h3>
            <label>Distância percorrida (m){activities.find(item => item.codigo === timer.atividade_codigo)?.tipo === 'deslocamento' ? ' *' : ''}<input inputMode="decimal" value={distance[timer.id] || ''} onChange={event => setDistance({...distance, [timer.id]: event.target.value})}/></label>
            <label>Observação<textarea value={observation[timer.id] || ''} onChange={event => setObservation({...observation, [timer.id]: event.target.value})}/></label>
            <div className="cr-actions"><button className="cr-btn cr-red" onClick={() => void finish(timer)}>Salvar medição</button><button className="cr-btn cr-light" onClick={() => update({...timer, finalizando: false})}>Voltar ao cronômetro</button><button className="cr-btn cr-quiet" onClick={() => void drop(timer)}>{discard === timer.id ? 'Confirmar descarte' : 'Descartar'}</button></div>
          </div> : <div className="cr-actions">
            {timer.pausa_inicio ? <button className="cr-btn cr-green" onClick={() => resume(timer)}>Retomar</button> : <><select aria-label="Motivo da pausa" value={reason[timer.id] || ''} onChange={event => setReason({...reason, [timer.id]: event.target.value})}><option value="">Motivo da pausa</option>{reasons.map(item => <option key={item}>{item}</option>)}</select><button className="cr-btn cr-light" onClick={() => pause(timer)}>Pausar</button></>}
            <button className="cr-btn cr-red" onClick={() => update({...timer, finalizando: true})}>Finalizar</button>
          </div>}
        </article>) : <div className="cr-empty">Inicie uma atividade para cronometrar. Vários cronômetros podem rodar ao mesmo tempo, inclusive sem internet.</div>}
      </section>
    </div>
  </div>;
}

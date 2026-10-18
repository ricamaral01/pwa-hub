import {diaProducao, lognormal, meanCI, POL_LIST, polOf} from './engine';
import type {DayResult, Policy, Summary, TimeCatalog, WorkerInput} from './engine-types';

const numeric: Array<Exclude<keyof DayResult, 'res'>> = [
  'total', 'nConc', 'fimConc', 'fimMont', 'fimLivre', 'extra', 'acab', 'acabMax',
  'car', 'carMax', 'pinosLate', 'pinosFim', 'inter', 'bloq', 'pass', 'idade', 'esperaPronta'
];

function sampler(times: TimeCatalog) {
  const sample = (code: string, sector: number, random: () => number): number => {
    const activity = times[code];
    if (!activity) return lognormal(random, 1, 0.3);
    const stratum = activity.por_setor[String(sector)];
    const selected = stratum?.n >= 3 ? {media: stratum.media_min, cv: stratum.cv} : activity;
    return lognormal(random, selected.media, selected.cv);
  };
  return Object.assign(sample, {med: (code: string) => times[code]?.fonte === 'medido'});
}

function summarize(days: DayResult[]): Summary {
  const result = {} as Summary;
  for (const key of numeric) result[key] = meanCI(days.map(day => day[key]));
  const names = days[0]?.res.map(resource => resource.name) ?? [];
  result.recursos = names.map((name, index) => ({
    name,
    util: meanCI(days.map(day => day.res[index].util)),
    wait: meanCI(days.map(day => day.res[index].wait))
  }));
  return result;
}

function pairedDifference(base: DayResult[], scenario: DayResult[]): Summary {
  const delta = scenario.map((day, index) => ({
    ...day,
    ...Object.fromEntries(numeric.map(key => [key, day[key] - base[index][key]])),
    res: day.res.map((resource, r) => ({
      name: resource.name,
      util: resource.util - base[index].res[r].util,
      wait: resource.wait - base[index].res[r].wait
    }))
  })) as DayResult[];
  return summarize(delta);
}

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  const job = event.data;
  const count = Math.max(1, Math.min(1000, Math.floor(job.replicacoes)));
  const T = sampler(job.times);
  const policies = job.kind === 'sequences' ? POL_LIST as Policy[] :
    [job.policy ?? polOf(job.base.pol) as Policy];
  const total = count * policies.length * (job.kind === 'compare' ? 2 : 1);
  let completed = 0;
  const run = (cfg: WorkerInput['base'], policy: Policy, startSeed: number): DayResult[] => {
    const result: DayResult[] = [];
    for (let i = 0; i < count; i++) {
      result.push(diaProducao(cfg, job.layout, policy, T, startSeed + i) as DayResult);
      self.postMessage({id: job.id, type: 'progress', completed: ++completed, total});
    }
    return result;
  };
  try {
    if (job.kind === 'sequences') {
      const entries = policies.map(policy => {
        const days = run(job.base, policy, 2000);
        return {policy, summary: summarize(days), days};
      });
      const complete = entries.filter(entry => entry.summary.nConc.m >= entry.summary.total.m - 1e-9);
      const recommendation = [...complete].sort((a, b) =>
        a.summary.extra.m - b.summary.extra.m || a.summary.fimConc.m - b.summary.fimConc.m)[0] ?? null;
      self.postMessage({id: job.id, type: 'done', result: {
        entries: entries.map(({policy, summary}) => ({policy, summary})),
        recommendation: recommendation?.policy ?? null
      }});
    } else if (job.kind === 'compare' && job.scenario) {
      const policy = policies[0];
      const base = run(job.base, policy, 1000);
      const scenario = run(job.scenario, policy, 1000);
      self.postMessage({id: job.id, type: 'done', result: {
        base: summarize(base), scenario: summarize(scenario), difference: pairedDifference(base, scenario)
      }});
    } else {
      self.postMessage({id: job.id, type: 'done', result: summarize(run(job.base, policies[0], 1000))});
    }
  } catch (error) {
    self.postMessage({id: job.id, type: 'error', message: error instanceof Error ? error.message : String(error)});
  }
};

export type Sector = 1 | 2 | 3 | 4;
export type SectorOrder = 'longe' | 'perto' | 'alternado';
export type FormOrder = 'longe' | 'perto';
export interface Policy { setor: SectorOrder; dentro: FormOrder }

export interface SectorLayout {
  dm: number; filas: number; nf: number; d1: number; dn: number;
  tl: number; regra: string; cor: number | ''; dest: number | '';
}
export type Layout = Record<Sector, SectorLayout>;

export interface SimulationConfig {
  dias: number; vCarr: number; vVazia: number; vMono: number;
  hDesforma: string; hConcIni: string; hMontIni: string; hExtraIni: string;
  hFim: string; hPinosIni: string; hPinosFim: string;
  nMont: number; nPinos: number; corredor: number; curaH: number; pinosH: number;
  probReprov: number; retrabalho: number;
  [key: string]: number | string;
}

export interface SectorTime { n: number; media_min: number; cv: number }
export interface ActivityTime {
  media: number; cv: number; fonte: 'medido' | 'estimativa'; n: number;
  por_setor: Record<string, SectorTime>;
}
export type TimeCatalog = Record<string, ActivityTime>;

export interface ResourceResult { name: string; util: number; wait: number }
export interface DayResult {
  total: number; nConc: number; fimConc: number; fimMont: number; fimLivre: number;
  extra: number; acab: number; acabMax: number; car: number; carMax: number;
  pinosLate: number; pinosFim: number; inter: number; bloq: number;
  pass: number; idade: number; esperaPronta: number; res: ResourceResult[];
}

export interface Interval { m: number; h: number }
export type Summary = Record<Exclude<keyof DayResult, 'res'>, Interval> & {
  recursos: Array<{name: string; util: Interval; wait: Interval}>;
};

export interface WorkerInput {
  id: string;
  kind: 'base' | 'sequences' | 'compare';
  replicacoes: number;
  base: SimulationConfig;
  scenario?: SimulationConfig;
  layout: Layout;
  times: TimeCatalog;
  policy?: Policy;
}

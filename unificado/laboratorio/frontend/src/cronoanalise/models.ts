export type Process = 'desforma' | 'montagem' | 'usina' | 'concretagem';
export const stages: Record<Process, string> = {
  desforma: 'Desforma', montagem: 'Montagem', usina: 'Usina', concretagem: 'Concretagem'
};
export interface Activity {
  codigo: string; processo: Process; nome: string; tipo: string; pessoas_padrao: number;
  estimativa_min: number; por_cacamba: boolean; ponto_inicio: string; ponto_fim: string;
  ordem: number; ativo: boolean;
}
export interface Stat {n: number; media_min?: number; cv?: number; n_necessario?: number; suficientes?: boolean}
export interface Pause {inicio: string; fim: string; motivo: string}
export interface Timer {
  id: string; atividade_codigo: string; atividade_nome: string; inicio: string;
  pessoas: number; pausas: Pause[]; pausa_inicio?: string; pausa_motivo?: string;
  contexto: Context; finalizando?: boolean;
}
export interface Context {
  processo: Process; setor: string; forma: string; tipo_poste: string;
  equipamento: string; batelada: string; cronometrista_nome: string;
}
export interface Measurement {
  id: string; atividade_codigo: string; setor: number | null; forma: string | null;
  tipo_poste: string | null; equipamento: string | null; batelada: string | null;
  pessoas: number; inicio: string; fim: string; bruta_s: number; duracao_s: number;
  pausas: Pause[]; distancia_m: number | null; observacao: string | null;
  cronometrista_nome: string | null; dispositivo_id: string; app_versao: string;
  valido?: boolean; invalid_motivo?: string;
}
export interface Queued {id: string; medicao: Measurement; erro?: string}
export const initialContext: Context = {
  processo: 'desforma', setor: '', forma: '', tipo_poste: '', equipamento: '',
  batelada: '', cronometrista_nome: ''
};
export const version = 'cronoanalise-1.0.0';

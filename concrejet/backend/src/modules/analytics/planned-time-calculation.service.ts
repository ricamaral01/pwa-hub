import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type PlannedInterval = {
  calendarioTurnoId: string;
  unidadeId: string;
  maquinaId: string | null;
  inicio: string;
  fim: string;
  brutoS: number;
  excluidoS: number;
  indisponibilidadePlanejadaS: number;
  planejadoLiquidoS: number;
  intervalosExcluidos: Array<{ inicio: string; fim: string; segundos: number; motivo?: string }>;
  indisponibilidadesPlanejadas: Array<{
    inicio: string;
    fim: string;
    segundos: number;
    motivo?: string;
  }>;
};

export type PlannedTimeResult = {
  tempoBrutoTurnoS: number;
  intervalosExcluidosS: number;
  indisponibilidadesPlanejadasS: number;
  tempoPlanejadoLiquidoS: number;
  turnos: PlannedInterval[];
  inconsistencias: string[];
};

type CalendarRow = {
  id: string;
  unidade_id: string;
  maquina_id: string | null;
  dia_semana: number;
  inicio_hora: string;
  fim_hora: string;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  intervalos_excluidos: Array<{ inicio: string; fim: string; motivo?: string }> | null;
  indisponibilidades_planejadas: Array<{ inicio: string; fim: string; motivo?: string }> | null;
};

@Injectable()
export class PlannedTimeCalculationService {
  constructor(private readonly dataSource: DataSource) {}

  async calculate(input: {
    empresaId: string;
    inicio: string;
    fim: string;
    unidadeId?: string | null;
    maquinaId?: string | null;
  }): Promise<PlannedTimeResult> {
    const start = new Date(input.inicio);
    const end = new Date(input.fim);
    const rows = await this.dataSource.query(
      `
        select *
        from calendario_turno
        where empresa_id = $1
          and ativo = true
          and ($2::uuid is null or unidade_id = $2::uuid)
          and ($3::uuid is null or maquina_id is null or maquina_id = $3::uuid)
          and vigencia_inicio <= $5::date
          and (vigencia_fim is null or vigencia_fim >= $4::date)
        order by maquina_id nulls last, unidade_id, dia_semana, inicio_hora
      `,
      [input.empresaId, input.unidadeId ?? null, input.maquinaId ?? null, input.inicio, input.fim],
    );
    const inconsistencias: string[] = [];
    if (!rows.length) {
      return emptyResult(['Calendario produtivo ausente para o periodo consultado.']);
    }

    const turnos: PlannedInterval[] = [];
    for (const day of daysBetween(start, end)) {
      const dow = day.getDay();
      for (const row of rows as CalendarRow[]) {
        if (row.dia_semana !== dow) continue;
        const turno = buildShift(day, row.inicio_hora, row.fim_hora);
        const clipped = overlap(turno.inicio, turno.fim, start, end);
        if (!clipped) continue;
        const excluded: Array<{ inicio: Date; fim: Date; motivo?: string }> = [];
        for (const item of row.intervalos_excluidos ?? []) {
          const interval = buildShift(day, item.inicio, item.fim, item.motivo);
          const cut = overlap(interval.inicio, interval.fim, clipped.inicio, clipped.fim);
          if (cut) excluded.push({ ...cut, motivo: interval.motivo });
        }
        const plannedDowntimes: Array<{ inicio: Date; fim: Date; motivo?: string }> = [];
        for (const item of row.indisponibilidades_planejadas ?? []) {
          const interval = buildShift(day, item.inicio, item.fim, item.motivo);
          const cut = overlap(interval.inicio, interval.fim, clipped.inicio, clipped.fim);
          if (cut) plannedDowntimes.push({ ...cut, motivo: interval.motivo });
        }
        const mergedExcluded = mergeIntervals(excluded);
        const mergedPlannedDowntimes = mergeIntervals(plannedDowntimes);
        const mergedNonProductive = mergeIntervals([...mergedExcluded, ...mergedPlannedDowntimes]);
        const brutoS = secondsBetween(clipped.inicio, clipped.fim);
        const excluidoS = mergedNonProductive.reduce(
          (sum, item) => sum + secondsBetween(item.inicio, item.fim),
          0,
        );
        const indisponibilidadePlanejadaS = mergedPlannedDowntimes.reduce(
          (sum, item) => sum + secondsBetween(item.inicio, item.fim),
          0,
        );
        turnos.push({
          calendarioTurnoId: row.id,
          unidadeId: row.unidade_id,
          maquinaId: row.maquina_id,
          inicio: clipped.inicio.toISOString(),
          fim: clipped.fim.toISOString(),
          brutoS,
          excluidoS,
          indisponibilidadePlanejadaS,
          planejadoLiquidoS: Math.max(0, brutoS - excluidoS),
          intervalosExcluidos: mergedExcluded.map((item) => ({
            inicio: item.inicio.toISOString(),
            fim: item.fim.toISOString(),
            segundos: secondsBetween(item.inicio, item.fim),
            motivo: item.motivo,
          })),
          indisponibilidadesPlanejadas: mergedPlannedDowntimes.map((item) => ({
            inicio: item.inicio.toISOString(),
            fim: item.fim.toISOString(),
            segundos: secondsBetween(item.inicio, item.fim),
            motivo: item.motivo,
          })),
        });
      }
    }
    if (!turnos.length)
      inconsistencias.push('Nenhum turno aplicavel sobrepoe o periodo consultado.');

    return {
      tempoBrutoTurnoS: roundSeconds(turnos.reduce((sum, item) => sum + item.brutoS, 0)),
      intervalosExcluidosS: roundSeconds(turnos.reduce((sum, item) => sum + item.excluidoS, 0)),
      indisponibilidadesPlanejadasS: roundSeconds(
        turnos.reduce((sum, item) => sum + item.indisponibilidadePlanejadaS, 0),
      ),
      tempoPlanejadoLiquidoS: roundSeconds(
        turnos.reduce((sum, item) => sum + item.planejadoLiquidoS, 0),
      ),
      turnos,
      inconsistencias,
    };
  }
}

export function overlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): { inicio: Date; fim: Date } | null {
  const inicio = new Date(Math.max(startA.getTime(), startB.getTime()));
  const fim = new Date(Math.min(endA.getTime(), endB.getTime()));
  return fim > inicio ? { inicio, fim } : null;
}

export function secondsBetween(inicio: Date, fim: Date): number {
  return roundSeconds((fim.getTime() - inicio.getTime()) / 1000);
}

function buildShift(day: Date, inicioHora: string, fimHora: string, motivo?: string) {
  const inicio = withTime(day, inicioHora);
  let fim = withTime(day, fimHora);
  if (fim <= inicio) fim = new Date(fim.getTime() + 86400_000);
  return { inicio, fim, motivo };
}

function withTime(day: Date, time: string): Date {
  const [h = '0', m = '0', s = '0'] = time.split(':');
  const date = new Date(day);
  date.setHours(Number(h), Number(m), Number(s), 0);
  return date;
}

function daysBetween(start: Date, end: Date): Date[] {
  const first = new Date(start);
  first.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  for (let day = first; day < end; day = new Date(day.getTime() + 86400_000)) {
    days.push(new Date(day));
  }
  return days;
}

function mergeIntervals<T extends { inicio: Date; fim: Date; motivo?: string }>(items: T[]): T[] {
  const ordered = [...items].sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  const merged: T[] = [];
  for (const item of ordered) {
    const last = merged.at(-1);
    if (!last || item.inicio > last.fim) merged.push({ ...item });
    else if (item.fim > last.fim) last.fim = item.fim;
  }
  return merged;
}

function emptyResult(inconsistencias: string[]): PlannedTimeResult {
  return {
    tempoBrutoTurnoS: 0,
    intervalosExcluidosS: 0,
    indisponibilidadesPlanejadasS: 0,
    tempoPlanejadoLiquidoS: 0,
    turnos: [],
    inconsistencias,
  };
}

function roundSeconds(value: number): number {
  return Math.round(value * 1000) / 1000;
}

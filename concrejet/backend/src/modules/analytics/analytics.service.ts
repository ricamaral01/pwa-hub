import { BadRequestException, Injectable, StreamableFile } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  overlap,
  PlannedTimeCalculationService,
  secondsBetween,
} from './planned-time-calculation.service';

const FORMULA_VERSION = 'oee-v1-2026-08-01';
const MAX_DAYS = 370;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly plannedTime: PlannedTimeCalculationService,
  ) {}

  async overview(user: { empresaId: string }, query: Record<string, unknown>) {
    const range = parseRange(query);
    const [production] = await this.production(user, query);
    const [losses] = await this.losses(user, query);
    const [stock] = await this.stock(user, query);
    const oee = await this.oee(user, query);
    return {
      periodo: range,
      production: production ?? {},
      losses: losses ?? {},
      stock: stock ?? {},
      oee: oee.resumo,
      formulaVersion: FORMULA_VERSION,
      atualizadoEm: new Date().toISOString(),
    };
  }

  async production(user: { empresaId: string }, query: Record<string, unknown>) {
    const range = parseRange(query);
    return this.dataSource.query(
      `
        select
          count(*) as apontamentos,
          count(*) filter (where status = 'concluido') as apontamentos_concluidos,
          coalesce(sum(pecas_boas),0)::int as pecas_boas,
          coalesce(sum(pecas_refugo),0)::int as pecas_refugo,
          coalesce(sum(falha_preenchimento_qtd),0)::int as falha_preenchimento,
          coalesce(sum(pecas_boas * peso_peca_aplicado_g / 1000),0)::numeric(14,3) as massa_util_kg,
          coalesce(avg(ciclo_real_s),0)::numeric(10,2) as ciclo_medio_real_s
        from apontamento
        where empresa_id = $1 and inicio_em >= $2 and inicio_em < $3
      `,
      [user.empresaId, range.inicio, range.fim],
    );
  }

  async losses(user: { empresaId: string }, query: Record<string, unknown>) {
    const range = parseRange(query);
    return this.dataSource.query(
      `
        select
          coalesce(sum(borra_kg),0)::numeric(14,3) as borra_kg,
          coalesce(sum(galho_kg),0)::numeric(14,3) as galho_kg,
          coalesce(sum(outras_perdas_kg),0)::numeric(14,3) as outras_perdas_kg,
          coalesce(sum(((pecas_refugo + falha_preenchimento_qtd) * peso_peca_aplicado_g / 1000) + borra_kg + galho_kg + outras_perdas_kg),0)::numeric(14,3) as perda_total_kg,
          coalesce(sum(((pecas_refugo + falha_preenchimento_qtd) * peso_peca_aplicado_g / 1000) + borra_kg + outras_perdas_kg),0)::numeric(14,3) as perda_sem_galho_kg,
          coalesce(sum(custo_resina_aplicado_kg * (((pecas_refugo + falha_preenchimento_qtd) * peso_peca_aplicado_g / 1000) + borra_kg + galho_kg + outras_perdas_kg)),0)::numeric(14,2) as perda_reais
        from apontamento
        where empresa_id = $1 and inicio_em >= $2 and inicio_em < $3
      `,
      [user.empresaId, range.inicio, range.fim],
    );
  }

  async cycles(user: { empresaId: string }, query: Record<string, unknown>) {
    const range = parseRange(query);
    return this.dataSource.query(
      `
        select maquina_id, avg(ciclo_real_s)::numeric(10,2) ciclo_medio_real_s,
               avg(ciclo_padrao_aplicado_s)::numeric(10,2) ciclo_padrao_medio_s,
               (avg(ciclo_real_s) - avg(ciclo_padrao_aplicado_s))::numeric(10,2) desvio_s
        from apontamento
        where empresa_id = $1 and inicio_em >= $2 and inicio_em < $3 and ciclo_real_s is not null
        group by maquina_id
        order by maquina_id
      `,
      [user.empresaId, range.inicio, range.fim],
    );
  }

  async stops(user: { empresaId: string }, query: Record<string, unknown>) {
    const range = parseRange(query);
    return this.dataSource.query(
      `
        select tipo_ocorrencia_id, status, classificacao, programacao,
               count(*)::int quantidade,
               coalesce(sum(extract(epoch from (least(coalesce(fim_em, $3::timestamptz), $3::timestamptz) - greatest(inicio_em, $2::timestamptz)))),0)::numeric(14,2) duracao_segundos
        from ocorrencia
        where empresa_id = $1 and inicio_em < $3 and coalesce(fim_em, $3::timestamptz) > $2
        group by tipo_ocorrencia_id, status, classificacao, programacao
      `,
      [user.empresaId, range.inicio, range.fim],
    );
  }

  async stock(user: { empresaId: string }, query: Record<string, unknown>) {
    const range = parseRange(query);
    return this.dataSource.query(
      `
        select tipo_movimento, count(*)::int movimentos, coalesce(sum(quantidade_kg),0)::numeric(14,3) quantidade_kg
        from estoque_movimento
        where empresa_id = $1 and criado_em >= $2 and criado_em < $3
        group by tipo_movimento
        order by tipo_movimento
      `,
      [user.empresaId, range.inicio, range.fim],
    );
  }

  async traceability(user: { empresaId: string }, query: Record<string, unknown>) {
    const loteId = typeof query.loteId === 'string' ? query.loteId : null;
    return this.dataSource.query(
      `
        select *
        from vw_rastreabilidade_lotes
        where lote_id = coalesce($1::uuid, lote_id)
        order by criado_em nulls first
        limit 500
      `,
      [loteId],
    );
  }

  async oee(user: { empresaId: string }, query: Record<string, unknown>) {
    const range = parseRange(query);
    const unidadeId = typeof query.unidadeId === 'string' ? query.unidadeId : null;
    const maquinaId = typeof query.maquinaId === 'string' ? query.maquinaId : null;
    const [prod] = await this.dataSource.query(
      `
        select
          coalesce(sum(extract(epoch from (fim_em - inicio_em))),0)::numeric as tempo_apontado_s,
          coalesce(sum(pecas_boas + pecas_refugo + falha_preenchimento_qtd),0)::numeric as quantidade_total,
          coalesce(sum(pecas_boas),0)::numeric as pecas_boas,
          coalesce(sum(((pecas_boas + pecas_refugo + falha_preenchimento_qtd) * ciclo_padrao_aplicado_s) / greatest(cavidades_aplicadas,1)),0)::numeric as tempo_ideal_s
        from apontamento
        where empresa_id = $1
          and status = 'concluido'
          and inicio_em >= $2
          and inicio_em < $3
          and fim_em is not null
          and ($4::uuid is null or unidade_id = $4::uuid)
          and ($5::uuid is null or maquina_id = $5::uuid)
      `,
      [user.empresaId, range.inicio, range.fim, unidadeId, maquinaId],
    );
    const stops = await this.dataSource.query(
      `
        select id, unidade_id, maquina_id, inicio_em, fim_em, entra_calculo_oee, programacao, tipo_ocorrencia_id
        from ocorrencia o
        where o.empresa_id = $1
          and o.inicio_em < $3
          and coalesce(o.fim_em, $3::timestamptz) > $2
          and ($4::uuid is null or o.unidade_id = $4::uuid)
          and ($5::uuid is null or o.maquina_id = $5::uuid)
      `,
      [user.empresaId, range.inicio, range.fim, unidadeId, maquinaId],
    );
    const planned = await this.plannedTime.calculate({
      empresaId: user.empresaId,
      inicio: range.inicio,
      fim: range.fim,
      unidadeId,
      maquinaId,
    });
    const stopMemory = calculateStopOverlap(stops, planned.turnos, range.fim);
    const tempoPlanejado = planned.tempoPlanejadoLiquidoS;
    const tempoOperacional = Math.max(0, tempoPlanejado - stopMemory.paradasIncluidasS);
    const disponibilidade = planned.inconsistencias.length
      ? null
      : safeRatio(tempoOperacional, tempoPlanejado);
    const performance =
      disponibilidade === null
        ? null
        : safeRatio(Number(prod.tempo_ideal_s ?? 0), tempoOperacional);
    const qualidade =
      disponibilidade === null
        ? null
        : safeRatio(Number(prod.pecas_boas ?? 0), Number(prod.quantidade_total ?? 0));
    const oee =
      disponibilidade === null || performance === null || qualidade === null
        ? null
        : disponibilidade * performance * qualidade;
    return {
      resumo: {
        disponibilidade,
        performance,
        qualidade,
        oee,
        configuracaoAusente: planned.inconsistencias.length > 0,
      },
      memoria: {
        periodo: range,
        turnosConsiderados: planned.turnos,
        intervalosExcluidosS: planned.intervalosExcluidosS,
        indisponibilidadesPlanejadasS: planned.indisponibilidadesPlanejadasS,
        inconsistencias: planned.inconsistencias,
        tempoPlanejadoS: tempoPlanejado,
        tempoOperacionalS: tempoOperacional,
        paradasConsideradas: stopMemory.paradasConsideradas,
        paradasIgnoradas: stopMemory.paradasIgnoradas,
        paradasIncluidasS: stopMemory.paradasIncluidasS,
        paradasExcluidasS: stopMemory.paradasExcluidasS,
        quantidadeTotal: Number(prod.quantidade_total ?? 0),
        pecasBoas: Number(prod.pecas_boas ?? 0),
        tempoIdealS: Number(prod.tempo_ideal_s ?? 0),
        disponibilidade,
        performance,
        qualidade,
        oee,
        formulaVersion: FORMULA_VERSION,
      },
    };
  }

  async refreshStatus() {
    return { status: 'manual', ultimoRefreshEm: new Date().toISOString(), materializedViews: [] };
  }

  async exportCsv(user: { empresaId: string }, query: Record<string, unknown>) {
    const rows = await this.production(user, query);
    const csv = toCsv(rows);
    return new StreamableFile(Buffer.from(csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: 'attachment; filename="relatorio-producao.csv"',
    });
  }
}

function calculateStopOverlap(
  stops: Array<{
    id: string;
    inicio_em: string;
    fim_em: string | null;
    entra_calculo_oee: boolean;
    programacao: string;
    tipo_ocorrencia_id: string;
  }>,
  shifts: Array<{ inicio: string; fim: string }>,
  fallbackEnd: string,
) {
  const paradasConsideradas: Array<Record<string, unknown>> = [];
  const paradasIgnoradas: Array<Record<string, unknown>> = [];
  let paradasIncluidasS = 0;
  let paradasExcluidasS = 0;
  for (const stop of stops) {
    const start = new Date(stop.inicio_em);
    const end = new Date(stop.fim_em ?? fallbackEnd);
    const intervals = shifts
      .map((shift) => overlap(start, end, new Date(shift.inicio), new Date(shift.fim)))
      .filter((item): item is { inicio: Date; fim: Date } => Boolean(item));
    const seconds = intervals.reduce((sum, item) => sum + secondsBetween(item.inicio, item.fim), 0);
    const target = {
      id: stop.id,
      tipoOcorrenciaId: stop.tipo_ocorrencia_id,
      segundos: seconds,
      intervalos: intervals.map((item) => ({
        inicio: item.inicio.toISOString(),
        fim: item.fim.toISOString(),
      })),
      entraCalculoOee: stop.entra_calculo_oee,
      programacao: stop.programacao,
    };
    if (!seconds) {
      paradasIgnoradas.push({ ...target, motivo: 'Fora dos turnos planejados.' });
      continue;
    }
    if (stop.entra_calculo_oee && stop.programacao === 'nao_programada') {
      paradasIncluidasS += seconds;
      paradasConsideradas.push(target);
    } else {
      paradasExcluidasS += seconds;
      paradasIgnoradas.push(target);
    }
  }
  return { paradasIncluidasS, paradasExcluidasS, paradasConsideradas, paradasIgnoradas };
}

function parseRange(query: Record<string, unknown>) {
  const inicio =
    typeof query.inicio === 'string'
      ? query.inicio
      : new Date(Date.now() - 7 * 86400_000).toISOString();
  const fim = typeof query.fim === 'string' ? query.fim : new Date().toISOString();
  const start = new Date(inicio);
  const end = new Date(fim);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new BadRequestException('Periodo invalido.');
  }
  if ((end.getTime() - start.getTime()) / 86400_000 > MAX_DAYS) {
    throw new BadRequestException(`Periodo maximo permitido: ${MAX_DAYS} dias.`);
  }
  return { inicio: start.toISOString(), fim: end.toISOString() };
}

function safeRatio(numerator: number, denominator: number): number | null {
  if (!denominator || denominator <= 0) return null;
  return numerator / denominator;
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return 'sem_dados\n';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(';')];
  for (const row of rows) {
    lines.push(headers.map((header) => String(row[header] ?? '').replace(/;/g, ',')).join(';'));
  }
  return lines.join('\n');
}

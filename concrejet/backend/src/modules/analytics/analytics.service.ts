import { BadRequestException, Injectable, StreamableFile } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  overlap,
  PlannedTimeCalculationService,
  secondsBetween,
} from './planned-time-calculation.service';

export const FORMULA_VERSION = 'oee-v1-2026-08-01';
const MAX_DAYS = 370;

type FilterMap = {
  inicio: string;
  fim: string;
  unidadeId: string | null;
  maquinaId: string | null;
  operadorId: string | null;
  itemId: string | null;
  moldeId: string | null;
  ordemProducaoId: string | null;
  loteId: string | null;
  resinaId: string | null;
  fornecedorId: string | null;
  operacaoId: string | null;
  tipoOcorrenciaId: string | null;
};

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly plannedTime: PlannedTimeCalculationService,
  ) {}

  async overview(user: { empresaId: string }, query: Record<string, unknown>) {
    const filters = parseFilters(query);
    const [production, losses, stops, stock, oeeResult, charts] = await Promise.all([
      this.production(user, query),
      this.losses(user, query),
      this.stops(user, query),
      this.stock(user, query),
      this.oee(user, query),
      this.charts(user, query),
    ]);
    const oee = oeeResult as {
      resumo: Record<string, number | boolean | null>;
      memoria: Record<string, unknown>;
    };
    return {
      periodo: { inicio: filters.inicio, fim: filters.fim },
      filtros: filters,
      cards: {
        producaoTotal: production.summary.pecas_total,
        pecasBoas: production.summary.pecas_boas,
        refugo: production.summary.pecas_refugo,
        indiceQualidade: production.summary.qualidade,
        perdaTotalKg: losses.summary.perda_total_kg,
        perdaPercentual: losses.summary.perdaPercentual,
        perdaReais: losses.summary.perda_reais,
        cicloMedioRealS: production.summary.ciclo_medio_real_s,
        cicloPadraoMedioS: production.summary.ciclo_padrao_medio_s,
        desvioMedioCicloS: production.summary.desvio_medio_ciclo_s,
        tempoTotalParadaS: stops.summary.duracaoTotalS,
        disponibilidade: oee.resumo.disponibilidade,
        performance: oee.resumo.performance,
        qualidade: oee.resumo.qualidade,
        oee: oee.resumo.oee,
      },
      charts,
      tables: {
        production: production.rows,
        losses: losses.rankings,
        stops: stops.rows,
        stock: stock.rows,
      },
      stock: stock.summary,
      memoriaOee: oee.memoria,
      formulaVersion: FORMULA_VERSION,
      atualizadoEm: new Date().toISOString(),
    };
  }

  async production(user: { empresaId: string }, query: Record<string, unknown>) {
    const filters = parseFilters(query);
    const rows = await this.dataSource.query(
      `
        select
          a.data_producao::text as data,
          m.codigo as maquina_codigo,
          m.nome as maquina_nome,
          c.matricula as operador_matricula,
          c.nome as operador_nome,
          i.codigo as item_codigo,
          i.descricao as item_descricao,
          mo.codigo as molde_codigo,
          op.numero as ordem_numero,
          sum(a.pecas_boas + a.pecas_refugo + a.falha_preenchimento_qtd)::int as pecas_total,
          sum(a.pecas_boas)::int as pecas_boas,
          sum(a.pecas_refugo)::int as pecas_refugo,
          sum(a.falha_preenchimento_qtd)::int as falha_preenchimento,
          avg(a.ciclo_real_s)::numeric(12,2) as ciclo_medio_real_s,
          avg(a.ciclo_padrao_aplicado_s)::numeric(12,2) as ciclo_padrao_medio_s,
          (avg(a.ciclo_real_s) - avg(a.ciclo_padrao_aplicado_s))::numeric(12,2) as desvio_medio_ciclo_s
        from apontamento a
        join maquina m on m.id = a.maquina_id
        join colaborador c on c.id = a.operador_id
        join item i on i.id = a.item_id
        join molde mo on mo.id = a.molde_id
        left join ordem_producao op on op.id = a.ordem_producao_id
        left join lote_resina lr on lr.id = a.lote_resina_id
        where ${appointmentWhere()}
        group by a.data_producao, m.codigo, m.nome, c.matricula, c.nome, i.codigo, i.descricao, mo.codigo, op.numero
        order by a.data_producao, m.codigo, i.codigo
        limit 500
      `,
      appointmentParams(user.empresaId, filters),
    );
    const [summary] = await this.dataSource.query(
      `
        select
          count(*)::int as apontamentos,
          count(*) filter (where a.status = 'concluido')::int as apontamentos_concluidos,
          coalesce(sum(a.pecas_boas + a.pecas_refugo + a.falha_preenchimento_qtd),0)::int as pecas_total,
          coalesce(sum(a.pecas_boas),0)::int as pecas_boas,
          coalesce(sum(a.pecas_refugo),0)::int as pecas_refugo,
          coalesce(sum(a.falha_preenchimento_qtd),0)::int as falha_preenchimento,
          avg(a.ciclo_real_s)::float as ciclo_medio_real_s,
          avg(a.ciclo_padrao_aplicado_s)::float as ciclo_padrao_medio_s,
          (avg(a.ciclo_real_s) - avg(a.ciclo_padrao_aplicado_s))::float as desvio_medio_ciclo_s
        from apontamento a
        left join lote_resina lr on lr.id = a.lote_resina_id
        where ${appointmentWhere()}
      `,
      appointmentParams(user.empresaId, filters),
    );
    return {
      periodo: { inicio: filters.inicio, fim: filters.fim },
      filtros: filters,
      summary: {
        ...numberize(summary),
        qualidade: safeRatio(Number(summary.pecas_boas ?? 0), Number(summary.pecas_total ?? 0)),
      } as Record<string, number | null>,
      rows: rows.map(numberize),
    };
  }

  async losses(user: { empresaId: string }, query: Record<string, unknown>) {
    const filters = parseFilters(query);
    const params = appointmentParams(user.empresaId, filters);
    const [summary] = await this.dataSource.query(
      `
        select
          coalesce(sum(a.pecas_refugo),0)::int as pecas_refugo,
          coalesce(sum(a.falha_preenchimento_qtd),0)::int as falha_preenchimento,
          coalesce(sum(a.borra_kg),0)::float as borra_kg,
          coalesce(sum(a.galho_kg),0)::float as galho_kg,
          coalesce(sum(a.outras_perdas_kg),0)::float as outras_perdas_kg,
          coalesce(sum((a.pecas_boas * a.peso_peca_aplicado_g) / 1000),0)::float as injecao_util_kg,
          coalesce(sum((a.pecas_refugo + a.falha_preenchimento_qtd) * a.peso_peca_aplicado_g / 1000),0)::float as perda_pecas_kg,
          coalesce(sum(((a.pecas_refugo + a.falha_preenchimento_qtd) * a.peso_peca_aplicado_g / 1000) + a.borra_kg + a.galho_kg + a.outras_perdas_kg),0)::float as perda_total_kg,
          coalesce(sum(((a.pecas_refugo + a.falha_preenchimento_qtd) * a.peso_peca_aplicado_g / 1000) + a.borra_kg + a.outras_perdas_kg),0)::float as perda_sem_galho_kg,
          coalesce(sum(coalesce(a.custo_resina_aplicado_kg,0) * (((a.pecas_refugo + a.falha_preenchimento_qtd) * a.peso_peca_aplicado_g / 1000) + a.borra_kg + a.galho_kg + a.outras_perdas_kg)),0)::float as perda_reais
        from apontamento a
        left join lote_resina lr on lr.id = a.lote_resina_id
        where ${appointmentWhere()}
      `,
      params,
    );
    const rankings = {
      porMaquina: await this.lossRanking('maquina', params),
      porItem: await this.lossRanking('item', params),
      porOperador: await this.lossRanking('operador', params),
    };
    const item = numberize(summary);
    const base = Number(item.injecao_util_kg) + Number(item.perda_total_kg);
    return {
      periodo: { inicio: filters.inicio, fim: filters.fim },
      filtros: filters,
      summary: { ...item, perdaPercentual: safeRatio(Number(item.perda_total_kg), base) } as Record<
        string,
        number | null
      >,
      rankings,
    };
  }

  async cycles(user: { empresaId: string }, query: Record<string, unknown>) {
    return (await this.production(user, query)).rows.map((row: Record<string, unknown>) => ({
      data: row.data,
      maquinaCodigo: row.maquina_codigo,
      itemCodigo: row.item_codigo,
      cicloMedioRealS: row.ciclo_medio_real_s,
      cicloPadraoMedioS: row.ciclo_padrao_medio_s,
      desvioMedioCicloS: row.desvio_medio_ciclo_s,
    }));
  }

  async stops(user: { empresaId: string }, query: Record<string, unknown>) {
    const filters = parseFilters(query);
    const params = occurrenceParams(user.empresaId, filters);
    const rows = await this.dataSource.query(
      `
        select
          t.codigo as tipo_codigo,
          t.descricao as tipo_descricao,
          o.classificacao,
          o.programacao,
          m.codigo as maquina_codigo,
          c.matricula as operador_matricula,
          count(*)::int quantidade,
          coalesce(sum(extract(epoch from (least(coalesce(o.fim_em, $3::timestamptz), $3::timestamptz) - greatest(o.inicio_em, $2::timestamptz)))),0)::float duracao_s,
          sum(extract(epoch from (least(coalesce(o.fim_em, $3::timestamptz), $3::timestamptz) - greatest(o.inicio_em, $2::timestamptz)))) filter (where o.entra_calculo_oee)::float as impacto_oee_s
        from ocorrencia o
        join tipo_ocorrencia t on t.id = o.tipo_ocorrencia_id
        join maquina m on m.id = o.maquina_id
        join colaborador c on c.id = o.operador_id
        where ${occurrenceWhere()}
        group by t.codigo, t.descricao, o.classificacao, o.programacao, m.codigo, c.matricula
        order by duracao_s desc
        limit 500
      `,
      params,
    );
    const mapped = rows.map(numberize) as Array<Record<string, unknown>>;
    return {
      periodo: { inicio: filters.inicio, fim: filters.fim },
      filtros: filters,
      summary: {
        quantidade: mapped.reduce((sum: number, item) => sum + Number(item.quantidade ?? 0), 0),
        duracaoTotalS: mapped.reduce((sum: number, item) => sum + Number(item.duracao_s ?? 0), 0),
        programadaS: mapped
          .filter((item) => item.programacao === 'programada')
          .reduce((sum: number, item) => sum + Number(item.duracao_s ?? 0), 0),
        naoProgramadaS: mapped
          .filter((item) => item.programacao === 'nao_programada')
          .reduce((sum: number, item) => sum + Number(item.duracao_s ?? 0), 0),
      },
      rows: mapped,
    };
  }

  async stock(user: { empresaId: string }, query: Record<string, unknown>) {
    const filters = parseFilters(query);
    const rows = await this.dataSource.query(
      `
        select
          em.tipo_movimento,
          lr.codigo as lote_codigo,
          r.codigo as resina_codigo,
          f.nome as fornecedor_nome,
          count(*)::int movimentos,
          coalesce(sum(em.quantidade_kg),0)::float quantidade_kg,
          coalesce(sum(em.custo_total_aplicado),0)::float custo_movimentado
        from estoque_movimento em
        join lote_resina lr on lr.id = em.lote_id
        join resina r on r.id = lr.resina_id
        left join fornecedor f on f.id = lr.fornecedor_id
        where em.empresa_id = $1
          and em.criado_em >= $2 and em.criado_em < $3
          and ($4::uuid is null or em.unidade_id = $4::uuid)
          and ($5::uuid is null or em.lote_id = $5::uuid)
          and ($6::uuid is null or lr.resina_id = $6::uuid)
          and ($7::uuid is null or lr.fornecedor_id = $7::uuid)
        group by em.tipo_movimento, lr.codigo, r.codigo, f.nome
        order by em.tipo_movimento, lr.codigo
        limit 500
      `,
      stockParams(user.empresaId, filters),
    );
    const balances = await this.dataSource.query(
      `
        select lr.codigo lote_codigo, r.codigo resina_codigo, lr.saldo_atual_kg::float saldo_atual_kg,
               lr.custo_por_kg::float custo_por_kg
        from lote_resina lr
        join resina r on r.id = lr.resina_id
        where lr.empresa_id = $1
          and ($2::uuid is null or lr.id = $2::uuid)
          and ($3::uuid is null or lr.resina_id = $3::uuid)
          and ($4::uuid is null or lr.fornecedor_id = $4::uuid)
        order by lr.saldo_atual_kg asc
        limit 100
      `,
      traceParams(user.empresaId, filters),
    );
    const mapped = rows.map(numberize) as Array<Record<string, unknown>>;
    return {
      periodo: { inicio: filters.inicio, fim: filters.fim },
      filtros: filters,
      summary: {
        movimentos: mapped.reduce((sum: number, item) => sum + Number(item.movimentos ?? 0), 0),
        entradasKg: sumByTypes(mapped, ['entrada', 'devolucao', 'blenda_producao']),
        consumosKg: sumByTypes(mapped, ['consumo', 'blenda_consumo', 'transferencia_saida']),
        ajustesKg: sumByTypes(mapped, ['ajuste_positivo', 'ajuste_negativo']),
        estornosKg: sumByTypes(mapped, ['estorno']),
        custoMovimentado: mapped.reduce(
          (sum: number, item) => sum + Number(item.custo_movimentado ?? 0),
          0,
        ),
        estoqueBaixo: balances.filter(
          (item: Record<string, unknown>) => Number(item.saldo_atual_kg) < 50,
        ),
      },
      rows: mapped,
      balances: balances.map(numberize),
    };
  }

  async traceability(user: { empresaId: string }, query: Record<string, unknown>) {
    const filters = parseFilters(query);
    const rows = await this.dataSource.query(
      `
        select
          v.lote_codigo,
          v.resina_codigo,
          v.fornecedor_nome,
          v.tipo_movimento,
          v.origem_tipo,
          v.quantidade_kg::float quantidade_kg,
          v.saldo_anterior_kg::float saldo_anterior_kg,
          v.saldo_posterior_kg::float saldo_posterior_kg,
          v.criado_em,
          b.codigo as blenda_codigo,
          a.data_producao::text as apontamento_data
        from vw_rastreabilidade_lotes v
        left join blenda b on b.id = v.origem_id
        left join apontamento a on a.id = v.origem_id
        join lote_resina lr on lr.id = v.lote_id
        where lr.empresa_id = $1
          and ($2::uuid is null or v.lote_id = $2::uuid)
          and ($3::uuid is null or lr.resina_id = $3::uuid)
          and ($4::uuid is null or lr.fornecedor_id = $4::uuid)
        order by v.criado_em nulls first
        limit 500
      `,
      traceParams(user.empresaId, filters),
    );
    return { periodo: { inicio: filters.inicio, fim: filters.fim }, filtros: filters, rows };
  }

  async oee(
    user: { empresaId: string },
    query: Record<string, unknown>,
    includeDetails = true,
  ): Promise<{
    periodo: { inicio: string; fim: string };
    filtros: FilterMap;
    resumo: Record<string, number | boolean | null>;
    porMaquina: Array<Record<string, unknown>>;
    evolucao: Array<Record<string, unknown>>;
    memoria: Record<string, unknown>;
  }> {
    const filters = parseFilters(query);
    const [prod] = await this.dataSource.query(
      `
        select
          coalesce(sum(extract(epoch from (a.fim_em - a.inicio_em))),0)::float as tempo_apontado_s,
          coalesce(sum(a.pecas_boas + a.pecas_refugo),0)::float as quantidade_total,
          coalesce(sum(a.pecas_boas),0)::float as pecas_boas,
          coalesce(sum(((a.pecas_boas + a.pecas_refugo) * a.ciclo_padrao_aplicado_s) / nullif(a.cavidades_aplicadas,0)),0)::float as tempo_ideal_s,
          avg(a.ciclo_padrao_aplicado_s)::float as ciclo_padrao_medio_s,
          avg(a.cavidades_aplicadas)::float as cavidades_media
        from apontamento a
        left join lote_resina lr on lr.id = a.lote_resina_id
        where ${appointmentWhere()} and a.status = 'concluido' and a.fim_em is not null
      `,
      appointmentParams(user.empresaId, filters),
    );
    const stops = await this.dataSource.query(
      `
        select o.id, o.unidade_id, o.maquina_id, o.inicio_em, o.fim_em, o.entra_calculo_oee, o.programacao, o.tipo_ocorrencia_id,
               t.codigo tipo_codigo, t.descricao tipo_descricao
        from ocorrencia o
        join tipo_ocorrencia t on t.id = o.tipo_ocorrencia_id
        where ${occurrenceWhere()}
      `,
      occurrenceParams(user.empresaId, filters),
    );
    const planned = await this.plannedTime.calculate({
      empresaId: user.empresaId,
      inicio: filters.inicio,
      fim: filters.fim,
      unidadeId: filters.unidadeId,
      maquinaId: filters.maquinaId,
    });
    const stopMemory = calculateStopOverlap(stops, planned.turnos, filters.fim);
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
      periodo: { inicio: filters.inicio, fim: filters.fim },
      filtros: filters,
      resumo: {
        disponibilidade,
        performance,
        qualidade,
        oee,
        performanceInconsistente: performance !== null && performance > 1,
        configuracaoAusente: planned.inconsistencias.length > 0,
      },
      porMaquina: includeDetails ? await this.oeeByMachine(user, filters) : [],
      evolucao: includeDetails ? await this.productionByDay(user.empresaId, filters) : [],
      memoria: {
        periodo: { inicio: filters.inicio, fim: filters.fim },
        turnosConsiderados: planned.turnos,
        tempoBrutoTurnoS: planned.tempoBrutoTurnoS,
        intervalosExcluidosS: planned.intervalosExcluidosS,
        indisponibilidadesPlanejadasS: planned.indisponibilidadesPlanejadasS,
        inconsistencias: planned.inconsistencias,
        tempoPlanejadoS: tempoPlanejado,
        tempoOperacionalS: tempoOperacional,
        paradasConsideradas: stopMemory.paradasConsideradas,
        paradasIgnoradas: stopMemory.paradasIgnoradas,
        paradasIncluidasS: stopMemory.paradasIncluidasS,
        paradasExcluidasS: stopMemory.paradasExcluidasS,
        quantidadeProduzida: Number(prod.quantidade_total ?? 0),
        pecasBoas: Number(prod.pecas_boas ?? 0),
        tempoIdealS: Number(prod.tempo_ideal_s ?? 0),
        cicloPadraoMedioS: Number(prod.ciclo_padrao_medio_s ?? 0),
        cavidadesMedia: Number(prod.cavidades_media ?? 0),
        disponibilidade,
        performance,
        qualidade,
        oee,
        formulaVersion: FORMULA_VERSION,
      },
    };
  }

  async charts(user: { empresaId: string }, query: Record<string, unknown>) {
    const filters = parseFilters(query);
    const [production, losses, stops, stock, cycles, oeeByMachine] = await Promise.all([
      this.production(user, query),
      this.losses(user, query),
      this.stops(user, query),
      this.stock(user, query),
      this.cycles(user, query),
      this.oeeByMachine(user, filters),
    ]);
    return {
      producaoPorDia: await this.productionByDay(user.empresaId, filters),
      boasVsRefugo: [
        { label: 'Pecas boas', value: production.summary.pecas_boas },
        { label: 'Refugo', value: production.summary.pecas_refugo },
      ],
      perdasPorCategoria: [
        { label: 'Refugo/falha kg', value: losses.summary.perda_pecas_kg },
        { label: 'Borra kg', value: losses.summary.borra_kg },
        { label: 'Galho kg', value: losses.summary.galho_kg },
        { label: 'Outras kg', value: losses.summary.outras_perdas_kg },
      ],
      perdasPorMaquina: losses.rankings.porMaquina,
      perdasPorItem: losses.rankings.porItem,
      cicloRealVsPadrao: cycles,
      tempoParadaPorTipo: stops.rows,
      disponibilidadePorMaquina: oeeByMachine.map((item) => ({
        ...item,
        value: item.disponibilidade,
      })),
      performancePorMaquina: oeeByMachine.map((item) => ({
        ...item,
        value: item.performance,
      })),
      qualidadePorMaquina: oeeByMachine.map((item) => ({
        ...item,
        value: item.qualidade,
      })),
      oeePorMaquina: oeeByMachine.map((item) => ({
        ...item,
        value: item.oee,
      })),
      consumoResinaPorLote: stock.rows,
      evolucaoEstoque: stock.balances,
    };
  }

  async reconciliation(user: { empresaId: string }, query: Record<string, unknown>) {
    const [production, losses, oee] = await Promise.all([
      this.production(user, query),
      this.losses(user, query),
      this.oee(user, query),
    ]);
    const sqlRows = await this.dataSource.query(
      `
        select
          coalesce(sum(pecas_boas),0)::float pecas_boas,
          coalesce(sum(pecas_refugo),0)::float pecas_refugo
        from apontamento a
        left join lote_resina lr on lr.id = a.lote_resina_id
        where ${appointmentWhere()}
      `,
      appointmentParams(user.empresaId, parseFilters(query)),
    );
    const direct = numberize(sqlRows[0] ?? {});
    const checks = [
      compare('pecasBoas', Number(direct.pecas_boas), Number(production.summary.pecas_boas), 0),
      compare('refugo', Number(direct.pecas_refugo), Number(production.summary.pecas_refugo), 0),
      compare(
        'perdaTotalKg',
        Number(losses.summary.perda_total_kg),
        Number(losses.summary.perda_total_kg),
        0.001,
      ),
      compare(
        'disponibilidade',
        Number(oee.resumo.disponibilidade ?? 0),
        Number(oee.memoria.disponibilidade ?? 0),
        0.000001,
      ),
      compare(
        'performance',
        Number(oee.resumo.performance ?? 0),
        Number(oee.memoria.performance ?? 0),
        0.000001,
      ),
      compare(
        'qualidade',
        Number(oee.resumo.qualidade ?? 0),
        Number(oee.memoria.qualidade ?? 0),
        0.000001,
      ),
      compare('oee', Number(oee.resumo.oee ?? 0), Number(oee.memoria.oee ?? 0), 0.000001),
    ];
    return {
      periodo: production.periodo,
      toleranciaDecimal: { unidades: 0, kg: 0.001, indicadores: 0.000001 },
      checks,
      divergencias: checks.filter((item) => !item.ok),
    };
  }

  async refreshStatus() {
    return { status: 'manual', ultimoRefreshEm: new Date().toISOString(), materializedViews: [] };
  }

  async exportCsv(
    user: { empresaId: string },
    query: Record<string, unknown>,
    report = 'production',
  ) {
    const payload =
      report === 'losses'
        ? (await this.losses(user, query)).rankings.porItem
        : report === 'stops'
          ? (await this.stops(user, query)).rows
          : report === 'oee'
            ? (await this.oee(user, query)).porMaquina
            : report === 'stock'
              ? (await this.stock(user, query)).rows
              : (await this.production(user, query)).rows;
    const csv = toCsv(payload as Array<Record<string, unknown>>, {
      report,
      geradoEm: new Date().toISOString(),
      formulaVersion: report === 'oee' ? FORMULA_VERSION : '',
    });
    return new StreamableFile(Buffer.from(csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="relatorio-${report}.csv"`,
    });
  }

  private async productionByDay(empresaId: string, filters: FilterMap) {
    return (
      await this.dataSource.query(
        `
          select a.data_producao::text as label,
                 sum(a.pecas_boas + a.pecas_refugo + a.falha_preenchimento_qtd)::float value,
                 sum(a.pecas_boas)::float pecas_boas,
                 sum(a.pecas_refugo)::float pecas_refugo
          from apontamento a
          left join lote_resina lr on lr.id = a.lote_resina_id
          where ${appointmentWhere()}
          group by a.data_producao
          order by a.data_producao
        `,
        appointmentParams(empresaId, filters),
      )
    ).map(numberize);
  }

  private async lossRanking(kind: 'maquina' | 'item' | 'operador', params: unknown[]) {
    const columns = {
      maquina: ['m.codigo', 'm.nome', 'join maquina m on m.id = a.maquina_id'],
      item: ['i.codigo', 'i.descricao', 'join item i on i.id = a.item_id'],
      operador: ['c.matricula', 'c.nome', 'join colaborador c on c.id = a.operador_id'],
    }[kind];
    return (
      await this.dataSource.query(
        `
          select ${columns[0]} as codigo, ${columns[1]} as descricao,
                 coalesce(sum(((a.pecas_refugo + a.falha_preenchimento_qtd) * a.peso_peca_aplicado_g / 1000) + a.borra_kg + a.galho_kg + a.outras_perdas_kg),0)::float as value
          from apontamento a
          ${columns[2]}
          left join lote_resina lr on lr.id = a.lote_resina_id
          where ${appointmentWhere()}
          group by ${columns[0]}, ${columns[1]}
          order by value desc
          limit 20
        `,
        params,
      )
    ).map(numberize);
  }

  private async oeeByMachine(
    user: { empresaId: string },
    filters: FilterMap,
  ): Promise<Array<Record<string, unknown>>> {
    const machines = await this.dataSource.query(
      `
        select distinct m.id, m.codigo, m.nome
        from maquina m
        join apontamento a on a.maquina_id = m.id
        left join lote_resina lr on lr.id = a.lote_resina_id
        where ${appointmentWhere()}
        order by m.codigo
      `,
      appointmentParams(user.empresaId, filters),
    );
    const result = [];
    for (const machine of machines) {
      const oee = (await this.oee(user, { ...filters, maquinaId: machine.id }, false)) as {
        resumo: Record<string, unknown>;
      };
      result.push({
        maquinaCodigo: machine.codigo,
        maquinaNome: machine.nome,
        disponibilidade: oee.resumo.disponibilidade,
        performance: oee.resumo.performance,
        qualidade: oee.resumo.qualidade,
        oee: oee.resumo.oee,
      });
    }
    return result;
  }
}

function parseFilters(query: Record<string, unknown>): FilterMap {
  const inicio =
    typeof query.inicio === 'string'
      ? query.inicio
      : new Date(Date.now() - 14 * 86400_000).toISOString();
  const fim = typeof query.fim === 'string' ? query.fim : new Date().toISOString();
  const start = new Date(inicio);
  const end = new Date(fim);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new BadRequestException('Periodo invalido: data final deve ser maior que a inicial.');
  }
  if ((end.getTime() - start.getTime()) / 86400_000 > MAX_DAYS) {
    throw new BadRequestException(`Periodo maximo permitido: ${MAX_DAYS} dias.`);
  }
  return {
    inicio: start.toISOString(),
    fim: end.toISOString(),
    unidadeId: readUuid(query.unidadeId),
    maquinaId: readUuid(query.maquinaId),
    operadorId: readUuid(query.operadorId),
    itemId: readUuid(query.itemId),
    moldeId: readUuid(query.moldeId),
    ordemProducaoId: readUuid(query.ordemProducaoId),
    loteId: readUuid(query.loteId),
    resinaId: readUuid(query.resinaId),
    fornecedorId: readUuid(query.fornecedorId),
    operacaoId: readUuid(query.operacaoId),
    tipoOcorrenciaId: readUuid(query.tipoOcorrenciaId),
  };
}

function readUuid(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new BadRequestException('Filtro UUID invalido.');
  }
  return value;
}

function filterParams(empresaId: string, filters: FilterMap) {
  return [
    empresaId,
    filters.inicio,
    filters.fim,
    filters.unidadeId,
    filters.maquinaId,
    filters.operadorId,
    filters.itemId,
    filters.moldeId,
    filters.loteId,
    filters.resinaId,
    filters.fornecedorId,
    filters.operacaoId,
    filters.ordemProducaoId,
  ];
}

function appointmentParams(empresaId: string, filters: FilterMap) {
  return filterParams(empresaId, filters);
}

function occurrenceParams(empresaId: string, filters: FilterMap) {
  return [
    empresaId,
    filters.inicio,
    filters.fim,
    filters.unidadeId,
    filters.maquinaId,
    filters.operadorId,
    filters.tipoOcorrenciaId,
  ];
}

function stockParams(empresaId: string, filters: FilterMap) {
  return [
    empresaId,
    filters.inicio,
    filters.fim,
    filters.unidadeId,
    filters.loteId,
    filters.resinaId,
    filters.fornecedorId,
  ];
}

function traceParams(empresaId: string, filters: FilterMap) {
  return [empresaId, filters.loteId, filters.resinaId, filters.fornecedorId];
}

function appointmentWhere() {
  return `
    a.empresa_id = $1
    and a.inicio_em >= $2 and a.inicio_em < $3
    and ($4::uuid is null or a.unidade_id = $4::uuid)
    and ($5::uuid is null or a.maquina_id = $5::uuid)
    and ($6::uuid is null or a.operador_id = $6::uuid)
    and ($7::uuid is null or a.item_id = $7::uuid)
    and ($8::uuid is null or a.molde_id = $8::uuid)
    and ($9::uuid is null or a.lote_resina_id = $9::uuid)
    and ($10::uuid is null or lr.resina_id = $10::uuid)
    and ($11::uuid is null or lr.fornecedor_id = $11::uuid)
    and ($12::uuid is null or a.operacao_id = $12::uuid)
    and ($13::uuid is null or a.ordem_producao_id = $13::uuid)
    and a.status <> 'cancelado'
  `;
}

function occurrenceWhere() {
  return `
    o.empresa_id = $1
    and o.inicio_em < $3 and coalesce(o.fim_em, $3::timestamptz) > $2
    and ($4::uuid is null or o.unidade_id = $4::uuid)
    and ($5::uuid is null or o.maquina_id = $5::uuid)
    and ($6::uuid is null or o.operador_id = $6::uuid)
    and ($7::uuid is null or o.tipo_ocorrencia_id = $7::uuid)
    and o.status <> 'cancelada'
  `;
}

function safeRatio(numerator: number, denominator: number): number | null {
  if (!denominator || denominator <= 0) return null;
  return numerator / denominator;
}

function calculateStopOverlap(
  stops: Array<{
    id: string;
    inicio_em: string;
    fim_em: string | null;
    entra_calculo_oee: boolean;
    programacao: string;
    tipo_ocorrencia_id: string;
    tipo_codigo?: string;
    tipo_descricao?: string;
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
      tipoCodigo: stop.tipo_codigo,
      tipoDescricao: stop.tipo_descricao,
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

function numberize(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value,
    ]),
  );
}

function sumByTypes(rows: Array<Record<string, unknown>>, types: string[]) {
  return rows
    .filter((item) => types.includes(String(item.tipo_movimento)))
    .reduce((sum, item) => sum + Number(item.quantidade_kg ?? 0), 0);
}

function compare(nome: string, bruto: number, agregado: number, tolerancia: number) {
  const diferenca = Math.abs(bruto - agregado);
  return { nome, bruto, agregado, diferenca, tolerancia, ok: diferenca <= tolerancia };
}

function toCsv(rows: Array<Record<string, unknown>>, metadata: Record<string, string>): string {
  const meta = Object.entries(metadata).map(([key, value]) => `# ${key};${value}`);
  if (!rows.length) return [...meta, 'sem_dados'].join('\n');
  const headers = Object.keys(rows[0]);
  const lines = [...meta, headers.join(';')];
  for (const row of rows) {
    lines.push(headers.map((header) => String(row[header] ?? '').replace(/;/g, ',')).join(';'));
  }
  return lines.join('\n');
}

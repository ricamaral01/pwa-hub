import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, getApiErrorMessage } from '@/api/client';
import { DataTable, DesktopShell, FilterBar, KpiCard } from '@/ui/desktop';

type Props = {
  kind: 'overview' | 'production' | 'losses' | 'stops' | 'oee' | 'stock' | 'traceability';
};

type AnalyticsPayload = {
  periodo?: { inicio: string; fim: string };
  cards?: Record<string, number | null>;
  charts?: Record<string, Array<Record<string, unknown>>>;
  tables?: Record<string, unknown>;
  rows?: Array<Record<string, unknown>>;
  summary?: Record<string, unknown>;
  rankings?: Record<string, Array<Record<string, unknown>>>;
  resumo?: Record<string, number | boolean | null>;
  porMaquina?: Array<Record<string, unknown>>;
  evolucao?: Array<Record<string, unknown>>;
  memoria?: Record<string, unknown>;
  memoriaOee?: Record<string, unknown>;
  balances?: Array<Record<string, unknown>>;
  formulaVersion?: string;
  atualizadoEm?: string;
};

const titles: Record<Props['kind'], string> = {
  overview: 'Dashboard gerencial',
  production: 'Relatorio de producao',
  losses: 'Relatorio de perdas',
  stops: 'Relatorio de paradas',
  oee: 'OEE e memoria de calculo',
  stock: 'Relatorio de estoque',
  traceability: 'Rastreabilidade de lotes',
};

const cardLabels: Record<
  string,
  { title: string; unit?: string; help: string; percent?: boolean }
> = {
  producaoTotal: {
    title: 'Producao total',
    unit: 'pecas',
    help: 'Pecas boas, refugo e falha no periodo.',
  },
  pecasBoas: { title: 'Pecas boas', unit: 'pecas', help: 'Total de pecas boas apontadas.' },
  refugo: { title: 'Refugo', unit: 'pecas', help: 'Pecas refugadas no periodo.' },
  indiceQualidade: {
    title: 'Indice de qualidade',
    percent: true,
    help: 'Pecas boas sobre total produzido.',
  },
  perdaTotalKg: {
    title: 'Perda total',
    unit: 'kg',
    help: 'Refugo convertido em kg mais borra, galho e outras perdas.',
  },
  perdaPercentual: {
    title: 'Perda percentual',
    percent: true,
    help: 'Perda total ponderada pela massa total.',
  },
  perdaReais: {
    title: 'Perda em reais',
    unit: 'R$',
    help: 'Perda em kg multiplicada pelo custo congelado da resina.',
  },
  cicloMedioRealS: { title: 'Ciclo medio real', unit: 's', help: 'Media do ciclo real apontado.' },
  cicloPadraoMedioS: {
    title: 'Ciclo padrao medio',
    unit: 's',
    help: 'Media do ciclo padrao aplicado no apontamento.',
  },
  desvioMedioCicloS: {
    title: 'Desvio medio de ciclo',
    unit: 's',
    help: 'Ciclo real medio menos ciclo padrao medio.',
  },
  tempoTotalParadaS: {
    title: 'Tempo total de parada',
    unit: 'h',
    help: 'Duracao das ocorrencias no periodo.',
  },
  disponibilidade: {
    title: 'Disponibilidade',
    percent: true,
    help: 'Tempo operacional sobre tempo planejado liquido.',
  },
  performance: {
    title: 'Performance',
    percent: true,
    help: 'Tempo ideal sobre tempo operacional.',
  },
  qualidade: { title: 'Qualidade', percent: true, help: 'Pecas boas sobre boas mais refugo.' },
  oee: { title: 'OEE', percent: true, help: 'Disponibilidade x Performance x Qualidade.' },
};

export default function AnalyticsPage({ kind }: Props) {
  const defaultRange = useMemo(() => {
    const fim = new Date();
    const inicio = new Date(Date.now() - 14 * 86400_000);
    return {
      inicio: inicio.toISOString().slice(0, 10),
      fim: fim.toISOString().slice(0, 10),
    };
  }, []);
  const [filters, setFilters] = useState(defaultRange);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const inicio = new Date(`${filters.inicio}T00:00:00`).toISOString();
    const fim = new Date(`${filters.fim}T23:59:59.999`).toISOString();
    return `inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}`;
  }, [filters]);

  const endpoint = kind === 'overview' ? 'overview' : kind;
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        const response = await apiClient.get<AnalyticsPayload>(`/analytics/${endpoint}?${query}`, {
          signal,
        });
        setData(response.data);
        setError('');
      } catch (err) {
        if (signal?.aborted) return;
        setError(getApiErrorMessage(err));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [endpoint, query],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const cards = buildCards(kind, data);
  const charts = buildCharts(kind, data);
  const tables = buildTables(kind, data);
  const memory = kind === 'oee' ? data?.memoria : data?.memoriaOee;

  return (
    <DesktopShell
      title={titles[kind]}
      actions={
        <a href={`/api/analytics/${kind === 'overview' ? 'production' : kind}/export.csv?${query}`}>
          Exportar CSV
        </a>
      }
    >
      <FilterBar>
        <label>
          Inicio
          <input
            type="date"
            value={filters.inicio}
            onChange={(event) =>
              setFilters((current) => ({ ...current, inicio: event.target.value }))
            }
          />
        </label>
        <label>
          Fim
          <input
            type="date"
            value={filters.fim}
            min={filters.inicio}
            onChange={(event) => setFilters((current) => ({ ...current, fim: event.target.value }))}
          />
        </label>
        <button type="button" onClick={() => void load()}>
          Atualizar
        </button>
        <button type="button" onClick={() => setFilters(defaultRange)}>
          Limpar
        </button>
        <span>
          Periodo ativo: {filters.inicio} a {filters.fim}
        </span>
      </FilterBar>

      {loading ? <div className="state-box">Carregando indicadores...</div> : null}
      {error ? (
        <div className="state-box error" role="alert">
          {error}
        </div>
      ) : null}
      {!loading && !error && !data ? (
        <div className="state-box">Sem dados para o periodo.</div>
      ) : null}

      <section className="analytics-card-grid">
        {cards.map((card) => (
          <div
            className={card.status ? `analytics-card ${card.status}` : 'analytics-card'}
            key={card.key}
            title={card.help}
          >
            <KpiCard label={card.title} value={card.value} />
            <small>
              {card.unit} - {card.period}
            </small>
          </div>
        ))}
      </section>

      <section className="analytics-grid">
        {charts.map((chart) => (
          <ChartPanel key={chart.title} title={chart.title} rows={chart.rows} unit={chart.unit} />
        ))}
      </section>

      {memory ? <OeeMemory memory={memory} /> : null}

      {tables.map((table) => (
        <TablePanel key={table.title} title={table.title} rows={table.rows} />
      ))}
    </DesktopShell>
  );
}

function buildCards(kind: Props['kind'], data: AnalyticsPayload | null) {
  const raw =
    kind === 'overview' ? data?.cards : kind === 'oee' ? data?.resumo : (data?.summary ?? {});
  return Object.entries(raw ?? {}).map(([key, value]) => {
    const spec = cardLabels[key] ?? { title: titleize(key), help: key };
    return {
      key,
      title: spec.title,
      help: spec.help,
      unit: spec.unit ?? (spec.percent ? '%' : 'un.'),
      value: formatMetric(value, spec),
      period: formatPeriod(data?.periodo),
      status:
        typeof value === 'number' && spec.percent
          ? value >= 0.85
            ? 'ok'
            : value >= 0.7
              ? 'atencao'
              : 'parada'
          : '',
    };
  });
}

function buildCharts(kind: Props['kind'], data: AnalyticsPayload | null) {
  if (!data) return [];
  const charts = data.charts ?? {};
  if (kind === 'oee') {
    return [
      { title: 'OEE por maquina', rows: data.porMaquina ?? [], unit: '%' },
      { title: 'Evolucao temporal', rows: data.evolucao ?? [], unit: 'pecas' },
    ];
  }
  if (kind === 'losses') {
    return [
      { title: 'Perdas por maquina', rows: data.rankings?.porMaquina ?? [], unit: 'kg' },
      { title: 'Perdas por item', rows: data.rankings?.porItem ?? [], unit: 'kg' },
      { title: 'Perdas por operador', rows: data.rankings?.porOperador ?? [], unit: 'kg' },
    ];
  }
  if (kind === 'stops')
    return [{ title: 'Tempo de parada por tipo', rows: data.rows ?? [], unit: 's' }];
  if (kind === 'stock') return [{ title: 'Consumo por lote', rows: data.rows ?? [], unit: 'kg' }];
  return Object.entries(charts).map(([title, rows]) => ({
    title: titleize(title),
    rows: Array.isArray(rows) ? rows : [],
    unit: inferUnit(title),
  }));
}

function buildTables(kind: Props['kind'], data: AnalyticsPayload | null) {
  if (!data) return [];
  if (kind === 'overview') {
    return [
      { title: 'Producao detalhada', rows: asRows(data.tables?.production) },
      { title: 'Paradas detalhadas', rows: asRows(data.tables?.stops) },
    ];
  }
  if (kind === 'losses') {
    return [
      { title: 'Ranking por maquina', rows: data.rankings?.porMaquina ?? [] },
      { title: 'Ranking por item', rows: data.rankings?.porItem ?? [] },
      { title: 'Ranking por operador', rows: data.rankings?.porOperador ?? [] },
    ];
  }
  if (kind === 'oee') return [{ title: 'Comparacao por maquina', rows: data.porMaquina ?? [] }];
  return [{ title: titles[kind], rows: data.rows ?? data.balances ?? [] }];
}

function ChartPanel({
  title,
  rows,
  unit,
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  unit: string;
}) {
  const values = rows.map((row) =>
    Number(row.value ?? row.oee ?? row.quantidade_kg ?? row.duracao_s ?? row.perda_total_kg ?? 0),
  );
  const max = Math.max(...values, 0);
  return (
    <article className="chart-panel">
      <h2>{title}</h2>
      {!rows.length ? <p>Sem dados para o periodo.</p> : null}
      <div className="bar-chart">
        {rows.slice(0, 12).map((row, index) => {
          const value = values[index] ?? 0;
          const label = safeText(
            row.label ??
              row.codigo ??
              row.maquinaCodigo ??
              row.maquina_codigo ??
              row.lote_codigo ??
              row.tipo_codigo ??
              `Item ${index + 1}`,
          );
          return (
            <div
              className="bar-row"
              key={`${label}-${index}`}
              title={`${label}: ${formatNumber(value)} ${unit}`}
            >
              <span>{label}</span>
              <div>
                <b style={{ width: max ? `${Math.max(4, (value / max) * 100)}%` : '0%' }} />
              </div>
              <strong>{formatNumber(unit === '%' ? value * 100 : value)}</strong>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function OeeMemory({ memory }: { memory: Record<string, unknown> }) {
  const rows = [
    ['Tempo bruto', seconds(memory.tempoBrutoTurnoS)],
    ['Intervalos excluidos', seconds(memory.intervalosExcluidosS)],
    ['Indisponibilidades planejadas', seconds(memory.indisponibilidadesPlanejadasS)],
    ['Tempo planejado', seconds(memory.tempoPlanejadoS)],
    ['Tempo operacional', seconds(memory.tempoOperacionalS)],
    ['Quantidade produzida', safeText(memory.quantidadeProduzida ?? 0)],
    ['Ciclo padrao aplicado', `${formatNumber(Number(memory.cicloPadraoMedioS ?? 0))} s`],
    ['Cavidades', formatNumber(Number(memory.cavidadesMedia ?? 0))],
    ['Formula', safeText(memory.formulaVersion ?? '')],
  ];
  return (
    <article className="memory-panel">
      <h2>Memoria de calculo OEE</h2>
      <DataTable>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <details>
        <summary>Ver dados tecnicos</summary>
        <pre>{maskUuid(JSON.stringify(memory, null, 2))}</pre>
      </details>
    </article>
  );
}

function TablePanel({ title, rows }: { title: string; rows: Array<Record<string, unknown>> }) {
  const headers = rows.length ? Object.keys(rows[0]).slice(0, 12) : [];
  return (
    <article className="table-panel">
      <h2>{title}</h2>
      {!rows.length ? <p>Sem dados para o periodo.</p> : null}
      {rows.length ? (
        <DataTable>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{titleize(header)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {headers.map((header) => (
                  <td key={header}>{formatCell(row[header])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </DataTable>
      ) : null}
    </article>
  );
}

function formatMetric(value: unknown, spec: { percent?: boolean; unit?: string }) {
  if (value === null || value === undefined || value === '') return 'Sem dados';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return safeText(value);
  if (spec.percent) return `${formatNumber(numeric * 100)}%`;
  if (spec.unit === 'h') return seconds(numeric);
  if (spec.unit === 'R$')
    return numeric.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return formatNumber(numeric);
}

function formatCell(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return safeText(value);
}

function safeText(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value.toString();
  }
  return JSON.stringify(value);
}

function maskUuid(value: string) {
  return value.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    'identificador interno',
  );
}

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function seconds(value: unknown) {
  const hours = Number(value ?? 0) / 3600;
  return `${formatNumber(hours)} h`;
}

function formatPeriod(period?: { inicio: string; fim: string }) {
  if (!period) return 'periodo atual';
  return `${new Date(period.inicio).toLocaleDateString('pt-BR')} a ${new Date(period.fim).toLocaleDateString('pt-BR')}`;
}

function titleize(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

function inferUnit(title: string) {
  if (
    title.toLowerCase().includes('oee') ||
    title.toLowerCase().includes('qualidade') ||
    title.toLowerCase().includes('performance') ||
    title.toLowerCase().includes('disponibilidade')
  )
    return '%';
  if (
    title.toLowerCase().includes('perda') ||
    title.toLowerCase().includes('resina') ||
    title.toLowerCase().includes('estoque')
  )
    return 'kg';
  return 'un.';
}

function asRows(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> => typeof item === 'object' && item !== null,
      )
    : [];
}

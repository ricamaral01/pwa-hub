import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, getApiErrorMessage } from '@/api/client';
import { DataTable, DesktopShell, FilterBar, KpiCard } from '@/ui/desktop';

type Props = {
  kind: 'overview' | 'production' | 'losses' | 'stops' | 'oee' | 'stock' | 'traceability';
};

export default function AnalyticsPage({ kind }: Props) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState('');
  const range = useMemo(() => {
    const fim = new Date();
    const inicio = new Date(Date.now() - 7 * 86400_000);
    return `inicio=${encodeURIComponent(inicio.toISOString())}&fim=${encodeURIComponent(fim.toISOString())}`;
  }, []);

  const load = useCallback(async () => {
    try {
      const response = await apiClient.get(`/analytics/${kind}?${range}`);
      setData(response.data);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, [kind, range]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = Array.isArray(data) ? data : data ? [data] : [];
  const headers = rows.length ? Object.keys(flatten(rows[0])) : [];

  return (
    <DesktopShell title={`Analytics - ${kind}`}>
      <FilterBar>
        <button type="button" onClick={() => void load()}>
          Atualizar
        </button>
        <a href={`/api/analytics/production/export.csv?${range}`}>Exportar CSV</a>
        {error ? <span role="alert">{error}</span> : null}
      </FilterBar>
      <div className="kpi-grid">
        <KpiCard label="Registros" value={String(rows.length)} />
        <KpiCard label="Ultima atualizacao" value={new Date().toLocaleTimeString()} />
      </div>
      <DataTable>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const flat = flatten(row);
            return (
              <tr key={index}>
                {headers.map((header) => (
                  <td key={header}>{formatCell(flat[header])}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </DesktopShell>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return maskUuid(JSON.stringify(value));
  if (typeof value === 'string') return maskUuid(value);
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value.toString();
  }
  return '';
}

function maskUuid(value: string): string {
  return value.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    'identificador interno',
  );
}

function flatten(value: unknown, prefix = ''): Record<string, unknown> {
  if (!value || typeof value !== 'object') return { [prefix || 'valor']: value };
  return Object.entries(value).reduce<Record<string, unknown>>((acc, [key, item]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === 'object' && !Array.isArray(item))
      Object.assign(acc, flatten(item, next));
    else acc[next] = Array.isArray(item) ? JSON.stringify(item) : item;
    return acc;
  }, {});
}

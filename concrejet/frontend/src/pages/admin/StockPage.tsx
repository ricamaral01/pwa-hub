import { useEffect, useState } from 'react';
import { apiClient, getApiErrorMessage } from '@/api/client';
import { DataTable, DesktopShell, FilterBar, KpiCard } from '@/ui/desktop';

type Movement = {
  id: string;
  tipoMovimento: string;
  loteId: string;
  quantidadeKg: string;
  saldoAnteriorKg: string;
  saldoPosteriorKg: string;
  origemTipo: string;
};

type AvailableLot = { id: string; codigo: string; resina?: { codigo?: string } | null };

export default function StockPage() {
  const [data, setData] = useState<Movement[]>([]);
  const [lots, setLots] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const [response, lotsResponse] = await Promise.all([
        apiClient.get<{ data: Movement[] }>('/stock-movements?limit=50'),
        apiClient.get<AvailableLot[]>('/resin-lots/available'),
      ]);
      setData(response.data.data);
      setLots(
        Object.fromEntries(
          lotsResponse.data.map((lot) => [
            lot.id,
            lot.resina?.codigo ? `${lot.codigo} - ${lot.resina.codigo}` : lot.codigo,
          ]),
        ),
      );
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <DesktopShell title="Estoque e movimentos">
      <FilterBar>
        <button type="button" onClick={() => void load()}>
          Atualizar
        </button>
        {error ? <span role="alert">{error}</span> : null}
      </FilterBar>
      <div className="kpi-grid">
        <KpiCard label="Movimentos" value={String(data.length)} />
        <KpiCard
          label="Consumos"
          value={String(data.filter((item) => item.tipoMovimento === 'consumo').length)}
        />
        <KpiCard
          label="Blendas"
          value={String(data.filter((item) => item.origemTipo === 'blenda').length)}
        />
      </div>
      <DataTable>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Lote</th>
            <th>Kg</th>
            <th>Saldo anterior</th>
            <th>Saldo posterior</th>
            <th>Origem</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.tipoMovimento}</td>
              <td>{lots[item.loteId] ?? 'Lote nao disponivel'}</td>
              <td>{item.quantidadeKg}</td>
              <td>{item.saldoAnteriorKg}</td>
              <td>{item.saldoPosteriorKg}</td>
              <td>{item.origemTipo}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </DesktopShell>
  );
}

import { useEffect, useState } from 'react';
import { apiClient, getApiErrorMessage } from '@/api/client';
import { DataTable, DesktopShell, FilterBar, KpiCard } from '@/ui/desktop';

type Blend = {
  id: string;
  codigo: string;
  descricao: string;
  status: string;
  quantidadePlanejadaKg: string;
  quantidadeResultanteKg?: string | null;
};

export default function BlendsPage() {
  const [data, setData] = useState<Blend[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const response = await apiClient.get<{ data: Blend[] }>('/blends');
      setData(response.data.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <DesktopShell title="Blendas">
      <FilterBar>
        <button type="button" onClick={() => void load()}>
          Atualizar
        </button>
        {error ? <span role="alert">{error}</span> : null}
      </FilterBar>
      <div className="kpi-grid">
        <KpiCard label="Blendas" value={String(data.length)} />
        <KpiCard
          label="Concluidas"
          value={String(data.filter((item) => item.status === 'concluida').length)}
        />
      </div>
      <DataTable>
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Descricao</th>
            <th>Status</th>
            <th>Planejado kg</th>
            <th>Resultado kg</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.codigo}</td>
              <td>{item.descricao}</td>
              <td>{item.status}</td>
              <td>{item.quantidadePlanejadaKg}</td>
              <td>{item.quantidadeResultanteKg ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </DesktopShell>
  );
}

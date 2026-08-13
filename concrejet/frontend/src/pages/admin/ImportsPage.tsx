import { useEffect, useState } from 'react';
import { apiClient, getApiErrorMessage } from '@/api/client';
import { DataTable, DesktopShell, FilterBar, KpiCard } from '@/ui/desktop';

type Batch = {
  id: string;
  nome: string;
  status: string;
  total_linhas: number;
  validas: number;
  rejeitadas: number;
  importadas: number;
};

export default function ImportsPage() {
  const [data, setData] = useState<Batch[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const response = await apiClient.get<Batch[]>('/imports');
      setData(response.data);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function analyze() {
    try {
      await apiClient.post('/imports/analyze', {
        path: '../imports/historico/exemplos',
        batchName: `fixture-${Date.now()}`,
      });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <DesktopShell title="Importacao historica">
      <FilterBar>
        <button type="button" onClick={() => void analyze()}>
          Analisar fixture
        </button>
        <button type="button" onClick={() => void load()}>
          Atualizar
        </button>
        {error ? <span role="alert">{error}</span> : null}
      </FilterBar>
      <div className="kpi-grid">
        <KpiCard label="Lotes" value={String(data.length)} />
      </div>
      <DataTable>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Status</th>
            <th>Linhas</th>
            <th>Validas</th>
            <th>Rejeitadas</th>
            <th>Importadas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.nome}</td>
              <td>{item.status}</td>
              <td>{item.total_linhas}</td>
              <td>{item.validas}</td>
              <td>{item.rejeitadas}</td>
              <td>{item.importadas}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </DesktopShell>
  );
}

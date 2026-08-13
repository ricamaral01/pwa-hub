import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';

export default function SyncConflictsPage() {
  const conflicts = useLiveQuery(() => db.conflicts.toArray(), []) ?? [];
  return (
    <main className="desktop-shell">
      <aside className="desktop-sidebar">
        <strong>ConcreTrack</strong>
        <span>Sincronizacao</span>
      </aside>
      <section className="desktop-content">
        <header className="desktop-header">
          <h1>Conflitos de sincronizacao</h1>
        </header>
        <div className="desktop-panel">
          <table className="industrial-table">
            <thead>
              <tr>
                <th>Operacao</th>
                <th>Registrado em</th>
                <th>Campos</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map((item) => (
                <tr key={item.id}>
                  <td>{item.queueItemUuid}</td>
                  <td>{item.registradoEm}</td>
                  <td>{item.camposDiferentes.join(', ') || 'revisao manual'}</td>
                  <td>{item.resolvidoEm ? 'resolvido' : 'aguardando supervisor'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

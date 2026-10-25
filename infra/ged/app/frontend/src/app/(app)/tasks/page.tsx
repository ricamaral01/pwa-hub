'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Clock, ListTodo, Plus, AlertCircle, Printer } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useEmbeddedReady } from '@/hooks/useEmbeddedReady';
import { useAuth } from '@/contexts/AuthContext';
import { tasksApi } from '@/services/api';
import StatsCard from '@/components/StatsCard';
import TaskBoard, { TaskRow } from '@/components/TaskBoard';
import TaskFilters from '@/components/TaskFilters';
import TaskModal from '@/components/TaskModal';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const { isLoading } = useRequireAuth();
  const { hasRole } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEmbeddedReady(!isLoading && !loading);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({
    search: '',
    status: '',
    priority: '',
    responsible_id: '',
    department: '',
    mine: '',
    overdue: '',
  });

  const canCreate = hasRole('ADMIN','ADMIN_MASTER', 'QUALIDADE', 'ENGENHARIA', 'LABORATORIO');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const [tasksRes, dashboardRes, usersRes] = await Promise.all([
        tasksApi.list(params),
        tasksApi.dashboard(),
        tasksApi.users(),
      ]);
      setTasks(tasksRes.data || []);
      setDashboard(dashboardRes.data || null);
      setUsers(usersRes.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!isLoading) load();
  }, [isLoading, load]);

  function setFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const summary = dashboard?.summary || {};

  return (
    <div className="space-y-5 task-report">
      <div className="hidden print:block report-heading">
        <div><strong>CONCREFER</strong><span>GED · CONTROLE DE TAREFAS</span></div>
        <div className="text-right"><strong>RELATÓRIO DE TAREFAS</strong><span>Emitido em {new Date().toLocaleString('pt-BR')}</span></div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
          <p className="text-sm text-gray-500 mt-1">Controle de pendências, planos de ação e atividades do GED</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50">
            <Printer size={16} /> Imprimir relatório
          </button>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} />
            Nova tarefa
          </button>
        )}</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Abertas" value={Number(summary.open_total || 0)} icon={ListTodo} color="blue" />
        <StatsCard label="Atrasadas" value={Number(summary.overdue_total || 0)} icon={AlertCircle} color="red" />
        <StatsCard label="Concluidas no mes" value={Number(summary.completed_month || 0)} icon={CheckCircle} color="green" />
        <StatsCard label="Minhas pendências" value={Number(summary.my_pending || 0)} icon={Clock} color="yellow" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 print:hidden">
        <TaskFilters users={users} values={filters} onChange={setFilter} onSearch={load} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{tasks.length} tarefa(s)</h2>
            <button onClick={load} className="text-sm text-brand-600 hover:underline">Atualizar</button>
          </div>
          <TaskBoard tasks={tasks} loading={loading} />
        </div>

        <aside className="space-y-4 print:hidden">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Proximos vencimentos</h3>
            <div className="space-y-3">
              {(dashboard?.due_soon || []).map((task: TaskRow) => (
                <a key={task.id} href={`/unificado/ged/tasks/${task.id}`} className="block text-sm hover:text-brand-600">
                  <span className="font-medium text-gray-800">{task.title}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : '-'}</span>
                </a>
              ))}
              {!dashboard?.due_soon?.length && <p className="text-xs text-gray-400">Nenhum vencimento proximo.</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Por status</h3>
            <div className="space-y-2">
              {(dashboard?.by_status || []).map((item: any) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{String(item.label).replaceAll('_', ' ')}</span>
                  <span className="font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {showModal && <TaskModal onClose={() => setShowModal(false)} onSuccess={load} />}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { AlertCircle, Calendar, FileText, Users } from 'lucide-react';
import clsx from 'clsx';
import { AREA_LABELS } from '@/constants/documentMeta';
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from '@/constants/taskMeta';

export interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  department?: string | null;
  due_date?: string | null;
  responsible_name?: string | null;
  created_by_name?: string | null;
  participants_count?: number;
  documents_count?: number;
  overdue?: boolean;
}

interface TaskBoardProps {
  tasks: TaskRow[];
  loading?: boolean;
}

export default function TaskBoard({ tasks, loading }: TaskBoardProps) {
  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-gray-400">
        <AlertCircle size={34} className="mb-2" />
        <p className="text-sm font-medium">Nenhuma tarefa encontrada.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Tarefa', 'Status', 'Prioridade', 'Responsável', 'Setor', 'Prazo', 'Vinculos'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50/70">
                <td className="px-4 py-3">
                  <Link href={`/tasks/${task.id}`} className="text-sm font-semibold text-gray-900 hover:text-brand-600 underline underline-offset-2">
                    {task.title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">Criada por {task.created_by_name || '-'}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', TASK_STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-700')}>
                    {TASK_STATUS_LABELS[task.status] || task.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', TASK_PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-700')}>
                    {TASK_PRIORITY_LABELS[task.priority] || task.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">{task.responsible_name || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{task.department ? (AREA_LABELS[task.department] || task.department) : '-'}</td>
                <td className="px-4 py-3 text-xs">
                  {task.due_date ? (
                    <span className={clsx('inline-flex items-center gap-1', task.overdue ? 'text-red-700 font-semibold' : 'text-gray-700')}>
                      <Calendar size={13} />
                      {new Date(task.due_date).toLocaleDateString('pt-BR')}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex items-center gap-1"><Users size={13} />{task.participants_count || 0}</span>
                    <span className="inline-flex items-center gap-1"><FileText size={13} />{task.documents_count || 0}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden divide-y divide-gray-100">
        {tasks.map((task) => (
          <Link key={task.id} href={`/tasks/${task.id}`} className="block p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{task.responsible_name || 'Sem responsável'} · {task.department || '-'}</p>
              </div>
              {task.overdue && <AlertCircle size={17} className="text-red-600 shrink-0" />}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', TASK_STATUS_COLORS[task.status])}>{TASK_STATUS_LABELS[task.status]}</span>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', TASK_PRIORITY_COLORS[task.priority])}>{TASK_PRIORITY_LABELS[task.priority]}</span>
              {task.due_date && <span className="text-xs text-gray-500">{new Date(task.due_date).toLocaleDateString('pt-BR')}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

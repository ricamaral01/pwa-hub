'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, ExternalLink, FileText, Paperclip, Plus, Send, UserPlus, X } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { tasksApi } from '@/services/api';
import { AREA_LABELS } from '@/constants/documentMeta';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from '@/constants/taskMeta';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function TaskDetailPage() {
  useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [taskRes, usersRes] = await Promise.all([
        tasksApi.getById(id),
        tasksApi.users(),
      ]);
      setData(taskRes.data);
      setUsers(usersRes.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao carregar tarefa.');
      router.push('/tasks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  const task = data?.task;
  const participants = data?.participants || [];
  const participantIds = useMemo(() => new Set(participants.map((p: any) => p.user_id)), [participants]);
  const availableParticipants = users.filter((u) => !participantIds.has(u.id) && u.id !== task?.responsible_id);

  async function doAction(fn: () => Promise<any>, success: string) {
    setSaving(true);
    try {
      await fn();
      toast.success(success);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Falha na operação.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !task) {
    return (
      <div className="h-56 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const inputClass = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 bg-white';

  return (
    <div className="space-y-5 max-w-6xl">
      <Link href="/tasks" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} />
        Voltar para Tarefas
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', TASK_STATUS_COLORS[task.status])}>{TASK_STATUS_LABELS[task.status]}</span>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', TASK_PRIORITY_COLORS[task.priority])}>{TASK_PRIORITY_LABELS[task.priority]}</span>
              {task.overdue && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Atrasada</span>}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-sm text-gray-500">
              Responsavel: {task.responsible_name || '-'} · Setor: {task.department ? (AREA_LABELS[task.department] || task.department) : '-'} · Criada por {task.created_by_name || '-'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className={inputClass}
              value={task.status}
              disabled={saving}
              onChange={(e) => doAction(() => tasksApi.updateStatus(id, e.target.value), 'Status atualizado.')}
            >
              {TASK_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        <main className="space-y-5">
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Dados da tarefa</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Responsavel</label>
                <select
                  className={inputClass}
                  value={task.responsible_id || ''}
                  disabled={saving}
                  onChange={(e) => doAction(() => tasksApi.updateResponsible(id, e.target.value), 'Responsavel atualizado.')}
                >
                  <option value="">Sem responsável</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Prazo</label>
                <input
                  type="date"
                  className={inputClass}
                  defaultValue={task.due_date ? String(task.due_date).slice(0, 10) : ''}
                  onBlur={(e) => {
                    const next = e.target.value;
                    const current = task.due_date ? String(task.due_date).slice(0, 10) : '';
                    if (next !== current) doAction(() => tasksApi.updateDueDate(id, next || undefined), 'Prazo atualizado.');
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Prioridade</label>
                <select
                  className={inputClass}
                  value={task.priority}
                  disabled={saving}
                  onChange={(e) => doAction(() => tasksApi.update(id, { priority: e.target.value }), 'Prioridade atualizada.')}
                >
                  {TASK_PRIORITIES.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-medium text-gray-700 mb-1">Descrição</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 min-h-20">{task.description || 'Sem descricao.'}</p>
            </div>
            {task.observations && (
              <div>
                <h3 className="text-xs font-medium text-gray-700 mb-1">Observacoes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{task.observations}</p>
              </div>
            )}
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Documentos vinculados</h2>
            {(data.documents || []).length ? (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                {data.documents.map((doc: any) => (
                  <div key={doc.document_id} className="p-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{doc.code} - {doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.area} · Rev {String(doc.current_revision).padStart(2, '0')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href={`/documents/${doc.document_id}`} className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
                        <FileText size={13} />Abrir
                      </Link>
                      {doc.current_file_url && (
                        <a href={doc.current_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
                          <ExternalLink size={13} />Drive
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Nenhum documento vinculado.</p>
            )}
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Comentarios</h2>
            <div className="flex gap-2">
              <input className={inputClass} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Adicionar comentario" />
              <button
                disabled={saving || !comment.trim()}
                onClick={() => doAction(async () => { await tasksApi.comment(id, comment.trim()); setComment(''); }, 'Comentario registrado.')}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-black disabled:opacity-60"
              >
                <Send size={15} />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {(data.comments || []).map((item: any) => (
                <div key={item.id} className="py-3 text-sm">
                  <p className="text-gray-700 whitespace-pre-wrap">{item.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.created_by_name} · {new Date(item.created_at).toLocaleString('pt-BR')}</p>
                </div>
              ))}
              {!data.comments?.length && <p className="text-sm text-gray-400">Nenhum comentario.</p>}
            </div>
          </section>
        </main>

        <aside className="space-y-5">
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Resumo</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Criação</span>
                <span className="font-medium text-gray-800">{new Date(task.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Prazo</span>
                <span className={clsx('font-medium inline-flex items-center gap-1', task.overdue ? 'text-red-700' : 'text-gray-800')}>
                  <Calendar size={13} />{task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
              {task.completed_at && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Conclusao</span>
                  <span className="font-medium text-gray-800">{new Date(task.completed_at).toLocaleString('pt-BR')}</span>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Participantes</h2>
            <div className="space-y-2">
              {participants.map((p: any) => (
                <div key={p.user_id} className="flex items-center justify-between gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-700">{p.name}</span>
                  <button onClick={() => doAction(() => tasksApi.removeParticipant(id, p.user_id), 'Participante removido.')} className="text-gray-400 hover:text-red-600">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <select className={inputClass} value={participantId} onChange={(e) => setParticipantId(e.target.value)}>
                <option value="">Adicionar</option>
                {availableParticipants.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <button
                disabled={!participantId || saving}
                onClick={() => doAction(async () => { await tasksApi.addParticipant(id, participantId); setParticipantId(''); }, 'Participante adicionado.')}
                className="px-3 rounded-lg bg-brand-600 text-white disabled:opacity-60"
              >
                <UserPlus size={16} />
              </button>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Anexos</h2>
            <div className="space-y-2">
              {(data.attachments || []).map((file: any) => (
                <a key={file.id} href={file.storage_path} target="_blank" rel="noopener noreferrer" className="block text-sm text-brand-600 hover:underline">
                  <Paperclip size={13} className="inline mr-1" />{file.original_name}
                </a>
              ))}
              {!data.attachments?.length && <p className="text-xs text-gray-400">Nenhum anexo.</p>}
            </div>
            <div className="flex gap-2">
              <input type="file" className="w-full text-xs" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
              <button
                disabled={!attachment || saving}
                onClick={() => attachment && doAction(async () => { await tasksApi.uploadAttachment(id, attachment); setAttachment(null); }, 'Anexo enviado.')}
                className="px-3 rounded-lg bg-gray-900 text-white disabled:opacity-60"
              >
                <Plus size={15} />
              </button>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Historico</h2>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              {(data.history || []).map((item: any) => (
                <div key={item.id} className="py-3 text-xs">
                  <p className="font-semibold text-gray-700">{String(item.event_type).replaceAll('_', ' ')}</p>
                  <p className="text-gray-600 mt-0.5">{item.description}</p>
                  <p className="text-gray-400 mt-1">{item.created_by_name || 'Sistema'} · {new Date(item.created_at).toLocaleString('pt-BR')}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

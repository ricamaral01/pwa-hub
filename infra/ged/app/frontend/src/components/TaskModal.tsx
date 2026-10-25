'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { tasksApi } from '@/services/api';
import { AREAS } from '@/constants/documentMeta';
import { TASK_PRIORITIES } from '@/constants/taskMeta';
import toast from 'react-hot-toast';

interface TaskModalProps {
  documentId?: string;
  documentLabel?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TaskModal({ documentId, documentLabel, onClose, onSuccess }: TaskModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    responsible_id: '',
    department: '',
    priority: 'MEDIA',
    due_date: '',
    observations: '',
  });

  useEffect(() => {
    tasksApi.users()
      .then((res) => setUsers(res.data || []))
      .catch(() => toast.error('Erro ao carregar usuários.'));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.responsible_id || !form.department) {
      toast.error('Preencha título, responsável e setor.');
      return;
    }

    setSaving(true);
    try {
      await tasksApi.create({
        ...form,
        document_id: documentId || undefined,
        due_date: form.due_date || null,
      });
      toast.success('Tarefa criada.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao criar tarefa.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 bg-white';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white w-full max-w-2xl rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Nova tarefa</h2>
            {documentLabel && <p className="text-xs text-gray-500 mt-0.5">Vinculada a {documentLabel}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
            <input className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex.: Revisar procedimento PR-SGQ-01" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
            <textarea className={inputClass} rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Responsável *</label>
              <select className={inputClass} value={form.responsible_id} onChange={(e) => set('responsible_id', e.target.value)}>
                <option value="">Selecione</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Setor *</label>
              <select className={inputClass} value={form.department} onChange={(e) => set('department', e.target.value)}>
                <option value="">Selecione</option>
                {AREAS.map((area) => (
                  <option key={area.value} value={area.value}>{area.value} - {area.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prioridade</label>
              <select className={inputClass} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prazo</label>
              <input type="date" className={inputClass} value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observacoes</label>
            <textarea className={inputClass} rows={3} value={form.observations} onChange={(e) => set('observations', e.target.value)} />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button disabled={saving} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">
            {saving ? 'Salvando...' : 'Criar tarefa'}
          </button>
        </div>
      </form>
    </div>
  );
}

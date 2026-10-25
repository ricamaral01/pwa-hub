'use client';

import { Search } from 'lucide-react';
import { AREAS } from '@/constants/documentMeta';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/constants/taskMeta';

interface TaskFiltersProps {
  users: any[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSearch: () => void;
}

export default function TaskFilters({ users, values, onChange, onSearch }: TaskFiltersProps) {
  const inputClass = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 bg-white';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-8 gap-3">
      <div className="md:col-span-2 xl:col-span-2 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={`${inputClass} pl-9`}
          value={values.search || ''}
          onChange={(e) => onChange('search', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="Buscar tarefa"
        />
      </div>

      <select className={inputClass} value={values.status || ''} onChange={(e) => onChange('status', e.target.value)}>
        <option value="">Status</option>
        {TASK_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>

      <select className={inputClass} value={values.priority || ''} onChange={(e) => onChange('priority', e.target.value)}>
        <option value="">Prioridade</option>
        {TASK_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>

      <select className={inputClass} value={values.responsible_id || ''} onChange={(e) => onChange('responsible_id', e.target.value)}>
        <option value="">Responsável</option>
        {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
      </select>

      <select className={inputClass} value={values.department || ''} onChange={(e) => onChange('department', e.target.value)}>
        <option value="">Setor</option>
        {AREAS.map((area) => <option key={area.value} value={area.value}>{area.value}</option>)}
      </select>

      <label className="flex items-center gap-2 text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 bg-white">
        <input type="checkbox" checked={values.mine === 'true'} onChange={(e) => onChange('mine', e.target.checked ? 'true' : '')} />
        Minhas
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 bg-white">
        <input type="checkbox" checked={values.overdue === 'true'} onChange={(e) => onChange('overdue', e.target.checked ? 'true' : '')} />
        Atrasadas
      </label>
    </div>
  );
}

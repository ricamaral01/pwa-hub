'use client';

import { Search } from 'lucide-react';
import { AREA_LABELS, AREAS } from '@/constants/documentMeta';

interface FilterBarProps {
  onAreaChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSearch: (value: string) => void;
  area: string;
  status: string;
  search: string;
}

const AREA_VALUES = ['', ...AREAS.map((a) => a.value)];

const STATUSES = ['', 'APROVADO', 'EM_REVISAO', 'OBSOLETO'];
const STATUS_LABELS: Record<string, string> = {
  '':         'Todos os Status',
  APROVADO:   'Aprovado',
  EM_REVISAO: 'Em Revisão',
  OBSOLETO:   'Obsoleto',
};

export default function FilterBar({ onAreaChange, onStatusChange, onSearch, area, status, search }: FilterBarProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_220px_180px]">
      {/* Busca */}
      <div className="relative sm:col-span-2 xl:col-span-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por código ou nome..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Área */}
      <select
        value={area}
        onChange={(e) => onAreaChange(e.target.value)}
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white"
      >
        {AREA_VALUES.map((a) => (
          <option key={a} value={a}>{AREA_LABELS[a]}</option>
        ))}
      </select>

      {/* Status */}
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
    </div>
  );
}

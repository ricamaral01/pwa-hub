'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { rncApi } from '@/services/api';
import { RNC_STATUSES, RNC_SEVERITIES, RNC_STATUS_COLORS } from '@/constants/rncMeta';
import { AREAS, AREA_LABELS } from '@/constants/documentMeta';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type RncRow = {
  id: string;
  number: string;
  title: string;
  status: string;
  severity: string;
  origin: string;
  emitter_area: string;
  destination_area: string;
  due_date?: string | null;
  created_by_name: string;
  responsible_name?: string | null;
  actions_count: number;
  actions_open_count: number;
  created_at: string;
};

export default function RncListPage() {
  useRequireAuth(['ADMIN', 'ADMIN_MASTER', 'QUALIDADE', 'ENGENHARIA', 'LABORATORIO']);

  const [items, setItems] = useState<RncRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [readonly, setReadonly] = useState(false);
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [destinationArea, setDestinationArea] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      if (severity) params.severity = severity;
      if (destinationArea) params.destination_area = destinationArea;
      if (search) params.search = search;
      const res = await rncApi.list(params);
      setItems(res.data);
    } catch {
      toast.error('Erro ao carregar RNCs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    rncApi.mode().then((res) => setReadonly(res.data.readonly)).catch(() => {});
    load();
  }, [status, severity, destinationArea]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Não Conformidades</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} registro(s) encontrado(s)</p>
        </div>
        {!readonly && <Link
          href="/rnc/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Nova RNC
        </Link>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Buscar por numero, titulo ou descricao"
            className="w-full text-sm border border-gray-300 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="">Todos os status</option>
          {RNC_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="">Todas as severidades</option>
          {RNC_SEVERITIES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={destinationArea}
          onChange={(e) => setDestinationArea(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="">Todos os setores destino</option>
          {AREAS.map((a) => (
            <option key={a.value} value={a.value}>{a.value} - {a.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-gray-400">
            <AlertTriangle size={34} className="mb-2" />
            <p className="text-sm font-medium">Nenhuma RNC encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Número', 'Título', 'Status', 'Severidade', 'Setor Destino', 'Responsável', 'Ações', 'Prazo', 'Criado por'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.number}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <Link href={`/rnc/${r.id}`} className="hover:text-brand-700 underline underline-offset-2">{r.title}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', RNC_STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-700')}>
                        {r.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">{r.severity}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{AREA_LABELS[r.destination_area] || r.destination_area}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{r.responsible_name || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{r.actions_open_count}/{r.actions_count}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{r.due_date ? new Date(r.due_date).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{r.created_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, CheckCircle, Clock, Archive, AlertCircle, Calendar } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useEmbeddedReady } from '@/hooks/useEmbeddedReady';
import { documentsApi } from '@/services/api';
import StatsCard from '@/components/StatsCard';
import DocumentTable, { DocumentRow } from '@/components/DocumentTable';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { AREAS } from '@/constants/documentMeta';

interface Stats {
  total: string;
  aprovados: string;
  em_revisao: string;
  obsoletos: string;
  pendentes: string;
}

interface AreaStat {
  area: string;
  status: string;
  count: number;
}

interface ExpiringDoc {
  id: string;
  code: string;
  name: string;
  area: string;
  valid_until: string;
  days_to_expire: number;
}

const STATUSES = [
  { value: 'APROVADO',   label: 'Aprovados',   cell: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200' },
  { value: 'EM_REVISAO', label: 'Em Revisão',  cell: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'OBSOLETO',   label: 'Obsoletos',   cell: 'bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-200'    },
];

export default function DashboardPage() {
  const { isLoading } = useRequireAuth();
  const router = useRouter();
  const [stats, setStats]         = useState<Stats | null>(null);
  const [areaStats, setAreaStats] = useState<AreaStat[]>([]);
  const [recent, setRecent]       = useState<DocumentRow[]>([]);
  const [expiring, setExpiring]   = useState<ExpiringDoc[]>([]);
  const [loading, setLoading]     = useState(true);
  useEmbeddedReady(!isLoading && !loading);

  useEffect(() => {
    if (isLoading) return;

    async function load() {
      try {
        const [statsRes, docsRes, areaRes, expiringRes] = await Promise.all([
          documentsApi.stats(),
          documentsApi.list({ status: 'APROVADO' }),
          documentsApi.statsByArea(),
          documentsApi.expiring(),
        ]);
        setStats(statsRes.data);
        setRecent(docsRes.data.slice(0, 6));
        setAreaStats(areaRes.data);
        setExpiring(expiringRes.data);
      } catch {
        toast.error('Erro ao carregar dados do dashboard.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isLoading]);

  function getCount(area: string, status: string): number {
    return areaStats.find((s) => s.area === area && s.status === status)?.count ?? 0;
  }

  function navigate(area: string, status: string) {
    router.push(`/documents?area=${area}&status=${status}`);
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral do controle documental</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Documentos Vigentes" value={Number(stats?.aprovados ?? 0)} icon={CheckCircle} color="green" />
        <StatsCard label="Em Revisão" value={Number(stats?.em_revisao ?? 0)} icon={Clock} color="yellow" />
        <StatsCard label="Obsoletos" value={Number(stats?.obsoletos ?? 0)} icon={Archive} color="gray" />
        <StatsCard label="Aprovações Pendentes" value={Number(stats?.pendentes ?? 0)} icon={AlertCircle} color="red" />
      </div>

      {/* Alertas de Vencimento */}
      {expiring.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden shadow-sm shadow-red-50">
          <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <h2 className="font-bold text-red-900 uppercase tracking-wider text-xs">Atenção: Documentos Próximos ao Vencimento</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Validade</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expiring.map((doc) => (
                  <tr key={doc.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-semibold text-gray-900">{doc.code}</div>
                      <div className="text-xs text-gray-500">{doc.name}</div>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-600">{doc.area}</td>
                    <td className="px-6 py-3">
                      <span className={clsx(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        doc.days_to_expire <= 7 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      )}>
                        <Calendar size={12} />
                        {new Date(doc.valid_until).toLocaleDateString('pt-BR')} ({doc.days_to_expire} dias)
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs">
                      <button 
                        onClick={() => router.push(`/documents/${doc.id}`)}
                        className="text-brand-600 hover:text-brand-700 font-bold hover:underline"
                      >
                        REVISAR AGORA
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Matriz por Área */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Documentos por Área</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Área</th>
                {STATUSES.map((s) => (
                  <th key={s.value} className="text-center px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {AREAS.map((area) => (
                <tr key={area.value} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-700 whitespace-nowrap">{area.label}</td>
                  {STATUSES.map((st) => {
                    const count = getCount(area.value, st.value);
                    return (
                      <td key={st.value} className="px-2 py-3 text-center">
                        <button
                          onClick={() => navigate(area.value, st.value)}
                          className={clsx(
                            'inline-flex items-center justify-center min-w-[40px] px-3 py-1 rounded-lg border text-sm font-semibold transition-colors',
                            count > 0 ? st.cell : 'bg-white text-gray-300 border-gray-100 cursor-default pointer-events-none'
                          )}
                          disabled={count === 0}
                        >
                          {count}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Documentos Vigentes Recentes</h2>
          </div>
          <button onClick={() => router.push('/documents')} className="text-sm text-brand-600 hover:underline">Ver todos</button>
        </div>
        <DocumentTable documents={recent} compact />
      </div>
    </div>
  );
}

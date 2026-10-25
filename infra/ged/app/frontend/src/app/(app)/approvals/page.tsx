'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useEmbeddedReady } from '@/hooks/useEmbeddedReady';
import { approvalsApi } from '@/services/api';
import ApprovalModal, { ApprovalItem } from '@/components/ApprovalModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckSquare, Eye, ExternalLink } from 'lucide-react';

export default function ApprovalsPage() {
  const { isLoading } = useRequireAuth();

  const [pending,  setPending]  = useState<ApprovalItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  useEmbeddedReady(!isLoading && !loading);
  const [selected, setSelected] = useState<ApprovalItem | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await approvalsApi.getPending();
      // Mapear campos do backend para a interface ApprovalItem
      setPending(res.data.map((a: any) => ({
        approval_id:       a.approval_id,
        version_id:        a.version_id,
        document_id:       a.document_id,
        code:              a.code,
        name:              a.name,
        area:              a.area,
        approval_level:    a.approval_level,
        revision_number:   a.revision_number,
        file_name:         a.file_name,
        drive_web_url:     a.drive_web_url,
        requested_by_name: a.requested_by_name,
        requested_at:      a.requested_at,
      })));
    } catch {
      toast.error('Erro ao carregar aprovações pendentes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (!isLoading) load(); }, [isLoading]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aprovações</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pending.length} pendência{pending.length !== 1 ? 's' : ''} aguardando revisão
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <CheckSquare size={32} className="mb-3 text-green-400" />
            <p className="text-sm font-medium">Nenhuma aprovação pendente!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pending.map((item) => (
              <div key={item.approval_id} className="px-4 py-4 sm:px-6 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                    <span className="font-mono text-sm font-bold text-brand-600">
                      Rev {String(item.revision_number).padStart(2, '0')}
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      Nível {item.approval_level} • Pendente
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 break-words">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    Solicitado por: {item.requested_by_name} &bull;{' '}
                    {format(new Date(item.requested_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-3 sm:mt-0">
                  {item.drive_web_url && (
                    <a
                      href={item.drive_web_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-brand-600 transition-colors"
                      title="Abrir arquivo"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                  <button
                    onClick={() => setSelected(item)}
                    className="flex flex-1 items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-brand-600 border border-brand-600 rounded-lg hover:bg-brand-50 transition-colors sm:flex-none"
                  >
                    <Eye size={15} />
                    Revisar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ApprovalModal
          item={selected}
          onClose={() => setSelected(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

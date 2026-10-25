
"use client";

import Link from 'next/link';
import { Edit2, ExternalLink, Trash2, Upload, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';
import { AREA_LABELS } from '@/constants/documentMeta';

export interface DocumentRow {
  id: string;
  code: string;
  name: string;
  area: string;
  status: string;
  current_revision: number;
  updated_at: string;
  created_by_name: string;
  current_file_url?: string;
}

interface DocumentTableProps {
  documents: DocumentRow[];
  loading?: boolean;
  onUpload?: (doc: DocumentRow) => void;
  onEdit?: (doc: DocumentRow) => void;
  onDelete?: (doc: DocumentRow) => void;
  compact?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  APROVADO:   { label: 'Aprovado',   className: 'bg-green-100 text-green-700' },
  EM_REVISAO: { label: 'Em Revisao', className: 'bg-amber-100 text-amber-700' },
  OBSOLETO:   { label: 'Obsoleto',   className: 'bg-gray-100 text-gray-500' },
};

function ActionButtons({ doc, onUpload, onEdit, onDelete, mobile }: {
  doc: DocumentRow;
  onUpload?: (doc: DocumentRow) => void;
  onEdit?: (doc: DocumentRow) => void;
  onDelete?: (doc: DocumentRow) => void;
  mobile?: boolean;
}) {
  const buttonClass = mobile ? 'rounded-lg p-2 text-gray-400 transition-colors' : '';
  return (
    <div className="flex items-center gap-2">
      <Link href={`/documents/${doc.id}`} title="Ver detalhes" className={mobile ? `${buttonClass} hover:bg-brand-50 hover:text-brand-600` : undefined}>
        <Eye size={16} className={mobile ? undefined : 'text-gray-400 hover:text-brand-600 transition-colors'} />
      </Link>
      {doc.current_file_url && (
        <a href={doc.current_file_url} target="_blank" rel="noopener noreferrer" title="Abrir arquivo" className={mobile ? `${buttonClass} hover:bg-brand-50 hover:text-brand-600` : undefined}>
          <ExternalLink size={16} className={mobile ? undefined : 'text-gray-400 hover:text-brand-600 transition-colors'} />
        </a>
      )}
      {onUpload && (
        <button onClick={() => onUpload(doc)} title="Nova versao" className={mobile ? `${buttonClass} hover:bg-amber-50 hover:text-amber-600` : undefined}>
          <Upload size={16} className={mobile ? undefined : 'text-gray-400 hover:text-amber-600 transition-colors'} />
        </button>
      )}
      {onEdit && (
        <button onClick={() => onEdit(doc)} title="Editar documento" className={mobile ? `${buttonClass} hover:bg-blue-50 hover:text-blue-600` : undefined}>
          <Edit2 size={16} className={mobile ? undefined : 'text-gray-400 hover:text-blue-600 transition-colors'} />
        </button>
      )}
      {onDelete && (
        <button onClick={() => onDelete(doc)} title="Excluir documento" className={mobile ? `${buttonClass} hover:bg-red-50 hover:text-red-600` : undefined}>
          <Trash2 size={16} className={mobile ? undefined : 'text-gray-400 hover:text-red-600 transition-colors'} />
        </button>
      )}
    </div>
  );
}

export default function DocumentTable({ documents, loading, onUpload, onEdit, onDelete, compact }: DocumentTableProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-3 text-sm">Carregando documentos...</p>
      </div>
    );
  }

  if (!documents.length) {
    return <div className="text-center py-12 text-gray-400"><p className="text-sm">Nenhum documento encontrado.</p></div>;
  }

  return (
    <>
      <div className="divide-y divide-gray-100 md:hidden">
        {documents.map((doc) => {
          const statusCfg = STATUS_CONFIG[doc.status] ?? { label: doc.status, className: 'bg-gray-100 text-gray-500' };
          return (
            <div key={doc.id} className="space-y-3 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{doc.code}</span>
                  <p className="mt-2 font-medium text-gray-900">{doc.name}</p>
                  {!compact && <p className="mt-1 text-xs text-gray-500">{AREA_LABELS[doc.area] ?? doc.area}</p>}
                </div>
                <span className={clsx('inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-xs font-medium', statusCfg.className)}>{statusCfg.label}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-gray-500">
                  <span className="font-mono font-semibold text-brand-600">Rev {String(doc.current_revision).padStart(2, '0')}</span>
                  {!compact && <> - {format(new Date(doc.updated_at), 'dd/MM/yyyy', { locale: ptBR })}</>}
                </div>
                <ActionButtons doc={doc} onUpload={onUpload} onEdit={onEdit} onDelete={onDelete} mobile />
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Codigo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
              {!compact && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Area</th>}
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revisao</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              {!compact && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Atualizado</th>}
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.map((doc) => {
              const statusCfg = STATUS_CONFIG[doc.status] ?? { label: doc.status, className: 'bg-gray-100 text-gray-500' };
              return (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{doc.code}</span></td>
                  <td className="px-4 py-3"><p className="font-medium text-gray-900 truncate max-w-xs">{doc.name}</p></td>
                  {!compact && <td className="px-4 py-3 text-gray-600">{AREA_LABELS[doc.area] ?? doc.area}</td>}
                  <td className="px-4 py-3"><span className="font-mono text-xs font-semibold text-brand-600">Rev {String(doc.current_revision).padStart(2, '0')}</span></td>
                  <td className="px-4 py-3"><span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', statusCfg.className)}>{statusCfg.label}</span></td>
                  {!compact && <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(doc.updated_at), 'dd/MM/yyyy', { locale: ptBR })}</td>}
                  <td className="px-4 py-3"><ActionButtons doc={doc} onUpload={onUpload} onEdit={onEdit} onDelete={onDelete} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

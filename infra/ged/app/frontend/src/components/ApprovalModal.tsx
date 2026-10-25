'use client';

import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { approvalsApi } from '@/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ApprovalItem {
  approval_id: string;
  version_id: string;
  document_id: string;
  code: string;
  name: string;
  area: string;
  approval_level: number;
  revision_number: number;
  file_name: string;
  drive_web_url?: string;
  requested_by_name: string;
  requested_at: string;
}

interface ApprovalModalProps {
  item: ApprovalItem;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApprovalModal({ item, onClose, onSuccess }: ApprovalModalProps) {
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handle(action: 'approve' | 'reject') {
    setSubmitting(true);
    try {
      if (action === 'approve') {
        await approvalsApi.approve(item.version_id, comments);
        toast.success('Documento aprovado!');
      } else {
        if (!comments.trim()) {
          toast.error('Informe o motivo da rejeição.');
          setSubmitting(false);
          return;
        }
        await approvalsApi.reject(item.version_id, comments);
        toast.success('Documento rejeitado.');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao processar aprovação.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Revisão de Documento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Código:</span>
              <span className="font-mono font-semibold">{item.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Documento:</span>
              <span className="font-medium text-right max-w-[200px]">{item.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Revisão:</span>
              <span className="font-mono font-semibold text-brand-600">
                Rev {String(item.revision_number).padStart(2, '0')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nível de aprovação:</span>
              <span className="font-medium">{item.approval_level === 1 ? '1º nível (Gestor da Área)' : '2º nível (Gestor SGQ)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Solicitado por:</span>
              <span>{item.requested_by_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Data:</span>
              <span>{format(new Date(item.requested_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
            </div>
            {item.drive_web_url && (
              <a
                href={item.drive_web_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block pt-1 text-brand-600 hover:underline text-xs"
              >
                Abrir arquivo no Google Drive →
              </a>
            )}
          </div>

          {/* Comentários */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Comentários <span className="text-gray-400">(obrigatório para rejeição)</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
              placeholder="Adicione observações..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => handle('reject')}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle size={16} />
              Rejeitar
            </button>
            <button
              onClick={() => handle('approve')}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={16} />
              Aprovar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

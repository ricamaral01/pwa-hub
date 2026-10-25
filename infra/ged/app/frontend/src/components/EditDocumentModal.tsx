'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsApi } from '@/services/api';
import { AREAS, DOCUMENT_TYPES } from '@/constants/documentMeta';
import { DocumentRow } from '@/components/DocumentTable';

interface EditDocumentModalProps {
  document: DocumentRow;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  name: string;
  area: string;
  doc_type: string;
  description: string;
  valid_until?: string;
}

export default function EditDocumentModal({ document, onClose, onSuccess }: EditDocumentModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    documentsApi.getById(document.id)
      .then((res) => {
        const doc = res.data;
        reset({
          name: doc.name ?? '',
          area: doc.area ?? '',
          doc_type: doc.doc_type ?? 'DC',
          description: doc.description ?? '',
          valid_until: doc.valid_until ? String(doc.valid_until).slice(0, 10) : '',
        });
      })
      .catch(() => toast.error('Erro ao carregar documento.'));
  }, [document.id, reset]);

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    try {
      await documentsApi.update(document.id, {
        ...data,
        valid_until: data.valid_until || null,
      });
      toast.success('Documento atualizado.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar documento.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-3 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Editar Documento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Documento *</label>
            <input {...register('name', { required: 'Obrigat?rio' })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
              <select {...register('doc_type', { required: 'Obrigat?rio' })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white">
                {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.value} - {t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">?rea *</label>
              <select {...register('area', { required: 'Obrigat?rio' })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white">
                {AREAS.map((a) => <option key={a.value} value={a.value}>{a.value} - {a.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descri??o</label>
            <textarea {...register('description')} rows={3} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data de Validade</label>
            <input type="date" {...register('valid_until')} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" />
          </div>

          <div className="flex gap-3 pt-3 pb-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50">
              {submitting ? 'Salvando...' : 'Salvar Altera??es'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

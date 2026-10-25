'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsApi } from '@/services/api';
import { AREAS, DOCUMENT_TYPES } from '@/constants/documentMeta';

interface UploadModalProps {
  /** Se passado, faz upload como nova versão do documento existente */
  documentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  code: string;
  name: string;
  area: string;
  doc_type: string;
  description: string;
  change_summary: string;
  valid_until?: string;
  initial_revision?: number;
}

export default function UploadModal({ documentId, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [namePlaceholder, setNamePlaceholder] = useState('Ex: Procedimento de auditoria interna');
  const fileRef = useRef<HTMLInputElement>(null);

  const isNewDoc = !documentId;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>();

  const selectedArea = watch('area');
  const selectedType = watch('doc_type');

  // Ao mudar área/tipo: atualiza prefixo do código e placeholder do nome
  useEffect(() => {
    const area = AREAS.find((a) => a.value === selectedArea);
    if (area) {
      setNamePlaceholder(area.placeholder);
    }

    const codeParts: string[] = [];
    if (selectedType) codeParts.push(selectedType);
    if (area?.prefix) codeParts.push(area.prefix);
    if (codeParts.length) {
      setValue('code', `${codeParts.join('-')}-`);
    }
  }, [selectedArea, selectedType, setValue]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  async function onSubmit(data: FormValues) {
    if (!file) {
      toast.error('Selecione um arquivo.');
      return;
    }

    setSubmitting(true);
    try {
      let targetId = documentId;

      if (isNewDoc) {
        // Criar documento primeiro
        const createRes = await documentsApi.create({
          code: data.code,
          name: data.name,
          area: data.area,
          doc_type: data.doc_type,
          description: data.description,
          valid_until: data.valid_until || undefined,
          initial_revision: data.initial_revision ?? 0,
        });
        targetId = createRes.data.id;
      }

      // Upload do arquivo
      await documentsApi.uploadVersion(targetId!, file, undefined, data.change_summary);

      toast.success(isNewDoc ? 'Documento criado com sucesso!' : 'Nova versão enviada para revisão!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao enviar arquivo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-3 max-h-[92vh] overflow-y-auto pb-2">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isNewDoc ? 'Novo Documento' : 'Nova Versão'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Campos só para novo documento */}
          {isNewDoc && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Documento *</label>
                  <select
                    {...register('doc_type', { required: 'Obrigatório' })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="">Selecione o tipo...</option>
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.value} - {t.label}</option>
                    ))}
                  </select>
                  {errors.doc_type && <p className="text-xs text-red-500 mt-1">{errors.doc_type.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Área *</label>
                  <select
                    {...register('area', { required: 'Obrigatório' })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="">Selecione a área...</option>
                    {AREAS.map((a) => (
                      <option key={a.value} value={a.value}>{a.value} - {a.label}</option>
                    ))}
                  </select>
                  {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Código *</label>
                  <input
                    {...register('code', { required: 'Obrigatório' })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none uppercase"
                    placeholder="Ex: MQ-SGQ-001"
                  />
                  {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">Formato sugerido: TIPO-AREA-SEQ (ex: MQ-SGQ-001)</p>
                </div>

                <div className="flex flex-col justify-end">
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                    O código é montado automaticamente com tipo e área. Complete com o número sequencial.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Número da Revisão Inicial *</label>
                <input
                  type="number"
                  min={0}
                  {...register('initial_revision', {
                    required: 'Obrigatório',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Mínimo 0' },
                  })}
                  defaultValue={0}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                  placeholder="0"
                />
                {errors.initial_revision && <p className="text-xs text-red-500 mt-1">{errors.initial_revision.message}</p>}
                <p className="text-xs text-gray-400 mt-0.5">Número de revisão inicial do documento (ex: 0 = Rev00, 1 = Rev01). A contagem continua a partir deste número.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Documento *</label>
                <input
                  {...register('name', { required: 'Obrigatório' })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                  placeholder={namePlaceholder}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  {...register('description')}
                  rows={2}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                  placeholder="Descrição opcional do documento..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data de Validade</label>
                <input
                  type="date"
                  {...register('valid_until')}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-400 mt-0.5">Após esta data, um novo documento deverá ser emitido. Opcional.</p>
              </div>
            </>
          )}

          {!isNewDoc && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Alterações desta versão *</label>
              <textarea
                {...register('change_summary', { required: 'Informe o que mudou nesta versão' })}
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                placeholder="Ex: Revisados critérios de aceite, atualizados responsáveis e incluído novo anexo técnico."
              />
              {errors.change_summary && <p className="text-xs text-red-500 mt-1">{errors.change_summary.message}</p>}
            </div>
          )}

          {/* Drop zone */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Arquivo * <span className="text-gray-400">(PDF, DOCX, XLSX, DOC, XLS — máx. 50 MB)</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragging ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400'
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                  <FileText size={20} className="text-brand-600" />
                  <span>{file.name}</span>
                  <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              ) : (
                <div className="text-gray-400">
                  <Upload size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Arraste o arquivo aqui ou clique para selecionar</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.doc,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : isNewDoc ? 'Criar Documento' : 'Enviar Nova Versão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

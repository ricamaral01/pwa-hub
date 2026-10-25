"use client";

import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useEmbeddedReady } from '@/hooks/useEmbeddedReady';
import { documentsApi } from '@/services/api';
import DocumentTable, { DocumentRow } from '@/components/DocumentTable';
import FilterBar from '@/components/FilterBar';
import UploadModal from '@/components/UploadModal';
import EditDocumentModal from '@/components/EditDocumentModal';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const DOCUMENT_MANAGERS = new Set([
  'ifanger.ilson@gmail.com',
  'ifanger.ilson@gmail',
  'ricardo@concrefer.com.br',
]);

export default function DocumentsPage() {
  const { isLoading } = useRequireAuth();
  const { user, hasPermission } = useAuth();

  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading]     = useState(true);
  useEmbeddedReady(!isLoading && !loading);
  const [area,    setArea]         = useState('');
  const [status,  setStatus]       = useState('');
  const [search,  setSearch]       = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('area'))   setArea(sp.get('area')!);
    if (sp.get('status')) setStatus(sp.get('status')!);
  }, []);

  const [showUpload, setShowUpload]   = useState(false);
  const [uploadDocId, setUploadDocId] = useState<string | undefined>(undefined);
  const [editingDoc, setEditingDoc]   = useState<DocumentRow | null>(null);

  const isDocumentManager = DOCUMENT_MANAGERS.has((user?.email || '').toLowerCase());
  const canUpload = hasPermission('documents.create') && hasPermission('documents.upload');
  const canEdit = isDocumentManager || hasPermission('documents.edit_all') || hasPermission('documents.manage');
  const canDelete = isDocumentManager || hasPermission('documents.delete') || hasPermission('documents.manage');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (area)   params.area   = area;
      if (status) params.status = status;
      if (search) params.name   = search;

      const res = await documentsApi.list(params);
      setDocuments(res.data);
    } catch {
      toast.error('Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  }, [area, status, search]);

  useEffect(() => {
    if (!isLoading) load();
  }, [isLoading, load]);

  function handleUploadExisting(doc: DocumentRow) {
    setUploadDocId(doc.id);
    setShowUpload(true);
  }

  async function handleDelete(doc: DocumentRow) {
    const confirmed = window.confirm(`Excluir o documento ${doc.code} - ${doc.name}? Esta a??o n?o pode ser desfeita.`);
    if (!confirmed) return;

    try {
      await documentsApi.remove(doc.id);
      toast.success('Documento exclu?do.');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir documento.');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {documents.length} documento{documents.length !== 1 ? 's' : ''} encontrado{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => { setUploadDocId(undefined); setShowUpload(true); }}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors sm:w-auto"
          >
            <Plus size={16} />
            Novo Documento
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <FilterBar
          area={area}
          status={status}
          search={search}
          onAreaChange={setArea}
          onStatusChange={setStatus}
          onSearch={setSearch}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <DocumentTable
          documents={documents}
          loading={loading}
          onUpload={canUpload ? handleUploadExisting : undefined}
          onEdit={canEdit ? setEditingDoc : undefined}
          onDelete={canDelete ? handleDelete : undefined}
        />
      </div>

      {showUpload && (
        <UploadModal
          documentId={uploadDocId}
          onClose={() => setShowUpload(false)}
          onSuccess={load}
        />
      )}

      {editingDoc && (
        <EditDocumentModal
          document={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

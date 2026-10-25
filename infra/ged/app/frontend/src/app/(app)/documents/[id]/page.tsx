'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { documentsApi, approvalsApi, readLogsApi, tasksApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, CheckCircle, ExternalLink, Upload, Users, FileText, XCircle, Clock, ListTodo, Plus } from 'lucide-react';
import Link from 'next/link';
import UploadModal from '@/components/UploadModal';
import clsx from 'clsx';
import { AREA_LABELS, DOCUMENT_TYPE_LABELS } from '@/constants/documentMeta';
import TaskModal from '@/components/TaskModal';
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS, TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '@/constants/taskMeta';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  APROVADO:   { label: 'Aprovado',    className: 'bg-green-100 text-green-700' },
  EM_REVISAO: { label: 'Em Revisão',  className: 'bg-amber-100 text-amber-700' },
  OBSOLETO:   { label: 'Obsoleto',    className: 'bg-gray-100 text-gray-500'   },
};

const APPROVAL_STATUS: Record<string, { label: string; className: string }> = {
  PENDENTE:  { label: 'Pendente',    className: 'bg-amber-100 text-amber-700' },
  APROVADO:  { label: 'Aprovado',    className: 'bg-green-100 text-green-700' },
  REJEITADO: { label: 'Rejeitado',   className: 'bg-red-100 text-red-700'     },
};

/** Retorna URL para embed no iframe.
 *  - Google Drive: extrai file ID e usa /preview
 *  - PDF local: usa diretamente no iframe (preview nativo do browser)
 *  - DOC/DOCX/XLS/XLSX: usa visualizador Office embutido
 */
function getEmbedUrl(url?: string, fileName?: string, officePreviewUrl?: string | null): string | null {
  if (!url) return null;

  // Links do Google Drive usam preview nativo.
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;

  // Garante URL absoluta para visores externos.
  const absoluteUrl = url.startsWith('http')
    ? url
    : (typeof window !== 'undefined' ? `${window.location.origin}${url}` : url);

  // PDFs podem ser exibidos diretamente pelo browser (sem depender de serviço externo).
  const ext = (fileName || url).split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return absoluteUrl;

  // Office files: renderização em iframe via Office Web Viewer.
  if (ext && ['doc', 'docx', 'xls', 'xlsx'].includes(ext)) {
    return officePreviewUrl
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(officePreviewUrl)}`
      : null;
  }

  return null;
}

export default function DocumentDetailPage() {
  useRequireAuth();
  const { hasRole, hasPermission, user } = useAuth();
  const params  = useParams();
  const router  = useRouter();
  const id      = params.id as string;

  const [doc,          setDoc]          = useState<any>(null);
  const [versions,     setVersions]     = useState<any[]>([]);
  const [officePreviewUrl, setOfficePreviewUrl] = useState<string | null>(null);
  const [readLogs,     setReadLogs]     = useState<any[]>([]);
  const [myStatus,     setMyStatus]     = useState<{ read: boolean; read_at?: string; current_version_id?: string } | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [confirming,   setConfirming]   = useState(false);
  const [approving,    setApproving]    = useState(false);
  const [showUpload,   setShowUpload]   = useState(false);
  const [comments,     setComments]     = useState('');
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [linkedTasks, setLinkedTasks] = useState<any[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const canUpload  = hasPermission('documents.upload');
  const canApprove = hasPermission('documents.approve_technical') || hasPermission('documents.approve_quality') || hasPermission('documents.approve_final');
  const canAdminDocument = hasPermission('documents.publish') || hasPermission('documents.make_obsolete');
  const canCreateTask = hasRole('ADMIN','ADMIN_MASTER', 'QUALIDADE', 'ENGENHARIA', 'LABORATORIO');

  async function load() {
    setLoading(true);
    setOfficePreviewUrl(null);
    try {
      const [docRes, versionsRes] = await Promise.all([
        documentsApi.getById(id),
        documentsApi.getVersions(id),
      ]);
      setDoc(docRes.data);
      setVersions(versionsRes.data);
      const ext = String(docRes.data.current_file_name || '').split('.').pop()?.toLowerCase();
      if (['doc', 'docx', 'xls', 'xlsx'].includes(ext || '') && docRes.data.current_version_id) {
        try {
          const preview = await documentsApi.getOfficePreview(id, docRes.data.current_version_id);
          setOfficePreviewUrl(preview.data.url);
        } catch {
          // O download autenticado permanece disponível caso a prévia falhe.
        }
      }
    } catch {
      toast.error('Documento não encontrado.');
      router.push('/documents');
      return;
    }

    try {
      const logsRes = await readLogsApi.getLogs(id);
      setReadLogs(logsRes.data);
    } catch { /* silencioso */ }

    try {
      const statusRes = await readLogsApi.myStatus(id);
      setMyStatus(statusRes.data);
    } catch { /* silencioso */ }

    try {
      const tasksRes = await tasksApi.list({ document_id: id });
      setLinkedTasks(tasksRes.data || []);
    } catch { /* silencioso */ }

    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleConfirmRead() {
    if (!myStatus?.current_version_id || myStatus.read) return;
    setConfirming(true);
    try {
      await readLogsApi.confirm(id, myStatus.current_version_id);
      toast.success('Leitura confirmada!');
      setMyStatus((s) => s ? { ...s, read: true, read_at: new Date().toISOString() } : s);
      const logsRes = await readLogsApi.getLogs(id);
      setReadLogs(logsRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao confirmar leitura.');
    } finally {
      setConfirming(false);
    }
  }

  async function handleApprove() {
    const pendingVersion = versions.find((v) => v.approval_status === 'PENDENTE');
    if (!pendingVersion) return;
    setApproving(true);
    try {
      await approvalsApi.approve(pendingVersion.id, comments);
      toast.success('Documento aprovado!');
      setShowApproveForm(false);
      setComments('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao aprovar.');
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!comments.trim()) {
      toast.error('Informe o motivo da rejeição.');
      return;
    }
    const pendingVersion = versions.find((v) => v.approval_status === 'PENDENTE');
    if (!pendingVersion) return;
    setApproving(true);
    try {
      await approvalsApi.reject(pendingVersion.id, comments);
      toast.success('Documento rejeitado.');
      setShowApproveForm(false);
      setComments('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao rejeitar.');
    } finally {
      setApproving(false);
    }
  }

  async function handlePublish() {
    if (!confirm('Publicar este documento e liberar a versão atual para produção?')) return;
    setApproving(true);
    try {
      await documentsApi.publish(id);
      toast.success('Documento publicado.');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao publicar documento.');
    } finally {
      setApproving(false);
    }
  }

  async function handleMakeObsolete() {
    if (!confirm('Tornar este documento obsoleto? Ele sairá da lista de documentos vigentes.')) return;
    setApproving(true);
    try {
      await documentsApi.makeObsolete(id);
      toast.success('Documento tornado obsoleto.');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao tornar documento obsoleto.');
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!doc) return null;

  const statusCfg      = STATUS_CONFIG[doc.status] ?? { label: doc.status, className: 'bg-gray-100 text-gray-500' };
  const currentWarning = versions.find((v) => v.id === doc.current_version_id)?.processing_warning;
  const embedUrl       = currentWarning ? null : getEmbedUrl(doc.current_file_url, doc.current_file_name, officePreviewUrl);
  const pendingVersion = versions.find((v) => v.approval_status === 'PENDENTE');
  const hasPending     = !!pendingVersion && canApprove;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/documents" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors w-fit">
        <ArrowLeft size={16} />
        Voltar para Documentos
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">{doc.code}</span>
              <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', statusCfg.className)}>{statusCfg.label}</span>
              <span className="font-mono text-sm font-bold text-brand-600">Rev {String(doc.current_revision).padStart(2, '0')}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{doc.name}</h1>
            <p className="text-sm text-gray-500">
              Área: {AREA_LABELS[doc.area] ?? doc.area}
              {doc.doc_type && <> &bull; Tipo: {DOCUMENT_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}</>}
              {' '} &bull; Criado por: {doc.created_by_name} &bull;{' '}
              {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
            {doc.description && <p className="text-sm text-gray-600 mt-2">{doc.description}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {doc.current_file_url && (
              <a href={doc.current_file_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 border border-brand-600 rounded-lg hover:bg-brand-50 transition-colors">
                <ExternalLink size={15} />Abrir no Drive
              </a>
            )}
            {canUpload && (
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">
                <Upload size={15} />Nova Versão
              </button>
            )}
            {hasPending && !showApproveForm && (
              <button onClick={() => setShowApproveForm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors">
                <Clock size={15} />Pendente — Revisar
              </button>
            )}
            {hasPermission('documents.publish') && doc.current_version_id && doc.status === 'EM_REVISAO' && (
              <button onClick={handlePublish} disabled={approving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                <CheckCircle size={15} />Publicar
              </button>
            )}
            {hasPermission('documents.make_obsolete') && doc.current_version_id && doc.status !== 'OBSOLETO' && (
              <button onClick={handleMakeObsolete} disabled={approving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                <XCircle size={15} />Tornar obsoleto
              </button>
            )}
            {myStatus?.current_version_id && (
              myStatus.read ? (
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 font-medium bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle size={15} />Leitura confirmada
                </div>
              ) : (
                <button onClick={handleConfirmRead} disabled={confirming}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                  <CheckCircle size={15} />{confirming ? 'Confirmando...' : 'Confirmar Ciência'}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListTodo size={17} className="text-brand-600" />
            <div>
              <h2 className="font-semibold text-gray-900">Tarefas vinculadas</h2>
              <p className="text-xs text-gray-500">{linkedTasks.length} tarefa(s) relacionada(s) a este documento</p>
            </div>
          </div>
          {canCreateTask && (
            <button
              onClick={() => setShowTaskModal(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
            >
              <Plus size={15} />
              Nova tarefa
            </button>
          )}
        </div>
        {linkedTasks.length ? (
          <div className="divide-y divide-gray-100">
            {linkedTasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {task.responsible_name || 'Sem responsável'} · {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', TASK_STATUS_COLORS[task.status])}>
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', TASK_PRIORITY_COLORS[task.priority])}>
                    {TASK_PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Nenhuma tarefa vinculada.</div>
        )}
      </div>

      {/* Formulário de aprovação */}
      {showApproveForm && hasPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-amber-900">
            Decisão de Aprovação – Rev {String(pendingVersion.revision_number).padStart(2, '0')}
          </h3>
          <p className="text-xs text-amber-700">Revise o documento abaixo antes de aprovar ou rejeitar.</p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Comentários <span className="text-gray-400">(obrigatório para rejeição)</span>
            </label>
            <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
              placeholder="Adicione observações..." />
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleReject} disabled={approving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-200">
              <XCircle size={15} />Rejeitar
            </button>
            <button onClick={handleApprove} disabled={approving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
              <CheckCircle size={15} />{approving ? 'Processando...' : 'Aprovar'}
            </button>
            <button onClick={() => { setShowApproveForm(false); setComments(''); }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Visualizador */}
      {embedUrl ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{doc.current_file_name ?? 'Documento'}</span>
            </div>
            {doc.current_file_url && (
              <a href={doc.current_file_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                <ExternalLink size={12} />Abrir em nova aba
              </a>
            )}
          </div>
          <div className="w-full" style={{ height: '80vh' }}>
            <iframe src={embedUrl} className="w-full h-full border-0" title={doc.name} allow="autoplay" />
          </div>
          {doc.status === 'OBSOLETO' && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="-rotate-[24deg] text-red-600/25 text-6xl font-extrabold tracking-widest select-none">
                VERSAO OBSOLETA
              </div>
            </div>
          )}
        </div>
      ) : doc.current_file_url ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <FileText size={48} className="mx-auto mb-4 text-brand-400" />
          <p className="text-sm font-semibold text-gray-700 mb-1">{doc.current_file_name ?? 'Arquivo disponível'}</p>
          <p className="text-xs text-gray-500 mb-5">
            {currentWarning
              ? 'Prévia desativada para o arquivo original salvo sem carimbo. Faça o download para conferir.'
              : 'Este formato não pode ser visualizado diretamente no navegador. Faça o download para abrir.'}
          </p>
          <a
            href={doc.current_file_url}
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
          >
            <ExternalLink size={15} />Baixar / Abrir Documento
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhum arquivo disponível.</p>
          <p className="text-xs mt-1">Faça o upload de uma versão do documento para visualizar aqui.</p>
        </div>
      )}

      {/* Histórico de versões */}
      {versions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Histórico de Versões</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {versions.map((v) => {
              const apSt = v.approval_status ? APPROVAL_STATUS[v.approval_status] : null;
              const versionReaders = readLogs.filter((log) => log.version_id === v.id);
              return (
                <div key={v.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-brand-600">
                        Rev {String(v.revision_number).padStart(2, '0')}
                      </span>
                      {apSt && (
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', apSt.className)}>
                          {apSt.label}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{v.file_name}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Enviado por: {v.uploaded_by_name} &bull;{' '}
                      {format(new Date(v.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                    {v.approved_by_name && (
                      <p className="text-xs text-gray-500">
                        {v.approval_status === 'APROVADO' ? 'Aprovado' : 'Revisado'} por: {v.approved_by_name}
                        {v.resolved_at && <> &bull; {format(new Date(v.resolved_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</>}
                      </p>
                    )}
                    {v.approval_comments && (
                      <p className="text-xs text-gray-600 italic">"{v.approval_comments}"</p>
                    )}
                    {v.processing_warning && (
                      <p role="alert" className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        {v.processing_warning} O arquivo original foi salvo sem carimbo.
                      </p>
                    )}
                    <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
                      <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
                        <p className="font-semibold text-gray-800">Submetido por</p>
                        <p>{v.uploaded_by_name || 'Nao informado'}</p>
                        <p className="text-gray-400">{format(new Date(v.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
                        <p className="font-semibold text-gray-800">Aprovado por</p>
                        {v.approved_by_name ? (
                          <>
                            <p>{v.approved_by_name}</p>
                            {v.resolved_at && <p className="text-gray-400">{format(new Date(v.resolved_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>}
                          </>
                        ) : (
                          <p className="text-gray-400">Sem aprovacao registrada</p>
                        )}
                      </div>
                      <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
                        <p className="font-semibold text-gray-800">Lido por</p>
                        {versionReaders.length > 0 ? (
                          <div className="space-y-1">
                            {versionReaders.map((log) => (
                              <p key={log.id}>
                                {log.user_name}
                                <span className="text-gray-400"> &bull; {format(new Date(log.read_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400">Nenhuma leitura registrada</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {v.drive_web_url && (
                    <a href={v.drive_web_url} target="_blank" rel="noopener noreferrer" title="Abrir esta versão">
                      <ExternalLink size={14} className="text-gray-400 hover:text-brand-600 shrink-0" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Log de ciência */}
      {hasRole('ADMIN','ADMIN_MASTER', 'QUALIDADE', 'ENGENHARIA') && readLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Users size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Log de Ciência</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {readLogs.map((log) => (
              <div key={log.id} className="px-6 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{log.user_name}</span>
                  <span className="text-gray-500 ml-2">({log.user_role})</span>
                </div>
                <div className="text-xs text-gray-500">
                  Rev {String(log.revision_number).padStart(2, '0')} &bull;{' '}
                  {format(new Date(log.read_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer — Emissor, Aprovador e Validade */}
      {(() => {
        const firstVersion = versions.length > 0 ? versions[versions.length - 1] : null;
        const approvedVersion = versions.find((v) => v.approval_status === 'APROVADO');
        const hasFooterData = firstVersion || approvedVersion || doc.valid_until;
        if (!hasFooterData) return null;
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Informações do Documento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {firstVersion && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-0.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Emissor</p>
                  <p className="text-sm font-semibold text-gray-900">{firstVersion.uploaded_by_name}</p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(firstVersion.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              )}
              {approvedVersion ? (
                <div className="bg-green-50 rounded-lg p-3 space-y-0.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aprovador</p>
                  <p className="text-sm font-semibold text-gray-900">{approvedVersion.approved_by_name}</p>
                  {approvedVersion.resolved_at && (
                    <p className="text-xs text-gray-400">
                      {format(new Date(approvedVersion.resolved_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 space-y-0.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aprovador</p>
                  <p className="text-sm text-gray-400 italic">Aguardando aprovação</p>
                </div>
              )}
              <div className={clsx('rounded-lg p-3 space-y-0.5', doc.valid_until ? 'bg-amber-50' : 'bg-gray-50')}>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Validade</p>
                {doc.valid_until ? (
                  <p className="text-sm font-semibold text-gray-900">
                    {format(new Date(doc.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sem validade definida</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {showUpload && (
        <UploadModal documentId={id} onClose={() => setShowUpload(false)} onSuccess={load} />
      )}
      {showTaskModal && (
        <TaskModal
          documentId={id}
          documentLabel={`${doc.code} - ${doc.name}`}
          onClose={() => setShowTaskModal(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

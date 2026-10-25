'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { rncApi, usersApi } from '@/services/api';
import { RNC_ACTION_STATUSES, RNC_ACTION_TYPES, RNC_ROOT_CAUSE_METHODS, RNC_STATUSES, RNC_STATUS_COLORS } from '@/constants/rncMeta';
import { AREA_LABELS } from '@/constants/documentMeta';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function RncDetailPage() {
  useRequireAuth(['ADMIN', 'ADMIN_MASTER', 'QUALIDADE', 'ENGENHARIA', 'LABORATORIO']);
  const params = useParams();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [readonly, setReadonly] = useState(false);
  const [migratedUrl, setMigratedUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  const [triage, setTriage] = useState({ triage_notes: '', responsible_sector_user_id: '', due_date: '', status: 'TRIAGEM_SGQ' });
  const [statusChange, setStatusChange] = useState('');
  const [rootCause, setRootCause] = useState({ method: '5_PORQUES', problem_statement: '', direct_cause: '', root_cause: '', contributing_causes: '' });
  const [action, setAction] = useState({ action_type: 'CORRETIVA', action_description: '', why: '', where_action: '', who_user_id: '', when_due: '', how: '', how_much: '' });
  const [comment, setComment] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [effectiveness, setEffectiveness] = useState({ effectiveness_result: true, notes: '', follow_up_required: false });

  async function load() {
    setLoading(true);
    try {
      const [rncRes, usersRes, modeRes] = await Promise.all([rncApi.getById(id), usersApi.list(), rncApi.mode()]);
      setReadonly(modeRes.data.readonly);
      setData(rncRes.data);
      setUsers(usersRes.data || []);
      const report = rncRes.data.report;
      setTriage({
        triage_notes: report.triage_notes || '',
        responsible_sector_user_id: report.responsible_sector_user_id || '',
        due_date: report.due_date ? String(report.due_date).slice(0, 10) : '',
        status: report.status === 'ABERTA' ? 'TRIAGEM_SGQ' : report.status,
      });
      setStatusChange(report.status || 'EM_ANALISE');
      const rc = rncRes.data.root_cause;
      if (rc) {
        setRootCause({
          method: rc.method,
          problem_statement: rc.problem_statement || '',
          direct_cause: rc.direct_cause || '',
          root_cause: rc.root_cause || '',
          contributing_causes: rc.contributing_causes || '',
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao carregar RNC.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  useEffect(() => {
    if (!readonly || !id) return;
    fetch(`/unificado/qualidade/api/nc/legado/${encodeURIComponent(id)}`, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setMigratedUrl(data?.url || null))
      .catch(() => setMigratedUrl(null));
  }, [readonly, id]);

  const responsibleCandidates = useMemo(() => {
    if (!data?.report?.destination_area) return users;
    return users.filter((u) => !u.managed_area || u.managed_area === data.report.destination_area);
  }, [users, data?.report?.destination_area]);

  async function doAction(fn: () => Promise<any>, successMsg: string) {
    setSaving(true);
    try {
      await fn();
      toast.success(successMsg);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Falha na operação.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-56 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data?.report) {
    return <div className="text-sm text-red-600">RNC nao encontrada.</div>;
  }

  const report = data.report;
  const inputClass = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{report.number} - {report.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Setor destino: {AREA_LABELS[report.destination_area] || report.destination_area} | Emissor: {AREA_LABELS[report.emitter_area] || report.emitter_area}
            </p>
          </div>
          <span className={clsx('text-xs px-2.5 py-1 rounded-full font-semibold', RNC_STATUS_COLORS[report.status] || 'bg-gray-100 text-gray-700')}>
            {report.status.replaceAll('_', ' ')}
          </span>
        </div>
      </div>

      {readonly && <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Esta RNC antiga está disponível somente para consulta. Registre e trate NCs novas no módulo Qualidade. {migratedUrl && <a className="underline font-semibold" href={migratedUrl}>Abrir NC migrada</a>}</div>}
      {readonly ? <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="font-semibold">Descrição</h2><p className="mt-2 whitespace-pre-wrap text-sm">{report.description}</p>
        <h2 className="mt-5 font-semibold">Histórico</h2>
        {(data.history || []).map((h:any) => <p key={h.id} className="mt-2 border-t pt-2 text-sm">{h.event_type}: {h.description}</p>)}
      </div> : <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Triagem SGQ / Atribuicao</h2>
          <textarea className={inputClass} rows={3} value={triage.triage_notes} onChange={(e)=>setTriage((p)=>({...p, triage_notes:e.target.value}))} placeholder="Orientacoes de triagem" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select className={inputClass} value={triage.responsible_sector_user_id} onChange={(e)=>setTriage((p)=>({...p, responsible_sector_user_id:e.target.value}))}>
              <option value="">Sem responsável definido</option>
              {responsibleCandidates.map((u:any)=> <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
            <input type="date" className={inputClass} value={triage.due_date} onChange={(e)=>setTriage((p)=>({...p, due_date:e.target.value}))} />
          </div>
          <select className={inputClass} value={triage.status} onChange={(e)=>setTriage((p)=>({...p, status:e.target.value}))}>
            {RNC_STATUSES.map((s)=> <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button disabled={saving} onClick={()=>doAction(()=>rncApi.triage(id, triage), 'Triagem salva.')} className="px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">Salvar triagem</button>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Mudanca de Status</h2>
          <select className={inputClass} value={statusChange} onChange={(e)=>setStatusChange(e.target.value)}>
            {RNC_STATUSES.map((s)=> <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button disabled={saving} onClick={()=>doAction(()=>rncApi.updateStatus(id, statusChange), 'Status atualizado.')} className="px-4 py-2.5 rounded-lg bg-gray-800 text-white text-sm font-semibold hover:bg-gray-900 disabled:opacity-60">Atualizar status</button>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 xl:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Análise de Causa Raiz</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select className={inputClass} value={rootCause.method} onChange={(e)=>setRootCause((p)=>({...p, method:e.target.value}))}>
              {RNC_ROOT_CAUSE_METHODS.map((m)=> <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <input className={inputClass} value={rootCause.problem_statement} onChange={(e)=>setRootCause((p)=>({...p, problem_statement:e.target.value}))} placeholder="Problema analisado" />
            <input className={inputClass} value={rootCause.direct_cause} onChange={(e)=>setRootCause((p)=>({...p, direct_cause:e.target.value}))} placeholder="Causa direta" />
            <input className={inputClass} value={rootCause.root_cause} onChange={(e)=>setRootCause((p)=>({...p, root_cause:e.target.value}))} placeholder="Causa raiz" />
            <textarea className={inputClass + ' md:col-span-2'} rows={3} value={rootCause.contributing_causes} onChange={(e)=>setRootCause((p)=>({...p, contributing_causes:e.target.value}))} placeholder="Causas contribuintes" />
          </div>
          <button disabled={saving} onClick={()=>doAction(()=>rncApi.upsertRootCause(id, {...rootCause, method_payload:{}}), 'Causa raiz salva.')} className="px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">Salvar causa raiz</button>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 xl:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Plano de Acao 5W2H</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className={inputClass} value={action.action_type} onChange={(e)=>setAction((p)=>({...p, action_type:e.target.value}))}>
              {RNC_ACTION_TYPES.map((a)=> <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <select className={inputClass} value={action.who_user_id} onChange={(e)=>setAction((p)=>({...p, who_user_id:e.target.value}))}>
              <option value="">Responsavel</option>
              {users.map((u:any)=> <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input type="date" className={inputClass} value={action.when_due} onChange={(e)=>setAction((p)=>({...p, when_due:e.target.value}))} />
            <input className={inputClass + ' md:col-span-3'} value={action.action_description} onChange={(e)=>setAction((p)=>({...p, action_description:e.target.value}))} placeholder="What - O que sera feito" />
            <input className={inputClass} value={action.why} onChange={(e)=>setAction((p)=>({...p, why:e.target.value}))} placeholder="Why - Por que" />
            <input className={inputClass} value={action.where_action} onChange={(e)=>setAction((p)=>({...p, where_action:e.target.value}))} placeholder="Where - Onde" />
            <input className={inputClass} value={action.how} onChange={(e)=>setAction((p)=>({...p, how:e.target.value}))} placeholder="How - Como" />
            <input className={inputClass} type="number" step="0.01" value={action.how_much} onChange={(e)=>setAction((p)=>({...p, how_much:e.target.value}))} placeholder="How much - Custo" />
          </div>
          <button disabled={saving} onClick={()=>doAction(()=>rncApi.addAction(id, {...action, how_much: action.how_much ? Number(action.how_much) : null}), 'Ação adicionada.')} className="px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">Adicionar ação</button>

          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
            {(data.actions || []).map((a:any) => (
              <div key={a.id} className="p-3 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-semibold text-gray-700">{a.action_type}</span>
                <span className="text-gray-600 flex-1 min-w-[240px]">{a.action_description}</span>
                <span className="text-gray-500">Resp: {a.responsible_name || '-'}</span>
                <span className="text-gray-500">Prazo: {a.when_due ? new Date(a.when_due).toLocaleDateString('pt-BR') : '-'}</span>
                <select className="border border-gray-300 rounded px-2 py-1 text-xs" value={a.status} onChange={(e)=>doAction(()=>rncApi.updateAction(id, a.id, { status: e.target.value, completed_at: e.target.value === 'CONCLUIDA' ? new Date().toISOString() : null }), 'Status da ação atualizado.')}>
                  {RNC_ACTION_STATUSES.map((s)=> <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Verificação de Eficácia</h2>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={effectiveness.effectiveness_result} onChange={(e)=>setEffectiveness((p)=>({...p, effectiveness_result:e.target.checked}))} />
            Eficaz
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={effectiveness.follow_up_required} onChange={(e)=>setEffectiveness((p)=>({...p, follow_up_required:e.target.checked}))} />
            Requer follow-up
          </label>
          <textarea className={inputClass} rows={3} value={effectiveness.notes} onChange={(e)=>setEffectiveness((p)=>({...p, notes:e.target.value}))} placeholder="Notas da verificação" />
          <button disabled={saving} onClick={()=>doAction(()=>rncApi.reviewEffectiveness(id, effectiveness), 'Revisao de eficacia registrada.')} className="px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">Salvar eficacia</button>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Encerramento / Reabertura</h2>
          <textarea className={inputClass} rows={3} value={conclusion} onChange={(e)=>setConclusion(e.target.value)} placeholder="Conclusao final ou motivo de reabertura" />
          <div className="flex gap-3">
            <button disabled={saving} onClick={()=>doAction(()=>rncApi.close(id, conclusion || undefined), 'RNC encerrada.')} className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">Encerrar</button>
            <button disabled={saving} onClick={()=>doAction(()=>rncApi.reopen(id, conclusion || undefined), 'RNC reaberta.')} className="px-4 py-2.5 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60">Reabrir</button>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 xl:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Historico e Comentarios</h2>
          <div className="flex gap-2">
            <input className={inputClass + ' flex-1'} value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="Registrar comentario" />
            <button disabled={saving || !comment.trim()} onClick={()=>doAction(async ()=>{await rncApi.comment(id, comment.trim()); setComment('');}, 'Comentario registrado.')} className="px-4 py-2.5 rounded-lg bg-gray-800 text-white text-sm font-semibold hover:bg-gray-900 disabled:opacity-60">Adicionar</button>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg">
            {(data.history || []).map((h:any) => (
              <div key={h.id} className="p-3 text-xs">
                <p className="font-semibold text-gray-700">{h.event_type}</p>
                <p className="text-gray-600 mt-0.5">{h.description}</p>
                <p className="text-gray-400 mt-1">{h.created_by_name || 'Sistema'} · {new Date(h.created_at).toLocaleString('pt-BR')}</p>
              </div>
            ))}
          </div>
        </section>
      </div>}
    </div>
  );
}

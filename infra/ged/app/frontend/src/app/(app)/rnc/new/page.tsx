'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { rncApi } from '@/services/api';
import { AREAS } from '@/constants/documentMeta';
import { RNC_ORIGINS, RNC_SEVERITIES, RNC_TYPES, RNC_ROOT_CAUSE_METHODS } from '@/constants/rncMeta';
import toast from 'react-hot-toast';

export default function NewRncPage() {
  useRequireAuth(['ADMIN', 'ADMIN_MASTER', 'QUALIDADE', 'ENGENHARIA', 'LABORATORIO']);
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    origin: 'PROCESSO_INTERNO',
    severity: 'MEDIA',
    rnc_type: 'PROCESSO',
    emitter_area: 'SGQ',
    destination_area: 'SGQ',
    description: '',
    requirement_reference: '',
    evidence_description: '',
    impact_description: '',
    containment_action: '',
    source_reference: '',
    product_reference: '',
    process_reference: '',
    lot_reference: '',
    supplier_reference: '',
    customer_reference: '',
    order_reference: '',
    due_date: '',
    responsible_sector_user_id: '',
    root_method: '5_PORQUES',
    root_problem_statement: '',
    root_direct_cause: '',
    root_root_cause: '',
    root_contributing_causes: '',
  });

  useEffect(() => {
    rncApi.mode().then((res) => {
      if (res.data.readonly) window.location.replace('/unificado/qualidade/abrir');
    }).catch(() => {});
    rncApi.users()
      .then((res) => setUsers(res.data || []))
      .catch(() => toast.error('Erro ao carregar responsáveis.'));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Preencha titulo e descricao.');
      return;
    }

    setSubmitting(true);
    try {
      const createRes = await rncApi.create({
        title: form.title,
        origin: form.origin,
        severity: form.severity,
        rnc_type: form.rnc_type,
        emitter_area: form.emitter_area,
        destination_area: form.destination_area,
        description: form.description,
        requirement_reference: form.requirement_reference || null,
        evidence_description: form.evidence_description || null,
        impact_description: form.impact_description || null,
        containment_action: form.containment_action || null,
        source_reference: form.source_reference || null,
        product_reference: form.product_reference || null,
        process_reference: form.process_reference || null,
        lot_reference: form.lot_reference || null,
        supplier_reference: form.supplier_reference || null,
        customer_reference: form.customer_reference || null,
        order_reference: form.order_reference || null,
        due_date: form.due_date || null,
        responsible_sector_user_id: form.responsible_sector_user_id || null,
      });

      const rnc = createRes.data;

      if (form.root_problem_statement.trim() && form.root_root_cause.trim()) {
        await rncApi.upsertRootCause(rnc.id, {
          method: form.root_method,
          problem_statement: form.root_problem_statement,
          direct_cause: form.root_direct_cause || null,
          root_cause: form.root_root_cause,
          contributing_causes: form.root_contributing_causes || null,
          method_payload: {},
        });
      }

      toast.success('RNC aberta com sucesso.');
      router.push(`/rnc/${rnc.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao abrir RNC.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abertura de RNC</h1>
        <p className="text-sm text-gray-500 mt-1">Modelo completo com classificação, contenção e causa raiz.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">1. Dados Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Título da não conformidade *</label>
              <input className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Descreva objetivamente a nao conformidade" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Origem *</label>
              <select className={inputClass} value={form.origin} onChange={(e) => set('origin', e.target.value)}>
                {RNC_ORIGINS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
              <select className={inputClass} value={form.rnc_type} onChange={(e) => set('rnc_type', e.target.value)}>
                {RNC_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Severidade *</label>
              <select className={inputClass} value={form.severity} onChange={(e) => set('severity', e.target.value)}>
                {RNC_SEVERITIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prazo de tratamento</label>
              <input type="date" className={inputClass} value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Responsável pelo tratamento *</label>
              <select required className={inputClass} value={form.responsible_sector_user_id} onChange={(e) => set('responsible_sector_user_id', e.target.value)}>
                <option value="">Selecione o responsável</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Setor emissor *</label>
              <select className={inputClass} value={form.emitter_area} onChange={(e) => set('emitter_area', e.target.value)}>
                {AREAS.map((a) => <option key={a.value} value={a.value}>{a.value} - {a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Setor destinatario *</label>
              <select className={inputClass} value={form.destination_area} onChange={(e) => set('destination_area', e.target.value)}>
                {AREAS.map((a) => <option key={a.value} value={a.value}>{a.value} - {a.label}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">2. Descrição da Não Conformidade</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Descrição objetiva *</label>
              <textarea className={inputClass} rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Requisito afetado (norma/procedimento)</label>
              <input className={inputClass} value={form.requirement_reference} onChange={(e) => set('requirement_reference', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Evidencias iniciais</label>
              <input className={inputClass} value={form.evidence_description} onChange={(e) => set('evidence_description', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Impacto</label>
              <input className={inputClass} value={form.impact_description} onChange={(e) => set('impact_description', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contencao imediata</label>
              <input className={inputClass} value={form.containment_action} onChange={(e) => set('containment_action', e.target.value)} />
            </div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Produto</label><input className={inputClass} value={form.product_reference} onChange={(e)=>set('product_reference', e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Processo</label><input className={inputClass} value={form.process_reference} onChange={(e)=>set('process_reference', e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Lote</label><input className={inputClass} value={form.lot_reference} onChange={(e)=>set('lot_reference', e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Fornecedor</label><input className={inputClass} value={form.supplier_reference} onChange={(e)=>set('supplier_reference', e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label><input className={inputClass} value={form.customer_reference} onChange={(e)=>set('customer_reference', e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Pedido / OS</label><input className={inputClass} value={form.order_reference} onChange={(e)=>set('order_reference', e.target.value)} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Fonte da deteccao</label><input className={inputClass} value={form.source_reference} onChange={(e)=>set('source_reference', e.target.value)} /></div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">3. Análise Inicial de Causa Raiz (Opcional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ferramenta da qualidade</label>
              <select className={inputClass} value={form.root_method} onChange={(e) => set('root_method', e.target.value)}>
                {RNC_ROOT_CAUSE_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Problema analisado</label>
              <input className={inputClass} value={form.root_problem_statement} onChange={(e) => set('root_problem_statement', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Causa direta</label>
              <input className={inputClass} value={form.root_direct_cause} onChange={(e) => set('root_direct_cause', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Causa raiz</label>
              <input className={inputClass} value={form.root_root_cause} onChange={(e) => set('root_root_cause', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Causas contribuintes</label>
              <textarea rows={3} className={inputClass} value={form.root_contributing_causes} onChange={(e) => set('root_contributing_causes', e.target.value)} />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={submitting} className="px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">
            {submitting ? 'Salvando...' : 'Abrir RNC'}
          </button>
        </div>
      </form>
    </div>
  );
}

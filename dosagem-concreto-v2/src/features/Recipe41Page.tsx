import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import principalFixture from '../../shared/golden/principal-4.1.json';
import alternativeFixture from '../../shared/golden/alternative-4.1.json';
import { calculateRecipe41, presentation41, type Recipe41, type RecipeItem41 } from '../core/calc/view41';
import { calculateBatchCorrection41, type BatchCorrectionInput41 } from '../core/calc/batch41';
import type { PrincipalInput } from '../core/calc/principal41';
import type { AlternativeInput } from '../core/calc/alternative41';
import { obterLimite } from '../core/config/nbr12655';
import { formatNumero, parseNumero } from '../core/units';
import { chamarApi } from '../data/api';
import { usePilotMode, type LayoutMode } from '../app/layout';
import { Button, CalcField, Card, Input, Pill, Select, type Tone } from '../ui/components';
import { Icon } from '../ui/icons';
import { PackingPanel, type PackingData } from './PackingPanel';
import './recipe41.css';

type Saved = { id: string; versao: number; revisao: number; status: string; documento?: unknown };
const normalizeSaved = (response: Saved): Saved => ({ ...response,
  status: (response.documento as { status?: string } | undefined)?.status ?? response.status ?? 'rascunho' });
type ExperimentalDraft = { abatimentoMm: number; abatimento30MinMm: number; arPct: number;
  massaEspecificaKgM3: number; cp1MPa: number; cp2MPa: number; espalhamentoMm: number;
  t500S: number; iev: number; manutencao10Mm: number; manutencao20Mm: number;
  manutencao30Mm: number; indicadorFinosKgM3: number };
const experimentalFields: { key: keyof ExperimentalDraft; label: string; unit: string }[] = [
  { key: 'abatimentoMm', label: 'Abatimento', unit: 'mm' },
  { key: 'abatimento30MinMm', label: 'Abatimento aos 30 min', unit: 'mm' },
  { key: 'arPct', label: 'Ar', unit: '%' },
  { key: 'massaEspecificaKgM3', label: 'Massa específica', unit: 'kg/m³' },
  { key: 'cp1MPa', label: 'CP 1 aos 28 dias', unit: 'MPa' },
  { key: 'cp2MPa', label: 'CP 2 aos 28 dias', unit: 'MPa' },
];
const caaFields: { key: keyof ExperimentalDraft; label: string; unit: string }[] = [
  { key: 'espalhamentoMm', label: 'Espalhamento inicial', unit: 'mm' },
  { key: 't500S', label: 'T500', unit: 's' },
  { key: 'iev', label: 'IEV medido', unit: '' },
  { key: 'manutencao10Mm', label: 'Espalhamento 10 min', unit: 'mm' },
  { key: 'manutencao20Mm', label: 'Espalhamento 20 min', unit: 'mm' },
  { key: 'manutencao30Mm', label: 'Espalhamento 30 min', unit: 'mm' },
  { key: 'indicadorFinosKgM3', label: 'Indicador de finos', unit: 'kg/m³' },
];
const defaultPrincipal = () => structuredClone(principalFixture.base) as PrincipalInput;
const defaultAlternative = () => structuredClone(alternativeFixture.a1) as AlternativeInput;
const editText = (n: number) => Number.isFinite(n) ? String(Number(n.toFixed(6))).replace('.', ',') : '';

/** Campo numérico que preserva o texto digitado (ex.: "0,0" a caminho de "0,05") e só repassa números válidos. */
function NumField({ id, label, value, onChange, unit }: { id: string; label: string; value: number; onChange: (n: number) => void; unit?: string }) {
  const [text, setText] = useState(() => editText(value));
  const ref = useRef<string>(text);
  useEffect(() => { const parsed = parseNumero(ref.current); if (parsed == null || Math.abs(parsed - value) > 1e-9) { const next = editText(value); ref.current = next; setText(next); } }, [value]);
  const invalid = text.trim() !== '' && parseNumero(text) == null;
  return <Input id={id} label={label} unit={unit} inputMode="decimal" value={text} error={invalid ? 'Número inválido' : undefined}
    onChange={event => { const raw = event.target.value; ref.current = raw; setText(raw); const parsed = parseNumero(raw); if (parsed != null) onChange(parsed); }}/>;
}

const catLabel: Record<string, string> = { cimento: 'Cimento', adicao: 'Adição', areia: 'Areia', brita: 'Brita', agua: 'Água', aditivo: 'Aditivo', outro: 'Adição menor' };
function itemNames(items: RecipeItem41[]) {
  const total: Record<string, number> = {}, seen: Record<string, number> = {};
  items.forEach(i => { total[i.categoria] = (total[i.categoria] ?? 0) + 1; });
  return items.map(i => { seen[i.categoria] = (seen[i.categoria] ?? 0) + 1; const base = catLabel[i.categoria] ?? i.nome; return total[i.categoria] > 1 ? `${base} ${seen[i.categoria]}` : base; });
}
const volumeColors: { key: string; label: string; color: string; cats: string[] }[] = [
  { key: 'cim', label: 'cimento', color: '#F4F6FA', cats: ['cimento', 'adicao'] },
  { key: 'agua', label: 'água', color: '#4A67BD', cats: ['agua'] },
  { key: 'areia', label: 'areias', color: '#FFC906', cats: ['areia'] },
  { key: 'brita', label: 'britas', color: '#9AA6BD', cats: ['brita'] },
  { key: 'outros', label: 'ar e aditivos', color: '#33426A', cats: ['aditivo', 'outro'] }
];
type Check = { tone: Tone; title: string; detail?: string };

export function Recipe41Page({ fixedMethod, layout = 'desktop' }: { fixedMethod?: Recipe41['metodo']; layout?: LayoutMode }) {
  const pilot = usePilotMode();
  const [id] = useState(() => crypto.randomUUID());
  const [selectedMethod, setMethod] = useState<Recipe41['metodo']>('principal_abrams');
  const method = fixedMethod ?? selectedMethod;
  const [mode, setMode] = useState<'complete' | 'spreadsheet'>('complete');
  const [principal, setPrincipal] = useState(defaultPrincipal);
  const [alternative, setAlternative] = useState(defaultAlternative);
  const [name, setName] = useState(() => fixedMethod === 'principal_abrams' ? 'Novo traço por empacotamento' : fixedMethod === 'alternativo_concrefer' ? 'Novo traço por volume' : 'Novo traço 4.1');
  const [unit, setUnit] = useState('campinas');
  const [fck, setFck] = useState(30);
  const [sd, setSd] = useState(4);
  const [concreteType, setConcreteType] = useState<'convencional' | 'caa'>('convencional');
  const [caaClasses, setCaaClasses] = useState<{ SF: string; VS: string; IEV: number }>({ SF: 'SF2', VS: 'VS1', IEV: 0 });
  const [caaMaxLoss, setCaaMaxLoss] = useState(10);
  const [costs, setCosts] = useState<Record<string, number>>({ m0: .78, m2: .085, m3: .07, m4: .075, m5: .07, m7: 9.5 });
  const [catalogMaterials, setCatalogMaterials] = useState<{ id: string; nome: string; categoria: string; status: string }[]>([]);
  const [materialIds, setMaterialIds] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Saved | null>(null);
  const [packing, setPacking] = useState<{ data: PackingData | null; touched: boolean }>({ data: null, touched: false });
  const [deviation, setDeviation] = useState<number | null>(null);
  const [batchInput, setBatchInput] = useState<BatchCorrectionInput41>({
    volumeL: 1000, referenceCondition: 'sss',
    aggregates: [{ humidityPct: 11, absorptionPct: 0 }, { humidityPct: 10, absorptionPct: 0 },
      { humidityPct: 0.5, absorptionPct: 0 }],
  });
  const [experimentalDraft, setExperimentalDraft] = useState<ExperimentalDraft[]>([1, 2, 3].map(() => ({
    abatimentoMm: 100, abatimento30MinMm: 90, arPct: 1.5,
    massaEspecificaKgM3: 2380, cp1MPa: 35, cp2MPa: 36,
    espalhamentoMm: 700, t500S: 1.5, iev: 0, manutencao10Mm: 690,
    manutencao20Mm: 680, manutencao30Mm: 670, indicadorFinosKgM3: 420,
  })));
  const [busy, setBusy] = useState(false);
  useEffect(() => { void chamarApi<typeof catalogMaterials>('materiais.listar', {})
    .then(setCatalogMaterials).catch(() => setCatalogMaterials([])); }, []);
  const changePacking = useCallback((data: PackingData | null, touched: boolean) => {
    setPacking(previous => {
      const next = { data, touched };
      return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
    });
    setSaved(null);
  }, []);
  const [message, setMessage] = useState<{ tone: Tone; text: string }>({ tone: 'warn', text: 'Exemplo inicial da especificação 4.1. Confirme os materiais antes de salvar.' });
  const recipe: Recipe41 = method === 'principal_abrams'
    ? { metodo: method, balanco: mode, metodoDados: principal, custosRsKg: costs }
    : { metodo: method, balanco: mode, metodoDados: alternative, custosRsKg: costs };
  const calculation = useMemo(() => { try { return { value: calculateRecipe41(recipe), error: '' }; } catch (error) { return { value: null, error: (error as Error).message }; } }, [method, mode, principal, alternative, costs]);
  const view = calculation.value ? presentation41(calculation.value) : null;
  const batch = useMemo(() => {
    if (method !== 'alternativo_concrefer' || !calculation.value) return { value: null, error: '' };
    try {
      return { value: calculateBatchCorrection41(calculation.value.result, alternative.waterEffectiveKg,
        alternative.admixtures.map(item => item.density), batchInput), error: '' };
    } catch (error) { return { value: null, error: (error as Error).message }; }
  }, [method, calculation.value, alternative, batchInput]);
  const names = calculation.value ? itemNames(calculation.value.items) : [];
  const updatePrincipal = (mutate: (next: PrincipalInput) => void) => { const next = structuredClone(principal); mutate(next); setPrincipal(next); setSaved(null); };
  const updateAlternative = (mutate: (next: AlternativeInput) => void) => { const next = structuredClone(alternative); mutate(next); setAlternative(next); setSaved(null); };
  const isPacking = fixedMethod === 'principal_abrams' && principal.sands.length === 2;

  const save = async () => {
    if (!calculation.value) return;
    if (method === 'alternativo_concrefer' && !batch.value) {
      setMessage({ tone: 'crit', text: batch.error || 'Corrija a betonada antes de salvar.' });
      return;
    }
    if (fixedMethod === 'principal_abrams' && packing.touched && !packing.data) {
      setMessage({ tone: 'crit', text: 'Corrija as curvas do empacotamento antes de salvar o traço.' });
      return;
    }
    setBusy(true);
    setMessage({ tone: 'info', text: 'Enviando traço ao servidor…' });
    const now = new Date().toISOString();
    const document = {
      id, codigo: '', nome: name, unidade: unit, versao: saved?.versao ?? 0, revisao: saved?.revisao ?? 0,
      status: saved?.status ?? 'rascunho', ...recipe,
      materialIds: Array.from({ length: Math.max(...calculation.value.items.map(item => Number(item.id.slice(1)))) + 1 },
        (_, index) => materialIds[`m${index}`] || null),
      tipoConcreto: concreteType,
      ...(method === 'alternativo_concrefer'
        ? { correcaoUmidade: batchInput, referenciaAgregados: batchInput.referenceCondition }
        : { referenciaAgregados: 'dry' }),
      ...(fixedMethod === 'principal_abrams' && packing.data ? { empacotamento: packing.data } : {}),
      objetivo: { fckMPa: fck, sdMPa: sd, classe: 'II', estrutura: 'armado', abatimentoMm: 100, toleranciaMm: 20,
        ...(concreteType === 'caa' ? { classesCAA: caaClasses } : {}) },
      arIncorporadoPct: recipe.metodoDados.airFraction * 100, normalizarPara1m3: false,
      itens: calculation.value.items, resultadoCalculado: calculation.value.result, experimentais: [],
      planoExperimental: { misturasPrevistas: 3, condicoes: [1, 2, 3].map(i => ({ id: `dia-${i}`, dia: `dia-${i}` })),
        volumeBetonadaL: 25, ensaiosFresco: concreteType === 'caa'
          ? ['espalhamentoMm', 't500S', 'iev', 'manutencaoEspalhamento', 'arPct', 'massaEspecificaKgM3']
          : ['abatimentoMm', 'abatimento30MinMm', 'arPct', 'massaEspecificaKgM3'],
        ...(concreteType === 'caa' ? { temposManutencaoMin: [10, 20, 30], perdaEspalhamentoMaxPct: caaMaxLoss } : {}),
        idadesDias: [28], cpsPorIdade: 2, resistenciaMinMPa: fck, resistenciaMediaMinMPa: fck + 2, condicaoPreparo: 'A' },
      auditoria: { criadoPor: 'local', criadoEm: now, alteradoPor: 'local', alteradoEm: now }
    };
    try {
      const response = await chamarApi<Saved>('tracos.salvarVersao', document);
      setSaved(normalizeSaved(response));
      setMessage({ tone: 'ok', text: `Salvo no servidor: versão ${response.versao}, revisão ${response.revisao}.` });
      if (response.documento && JSON.stringify((response.documento as { resultadoCalculado?: unknown }).resultadoCalculado) !== JSON.stringify(calculation.value.result)) {
        setMessage({ tone: 'warn', text: 'Servidor confirmou a gravação com resultado recalculado; revise os valores antes de liberar.' });
      }
    } catch (error) { setMessage({ tone: 'crit', text: (error as Error).message }); }
    finally { setBusy(false); }
  };
  const release = async () => {
    if (!saved || !calculation.value) return;
    setMessage({ tone: 'info', text: 'Validando liberação no servidor…' });
    try {
      const response = await chamarApi<Saved>('tracos.enviarAprovacao', { id, versao: saved.versao, revisao: saved.revisao, resultadoCliente: calculation.value.result });
      setSaved(normalizeSaved(response));
      setMessage({ tone: 'ok', text: 'Liberado para ensaio pelo servidor. O plano de três misturas deve ser executado antes da aprovação.' });
    } catch (error) { setMessage({ tone: 'crit', text: (error as Error).message }); }
  };
  const saveExperiments = async () => {
    if (!saved?.documento || saved.status !== 'em_teste') return;
    setBusy(true);
    setMessage({ tone: 'info', text: 'Salvando ensaios experimentais…' });
    try {
      const experiments = experimentalDraft.map((entry, index) => ({
        id: `mix-${index + 1}`, condicaoId: `dia-${index + 1}`, data: new Date().toISOString(),
        ...(concreteType === 'caa' ? {
          espalhamentoMm: entry.espalhamentoMm, t500S: entry.t500S, iev: entry.iev,
          manutencaoEspalhamento: [10, 20, 30].map(minuto => ({ minuto,
            espalhamentoMm: entry[`manutencao${minuto}Mm` as 'manutencao10Mm' | 'manutencao20Mm' | 'manutencao30Mm'] })),
          indicadorFinosKgM3: entry.indicadorFinosKgM3,
        } : { abatimentoMm: entry.abatimentoMm, abatimento30MinMm: entry.abatimento30MinMm }),
        arPct: entry.arPct, massaEspecificaKgM3: entry.massaEspecificaKgM3,
        rupturas: [{ idadeDias: 28, resultadosMPa: [entry.cp1MPa, entry.cp2MPa] }],
      }));
      const document = saved.documento as Record<string, unknown>;
      const response = await chamarApi<Saved>('tracos.salvarVersao', {
        ...document, id: saved.id, versao: saved.versao, revisao: saved.revisao,
        experimentais: experiments,
      });
      setSaved(normalizeSaved(response));
      setMessage({ tone: 'ok', text: `Três misturas salvas no servidor: revisão ${response.revisao}.` });
    } catch (error) { setMessage({ tone: 'crit', text: (error as Error).message }); }
    finally { setBusy(false); }
  };
  const approve = async () => {
    if (!saved || saved.status !== 'em_teste' || !calculation.value) return;
    setBusy(true);
    setMessage({ tone: 'info', text: 'Validando aprovação no servidor…' });
    try {
      const response = await chamarApi<Saved>('tracos.aprovar', {
        id, versao: saved.versao, revisao: saved.revisao,
        resultadoCliente: calculation.value.result, parecer: 'Conforme plano experimental',
      });
      setSaved(normalizeSaved(response));
      setMessage({ tone: 'ok', text: 'Traço aprovado pelo servidor. Confira a carta e a versão.' });
    } catch (error) { setMessage({ tone: 'crit', text: (error as Error).message }); }
    finally { setBusy(false); }
  };

  // ---- verificações exibidas (as regras de bloqueio continuam no servidor) ----
  const sandSum = method === 'principal_abrams' ? principal.sands.reduce((s, p) => s + p.fraction, 0) : alternative.sands.reduce((s, p) => s + p.volumeFraction, 0);
  const gravelSum = method === 'principal_abrams' ? principal.gravels.reduce((s, p) => s + p.fraction, 0) : alternative.gravels.reduce((s, p) => s + p.volumeFraction, 0);
  const limite = obterLimite('II', 'armado');
  const checks: Check[] = [];
  checks.push(Math.abs(sandSum - 1) <= 0.001 && Math.abs(gravelSum - 1) <= 0.001
    ? { tone: 'ok', title: 'Frações dos grupos somam 100 %' }
    : { tone: 'crit', title: 'Frações não fecham 100 %', detail: `Areias ${formatNumero(sandSum * 100, 1)} % · britas ${formatNumero(gravelSum * 100, 1)} %. Bloqueia a liberação.` });
  if (view) {
    if (mode === 'spreadsheet') checks.push({ tone: 'warn', title: 'Modo planilha', detail: 'Serve só para conferência; não pode ser aprovado.' });
    else checks.push(Math.abs(view.panel.physicalVolumeL - 1000) <= 1 ? { tone: 'ok', title: 'Volume 1000 ± 1 L' } : { tone: 'crit', title: 'Volume fora de 1000 ± 1 L', detail: `${formatNumero(view.panel.physicalVolumeL, 2)} L. Bloqueia a liberação.` });
    if (limite) {
      const okAc = limite.relacaoAguaCimentoMax == null || view.panel.waterCementRatio <= limite.relacaoAguaCimentoMax;
      const okC = limite.consumoCimentoMinKgM3 == null || view.panel.cementKg >= limite.consumoCimentoMinKgM3;
      checks.push(okAc && okC
        ? { tone: 'ok', title: 'NBR 12655 · classe II', detail: `a/c ${formatNumero(view.panel.waterCementRatio, 3)} ≤ ${formatNumero(limite.relacaoAguaCimentoMax ?? 0, 2)} · cimento ${formatNumero(view.panel.cementKg, 0)} ≥ ${limite.consumoCimentoMinKgM3} kg/m³` }
        : { tone: 'warn', title: 'NBR 12655 · classe II', detail: `${okAc ? '' : `a/c ${formatNumero(view.panel.waterCementRatio, 3)} acima de ${formatNumero(limite.relacaoAguaCimentoMax ?? 0, 2)}. `}${okC ? '' : `Cimento ${formatNumero(view.panel.cementKg, 0)} abaixo de ${limite.consumoCimentoMinKgM3} kg/m³.`} Exige justificativa.` });
    }
  }
  if (fixedMethod === 'principal_abrams' && packing.touched) checks.push(packing.data ? { tone: 'ok', title: 'Curvas do empacotamento completas' } : { tone: 'crit', title: 'Curvas do empacotamento incompletas', detail: 'O salvamento fica bloqueado até corrigir.' });
  checks.push(saved ? { tone: 'ok', title: `Salvo no servidor · v${saved.versao} rev. ${saved.revisao}`, detail: !saved.status || saved.status === 'rascunho' ? 'Pode ser liberado para ensaio.' : `Situação: ${String(saved.status).replace('_', ' ')}` } : { tone: 'warn', title: 'Ainda não salvo no servidor' });
  const pending = checks.filter(c => c.tone !== 'ok').length;

  // ---- navegação por seções ----
  const sections = [
    { id: 'sec-objetivo', label: 'Objetivo', hint: `fck ${formatNumero(fck, 0)} · sd ${formatNumero(sd, 1)}` },
    { id: 'sec-proporcoes', label: 'Proporções', hint: method === 'principal_abrams' ? 'Abrams e argamassa' : 'frações volumétricas' },
    ...(isPacking ? [{ id: 'sec-empacotamento', label: 'Empacotamento', hint: deviation == null ? 'curvas das areias' : `desvio ${formatNumero(deviation, 2)}` }] : []),
    { id: 'sec-resultado', label: 'Resultado', hint: view ? `R$ ${formatNumero(view.panel.costRsM3, 2)}/m³` : 'entradas incompletas' },
    { id: 'sec-carta', label: 'Carta', hint: pending ? `${pending} pendência(s)` : 'pronta' }
  ];
  const [activeSection, setActiveSection] = useState(sections[0].id);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => { const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (visible) setActiveSection(visible.target.id); }, { rootMargin: '-120px 0px -55% 0px' });
    sections.forEach(s => { const el = (window.__DOSAGEM_NATIVE__ ? document.querySelector('#module-host')?.shadowRoot?.getElementById(s.id) : document.getElementById(s.id)); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [isPacking, Boolean(view)]);
  const goTo = (sectionId: string) => { setActiveSection(sectionId); (window.__DOSAGEM_NATIVE__ ? document.querySelector('#module-host')?.shadowRoot?.getElementById(sectionId) : document.getElementById(sectionId))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  const title = fixedMethod === 'principal_abrams' ? 'Dosagem por empacotamento' : fixedMethod === 'alternativo_concrefer' ? 'Dosagem por volume' : 'Traço de concreto';
  const statusPill = saved ? <Pill tone={!saved.status || saved.status === 'rascunho' ? 'ok' : 'info'}>{!saved.status || saved.status === 'rascunho' ? `Salvo · v${saved.versao} rev. ${saved.revisao}` : String(saved.status).replace('_', ' ')}</Pill> : <Pill tone="warn">Não salvo</Pill>;

  const volumes = view && calculation.value ? volumeColors.map(group => ({ ...group, litros: calculation.value!.items.filter(i => group.cats.includes(i.categoria)).reduce((s, i) => s + i.massaKgM3 / i.massaEspecificaKgDm3, 0) + (group.key === 'outros' ? recipe.metodoDados.airFraction * 1000 : 0) })) : [];
  const kpis = view ? [
    { label: 'Cimento', value: formatNumero(view.panel.cementKg, 1), unit: 'kg/m³' },
    { label: 'Água efetiva', value: formatNumero(view.panel.waterEffectiveKg, 1), unit: 'kg/m³' },
    { label: 'a/c', value: formatNumero(view.panel.waterCementRatio, 4) },
    { label: 'a/agl', value: formatNumero(view.panel.waterBinderRatio, 4) },
    { label: 'α (argamassa)', value: `${formatNumero(view.panel.alpha * 100, 1)} %` },
    ...(isPacking ? [{ label: 'Desvio granulom.', value: deviation == null ? '—' : formatNumero(deviation, 2) }] : [])
  ] : [];
  const volumeOk = view ? Math.abs(view.panel.physicalVolumeL - 1000) <= 1 : false;
  const checklist = <section className="ct-card ct-checklist" aria-labelledby="r41-checklist-title">
    <div className="ct-card-head"><h2 id="r41-checklist-title">Pronto para liberar?</h2>{pending ? <Pill tone="warn">{pending} pendência(s)</Pill> : <Pill tone="ok">Tudo certo</Pill>}</div>
    <ul>{checks.map(c => <li key={c.title} className={`is-${c.tone}`}><Icon name={c.tone === 'ok' ? 'check' : c.tone === 'crit' ? 'erro' : 'alerta'} size={18} strokeWidth={2.3}/><div><strong>{c.title}</strong>{c.detail && <small>{c.detail}</small>}</div></li>)}</ul>
    <p className="ct-muted ct-checklist-note">Indicação local. A liberação e a aprovação são validadas pelo servidor.</p>
  </section>;
  const strip: ReactNode = view ? <div className="ct-live-strip" aria-label="Resumo do resultado">
    <div><small>Volume</small><strong>{formatNumero(view.panel.physicalVolumeL, layout === 'mobile' ? 0 : 1)} L{mode === 'complete' && (volumeOk ? ' ✓' : ' ✕')}</strong></div>
    <div><small>Cimento</small><strong>{formatNumero(view.panel.cementKg, 1)}</strong></div>
    <div><small>a/c</small><strong>{formatNumero(view.panel.waterCementRatio, 3)}</strong></div>
    {layout !== 'mobile' && <div><small>α</small><strong>{formatNumero(view.panel.alpha * 100, 1)} %</strong></div>}
    <div><small>R$/m³</small><strong className="is-accent">{formatNumero(view.panel.costRsM3, 2)}</strong></div>
  </div> : null;

  return <div className={`ct-recipe41 ct-ws-layout is-${layout}`}>
    <div className="ct-page-heading ct-recipe-head">
      <div>
        <p className="ct-eyebrow">{method === 'principal_abrams' ? 'Abrams + teor de argamassa' : 'Método Concrefer · Rica v4'}</p>
        <h1>{title}</h1>
        <div className="ct-row ct-recipe-tags">{statusPill}<Pill tone="mute">{unit || 'sem unidade'}</Pill><Pill tone={mode === 'complete' ? 'mute' : 'warn'}>{mode === 'complete' ? 'Balanço completo' : 'Modo planilha'}</Pill></div>
      </div>
      {fixedMethod && <nav className="ct-seg" aria-label="Método de dosagem"><Link className={fixedMethod === 'principal_abrams' ? 'active' : ''} aria-current={fixedMethod === 'principal_abrams' ? 'page' : undefined} to="/dosagem/empacotamento">Empacotamento</Link><Link className={fixedMethod === 'alternativo_concrefer' ? 'active' : ''} aria-current={fixedMethod === 'alternativo_concrefer' ? 'page' : undefined} to="/dosagem/volume">Volume</Link></nav>}
    </div>

    {layout === 'mobile' && strip && <div className="ct-strip-top">{strip}</div>}

    <nav className="ct-sectionnav" aria-label="Seções do traço">
      {sections.map((s, i) => <button key={s.id} type="button" className={activeSection === s.id ? 'active' : ''} aria-current={activeSection === s.id ? 'step' : undefined} onClick={() => goTo(s.id)}><span className="ct-sectionnav-n">{i + 1}</span><span><b>{s.label}</b><small>{s.hint}</small></span></button>)}
    </nav>

    <div className="ct-ws">
      <div className="ct-ws-main">
        <Card id="sec-objetivo" title="Objetivo e identificação" subtitle="Borda = valor digitado · fundo cinza = valor calculado">
          <div className="ct-grid ct-grid--3">
            <Input id="r41-name" label="Nome do traço" value={name} onChange={e => { setName(e.target.value); setSaved(null); }}/>
            <Input id="r41-unit" label="Unidade" value={unit} onChange={e => { setUnit(e.target.value); setSaved(null); }}/>
            {fixedMethod ? <CalcField label="Método" value={fixedMethod === 'principal_abrams' ? 'Principal · Abrams e empacotamento' : 'Alternativo · volume Concrefer'}/> : <Select id="r41-method" label="Método" value={method} onChange={e => { setMethod(e.target.value as Recipe41['metodo']); setSaved(null); }}><option value="principal_abrams">Principal · Abrams</option><option value="alternativo_concrefer">Alternativo · Concrefer</option></Select>}
            <NumField id="r41-fck" label="Fck" unit="MPa" value={fck} onChange={n => { setFck(n); setSaved(null); }}/>
            <NumField id="r41-sd" label="Desvio padrão" unit="MPa" value={sd} onChange={n => { setSd(n); setSaved(null); }}/>
            <CalcField label="fcj = fck + 1,65 · sd" value={formatNumero(fck + 1.65 * sd, 1)} unit="MPa"/>
            <Select id="r41-mode" label="Balanço de volume" value={mode} onChange={e => { setMode(e.target.value as typeof mode); setSaved(null); }}><option value="complete">Completo</option><option value="spreadsheet">Modo planilha · conferência</option></Select>
            <Select id="r41-concrete-type" label="Tipo de concreto" value={concreteType} onChange={e => { setConcreteType(e.target.value as typeof concreteType); setSaved(null); }}><option value="convencional">Convencional</option><option value="caa">CAA · autoadensável</option></Select>
          </div>
          {concreteType === 'caa' && <div className="ct-grid ct-grid--4">
            <Select id="r41-caa-sf" label="Classe de espalhamento SF" value={caaClasses.SF} onChange={e => { setCaaClasses(current => ({ ...current, SF: e.target.value })); setSaved(null); }}><option>SF1</option><option>SF2</option><option>SF3</option></Select>
            <Select id="r41-caa-vs" label="Classe de viscosidade VS" value={caaClasses.VS} onChange={e => { setCaaClasses(current => ({ ...current, VS: e.target.value })); setSaved(null); }}><option>VS1</option><option>VS2</option></Select>
            <Select id="r41-caa-iev" label="Classe de estabilidade IEV" value={caaClasses.IEV} onChange={e => { setCaaClasses(current => ({ ...current, IEV: Number(e.target.value) })); setSaved(null); }}>{[0, 1, 2, 3].map(value => <option key={value} value={value}>{value}</option>)}</Select>
            <NumField id="r41-caa-loss" label="Perda máxima em 30 min" unit="%" value={caaMaxLoss} onChange={n => { setCaaMaxLoss(n); setSaved(null); }}/>
          </div>}
          {mode === 'spreadsheet' && <p className="ct-alert ct-alert--aviso ct-gap-top"><Icon name="alerta" size={18}/>Modo planilha serve apenas para conferência e não pode ser aprovado.</p>}
        </Card>

        {method === 'principal_abrams' ? <Card id="sec-proporcoes" title="Parâmetros do método principal" subtitle="Cimento e aglomerante por m³; as frações dos agregados são em massa dentro de cada grupo.">
          <div className="ct-grid ct-grid--4">
            <NumField id="r41-water" label="Água efetiva" unit="kg/m³" value={principal.waterEffectiveKg} onChange={n => updatePrincipal(d => { d.waterEffectiveKg = n; })}/>
            <NumField id="r41-binder" label="Aglomerante" unit="kg/m³" value={principal.binderKg} onChange={n => updatePrincipal(d => { d.binderKg = n; })}/>
            <NumField id="r41-addition" label="Fração da adição" unit="%" value={principal.additionFraction * 100} onChange={n => updatePrincipal(d => { d.additionFraction = n / 100; })}/>
            <NumField id="r41-mortar" label="Teor de argamassa em volume" unit="%" value={principal.mortarVolumeFraction * 100} onChange={n => updatePrincipal(d => { d.mortarVolumeFraction = n / 100; })}/>
            <NumField id="r41-air" label="Ar" unit="%" value={principal.airFraction * 100} onChange={n => updatePrincipal(d => { d.airFraction = n / 100; })}/>
            <NumField id="r41-cement-density" label="Massa específica cimento" unit="kg/dm³" value={principal.cementDensity} onChange={n => updatePrincipal(d => { d.cementDensity = n; })}/>
            {view && <CalcField label="a/c resultante" value={formatNumero(view.panel.waterCementRatio, 4)}/>}
          </div>
          <AggregateGroups
            groups={[{ title: 'Areias', sum: sandSum, parts: principal.sands.map((p, i) => ({ key: `r41-sf${i}`, densityKey: `r41-sd${i}`, label: `Areia ${i + 1}`, fraction: p.fraction, density: p.density, mass: calculation.value?.result.sandMassesKg[i], tag: isPacking ? 'empacotamento' : undefined, onFraction: (n: number) => updatePrincipal(d => { d.sands[i].fraction = n / 100; }), onDensity: (n: number) => updatePrincipal(d => { d.sands[i].density = n; }) })) },
              { title: 'Britas', sum: gravelSum, parts: principal.gravels.map((p, i) => ({ key: `r41-gf${i}`, densityKey: `r41-gd${i}`, label: `Brita ${i + 1}`, fraction: p.fraction, density: p.density, mass: calculation.value?.result.gravelMassesKg[i], onFraction: (n: number) => updatePrincipal(d => { d.gravels[i].fraction = n / 100; }), onDensity: (n: number) => updatePrincipal(d => { d.gravels[i].density = n; }) })) }]}
            fractionLabel="Fração em massa"/>
        </Card> : <Card id="sec-proporcoes" title="Parâmetros do método alternativo" subtitle="Cimento = água ÷ (a/c). As areias fecham o volume de 1 m³.">
          <div className="ct-grid ct-grid--4">
            <NumField id="r41-alt-water" label="Água efetiva" unit="kg/m³" value={alternative.waterEffectiveKg} onChange={n => updateAlternative(d => { d.waterEffectiveKg = n; })}/>
            <NumField id="r41-alt-ratio" label="Relação a/c" value={alternative.waterCementRatio} onChange={n => updateAlternative(d => { d.waterCementRatio = n; })}/>
            <NumField id="r41-alt-mortar" label="Teor de argamassa em volume" unit="%" value={alternative.mortarVolumeFraction * 100} onChange={n => updateAlternative(d => { d.mortarVolumeFraction = n / 100; })}/>
            <NumField id="r41-alt-air" label="Ar" unit="%" value={alternative.airFraction * 100} onChange={n => updateAlternative(d => { d.airFraction = n / 100; })}/>
            {view && <CalcField label="Cimento resultante" value={formatNumero(view.panel.cementKg, 1)} unit="kg/m³"/>}
          </div>
          {view && <div className="ct-volume-bar-block">
            <div className="ct-row ct-space"><strong className="ct-small-title">Composição de 1 m³ em volume</strong>{mode === 'complete' ? <Pill tone={volumeOk ? 'ok' : 'crit'}>{formatNumero(view.panel.physicalVolumeL, 2)} L</Pill> : <Pill tone="warn">{formatNumero(view.panel.physicalVolumeL, 2)} L · planilha</Pill>}</div>
            <div className="ct-volume-bar" role="img" aria-label={volumes.map(v => `${v.label} ${formatNumero(v.litros, 0)} L`).join(', ')}>{volumes.map(v => <span key={v.key} style={{ flex: Math.max(v.litros, 0.1), background: v.key === 'cim' ? '#0A1530' : v.color, color: v.key === 'areia' || v.key === 'brita' ? '#0A1530' : '#fff' }}>{v.litros >= 60 ? `${v.label} ${formatNumero(v.litros, 0)}` : ''}</span>)}</div>
          </div>}
          <AggregateGroups
            groups={[{ title: 'Areias', sum: sandSum, parts: alternative.sands.map((p, i) => ({ key: `r41-asf${i}`, densityKey: `r41-asd${i}`, label: `Areia ${i + 1}`, fraction: p.volumeFraction, density: p.density, mass: calculation.value?.result.sandMassesKg[i], onFraction: (n: number) => updateAlternative(d => { d.sands[i].volumeFraction = n / 100; }), onDensity: (n: number) => updateAlternative(d => { d.sands[i].density = n; }) })) },
              { title: 'Britas', sum: gravelSum, parts: alternative.gravels.map((p, i) => ({ key: `r41-agf${i}`, densityKey: `r41-agd${i}`, label: `Brita ${i + 1}`, fraction: p.volumeFraction, density: p.density, mass: calculation.value?.result.gravelMassesKg[i], onFraction: (n: number) => updateAlternative(d => { d.gravels[i].volumeFraction = n / 100; }), onDensity: (n: number) => updateAlternative(d => { d.gravels[i].density = n; }) })) }]}
            fractionLabel="Fração em volume"/>
        </Card>}

        {isPacking && <PackingPanel fraction={principal.sands[0].fraction} onApply={fraction => updatePrincipal(next => { next.sands[0].fraction = fraction; next.sands[1].fraction = 1 - fraction; })} onChange={changePacking} onDeviation={setDeviation}/>}
        {calculation.error && <div className="ct-alert ct-alert--erro" role="alert"><Icon name="erro" size={18}/>{calculation.error}</div>}

        {view && calculation.value && <>
          <Card id="sec-resultado" title="Resultado calculado" subtitle="Valores por m³. Custos unitários editáveis por material.">
            <div className="ct-recipe41-kpis">
              <div><small>Volume físico</small><strong>{formatNumero(view.panel.physicalVolumeL, 2)} L</strong></div>
              <div><small>Cimento</small><strong>{formatNumero(view.panel.cementKg, 2)} kg/m³</strong></div>
              <div><small>a/c</small><strong>{formatNumero(view.panel.waterCementRatio, 4)}</strong></div>
              <div><small>a/agl</small><strong>{formatNumero(view.panel.waterBinderRatio, 4)}</strong></div>
              <div><small>α</small><strong>{formatNumero(view.panel.alpha, 4)}</strong></div>
              <div><small>Custo</small><strong>R$ {formatNumero(view.panel.costRsM3, 2)}/m³</strong></div>
              <div><small>Água efetiva</small><strong>{formatNumero(view.panel.waterEffectiveKg, 2)} kg/m³</strong></div>
              {view.panel.finesKg !== undefined && <div><small>Finos</small><strong>{formatNumero(view.panel.finesKg, 2)} kg/m³</strong></div>}
            </div>
            <div className="ct-table-wrap"><table className="ct-table ct-materials-table">
              <thead><tr><th>Material</th><th className="num">Massa kg/m³</th><th className="num">ρ kg/dm³</th><th className="num">Volume L</th><th className="num">Custo R$/kg</th><th className="num">R$/m³</th></tr></thead>
              <tbody>{calculation.value.items.map((item, i) => <tr key={item.id}><td>{names[i]}<Select id={`r41-material-${item.id}`} label={`Cadastro de ${names[i]}`} value={materialIds[item.id] || ''} onChange={event => { setMaterialIds(current => ({ ...current, [item.id]: event.target.value })); setSaved(null); }}><option value="">Sem cadastro</option>{catalogMaterials.filter(material => material.categoria === item.categoria && material.status === 'ativo').map(material => <option key={material.id} value={material.id}>{material.nome}</option>)}</Select></td><td className="num">{formatNumero(item.massaKgM3, 3)}</td><td className="num">{formatNumero(item.massaEspecificaKgDm3, 3)}</td><td className="num">{formatNumero(item.massaKgM3 / item.massaEspecificaKgDm3, 3)}</td><td className="num"><CostInput label={`Custo de ${item.nome}`} value={costs[item.id] || 0} onChange={n => { setCosts(current => ({ ...current, [item.id]: n })); setSaved(null); }}/></td><td className="num">{item.custoRsM3 ? formatNumero(item.custoRsM3, 2) : '—'}</td></tr>)}</tbody>
              <tfoot><tr><td>Total (com {formatNumero(recipe.metodoDados.airFraction * 1000, 0)} L de ar)</td><td className="num">{formatNumero(calculation.value.items.reduce((s, i) => s + i.massaKgM3, 0), 3)}</td><td/><td className="num">{formatNumero(view.panel.physicalVolumeL, 2)}</td><td/><td className="num">{formatNumero(view.panel.costRsM3, 2)}</td></tr></tfoot>
            </table></div>
          </Card>
          {saved?.status === 'em_teste' && <Card title="Plano experimental" subtitle="Três misturas distintas com ensaios de fresco e dois CPs aos 28 dias.">
            <p className="ct-alert ct-alert--aviso">Valores iniciais são exemplo. Informe os resultados medidos antes de salvar e aprovar.</p>
            {experimentalDraft.map((entry, index) => <div className="ct-recipe41-part" key={index}>
              <h3>Mistura {index + 1} · condição dia-{index + 1}</h3>
              <div className="ct-grid ct-grid--3">{(concreteType === 'caa'
                ? [...caaFields, ...experimentalFields.filter(field => !['abatimentoMm', 'abatimento30MinMm'].includes(field.key))]
                : experimentalFields).map(field => <NumField
                key={field.key} id={`r41-exp-${index + 1}-${field.key}`} label={field.label} unit={field.unit}
                value={entry[field.key]}
                onChange={value => setExperimentalDraft(current => current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, [field.key]: value } : item))}/>)}</div>
            </div>)}
            {concreteType === 'caa' && <div role="img" aria-label="G11 · manutenção do espalhamento CAA por mistura" className="ct-table-wrap"><table className="ct-table"><caption>G11 · Manutenção do espalhamento CAA</caption><thead><tr><th>Mistura</th><th>Inicial</th><th>10 min</th><th>20 min</th><th>30 min</th><th>Perda em 30 min</th></tr></thead><tbody>{experimentalDraft.map((entry, index) => <tr key={index}><td>{index + 1}</td><td>{entry.espalhamentoMm} mm</td><td>{entry.manutencao10Mm} mm</td><td>{entry.manutencao20Mm} mm</td><td>{entry.manutencao30Mm} mm</td><td>{entry.espalhamentoMm > 0 ? formatNumero((entry.espalhamentoMm - entry.manutencao30Mm) / entry.espalhamentoMm * 100, 1) : '—'}%</td></tr>)}</tbody></table></div>}
            <div className="ct-row"><Button variant="secondary" disabled={busy} onClick={() => void saveExperiments()}>Salvar ensaios do plano</Button>
              <Button disabled={busy} onClick={() => void approve()}>Aprovar traço</Button></div>
          </Card>}
          {method === 'alternativo_concrefer' && <Card title="Betonada corrigida" subtitle="Massas a pesar e água dosada para o volume informado.">
            <p className="ct-alert ct-alert--aviso">Umidades iniciais são exemplo da planilha. Confirme as medições e absorções antes de usar.</p>
            <div className="ct-grid ct-grid--2">
              <NumField id="r41-batch-volume" label="Volume da betonada" unit="L" value={batchInput.volumeL}
                onChange={volumeL => { setBatchInput(current => ({ ...current, volumeL })); setSaved(null); }}/>
              <Select id="r41-batch-reference" label="Condição de referência" value={batchInput.referenceCondition}
                onChange={event => { setBatchInput(current => ({ ...current, referenceCondition: event.target.value as 'dry' | 'sss' })); setSaved(null); }}>
                <option value="sss">SSS · saturada superfície seca</option><option value="dry">Seca</option>
              </Select>
            </div>
            <div className="ct-grid ct-grid--3">
              {[...calculation.value.result.sandMassesKg, ...calculation.value.result.gravelMassesKg].map((mass, index) => {
                const label = index < calculation.value!.result.sandMassesKg.length
                  ? `Areia ${index + 1}` : `Brita ${index + 1 - calculation.value!.result.sandMassesKg.length}`;
                const measured = batchInput.aggregates[index] ?? { humidityPct: 0, absorptionPct: 0 };
                return <div className="ct-recipe41-part" key={`${label}-${index}`}>
                  <h3>{label}</h3><p>Referência: {formatNumero(mass * batchInput.volumeL / 1000, 3)} kg</p>
                  <NumField id={`r41-batch-humidity-${index}`} label={`Umidade total ${label}`} unit="%" value={measured.humidityPct}
                    onChange={humidityPct => { setBatchInput(current => ({ ...current,
                      aggregates: current.aggregates.map((item, itemIndex) => itemIndex === index ? { ...item, humidityPct } : item),
                    })); setSaved(null); }}/>
                  <NumField id={`r41-batch-absorption-${index}`} label={`Absorção ${label}`} unit="%" value={measured.absorptionPct}
                    onChange={absorptionPct => { setBatchInput(current => ({ ...current,
                      aggregates: current.aggregates.map((item, itemIndex) => itemIndex === index ? { ...item, absorptionPct } : item),
                    })); setSaved(null); }}/>
                  {batch.value && <p><strong>A pesar: {formatNumero(batch.value.weighMassesKg[index], 3)} kg</strong></p>}
                </div>;
              })}
            </div>
            {batch.error && <p className="ct-alert ct-alert--erro" role="alert">{batch.error}</p>}
            {batch.value && <div className="ct-recipe41-kpis" id="r41-batch-result">
              <div><small>Água efetiva</small><strong>{formatNumero(batch.value.waterEffectiveKg, 3)} kg</strong></div>
              <div><small>Água livre dos agregados</small><strong>{formatNumero(batch.value.freeWaterKg, 3)} kg</strong></div>
              <div><small>Água dosada</small><strong>{formatNumero(batch.value.waterToDoseKg, 3)} kg</strong></div>
              {batch.value.admixtureMassesG.map((mass, index) => <div key={index}><small>Aditivo {index + 1}</small>
                <strong>{formatNumero(mass, 0)} g · {formatNumero(batch.value!.admixtureVolumesMl[index], 2)} mL</strong></div>)}
            </div>}
          </Card>}
          {layout !== 'desktop' && checklist}
          {!fixedMethod && <Card title="Comparação dos métodos" subtitle="Os exemplos mantêm entradas próprias; confira as entradas antes de comparar desempenho."><div className="ct-grid ct-grid--2">{(['principal_abrams', 'alternativo_concrefer'] as const).map(which => { try { const candidate = calculateRecipe41(which === 'principal_abrams' ? { metodo: which, balanco: mode, metodoDados: principal, custosRsKg: costs } : { metodo: which, balanco: mode, metodoDados: alternative, custosRsKg: costs }); return <div className={`ct-recipe41-part${which === method ? ' is-current' : ''}`} key={which}><h3>{which === 'principal_abrams' ? 'Principal' : 'Alternativo'}</h3><p>Volume {formatNumero(candidate.summary.physicalVolumeL, 2)} L</p><p>Cimento {formatNumero(candidate.summary.cementKg, 2)} kg/m³</p><p>a/c {formatNumero(candidate.summary.waterCementRatio, 4)}</p><p>a/agl {formatNumero(candidate.summary.waterBinderRatio, 4)}</p><p>α {formatNumero(candidate.summary.alpha, 4)}</p><p>Custo R$ {formatNumero(candidate.summary.costRsM3, 2)}/m³</p><p>Areia {formatNumero(candidate.summary.sandKg, 3)} kg/m³ · Brita {formatNumero(candidate.summary.gravelKg, 3)} kg/m³</p>{candidate.summary.finesKg !== undefined && <p>Finos {formatNumero(candidate.summary.finesKg, 2)} kg/m³</p>}</div>; } catch { return <p key={which}>Entradas incompletas.</p>; } })}</div></Card>}
          <article id="sec-carta" className="ct-card ct-recipe41-letter" aria-labelledby="r41-letter-title">
            <header className="ct-letter-head">
              <div><p className="ct-eyebrow">Carta do traço</p><h2 id="r41-letter-title">{name}</h2><p className="ct-muted">{unit} · {method === 'principal_abrams' ? 'Principal' : 'Alternativo'} · {mode === 'complete' ? 'balanço completo' : 'modo planilha'}{saved ? ` · v${saved.versao} rev. ${saved.revisao}` : ''}</p></div>
              <Button variant="secondary" size="sm" className="ct-letter-print" onClick={() => window.print()}><Icon name="imprimir" size={16}/>Imprimir</Button>
            </header>
            <dl className="ct-letter-kv">
              <div><dt>Fck</dt><dd>{formatNumero(fck, 1)} MPa</dd></div>
              <div><dt>Volume</dt><dd>{formatNumero(view.letter.physicalVolumeL, 2)} L</dd></div>
              <div><dt>Cimento</dt><dd>{formatNumero(view.letter.cementKg, 2)} kg/m³</dd></div>
              <div><dt>Água efetiva</dt><dd>{formatNumero(view.letter.waterEffectiveKg, 2)} kg/m³</dd></div>
              <div><dt>a/c</dt><dd>{formatNumero(view.letter.waterCementRatio, 4)}</dd></div>
              <div><dt>a/agl</dt><dd>{formatNumero(view.letter.waterBinderRatio, 4)}</dd></div>
              <div><dt>α</dt><dd>{formatNumero(view.letter.alpha, 4)}</dd></div>
              <div><dt>Custo</dt><dd>R$ {formatNumero(view.letter.costRsM3, 2)}/m³</dd></div>
              {view.letter.finesKg !== undefined && <div><dt>Finos</dt><dd>{formatNumero(view.letter.finesKg, 2)} kg/m³</dd></div>}
            </dl>
            <table className="ct-table"><thead><tr><th>Material</th><th className="num">kg/m³</th><th className="num">Traço unitário</th></tr></thead><tbody>{calculation.value.items.map((item, i) => <tr key={item.id}><td>{names[i]}</td><td className="num">{formatNumero(item.massaKgM3, 3)}</td><td className="num">{formatNumero(item.massaKgM3 / view.letter.cementKg, 3)}</td></tr>)}</tbody></table>
            {method === 'alternativo_concrefer' && batch.value && <section className="ct-recipe41-batch-letter">
              <h3>Betonada corrigida · {formatNumero(batch.value.volumeL, 0)} L</h3>
              <table className="ct-table"><thead><tr><th>Agregado</th><th className="num">Massa a pesar</th></tr></thead><tbody>
                {batch.value.weighMassesKg.map((mass, index) => <tr key={index}><td>{index < calculation.value!.result.sandMassesKg.length ? `Areia ${index + 1}` : `Brita ${index + 1 - calculation.value!.result.sandMassesKg.length}`}</td><td className="num">{formatNumero(mass, 3)} kg</td></tr>)}
              </tbody></table>
              <p>Água efetiva {formatNumero(batch.value.waterEffectiveKg, 3)} kg · água livre {formatNumero(batch.value.freeWaterKg, 3)} kg · água dosada <strong>{formatNumero(batch.value.waterToDoseKg, 3)} kg</strong></p>
              {batch.value.admixtureMassesG.map((mass, index) => <p key={index}>Aditivo {index + 1}: {formatNumero(mass, 0)} g · {formatNumero(batch.value!.admixtureVolumesMl[index], 2)} mL</p>)}
            </section>}
            {pilot !== false ? <p className="ct-recipe41-watermark">PILOTO — NÃO LIBERADO PARA PRODUÇÃO</p> : saved?.status !== 'aprovado' && <p className="ct-recipe41-watermark">RASCUNHO · NÃO LIBERADO PARA PRODUÇÃO</p>}
          </article>
        </>}
      </div>

      {layout === 'desktop' && <aside className="ct-ws-aside" aria-label="Resultado ao vivo">
        <section className="ct-live" aria-live="polite" aria-labelledby="r41-live-title">
          <h2 id="r41-live-title">Resultado ao vivo</h2>
          {view ? <>
            <div className="ct-live-volume"><small>Volume físico</small><div><strong>{formatNumero(view.panel.physicalVolumeL, 1)} L</strong>{mode === 'complete' ? <Pill tone={volumeOk ? 'ok' : 'crit'}>1000 ± 1</Pill> : <Pill tone="warn">planilha</Pill>}</div>
              <div className="ct-live-bar" aria-hidden="true">{volumes.map(v => <span key={v.key} style={{ flex: Math.max(v.litros, 0.1), background: v.color }}/>)}</div>
              <div className="ct-live-legend" aria-hidden="true">{volumes.map(v => <span key={v.key}><i style={{ background: v.color }}/>{v.label}</span>)}</div>
            </div>
            <div className="ct-live-cost"><small>Custo</small><strong>R$ {formatNumero(view.panel.costRsM3, 2)}</strong><span>por m³</span></div>
            <div className="ct-live-kpis">{kpis.map(k => <div key={k.label}><small>{k.label}</small><strong>{k.value}</strong>{k.unit && <span>{k.unit}</span>}</div>)}</div>
          </> : <p className="ct-live-empty">Complete as entradas para ver o resultado.</p>}
        </section>
        {checklist}
      </aside>}
    </div>

    <div className="ct-dock">
      {layout === 'tablet' && strip}
      <div className="ct-actionbar">
        <p role="status" className={`ct-action-msg is-${message.tone}`}><Icon name={message.tone === 'ok' ? 'check' : message.tone === 'crit' ? 'erro' : message.tone === 'info' ? 'relogio' : 'alerta'} size={16} strokeWidth={2.3}/><span>{message.text}</span></p>
        <div className="ct-actionbar-buttons">
          {layout !== 'mobile' && <Button variant="secondary" onClick={() => window.print()} disabled={!view}><Icon name="imprimir" size={16}/>Imprimir carta</Button>}
          {saved?.status === 'rascunho' && <Button variant="dark" onClick={() => void release()}>Liberar para ensaio</Button>}
          <Button onClick={() => void save()} disabled={!view || busy}><Icon name="salvar" size={16}/>Salvar no servidor</Button>
        </div>
      </div>
    </div>
  </div>;
}

type Part = { key: string; densityKey: string; label: string; fraction: number; density: number; mass?: number; tag?: string; onFraction: (n: number) => void; onDensity: (n: number) => void };
function AggregateGroups({ groups, fractionLabel }: { groups: { title: string; sum: number; parts: Part[] }[]; fractionLabel: string }) {
  return <div className="ct-agg-groups">{groups.map(group => { const ok = Math.abs(group.sum - 1) <= 0.001; return <div className="ct-agg-group" key={group.title}>
    <div className="ct-agg-head"><h3>{group.title}</h3>{ok ? <Pill tone="ok">Σ 100 %</Pill> : <Pill tone="crit">Σ {formatNumero(group.sum * 100, 1)} %</Pill>}</div>
    {group.parts.map(part => <div className="ct-agg-row" key={part.key}>
      <div className="ct-agg-name"><strong>{part.label}</strong>{part.tag && <span className="ct-agg-tag">{part.tag}</span>}</div>
      <NumField id={part.key} label={fractionLabel} unit="%" value={part.fraction * 100} onChange={part.onFraction}/>
      <NumField id={part.densityKey} label="Massa específica" unit="kg/dm³" value={part.density} onChange={part.onDensity}/>
      <CalcField label="Massa" value={part.mass == null ? '—' : formatNumero(part.mass, 1)} unit="kg/m³"/>
    </div>)}
  </div>; })}</div>;
}
function CostInput({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const [text, setText] = useState(() => editText(value));
  return <input className="ct-cost-input" aria-label={label} inputMode="decimal" value={text} onChange={e => { setText(e.target.value); onChange(parseNumero(e.target.value) ?? 0); }}/>;
}

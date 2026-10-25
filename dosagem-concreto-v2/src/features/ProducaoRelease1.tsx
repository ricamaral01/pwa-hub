import { useEffect, useState } from 'react';
import { chamarApi } from '../data/api';
import { usePilotMode } from '../app/layout';
import { Button, Card, Input, NumberInput, Select } from '../ui/components';
import { AgeCurvePanel } from './AgeCurvePanel';

type Item = { id: string; nome: string; categoria: string; massaKgM3: number };
type Trace = { id: string; nome: string; versao: number; status: string; unidade: string; itens: Item[]; piloto?: boolean };
type Product = { id: string; nome: string; unidade: string; desformaMinMPa: number; desformaIdadeAlvoH: number };
type Planned = Record<string, { nome: string; categoria: string; massaAPesarKg: number; toleranciaPct: number; desvioPct?: number }>;
type Production = { id: string; versao: number; revisao: number; unidade: string; piloto?: boolean; simulacao?: boolean; tracoVersaoChave: string; volumeM3: number; produtoId?: string; planejado: Planned; aguaDosadaKg: number; aguaLivreKg: number; alertas: { materialId: string; desvioPct: number; toleranciaPct: number; estado: string }[]; estadoDesforma: string; desforma?: { exemplarMPa: number }; rastreabilidade?: { medidoEm: string; responsavel: string; balancaId: string; lotesMateriais: Record<string, string> } };
type Saved<T> = { documento: T };
type Impact = { id: number; materialId: string; classificacao: string; estado: string;
  diferencas: { volumeL: number; densidadeAnterior: number; densidadeNova: number } };
const format = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ProducaoRelease1() {
  const pilot = usePilotMode();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState('');
  const [productId, setProductId] = useState('');
  const [volume, setVolume] = useState(1);
  const [humidities, setHumidities] = useState<Record<string, number>>({});
  const [absorptions, setAbsorptions] = useState<Record<string, number>>({});
  const [materialLots, setMaterialLots] = useState<Record<string, string>>({});
  const [operator, setOperator] = useState('');
  const [scale, setScale] = useState('');
  const [measuredAt, setMeasuredAt] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [actual, setActual] = useState<Record<string, number>>({});
  const [batch, setBatch] = useState<Production | null>(null);
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const [impactReason, setImpactReason] = useState('');
  const [newProduct, setNewProduct] = useState({ nome: '', desformaMinMPa: 20, desformaIdadeAlvoH: 24 });
  const [strengths, setStrengths] = useState<[number, number]>([0, 0]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (pilot === null) return;
    void Promise.all([chamarApi<Trace[]>('tracos.listar', {}), chamarApi<Product[]>('produtos.listar', {})])
      .then(([foundTraces, foundProducts]) => { setTraces(foundTraces.filter(trace => trace.status === 'aprovado' && (pilot || !trace.piloto))); setProducts(foundProducts); })
      .catch(error => setMessage((error as Error).message));
  }, [pilot]);
  const trace = traces.find(item => `${item.id}:v${item.versao}` === selected);
  useEffect(() => {
    if (!trace) { setImpacts([]); return; }
    void chamarApi<Impact[]>('avaliacoes.listar', { tracoVersaoChave: `tracos:${trace.id}:v${trace.versao}` })
      .then(setImpacts).catch(error => setMessage((error as Error).message));
  }, [trace?.id, trace?.versao]);
  async function decideImpact(impact: Impact, decision: 'liberar' | 'revisar') {
    setBusy(true); setMessage('');
    try {
      const result = await chamarApi<Impact>('avaliacoes.decidir', {
        id: impact.id, decisao: decision, justificativa: impactReason.trim(),
      });
      setImpacts(items => items.map(item => item.id === impact.id ? { ...item, ...result } : item));
      setMessage(decision === 'liberar' ? 'Avaliação liberada pelo servidor.' : 'Revisão exigida pelo servidor.');
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  const trackingReady = Boolean(trace && operator.trim() && scale.trim() && measuredAt &&
    trace.itens.every(item => materialLots[item.id]?.trim()));
  function productionPayload(dosedKg: Record<string, number>) {
    if (!trace || !trackingReady) throw new Error('Informe horário, responsável, balança e lote de cada material.');
    const timestamp = new Date(measuredAt).toISOString();
    const umidades = Object.fromEntries(trace.itens.filter(item => item.categoria === 'areia' || item.categoria === 'brita')
      .map(item => [item.id, { umidadePct: humidities[item.id] ?? 0, absorcaoPct: absorptions[item.id] ?? 0,
        medidoEm: timestamp, responsavel: operator.trim() }]));
    return { id: batch?.id || crypto.randomUUID(), revisao: batch?.revisao ?? 0,
      tracoVersaoChave: `tracos:${trace.id}:v${trace.versao}`, volumeM3: volume,
      produtoId: productId || undefined, umidades, dosadoKg: dosedKg,
      rastreabilidade: { medidoEm: timestamp, responsavel: operator.trim(), balancaId: scale.trim(),
        lotesMateriais: Object.fromEntries(trace.itens.map(item => [item.id, materialLots[item.id].trim()])) } };
  }

  async function registerProduct() {
    setBusy(true); setMessage('');
    try {
      const result = await chamarApi<Saved<Product>>('produtos.salvar', {
        id: crypto.randomUUID(), unidade: trace?.unidade || 'campinas', ...newProduct,
      });
      setProducts(items => [...items, result.documento]);
      setProductId(result.documento.id);
      setMessage('Produto salvo no servidor.');
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  async function saveBatch(withActual: boolean) {
    if (!trace) return;
    setBusy(true); setMessage('');
    try {
      const result = await chamarApi<Saved<Production>>('producoes.salvar', productionPayload(withActual ? actual : {}));
      setBatch(result.documento);
      setMessage(withActual ? 'Dosado confirmado pelo servidor.' : 'Betonada planejada e salva no servidor.');
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  async function release() {
    if (!batch) return;
    setBusy(true); setMessage('');
    try {
      const result = await chamarApi<Saved<Production>>('producoes.liberarDesforma', {
        id: batch.id, idadeHoras: products.find(product => product.id === batch.produtoId)?.desformaIdadeAlvoH,
        cpResultadosMPa: strengths, ensaiadoEm: new Date().toISOString(),
      });
      setBatch(result.documento); setMessage('Desforma liberada com CPs medidos deste lote.');
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  return <div><div className="ct-page-heading"><div><h1>Produção</h1><p>Betonada, massas a pesar, dosado real e desforma por lote.</p></div></div>
    <Card title="Produto e critério de desforma"><div className="ct-grid ct-grid--3">
      <Input id="r1-product-name" label="Produto" value={newProduct.nome} onChange={event => setNewProduct(value => ({ ...value, nome: event.target.value }))}/>
      <NumberInput id="r1-product-strength" label="Resistência mínima" unit="MPa" value={newProduct.desformaMinMPa} onChange={event => setNewProduct(value => ({ ...value, desformaMinMPa: Number(event.target.value) }))}/>
      <NumberInput id="r1-product-age" label="Idade alvo" unit="h" value={newProduct.desformaIdadeAlvoH} onChange={event => setNewProduct(value => ({ ...value, desformaIdadeAlvoH: Number(event.target.value) }))}/>
    </div><Button disabled={busy || !newProduct.nome} onClick={() => void registerProduct()}>Salvar produto</Button></Card>
    <Card title="Betonada do dia"><div className="ct-grid ct-grid--3">
      <Select id="r1-trace" label="Traço aprovado" value={selected} onChange={event => { setSelected(event.target.value); setBatch(null); }}><option value="">Selecione</option>{traces.map(item => <option key={`${item.id}:${item.versao}`} value={`${item.id}:v${item.versao}`}>{item.nome} · v{item.versao}</option>)}</Select>
      <Select id="r1-product" label="Produto" value={productId} onChange={event => setProductId(event.target.value)}><option value="">Sem produto</option>{products.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</Select>
      <NumberInput id="r1-volume" label="Volume" unit="m³" value={volume} onChange={event => setVolume(Number(event.target.value))}/>
    </div>
    {trace && <><div className="ct-grid ct-grid--3">
      <Input id="r1-measured-at" label="Umidade medida em" type="datetime-local" value={measuredAt} onChange={event => setMeasuredAt(event.target.value)}/>
      <Input id="r1-operator" label="Responsável pela medição" value={operator} onChange={event => setOperator(event.target.value)}/>
      <Input id="r1-scale" label="Balança" value={scale} onChange={event => setScale(event.target.value)}/>
    </div><div className="ct-grid ct-grid--3">{trace.itens.map(item => <div key={item.id}>
      <Input id={`r1-lot-${item.id}`} label={`Lote ${item.nome}`} value={materialLots[item.id] ?? ''} onChange={event => setMaterialLots(values => ({ ...values, [item.id]: event.target.value }))}/>
      {(item.categoria === 'areia' || item.categoria === 'brita') && <>
        <NumberInput id={`r1-humidity-${item.id}`} label={`Umidade ${item.nome}`} unit="%" value={humidities[item.id] ?? 0} onChange={event => setHumidities(values => ({ ...values, [item.id]: Number(event.target.value) }))}/>
        <NumberInput id={`r1-absorption-${item.id}`} label={`Absorção ${item.nome}`} unit="%" value={absorptions[item.id] ?? 0} onChange={event => setAbsorptions(values => ({ ...values, [item.id]: Number(event.target.value) }))}/>
      </>}
    </div>)}</div></>}
    <Button disabled={!trackingReady || busy || volume <= 0} onClick={() => void saveBatch(false)}>Calcular e salvar betonada</Button></Card>
    {trace && impacts.length > 0 && <Card title="Avaliações de impacto do traço aprovado">
      <p>A versão aprovada permanece intacta. Uma revisão necessária bloqueia a betonada até a decisão registrada.</p>
      {impacts.map(impact => <div className="ct-recipe41-part" key={impact.id}>
        <p>Material {impact.materialId} · {impact.classificacao} · {impact.estado}</p>
        <p>Volume {format(impact.diferencas.volumeL)} L · massa específica {impact.diferencas.densidadeAnterior} → {impact.diferencas.densidadeNova} kg/dm³</p>
        {impact.estado !== 'liberada' && <><Input id={`r1-impact-reason-${impact.id}`} label="Justificativa do engenheiro" value={impactReason} onChange={event => setImpactReason(event.target.value)}/>
          <div className="ct-row"><Button disabled={busy || impactReason.trim().length < 10} onClick={() => void decideImpact(impact, 'liberar')}>Liberar avaliação</Button>
            <Button variant="secondary" disabled={busy || impactReason.trim().length < 10} onClick={() => void decideImpact(impact, 'revisar')}>Exigir revisão</Button></div></>}
      </div>)}
    </Card>}
    {batch && <Card title="Carta de produção">{pilot !== false && <p className="ct-recipe41-watermark">PILOTO — NÃO LIBERADO PARA PRODUÇÃO</p>}{batch.piloto && <p>Simulação · registro piloto</p>}<p>Traço {batch.tracoVersaoChave} · lote {batch.id} · {format(batch.volumeM3)} m³</p>
      <p>Água dosada: <strong>{format(batch.aguaDosadaKg)} kg</strong> · água livre: {format(batch.aguaLivreKg)} kg</p>
      <div className="ct-table-wrap"><table className="ct-table ct-production-table"><thead><tr><th>Material</th><th>Massa a pesar</th><th>Tolerância</th><th>Dosado real</th></tr></thead><tbody>{Object.entries(batch.planejado).map(([id, item]) => <tr key={id}><td>{item.nome}</td><td>{format(item.massaAPesarKg)} kg</td><td>±{item.toleranciaPct}%</td><td><NumberInput id={`r1-actual-${id}`} label={`Dosado ${item.nome}`} unit="kg" value={actual[id] ?? item.massaAPesarKg} onChange={event => setActual(values => ({ ...values, [id]: Number(event.target.value) }))}/></td></tr>)}</tbody></table></div>
      <Button disabled={busy} onClick={() => { const values = Object.fromEntries(Object.entries(batch.planejado).map(([id, item]) => [id, actual[id] ?? item.massaAPesarKg])); setActual(values); void saveBatchWith(values); }}>Registrar dosado</Button>
      {batch.alertas.length > 0 && <div className="ct-alert ct-alert--aviso">{batch.alertas.map(alert => <p key={alert.materialId}>Alerta: {batch.planejado[alert.materialId]?.nome} desviou {format(alert.desvioPct)}% (limite ±{alert.toleranciaPct}%).</p>)}</div>}
      <p>Desforma: {batch.estadoDesforma.replaceAll('_', ' ')}</p>
      {batch.produtoId && batch.estadoDesforma !== 'liberada' && <><div className="ct-grid ct-grid--2">{[0, 1].map(index => <NumberInput key={index} id={`r1-cp-${index}`} label={`CP ${index + 1} do lote`} unit="MPa" value={strengths[index]} onChange={event => setStrengths(values => index === 0 ? [Number(event.target.value), values[1]] : [values[0], Number(event.target.value)])}/>)}</div><Button disabled={busy || pilot !== false} onClick={() => void release()}>{pilot !== false ? 'Desforma real indisponível no piloto' : 'Solicitar liberação de desforma'}</Button></>}
      <Button variant="ghost" onClick={() => window.print()}>Imprimir carta</Button>
    </Card>}
    {batch?.rastreabilidade && <Card title="Rastreabilidade da betonada"><p>Umidade medida em {new Date(batch.rastreabilidade.medidoEm).toLocaleString('pt-BR')} · Responsável {batch.rastreabilidade.responsavel} · Balança {batch.rastreabilidade.balancaId}</p><p>{Object.entries(batch.rastreabilidade.lotesMateriais).map(([id, lot]) => `${batch.planejado[id]?.nome || id}: lote ${lot}`).join(' · ')}</p></Card>}
    {batch && <AgeCurvePanel key={batch.id} batchId={batch.id} unit={batch.unidade}/>}
    {message && <p role="status">{message}</p>}
  </div>;

  async function saveBatchWith(values: Record<string, number>) {
    setActual(values);
    if (!trace) return;
    setBusy(true); setMessage('');
    try {
      const result = await chamarApi<Saved<Production>>('producoes.salvar', productionPayload(values));
      setBatch(result.documento); setMessage('Dosado confirmado pelo servidor.');
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
}

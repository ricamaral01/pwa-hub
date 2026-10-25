import { useMemo, useState } from 'react';
import { fitAge41 } from '../core/calc/curves41';
import { chamarApi } from '../data/api';
import { Button, Card, Input, NumberInput } from '../ui/components';

type Reading = { days: number; cp1: number; cp2: number };
const initial: Reading[] = [3, 7, 14, 28].map(days => ({ days, cp1: 0, cp2: 0 }));
const fmt = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function AgeCurvePanel({ batchId, unit }: { batchId: string; unit: string }) {
  const [readings, setReadings] = useState<Reading[]>(initial);
  const [responsible, setResponsible] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const pairs = readings.filter(row => row.days > 0 && row.cp1 > 0 && row.cp2 > 0)
    .map(row => [row.days, Math.max(row.cp1, row.cp2)] as [number, number]);
  const curve = useMemo(() => {
    try { return pairs.length >= 2 ? fitAge41(pairs) : null; }
    catch { return null; }
  }, [JSON.stringify(pairs)]);
  const projections = curve ? [0.5, 0.75, 1, 3, 7, 14, 28].map(days => ({ days, ...curve.estimate(days) })) : [];
  const save = async () => {
    if (!curve || !responsible.trim()) return;
    setBusy(true); setMessage('');
    try {
      const now = new Date().toISOString();
      await chamarApi('ensaios.salvar', { id: crypto.randomUUID(), tipo: 'resistencia_por_idade',
        materialId: batchId, unidade: unit, data: now, responsavel: responsible.trim(),
        dados: { loteProducaoId: batchId, leituras: readings.filter(row => row.cp1 > 0 && row.cp2 > 0) },
        resultado: { fc28: curve.fc28, s: curve.s, r2: curve.r2,
          estimativas: projections }, status: 'concluido' });
      setMessage('Curva e CPs do lote salvos no servidor. Estimativa não libera desforma.');
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  };
  return <Card title="G8 · Resistências por idade" subtitle={`Lote ${batchId}. Informe os dois CPs medidos por idade.`}>
    <p>Estimativas extrapoladas são indicativas. A desforma exige CPs medidos do próprio lote na idade-alvo.</p>
    <div className="ct-table-wrap"><table className="ct-table ct-production-table"><thead><tr><th>Idade (dias)</th><th>CP 1 (MPa)</th><th>CP 2 (MPa)</th><th>Exemplar (MPa)</th></tr></thead><tbody>
      {readings.map((row, index) => <tr key={index}>
        <td><NumberInput id={`r1-age-days-${index}`} label={`Idade ${index + 1}`} value={row.days} onChange={event => setReadings(current => current.map((item, i) => i === index ? { ...item, days: Number(event.target.value) } : item))}/></td>
        <td><NumberInput id={`r1-age-cp1-${index}`} label={`CP 1 aos ${row.days} dias`} value={row.cp1 || ''} onChange={event => setReadings(current => current.map((item, i) => i === index ? { ...item, cp1: Number(event.target.value) } : item))}/></td>
        <td><NumberInput id={`r1-age-cp2-${index}`} label={`CP 2 aos ${row.days} dias`} value={row.cp2 || ''} onChange={event => setReadings(current => current.map((item, i) => i === index ? { ...item, cp2: Number(event.target.value) } : item))}/></td>
        <td>{row.cp1 > 0 && row.cp2 > 0 ? fmt(Math.max(row.cp1, row.cp2)) : '—'}</td>
      </tr>)}
    </tbody></table></div>
    {curve && <div id="r1-age-curve"><p>Curva I1 · fc28 {fmt(curve.fc28)} MPa · s {fmt(curve.s)} · R² {fmt(curve.r2)}</p>
      <div className="ct-table-wrap"><table className="ct-table"><thead><tr><th>Idade</th><th>Resistência estimada</th><th>Faixa</th></tr></thead><tbody>{projections.map(item => <tr key={item.days}><td>{item.days.toLocaleString('pt-BR')} dias</td><td>{fmt(item.strength)} MPa</td><td>{item.extrapolation ? 'Extrapolação' : 'Interpolação'}</td></tr>)}</tbody></table></div>
    </div>}
    <Input id="r1-age-responsible" label="Responsável pelos CPs" value={responsible} onChange={event => setResponsible(event.target.value)}/>
    <div className="ct-row" style={{ marginTop: 16 }}><Button disabled={busy || !curve || !responsible.trim()} onClick={() => void save()}>Salvar curva do lote no servidor</Button></div>
    {message && <p role="status">{message}</p>}
  </Card>;
}

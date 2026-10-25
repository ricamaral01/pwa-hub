import { useEffect, useMemo, useState, type ClipboardEvent } from 'react';
import { calcularEmpacotamento } from '../core/calc/empacotamento';
import { formatNumero, parseNumero } from '../core/units';
import { Button, Card, NumberInput } from '../ui/components';
import { Icon } from '../ui/icons';

const sieves = [25, 19, 12.5, 9.5, 6.3, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075];
const sieveLabel = (d: number) => formatNumero(d, d < 0.1 ? 3 : d % 1 ? 2 : 0).replace(/(,\d*?)0+$/, '$1').replace(/,$/, '');
const emptyRow = () => sieves.map(() => '');

export type PackingData = {
  peneirasMm: number[];
  curvasPassantesPct: [number[], number[]];
  expoenteQ: number;
  diametroMinimoMm: number;
  diametroMaximoMm: number;
};

function parseCurve(cells: string[], label: string) {
  const values = cells.map(value => parseNumero(value.trim()));
  if (values.length !== sieves.length || values.some(value => value == null || value < 0 || value > 100))
    throw new Error(`${label}: informe ${sieves.length} percentuais passantes de 0 a 100 (um por peneira).`);
  const curve = values as number[];
  if (curve.some((value, index) => index > 0 && value > curve[index - 1]))
    throw new Error(`${label}: o passante não pode aumentar ao reduzir a peneira.`);
  return curve;
}
const splitValues = (text: string) => text.split(/[;\t\n\r]+/).map(v => v.trim()).filter((v, i, all) => v !== '' || i < all.length - 1);

function Chart({ curves, alfred, combined }: { curves: (number | null)[][]; alfred: number[]; combined: number[] | null }) {
  const W = 560, H = 230, L = 34, B = 26, T = 8, R = 8;
  const lmin = Math.log(sieves[sieves.length - 1]), lmax = Math.log(sieves[0]);
  const x = (d: number) => L + (Math.log(d) - lmin) / (lmax - lmin) * (W - L - R);
  const y = (v: number) => T + (1 - v / 100) * (H - T - B);
  const line = (values: (number | null)[]) => values.map((v, i) => v == null ? null : `${x(sieves[i]).toFixed(1)},${y(v).toFixed(1)}`).filter(Boolean).join(' ');
  return <svg className="ct-packing-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Curvas granulométricas em % passante: areia 1, areia 2, combinada e curva de Alfred (alvo)">
    {[0, 25, 50, 75, 100].map(v => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#E1E6EF"/><text x={L - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#4A5672">{v}</text></g>)}
    {[0.075, 0.15, 0.3, 0.6, 1.18, 2.36, 4.75, 9.5, 19].map(d => <text key={d} x={x(d)} y={H - 8} textAnchor="middle" fontSize="10" fill="#4A5672">{sieveLabel(d)}</text>)}
    <polyline points={line(curves[0])} fill="none" stroke="#9AA6BD" strokeWidth="1.6"/>
    <polyline points={line(curves[1])} fill="none" stroke="#5B7BD5" strokeWidth="1.6"/>
    <polyline points={line(alfred)} fill="none" stroke="#0A1530" strokeWidth="2" strokeDasharray="6 5"/>
    {combined && <polyline points={line(combined)} fill="none" stroke="#DB0A40" strokeWidth="3" strokeLinejoin="round"/>}
  </svg>;
}

export function PackingPanel({ fraction, onApply, onChange, onDeviation }: { fraction: number; onApply: (fraction: number) => void; onChange: (data: PackingData | null, touched: boolean) => void; onDeviation?: (rmse: number | null) => void }) {
  const [rows, setRows] = useState<[string[], string[]]>([emptyRow(), emptyRow()]);
  const [raw, setRaw] = useState<[string, string]>(['', '']);
  const [q, setQ] = useState('0,25');
  const [dmin, setDmin] = useState('0,001');
  const [dmax, setDmax] = useState('25');
  const touched = rows.some(row => row.some(cell => cell.trim() !== ''));

  const setRow = (k: 0 | 1, next: string[]) => {
    setRows(current => { const copy: [string[], string[]] = [current[0], current[1]]; copy[k] = next; return copy; });
    setRaw(current => { const copy: [string, string] = [current[0], current[1]]; copy[k] = next.some(v => v.trim()) ? next.join('; ') : ''; return copy; });
  };
  const pasteRaw = (k: 0 | 1, text: string) => {
    setRaw(current => { const copy: [string, string] = [current[0], current[1]]; copy[k] = text; return copy; });
    const values = splitValues(text);
    setRows(current => { const copy: [string[], string[]] = [current[0], current[1]]; copy[k] = sieves.map((_, i) => values[i] ?? ''); return copy; });
  };
  const editCell = (k: 0 | 1, i: number, value: string) => { const next = [...rows[k]]; next[i] = value; setRow(k, next); };
  const pasteCell = (k: 0 | 1, i: number, event: ClipboardEvent<HTMLInputElement>) => {
    const values = splitValues(event.clipboardData.getData('text'));
    if (values.length < 2) return;
    event.preventDefault();
    const next = [...rows[k]]; values.forEach((v, j) => { if (i + j < next.length) next[i + j] = v; }); setRow(k, next);
  };

  const exponent = parseNumero(q) ?? 0, minimum = parseNumero(dmin) ?? 0, maximum = parseNumero(dmax) ?? 0;
  const alfred = useMemo(() => sieves.map(d => maximum > minimum && minimum > 0 && exponent > 0 ? ((d ** exponent - minimum ** exponent) / (maximum ** exponent - minimum ** exponent)) * 100 : NaN), [exponent, minimum, maximum]);
  const result = useMemo(() => {
    if (!touched) return null;
    try {
      if (!rows[0].some(v => v.trim()) || !rows[1].some(v => v.trim())) throw new Error('Informe as curvas das duas areias para salvar o estudo de empacotamento.');
      const curves = [parseCurve(rows[0], 'Areia 1'), parseCurve(rows[1], 'Areia 2')];
      const evaluate = (firstPct: number) => calcularEmpacotamento(sieves, curves, [firstPct, 100 - firstPct], exponent, minimum, maximum);
      const current = evaluate(fraction * 100);
      let best = { firstPct: 0, ...evaluate(0) };
      for (let step = 1; step <= 200; step++) {
        const firstPct = step * 0.5;
        const candidate = evaluate(firstPct);
        if (candidate.rmse < best.rmse) best = { firstPct, ...candidate };
      }
      const data: PackingData = { peneirasMm: [...sieves], curvasPassantesPct: curves as [number[], number[]], expoenteQ: exponent, diametroMinimoMm: minimum, diametroMaximoMm: maximum };
      return { current, best, error: '', data };
    } catch (error) {
      return { current: null, best: null, error: (error as Error).message, data: null };
    }
  }, [rows, touched, exponent, minimum, maximum, fraction]);
  useEffect(() => { onChange(result?.data ?? null, touched); }, [result, touched, onChange]);
  useEffect(() => { onDeviation?.(result?.current?.rmse ?? null); }, [result, onDeviation]);

  const partial = rows.map(row => row.map(v => parseNumero(v)));
  const atBest = !!result?.best && Math.abs(result.best.firstPct - fraction * 100) < 0.01;

  return <Card id="sec-empacotamento" title="Empacotamento das areias" subtitle="Curva combinada das duas areias × curva de Alfred. A busca sugere a proporção de menor desvio.">
    <div className="ct-packing">
      <div className="ct-packing-plot">
        <Chart curves={partial} alfred={alfred.map(v => Number.isFinite(v) ? v : 0)} combined={result?.current?.combinada ?? null}/>
        <div className="ct-packing-legend" aria-hidden="true"><span><i style={{ background: '#DB0A40' }}/>Combinada</span><span><i className="is-dashed"/>Alfred (alvo)</span><span><i style={{ background: '#9AA6BD' }}/>Areia 1</span><span><i style={{ background: '#5B7BD5' }}/>Areia 2</span><span className="ct-muted">peneira, mm (escala log)</span></div>
      </div>
      <div className="ct-packing-control">
        <div className="ct-field">
          <label htmlFor="packing-ratio">Proporção Areia 1 / Areia 2 (% em massa)</label>
          <div className="ct-packing-ratio"><strong>{formatNumero(fraction * 100, 1)} / {formatNumero((1 - fraction) * 100, 1)}</strong></div>
          <input id="packing-ratio" type="range" min={0} max={100} step={0.5} value={Math.round(fraction * 200) / 2} onChange={event => onApply(Number(event.target.value) / 100)} aria-valuetext={`Areia 1 ${formatNumero(fraction * 100, 1)} %, Areia 2 ${formatNumero((1 - fraction) * 100, 1)} %`}/>
        </div>
        <div className="ct-packing-dev">
          <div><small>Desvio atual (RMSE)</small><strong>{result?.current ? formatNumero(result.current.rmse, 2) : '—'}</strong></div>
          <div><small>Menor desvio possível</small><strong>{result?.best ? formatNumero(result.best.rmse, 2) : '—'}</strong></div>
        </div>
        {result?.error && <p className="ct-alert ct-alert--erro" role="alert"><Icon name="erro" size={18}/>{result.error}</p>}
        {result?.best && result.current && <div className={`ct-packing-suggest${atBest ? ' is-best' : ''}`} aria-live="polite">
          <p>Proporção atual: {formatNumero(fraction * 100, 1)}% / {formatNumero((1 - fraction) * 100, 1)}% · desvio {formatNumero(result.current.rmse, 2)}</p>
          <p><strong>Sugestão: {formatNumero(result.best.firstPct, 1)}% / {formatNumero(100 - result.best.firstPct, 1)}%</strong> · desvio {formatNumero(result.best.rmse, 2)}</p>
          {atBest ? <p className="ct-packing-ok"><Icon name="check" size={16} strokeWidth={2.4}/>A proporção do traço já é a de menor desvio.</p>
            : <Button variant="dark" size="sm" onClick={() => onApply(result.best!.firstPct / 100)}>Aplicar proporção sugerida ao traço</Button>}
        </div>}
        {!touched && <p className="ct-muted ct-packing-hint">Cole as curvas abaixo (ou digite peneira a peneira) para ver o gráfico e a sugestão.</p>}
        <p className="ct-muted ct-packing-hint">Sugestão geométrica de empacotamento; não garante desempenho. Validar em laboratório.</p>
      </div>
    </div>
    <div className="ct-packing-paste">
      <div className="ct-field"><label htmlFor="packing-sand-1">Colar curva da Areia 1 · {sieves.length} passantes (%)</label><textarea id="packing-sand-1" rows={1} value={raw[0]} onChange={event => pasteRaw(0, event.target.value)} placeholder="100; 95; 80; 65; 50; 35; 20; 12; 8; 5; 2; 1"/></div>
      <div className="ct-field"><label htmlFor="packing-sand-2">Colar curva da Areia 2 · {sieves.length} passantes (%)</label><textarea id="packing-sand-2" rows={1} value={raw[1]} onChange={event => pasteRaw(1, event.target.value)} placeholder="100; 100; 98; 90; 75; 60; 42; 25; 12; 6; 3; 1"/></div>
    </div>
    <div className="ct-table-wrap ct-sieve-wrap">
      <table className="ct-sieve-table">
        <caption className="ct-sr">Percentual passante por peneira</caption>
        <thead><tr><th scope="col">Passante %</th>{sieves.map(d => <th scope="col" key={d}>{sieveLabel(d)}</th>)}</tr></thead>
        <tbody>
          {([0, 1] as const).map(k => <tr key={k}><th scope="row">Areia {k + 1}</th>{sieves.map((d, i) => <td key={d}><input id={`packing-s${k + 1}-${i}`} inputMode="decimal" aria-label={`Areia ${k + 1}, peneira ${sieveLabel(d)} mm, % passante`} value={rows[k][i]} onChange={event => editCell(k, i, event.target.value)} onPaste={event => pasteCell(k, i, event)} aria-invalid={rows[k][i].trim() !== '' && parseNumero(rows[k][i]) == null}/></td>)}</tr>)}
          <tr className="is-calc"><th scope="row">Combinada</th>{sieves.map((d, i) => <td key={d}><span>{result?.current ? formatNumero(result.current.combinada[i], 0) : '—'}</span></td>)}</tr>
          <tr className="is-calc is-target"><th scope="row">Alfred</th>{sieves.map((d, i) => <td key={d}><span>{Number.isFinite(alfred[i]) ? formatNumero(alfred[i], 0) : '—'}</span></td>)}</tr>
        </tbody>
      </table>
    </div>
    <details className="ct-packing-params">
      <summary>Parâmetros da curva de Alfred · q {q} · Dmín {dmin} mm · Dmáx {dmax} mm</summary>
      <div className="ct-grid ct-grid--3">
        <NumberInput id="packing-q" label="Expoente q" value={q} onChange={event => setQ(event.target.value)}/>
        <NumberInput id="packing-dmin" label="Diâmetro mínimo" unit="mm" value={dmin} onChange={event => setDmin(event.target.value)}/>
        <NumberInput id="packing-dmax" label="Diâmetro máximo" unit="mm" value={dmax} onChange={event => setDmax(event.target.value)}/>
      </div>
    </details>
  </Card>;
}

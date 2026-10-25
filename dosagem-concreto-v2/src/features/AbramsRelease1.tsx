import { useState } from 'react';
import { fitAbrams41, projectAbrams41, type Pair } from '../core/calc/curves41';
import { formatNumero, parseNumero } from '../core/units';
import { Button, Card, NumberInput } from '../ui/components';

type Point = { ratio: string; strength: string; water: string };
type Target = { fck: string; sd: string };
const points: Point[] = [
  { ratio: '1', strength: '18,5', water: '195' },
  { ratio: '0,864', strength: '24', water: '190' },
  { ratio: '0,760', strength: '28,1', water: '190' },
  { ratio: '0,633', strength: '36,1', water: '190' },
  { ratio: '0,543', strength: '43', water: '190' },
];
const targets: Target[] = [
  { fck: '15', sd: '2,55' }, { fck: '20', sd: '2,85' },
  { fck: '25', sd: '3,15' }, { fck: '30', sd: '4' },
  { fck: '35', sd: '4' }, { fck: '40', sd: '5' },
];

function number(value: string) {
  const parsed = parseNumero(value);
  if (parsed === null || !Number.isFinite(parsed)) throw new Error('Informe apenas números válidos.');
  return parsed;
}

export function AbramsRelease1() {
  const [data, setData] = useState(points);
  const [projects, setProjects] = useState(targets);
  const [result, setResult] = useState<{
    fit: ReturnType<typeof fitAbrams41>;
    rows: { fck: number; sd: number; project: ReturnType<typeof projectAbrams41> }[];
  } | null>(null);
  const [error, setError] = useState('');

  function calculate() {
    try {
      const strength: Pair[] = data.map(item => [number(item.ratio), number(item.strength)]);
      const water: Pair[] = data.map(item => [number(item.ratio), number(item.water)]);
      if (data.length < 3 || strength.some(([ratio, fc]) => ratio <= 0 || fc <= 0) || water.some(([, kg]) => kg <= 0)) {
        throw new Error('Informe ao menos três pontos positivos de a/c, resistência e água.');
      }
      const fit = fitAbrams41(strength);
      const rows = projects.map(item => {
        const fck = number(item.fck), sd = number(item.sd);
        if (fck <= 0 || sd < 0) throw new Error('Informe fck positivo e desvio padrão não negativo.');
        return { fck, sd, project: projectAbrams41(strength, water, fck, sd) };
      });
      setResult({ fit, rows });
      setError('');
    } catch (cause) { setResult(null); setError((cause as Error).message); }
  }

  return <>
    <div className="ct-alert ct-alert--aviso">Exemplo P2 preenchido para conferência. Substitua pelos ensaios medidos antes de usar a tabela em um projeto.</div>
    <Card title="Pontos da curva de Abrams" subtitle="Relação a/c, resistência aos 28 dias e água medida.">
      <div className="ct-table-wrap"><table className="ct-table"><thead><tr><th>Ponto</th><th>a/c</th><th>Resistência</th><th>Água</th></tr></thead><tbody>
        {data.map((item, i) => <tr key={i}><td>{i + 1}</td>
          <td><NumberInput id={`abr-ratio-${i}`} label={`a/c do ponto ${i + 1}`} value={item.ratio} onChange={event => { setData(values => values.map((value, j) => j === i ? { ...value, ratio: event.target.value } : value)); setResult(null); }}/></td>
          <td><NumberInput id={`abr-strength-${i}`} label={`Resistência do ponto ${i + 1}`} unit="MPa" value={item.strength} onChange={event => { setData(values => values.map((value, j) => j === i ? { ...value, strength: event.target.value } : value)); setResult(null); }}/></td>
          <td><NumberInput id={`abr-water-${i}`} label={`Água do ponto ${i + 1}`} unit="kg/m³" value={item.water} onChange={event => { setData(values => values.map((value, j) => j === i ? { ...value, water: event.target.value } : value)); setResult(null); }}/></td>
        </tr>)}
      </tbody></table></div>
      <div className="ct-row"><Button variant="ghost" onClick={() => { setData(values => [...values, { ratio: '', strength: '', water: '' }]); setResult(null); }}>+ Ponto</Button>{data.length > 3 && <Button variant="ghost" onClick={() => { setData(values => values.slice(0, -1)); setResult(null); }}>Remover último</Button>}</div>
    </Card>
    <Card title="Condições de projeto"><div className="ct-table-wrap"><table className="ct-table"><thead><tr><th>Projeto</th><th>fck</th><th>Desvio padrão</th></tr></thead><tbody>
      {projects.map((item, i) => <tr key={i}><td>{i + 1}</td>
        <td><NumberInput id={`abr-fck-${i}`} label={`fck do projeto ${i + 1}`} unit="MPa" value={item.fck} onChange={event => { setProjects(values => values.map((value, j) => j === i ? { ...value, fck: event.target.value } : value)); setResult(null); }}/></td>
        <td><NumberInput id={`abr-sd-${i}`} label={`Desvio padrão do projeto ${i + 1}`} unit="MPa" value={item.sd} onChange={event => { setProjects(values => values.map((value, j) => j === i ? { ...value, sd: event.target.value } : value)); setResult(null); }}/></td>
      </tr>)}
    </tbody></table></div><div className="ct-row"><Button variant="ghost" onClick={() => { setProjects(values => [...values, { fck: '', sd: '' }]); setResult(null); }}>+ Projeto</Button>{projects.length > 1 && <Button variant="ghost" onClick={() => { setProjects(values => values.slice(0, -1)); setResult(null); }}>Remover último</Button>}</div></Card>
    <div className="ct-row"><Button onClick={calculate}>Calcular curva e projetos</Button><Button variant="ghost" onClick={() => window.print()}>Imprimir</Button></div>
    {error && <div className="ct-alert ct-alert--erro" role="alert">{error}</div>}
    {result && <Card title="Curva de Abrams e tabela de projeto" id="abrams-result"><div className="ct-grid ct-grid--3">
      <div className="ct-calc">A = {formatNumero(result.fit.powerA, 4)}</div><div className="ct-calc">B = {formatNumero(result.fit.powerB, 5)}</div><div className="ct-calc">R² potência = {formatNumero(result.fit.powerR2, 5)}</div>
      <div className="ct-calc">k1 = {formatNumero(result.fit.expK1, 3)}</div><div className="ct-calc">k2 = {formatNumero(result.fit.expK2, 5)}</div><div className="ct-calc">R² exponencial = {formatNumero(result.fit.expR2, 5)}</div>
    </div><div className="ct-table-wrap" tabIndex={0} role="region" aria-label="Tabela de projeto da curva de Abrams"><table className="ct-table"><thead><tr><th>fck</th><th>sd</th><th>fcj</th><th>a/c</th><th>Água</th><th>Cimento</th><th>Validade</th></tr></thead><tbody>
      {result.rows.map((row, i) => <tr key={i}><td>{formatNumero(row.fck, 2)} MPa</td><td>{formatNumero(row.sd, 2)} MPa</td><td>{formatNumero(row.project.fcj, 2)} MPa</td><td>{formatNumero(row.project.ratio, 4)}</td><td>{formatNumero(row.project.water, 0)} kg/m³</td><td>{formatNumero(row.project.cement, 0)} kg/m³</td><td>{row.project.extrapolation ? 'Extrapolação — conferir' : 'Dentro dos pontos'}</td></tr>)}
    </tbody></table></div></Card>}
  </>;
}

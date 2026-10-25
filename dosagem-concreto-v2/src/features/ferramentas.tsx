import { useState } from 'react';
import { calculoInverso } from '../core/calc/calculoInverso';
import { calcularEmpacotamento } from '../core/calc/empacotamento';
import { parseNumero } from '../core/units';
import { Button, Card, NumberInput, Select } from '../ui/components';
import { AbramsRelease1 } from './AbramsRelease1';

const num = (value: string) => parseNumero(value) ?? 0;

export function FerramentasPage() {
  const [tab, setTab] = useState('inverso');
  const [mass, setMass] = useState('380');
  const [rho, setRho] = useState('3,12');
  const [air, setAir] = useState('2,5');
  const [q, setQ] = useState('0,25');
  const [dmin, setDmin] = useState('0,001');
  const [dmax, setDmax] = useState('19');
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');
  function calculate() {
    try {
      setError('');
      setResult(tab === 'inverso'
        ? calculoInverso([{ massaKg: num(mass), massaEspecificaKgDm3: num(rho) }], num(air))
        : calcularEmpacotamento([25, 19, 12.5, 9.5, 6.3, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075], [[100, 95, 80, 65, 50, 35, 20, 12, 8, 5, 2, 1]], [100], num(q), num(dmin), num(dmax)));
    } catch (cause) { setError((cause as Error).message); setResult(null); }
  }
  return <div>
    <div className="ct-page-heading"><div><h1>Ferramentas</h1><p>Cálculo inverso, curva de Abrams e empacotamento.</p></div></div>
    <Card><Select id="ferramenta" label="Ferramenta" value={tab} onChange={event => { setTab(event.target.value); setResult(null); }}><option value="inverso">Cálculo inverso · quantidade → volume</option><option value="abrams">Curva de Abrams</option><option value="empacotamento">Empacotamento</option></Select></Card>
    {tab === 'abrams' ? <AbramsRelease1/> : <Card title={tab === 'inverso' ? 'Cálculo inverso' : 'Empacotamento'}>
      {tab === 'inverso' ? <div className="ct-grid ct-grid--3"><NumberInput id="inv-massa" label="Massa" unit="kg" value={mass} onChange={event => setMass(event.target.value)}/><NumberInput id="inv-rho" label="Massa específica" unit="kg/dm³" value={rho} onChange={event => setRho(event.target.value)}/><NumberInput id="inv-ar" label="Ar incorporado" unit="%" value={air} onChange={event => setAir(event.target.value)}/></div>
        : <div className="ct-grid ct-grid--3"><NumberInput id="emp-q" label="Expoente q" value={q} onChange={event => setQ(event.target.value)}/><NumberInput id="emp-dmin" label="Diâmetro mínimo" unit="mm" value={dmin} onChange={event => setDmin(event.target.value)}/><NumberInput id="emp-dmax" label="Diâmetro máximo" unit="mm" value={dmax} onChange={event => setDmax(event.target.value)}/></div>}
      <div className="ct-row" style={{ marginTop: 20 }}><Button onClick={calculate}>Calcular</Button><Button variant="ghost" onClick={() => window.print()}>Imprimir</Button></div>
      {error && <div className="ct-alert ct-alert--erro" role="alert">{error}</div>}
      {result !== null && <div className="ct-calc" style={{ marginTop: 16 }}><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre></div>}
    </Card>}
    <div className="ct-alert ct-alert--aviso">Confira os dados de ensaio e a memória de cálculo antes de usar uma projeção de engenharia.</div>
  </div>;
}

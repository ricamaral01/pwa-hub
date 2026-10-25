import { useState, type ChangeEvent } from 'react';
import { chamarApi } from '../data/api';
import { converterArquivoRelease1 } from '../data/release1Importer';
import type { PreviaLegado } from '../data/legacyConverter';
import { Button, Card, Input } from '../ui/components';

type Result = { simulacao: boolean; lidos: number; convertidos: number; duplicados: number; gravados: number; avisos: string[] };
const empty = (): PreviaLegado => ({ lidos: 0, convertidos: [], avisos: [] });

export function ImportacaoRelease1() {
  const [unit, setUnit] = useState('campinas');
  const [preview, setPreview] = useState<PreviaLegado>(empty);
  const [source, setSource] = useState('');
  const [simulated, setSimulated] = useState<Result | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setPreview(empty()); setSimulated(null); setMessage('');
    setSource(files.map(file => file.name).join(', '));
    if (!files.length) return;
    setBusy(true);
    const merged = empty();
    for (const file of files) {
      try {
        const part = await converterArquivoRelease1(file, unit);
        merged.lidos += part.lidos;
        merged.convertidos.push(...part.convertidos);
        merged.avisos.push(...part.avisos);
      } catch (error) { merged.avisos.push(`${file.name}: ${(error as Error).message}`); }
    }
    setPreview(merged); setBusy(false);
  }

  async function send(effective: boolean) {
    if (effective && !simulated) return;
    setBusy(true); setMessage('');
    try {
      const totals: Result = { simulacao: !effective, lidos: 0, convertidos: 0, duplicados: 0, gravados: 0, avisos: [] };
      for (let index = 0; index < preview.convertidos.length; index += 500) {
        const result = await chamarApi<Result>('importacao.legado', {
          simulacao: !effective, registros: preview.convertidos.slice(index, index + 500), unidadePadrao: unit,
        });
        totals.lidos += result.lidos; totals.convertidos += result.convertidos;
        totals.duplicados += result.duplicados; totals.gravados += result.gravados;
        totals.avisos.push(...result.avisos);
      }
      if (totals.avisos.length) setMessage(`Servidor recusou ${totals.avisos.length} registro(s): ${totals.avisos.slice(0, 3).join('; ')}`);
      else setMessage(effective ? `${totals.gravados} registro(s) gravados; ${totals.duplicados} já existiam.` :
        `Simulação concluída: ${totals.convertidos} válido(s), ${totals.duplicados} já existentes. Nenhum registro gravado.`);
      if (!effective && !totals.avisos.length) setSimulated(totals);
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  return <Card title="Importação de planilhas da Release 1">
    <p>Conferência das planilhas Rica v4, Dosagem Udemy e Curva de Abrams. Os dados importados ficam como referência e não podem ser aprovados como traço de produção.</p>
    <div className="ct-grid ct-grid--2">
      <Input id="import-r1-unit" label="Unidade" value={unit} onChange={e => { setUnit(e.target.value); setSimulated(null); }}/>
      <div className="ct-field"><label htmlFor="import-r1-files">Planilhas .xlsx</label><input id="import-r1-files" type="file" accept=".xlsx" multiple onChange={e => void selectFiles(e)} /></div>
    </div>
    {source && <p role="status">{source}: {preview.lidos} aba(s) lidas, {preview.convertidos.length} pronta(s) para importação.</p>}
    {preview.avisos.length > 0 && <div className="ct-alert ct-alert--aviso"><strong>Avisos de conferência</strong><ul>{preview.avisos.slice(0, 30).map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}
    {preview.convertidos.length > 0 && <div className="ct-row"><Button variant="secondary" disabled={busy} onClick={() => void send(false)}>Simular no servidor</Button><Button disabled={busy || !simulated} onClick={() => void send(true)}>Importar referências</Button></div>}
    {message && <p role="status">{message}</p>}
  </Card>;
}

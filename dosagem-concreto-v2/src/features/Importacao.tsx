import { useEffect, useState, type ChangeEvent } from 'react';
import { chamarApi } from '../data/api';
import { salvarNaFila } from '../data/sync';
import { converterArquivoLegado, converterLocalStorage, type PreviaLegado } from '../data/legacyConverter';
import { Button, Card, Input } from '../ui/components';

const vazio = (): PreviaLegado => ({ lidos: 0, convertidos: [], avisos: [] });
type RespostaImportacao = { simulacao: boolean; lidos: number; convertidos: number; duplicados: number; gravados: number; avisos: string[]; amostras: unknown[] };

export function Importacao() {
  const [unidade, setUnidade] = useState('campinas');
  const [previa, setPrevia] = useState<PreviaLegado>(vazio);
  const [simulacao, setSimulacao] = useState<RespostaImportacao | null>(null);
  const [fonte, setFonte] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [busy, setBusy] = useState(false);
  const [admin, setAdmin] = useState(false);
  useEffect(() => { void chamarApi<Array<{papel:string}>>('usuarios.listar',{}).then(u => setAdmin(u[0]?.papel === 'admin')).catch(() => setAdmin(false)); }, []);
  const definir = (p: PreviaLegado, titulo: string) => { setPrevia(p); setFonte(titulo); setSimulacao(null); setMensagem(''); };
  const arquivos = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    const total = vazio();
    for (const file of files) {
      try { const parte = await converterArquivoLegado(file, unidade); total.lidos += parte.lidos; total.convertidos.push(...parte.convertidos); total.avisos.push(...parte.avisos); }
      catch (error) { total.avisos.push(`${file.name}: ${(error as Error).message}`); }
    }
    definir(total, files.map(f => f.name).join(', ')); setBusy(false);
  };
  const enviar = async (efetivar: boolean) => {
    setBusy(true); setMensagem('');
    try {
      const dados = { simulacao: !efetivar, registros: previa.convertidos, unidadePadrao: unidade };
      if (efetivar) {
        if (!simulacao) throw new Error('Faça a simulação antes de importar.');
        const resposta = await salvarNaFila('importacao.legado', dados);
        setMensagem(resposta ? 'Importação confirmada pelo servidor. Consulte a lista de traços e cadastros.' : 'Importação na fila, aguardando servidor.');
      } else {
        const resposta = await chamarApi<RespostaImportacao>('importacao.legado', dados);
        setSimulacao(resposta); setMensagem('Simulação concluída; nenhuma linha foi gravada.');
      }
    } catch (error) { setMensagem((error as Error).message); }
    finally { setBusy(false); }
  };
  if (!admin) return <Card title="Importação"><p className="ct-muted">A importação requer sessão e papel de administrador na API v2.</p></Card>;
  return <Card title="Importação do legado">
    <p>Exporte as planilhas antigas como .xlsx ou .csv, ou selecione o JSON exportado. A conversão ocorre neste navegador; as planilhas originais não são alteradas.</p>
    <div className="ct-grid ct-grid--2">
      <Input id="import-unidade" label="Unidade padrão" value={unidade} onChange={e => { setUnidade(e.target.value); setSimulacao(null); }}/>
      <div className="ct-field"><label htmlFor="import-arquivos">Planilhas ou JSON</label><input id="import-arquivos" type="file" accept=".xlsx,.csv,.json" multiple onChange={e => void arquivos(e)} /></div>
    </div>
    <div className="ct-row"><Button variant="secondary" onClick={() => definir(converterLocalStorage(unidade), 'Dados deste navegador')}>Ler localStorage legado</Button></div>
    {fonte && <p role="status">Fonte: {fonte}. Lidos: {previa.lidos}; convertidos: {previa.convertidos.length}; com aviso: {previa.avisos.length}.</p>}
    {previa.avisos.length > 0 && <div className="ct-alert ct-alert--aviso"><strong>Avisos de conversão</strong><ul>{previa.avisos.slice(0,30).map((a,i) => <li key={i}>{a}</li>)}</ul>{previa.avisos.length > 30 && <p>Mais {previa.avisos.length - 30} avisos.</p>}</div>}
    {previa.convertidos.length > 0 && <div className="ct-row"><Button variant="secondary" disabled={busy} onClick={() => void enviar(false)}>Simular no servidor</Button><Button disabled={busy || !simulacao} onClick={() => void enviar(true)}>Importar após simulação</Button></div>}
    {simulacao && <pre className="ct-calc" style={{ whiteSpace: 'pre-wrap', maxHeight: 350, overflow: 'auto' }}>{JSON.stringify(simulacao, null, 2)}</pre>}
    {mensagem && <p role="status">{mensagem}</p>}
  </Card>;
}

import type { LayoutPreference } from '../app/layout';
import { apiConfigurada } from '../data/api';
import { Card, Select } from '../ui/components';
import { Importacao } from './Importacao';

export function ReferenciaPage() {
  return <div>
    <div className="ct-page-heading"><div><h1>Referência</h1><p>Definições dos indicadores e orientação de uso.</p></div></div>
    <Card title="Fluxo recomendado"><ol><li>Cadastre materiais e confira massas específicas.</li><li>Registre ensaios e vincule-os aos materiais.</li><li>Defina objetivo e proporções no editor.</li><li>Confira pendências, resultado e carta.</li><li>Salve e verifique a confirmação do servidor.</li></ol></Card>
    <Card title="Indicadores"><div className="ct-table-wrap"><table className="ct-table"><thead><tr><th>Indicador</th><th>Definição</th></tr></thead><tbody><tr><td>a/c</td><td>Água ÷ cimento</td></tr><tr><td>a/agl</td><td>Água ÷ (cimento + adições)</td></tr><tr><td>Volume absoluto</td><td>Σ massa ÷ massa específica + ar incorporado</td></tr><tr><td>Argamassa seca</td><td>(aglomerante + areia) ÷ (aglomerante + areia + brita)</td></tr><tr><td>fcj</td><td>fck + 1,65 × desvio padrão</td></tr></tbody></table></div><p className="ct-muted">A faixa de teor de argamassa e a validade dos ensaios são critérios internos. As referências normativas devem ser conferidas por engenharia antes da liberação em produção.</p></Card>
    <Card title="Sobre o salvamento"><p>Rascunhos são mantidos neste navegador. Apenas a mensagem “Salvo no servidor” confirma uma gravação no banco v2. Quando não há rede, o envio permanece na fila.</p></Card>
  </div>;
}

export function ConfigPage({ preference, setPreference }: { preference: LayoutPreference; setPreference: (v: LayoutPreference) => void }) {
  return <div>
    <div className="ct-page-heading"><div><h1>Configurações</h1><p>Aparência, sincronização e importação controlada.</p></div></div>
    <Card title="Aparência"><Select id="layout-preferencia" label="Modo de layout" value={preference} onChange={e => setPreference(e.target.value as LayoutPreference)}><option value="automatico">Automático</option><option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="mobile">Celular</option></Select></Card>
    <Card title="Versões"><p>Aplicação: {import.meta.env.VITE_APP_VERSION || '2.0.0'} · API: {apiConfigurada() ? 'Configurada' : 'Não configurada'}</p><p className="ct-muted">A gravação no servidor exige sessão válida do Hub e implantação própria do backend v2.</p></Card>
    <Importacao />
  </div>;
}

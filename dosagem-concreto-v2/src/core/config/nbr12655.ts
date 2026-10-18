import type { ClasseAgressividade, TipoEstrutura } from '../model';
// Conferir contra a edição vigente da NBR 12655 antes de liberar em produção.
// Para concreto simples, só há alerta informativo.
export interface LimiteConcreto { relacaoAguaCimentoMax?: number; consumoCimentoMinKgM3?: number; fckMinMPa?: number; fonte: string }
const legado: Partial<Record<ClasseAgressividade, LimiteConcreto>> = {
  II: { relacaoAguaCimentoMax: 0.60, consumoCimentoMinKgM3: 280, fonte: 'Referência exibida em index.html:7063-7065; confirmar com engenharia' },
  III: { relacaoAguaCimentoMax: 0.55, consumoCimentoMinKgM3: 320, fonte: 'Mockup aprovado 03-dosagem-etapa3-desktop.html:114-117; confirmar com engenharia' },
  IV: { relacaoAguaCimentoMax: 0.45, consumoCimentoMinKgM3: 280, fonte: 'Referência exibida em index.html:7063-7065; confirmar com engenharia' }
};
export function obterLimite(classe: ClasseAgressividade, estrutura: TipoEstrutura): LimiteConcreto | null { return estrutura === 'simples' ? null : (legado[classe] ?? null); }

import type { Pendencia, Traco } from '../model';
import { obterLimite } from '../config/nbr12655';
import { indicadoresConfig } from '../config/indicadores.config';
export function alertasLimites(t: Traco, r: { volumeTotalL: number; relacaoAguaCimento: number; consumoCimentoKgM3: number; teorArgamassaSecoPct: number }): Pendencia[] {
  const p: Pendencia[] = [];
  if (Math.abs(r.volumeTotalL - 1000) > 15) p.push({ campo: 'volumeTotalL', nivel: 'aviso', mensagem: `Desvio de volume acima de 15 L: ${Math.round(r.volumeTotalL - 1000)} L.` });
  if (r.teorArgamassaSecoPct < indicadoresConfig.teorArgamassaMinPct || r.teorArgamassaSecoPct > indicadoresConfig.teorArgamassaMaxPct) p.push({ campo: 'teorArgamassaSecoPct', nivel: 'aviso', mensagem: 'Teor de argamassa fora da faixa interna de 51–55%.' });
  if (t.objetivo.estrutura === 'simples') { p.push({ campo: 'objetivo.estrutura', nivel: 'aviso', mensagem: 'Limites apresentados apenas como informação para concreto simples.' }); return p; }
  const l = obterLimite(t.objetivo.classe, t.objetivo.estrutura);
  if (!l) { p.push({ campo: 'objetivo.classe', nivel: 'aviso', mensagem: 'Limites desta classe aguardam conferência de engenharia.' }); return p; }
  if (l.relacaoAguaCimentoMax != null && r.relacaoAguaCimento > l.relacaoAguaCimentoMax) p.push({ campo: 'relacaoAguaCimento', nivel: 'aviso', mensagem: 'Relação a/c acima do limite de referência. Conferir com engenharia.' });
  if (l.consumoCimentoMinKgM3 != null && r.consumoCimentoKgM3 < l.consumoCimentoMinKgM3) p.push({ campo: 'consumoCimentoKgM3', nivel: 'aviso', mensagem: 'Consumo de cimento abaixo da referência. Conferir com engenharia.' });
  return p;
}

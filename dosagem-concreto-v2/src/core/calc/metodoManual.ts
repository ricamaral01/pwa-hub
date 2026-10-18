import type { ItemCalculado, ResultadoTraco, Traco } from '../model';
import { validarTraco } from '../validate';
import { volumeAbsolutoL, volumeArL, massaItem } from './volumes';
import { indicadores } from './indicadores';
import { custoTotalRsM3 } from './custo';
import { alertasLimites } from './limites';
export function calcularTraco(t: Traco): ResultadoTraco | null {
  const erros = validarTraco(t);
  if (erros.some(p => p.nivel === 'erro')) return null;
  const cimento = t.itens.filter(i => i.categoria === 'cimento').reduce((s, i) => s + (i.massaKgM3 ?? 0), 0);
  const adicao = t.itens.filter(i => i.categoria === 'adicao').reduce((s, i) => s + (i.massaKgM3 ?? 0), 0);
  const brutos: ItemCalculado[] = t.itens.map(i => {
    const massaResolvidaKgM3 = massaItem(i, cimento, cimento + adicao);
    return { ...i, massaResolvidaKgM3, volumeL: volumeAbsolutoL(massaResolvidaKgM3, i.massaEspecificaKgDm3), custoRsM3: massaResolvidaKgM3 * (i.custoRsKg ?? 0) };
  });
  const ar = volumeArL(t.arIncorporadoPct);
  const brutoTotal = brutos.reduce((s, i) => s + i.volumeL, ar);
  if (!Number.isFinite(brutoTotal) || brutoTotal <= 0) return null;
  const fator = t.normalizarPara1m3 ? 1000 / brutoTotal : 1;
  if (!Number.isFinite(fator) || fator <= 0) return null;
  const itens = brutos.map(i => ({ ...i, massaResolvidaKgM3: i.massaResolvidaKgM3 * fator, volumeL: i.volumeL * fator, custoRsM3: i.custoRsM3 * fator }));
  const volumeTotalL = itens.reduce((s, i) => s + i.volumeL, ar);
  const ind = indicadores(itens, volumeTotalL, t.objetivo.fckMPa, t.objetivo.sdMPa);
  const r: ResultadoTraco = { itens, volumeArL: ar, volumeTotalL, desvioL: volumeTotalL - 1000, fatorNormalizacao: fator, ...ind, custoRsM3: custoTotalRsM3(itens), pendencias: [] };
  r.pendencias = alertasLimites(t, r);
  return Object.values(r).some(v => typeof v === 'number' && !Number.isFinite(v)) ? null : r;
}

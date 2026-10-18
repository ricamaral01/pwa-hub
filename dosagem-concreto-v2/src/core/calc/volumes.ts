import type { ItemTraco } from '../model';
export function volumeAbsolutoL(massaKg: number, massaEspecificaKgDm3: number): number { return massaKg / massaEspecificaKgDm3; }
export function volumeArL(arIncorporadoPct: number): number { return arIncorporadoPct * 10; }
export function massaItem(item: ItemTraco, cimentoKg: number, aglomeranteKg: number): number {
  if (item.categoria === 'aditivo' && item.dosagemPct != null) return item.dosagemPct / 100 * (item.basePct === 'aglomerante' ? aglomeranteKg : cimentoKg);
  return item.massaKgM3 ?? 0;
}

import type { ItemCalculado } from '../model';
export function custoTotalRsM3(itens: ItemCalculado[]): number { return itens.reduce((n, i) => n + i.custoRsM3, 0); }

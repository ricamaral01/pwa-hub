import type { ItemCalculado } from '../model';
export interface CorrecaoUmidade { id: string; massaSecaKgM3: number; aguaAgregadoKgM3: number; massaObraKgM3: number }
export function corrigirUmidade(itens: ItemCalculado[]): { itens: CorrecaoUmidade[]; aguaObraKgM3: number } {
  const agua = itens.filter(i => i.categoria === 'agua').reduce((s, i) => s + i.massaResolvidaKgM3, 0);
  const corrigidos = itens.filter(i => i.categoria === 'areia' || i.categoria === 'brita').map(i => {
    const delta = i.massaResolvidaKgM3 * (i.umidadeLivrePct ?? 0) / 100;
    return { id: i.id, massaSecaKgM3: i.massaResolvidaKgM3, aguaAgregadoKgM3: delta, massaObraKgM3: i.massaResolvidaKgM3 + delta };
  });
  return { itens: corrigidos, aguaObraKgM3: agua - corrigidos.reduce((s, i) => s + i.aguaAgregadoKgM3, 0) };
}

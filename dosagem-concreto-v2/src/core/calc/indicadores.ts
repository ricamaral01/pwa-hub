import type { ItemCalculado } from '../model';
import { indicadoresConfig } from '../config/indicadores.config';
const soma = (itens: ItemCalculado[], categoria: string) => itens.filter(i => i.categoria === categoria).reduce((n, i) => n + i.massaResolvidaKgM3, 0);
export function indicadores(itens: ItemCalculado[], volumeTotalL: number, fckMPa: number, sdMPa: number) {
  const cimento = soma(itens, 'cimento');
  const adicao = soma(itens, 'adicao');
  const aglomerante = cimento + adicao;
  const areia = soma(itens, 'areia');
  const brita = soma(itens, 'brita');
  const agua = soma(itens, 'agua');
  const baseArgamassa = indicadoresConfig.incluirAdicoesNoTeorArgamassa ? aglomerante : cimento;
  const baseUnitario = indicadoresConfig.baseTracoUnitario === 'aglomerante' ? aglomerante : cimento;
  const massaTotal = itens.reduce((n, i) => n + i.massaResolvidaKgM3, 0);
  return {
    massaTotalKgM3: massaTotal,
    relacaoAguaCimento: agua / cimento,
    relacaoAguaAglomerante: agua / aglomerante,
    teorArgamassaSecoPct: (baseArgamassa + areia) / (baseArgamassa + areia + brita) * 100,
    consumoCimentoKgM3: cimento,
    consumoAglomeranteKgM3: aglomerante,
    massaEspecificaTeoricaKgM3: massaTotal / (volumeTotalL / 1000),
    fcjMPa: fckMPa + 1.65 * sdMPa,
    tracoUnitario: { base: 1, areia: areia / baseUnitario, brita: brita / baseUnitario, agua: agua / baseUnitario }
  };
}

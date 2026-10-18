export function custoLiquidoMcc(d: { preco: number; unidade: 'kg' | 't'; icmsPct: number; deduzICMS: boolean; ipiPct: number; deduzIPI: boolean; frete: number; unidadeFrete: 'kg' | 't'; icmsFretePct: number; deduzICMSFrete: boolean }): number {
  const p = d.unidade === 't' ? d.preco / 1000 : d.preco;
  const f = d.unidadeFrete === 't' ? d.frete / 1000 : d.frete;
  return Math.max(0, p - (d.deduzICMS ? p * d.icmsPct / 100 : 0) - (d.deduzIPI ? p * d.ipiPct / 100 : 0) + f - (d.deduzICMSFrete ? f * d.icmsFretePct / 100 : 0));
}

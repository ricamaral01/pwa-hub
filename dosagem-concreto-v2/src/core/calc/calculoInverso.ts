export function calculoInverso(itens: { massaKg: number; massaEspecificaKgDm3: number }[], arPct: number) {
  if (!itens.length || itens.some(i => i.massaKg < 0 || i.massaEspecificaKgDm3 <= 0) || arPct < 0 || arPct >= 100) throw new Error('Entradas inválidas.');
  const volumeSolidosL = itens.reduce((s, i) => s + i.massaKg / i.massaEspecificaKgDm3, 0);
  if (volumeSolidosL <= 0) throw new Error('Informe ao menos uma massa positiva.');
  const volumeTotalL = volumeSolidosL / (1 - arPct / 100);
  return { volumeSolidosL, volumeTotalL, volumeArL: volumeTotalL - volumeSolidosL, volumeConcretoM3: volumeTotalL / 1000, fatorPara1M3: 1000 / volumeTotalL };
}

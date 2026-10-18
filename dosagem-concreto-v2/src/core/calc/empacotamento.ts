export function calcularEmpacotamento(peneirasMm: number[], curvasPassante: number[][], proporcoesPct: number[], q: number, dMinMm: number, dMaxMm: number) {
  if (peneirasMm.length === 0 || curvasPassante.length !== proporcoesPct.length || curvasPassante.some(c => c.length !== peneirasMm.length) || Math.abs(proporcoesPct.reduce((s, p) => s + p, 0) - 100) > 0.1 || q <= 0 || dMinMm <= 0 || dMaxMm <= dMinMm) throw new Error('Dados de empacotamento inválidos.');
  const combinada = peneirasMm.map((_, i) => curvasPassante.reduce((s, c, j) => s + c[i] * proporcoesPct[j] / 100, 0));
  const alfred = peneirasMm.map(d => ((d ** q - dMinMm ** q) / (dMaxMm ** q - dMinMm ** q)) * 100);
  const rmse = Math.sqrt(combinada.reduce((s, v, i) => s + (v - alfred[i]) ** 2, 0) / peneirasMm.length);
  return { combinada, alfred, rmse };
}

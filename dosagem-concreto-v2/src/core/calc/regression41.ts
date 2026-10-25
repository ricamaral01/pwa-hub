export type AdjustmentPoint = { water: number; admixture: number; workability: number };

function inverse3(m: number[][]) {
  const [a, b, c] = m[0], [d, e, f] = m[1], [g, h, i] = m[2];
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-10) return null;
  return [[(e * i - f * h), (c * h - b * i), (b * f - c * e)],
    [(f * g - d * i), (a * i - c * g), (c * d - a * f)],
    [(d * h - e * g), (b * g - a * h), (a * e - b * d)]].map(row => row.map(v => v / det));
}

export function regressionAdjustment41(points: AdjustmentPoint[]) {
  if (points.length < 8) return { recommend: false, reason: 'histórico: mínimo de 8 ajustes' };
  if (points.some(p => ![p.water, p.admixture, p.workability].every(Number.isFinite))) throw new Error('Ajuste inválido');
  const n = points.length, df = n - 3;
  if (df < 5) return { recommend: false, reason: 'graus de liberdade insuficientes' };
  if (new Set(points.map(p => p.water)).size < 3 || new Set(points.map(p => p.admixture)).size < 3) return { recommend: false, reason: 'variar cada fator em três níveis' };
  const mean = (key: keyof AdjustmentPoint) => points.reduce((sum, p) => sum + p[key], 0) / n;
  const mw = mean('water'), ma = mean('admixture'), my = mean('workability');
  const sw = points.reduce((sum, p) => sum + (p.water - mw) ** 2, 0);
  const sa = points.reduce((sum, p) => sum + (p.admixture - ma) ** 2, 0);
  const cross = points.reduce((sum, p) => sum + (p.water - mw) * (p.admixture - ma), 0);
  const correlation = cross / Math.sqrt(sw * sa);
  if (!Number.isFinite(correlation) || Math.abs(correlation) >= .7) return { recommend: false, reason: 'água e aditivo variaram juntos', correlation };
  const matrix = [[n, points.reduce((s, p) => s + p.water, 0), points.reduce((s, p) => s + p.admixture, 0)],
    [points.reduce((s, p) => s + p.water, 0), points.reduce((s, p) => s + p.water ** 2, 0), points.reduce((s, p) => s + p.water * p.admixture, 0)],
    [points.reduce((s, p) => s + p.admixture, 0), points.reduce((s, p) => s + p.water * p.admixture, 0), points.reduce((s, p) => s + p.admixture ** 2, 0)]];
  const inverse = inverse3(matrix);
  if (!inverse) return { recommend: false, reason: 'fatores dependentes', correlation };
  const rhs = [points.reduce((s, p) => s + p.workability, 0), points.reduce((s, p) => s + p.water * p.workability, 0), points.reduce((s, p) => s + p.admixture * p.workability, 0)];
  const coefficients = inverse.map(row => row.reduce((s, v, j) => s + v * rhs[j], 0));
  const rss = points.reduce((s, p) => s + (p.workability - coefficients[0] - coefficients[1] * p.water - coefficients[2] * p.admixture) ** 2, 0);
  const tss = points.reduce((s, p) => s + (p.workability - my) ** 2, 0);
  const adjustedR2 = 1 - (rss / df) / (tss / (n - 1));
  if (!Number.isFinite(adjustedR2) || adjustedR2 < .6) return { recommend: false, reason: 'R² ajustado abaixo de 0,6', correlation, adjustedR2 };
  const t95 = df === 5 ? 2.5706 : df === 6 ? 2.4469 : df === 7 ? 2.3646 : df === 8 ? 2.3060 : 1.96 + 2.89 / df;
  const confidence95 = coefficients.map((value, j) => {
    const half = t95 * Math.sqrt(rss / df * inverse[j][j]);
    return [value - half, value + half];
  });
  return { recommend: true, reason: 'sugestão para a próxima betonada; validar em laboratório', correlation, adjustedR2, coefficients, confidence95, n };
}

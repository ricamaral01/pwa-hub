export function mixRetained41(retained: number[][], fractions: number[]) {
  if (!retained.length || retained.length !== fractions.length || retained.some(row => row.length !== retained[0].length)) throw new Error('Curvas incompatíveis');
  if (Math.abs(fractions.reduce((a, b) => a + b, 0) - 1) > 1e-9 || fractions.some(f => !Number.isFinite(f) || f < 0)) throw new Error('Frações inválidas');
  const cumulative: number[] = [];
  let total = 0;
  for (let sieve = 0; sieve < retained[0].length; sieve++) {
    total += retained.reduce((sum, row, i) => sum + row[sieve] * fractions[i], 0);
    cumulative.push(total);
  }
  // First sieve (6.3 mm in O1) is outside the normal MF series.
  return { cumulative, fineness: cumulative.slice(1).reduce((a, b) => a + b, 0) / 100 };
}

export function optimizeRetained41(retained: number[][], targetCumulative: number[], current: number[], step = 0.005) {
  if (retained.length !== 2 || retained[0].length !== targetCumulative.length || step <= 0 || step > 1) throw new Error('Busca de duas curvas inválida');
  const score = (fraction: number) => {
    const mix = mixRetained41(retained, [fraction, 1 - fraction]);
    return { ...mix, firstFraction: fraction, squaredError: mix.cumulative.reduce((sum, value, i) => sum + (value - targetCumulative[i]) ** 2, 0) };
  };
  const currentResult = score(current[0]);
  let best = score(0);
  for (let i = 1; i <= Math.round(1 / step); i++) {
    const candidate = score(Math.min(1, i * step));
    if (candidate.squaredError < best.squaredError) best = candidate;
  }
  return { current: currentResult, best };
}

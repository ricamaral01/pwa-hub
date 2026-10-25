export type Pair = [number, number];

function linearLogFit(pairs: Pair[], transformX: (x: number) => number) {
  if (pairs.length < 3) throw new Error('Mínimo de três pontos');
  const xy = pairs.map(([x, y]) => {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x <= 0 || y <= 0) throw new Error('Ponto inválido');
    return [transformX(x), Math.log(y)] as Pair;
  });
  const n = xy.length;
  const mx = xy.reduce((s, p) => s + p[0], 0) / n;
  const my = xy.reduce((s, p) => s + p[1], 0) / n;
  const xx = xy.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  if (xx <= 1e-12) throw new Error('Pontos sem variação');
  const slope = xy.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / xx;
  const intercept = my - slope * mx;
  const ss = xy.reduce((s, p) => s + (p[1] - my) ** 2, 0);
  const residual = xy.reduce((s, p) => s + (p[1] - intercept - slope * p[0]) ** 2, 0);
  return { intercept, slope, r2: 1 - residual / ss };
}

export function fitAbrams41(pairs: Pair[]) {
  const power = linearLogFit(pairs, Math.log);
  const exponential = linearLogFit(pairs, x => x);
  return { powerA: Math.exp(power.intercept), powerB: power.slope, powerR2: power.r2,
    expK1: Math.exp(exponential.intercept), expK2: Math.exp(-exponential.slope), expR2: exponential.r2 };
}

export function interpolateLyse41(pairs: Pair[], ratio: number) {
  if (!Number.isFinite(ratio) || pairs.length < 2) throw new Error('Curva de água inválida');
  const sorted = [...pairs].sort((a, b) => a[0] - b[0]);
  if (ratio <= sorted[0][0]) return { water: sorted[0][1], extrapolation: ratio < sorted[0][0] };
  if (ratio >= sorted.at(-1)![0]) return { water: sorted.at(-1)![1], extrapolation: ratio > sorted.at(-1)![0] };
  const high = sorted.findIndex(p => p[0] >= ratio);
  const [x0, y0] = sorted[high - 1], [x1, y1] = sorted[high];
  return { water: y0 + (ratio - x0) / (x1 - x0) * (y1 - y0), extrapolation: false };
}

export function projectAbrams41(pairs: Pair[], waterPairs: Pair[], fck: number, sd: number) {
  const fit = fitAbrams41(pairs);
  const fcj = fck + 1.65 * sd;
  const ratio = (fcj / fit.powerA) ** (1 / fit.powerB);
  const lyse = interpolateLyse41(waterPairs, ratio);
  const water = Math.floor(lyse.water + 1e-9);
  return { fcj, ratio, water, cement: Math.ceil(water / ratio - 1e-9), extrapolation: lyse.extrapolation || ratio < Math.min(...pairs.map(p => p[0])) || ratio > Math.max(...pairs.map(p => p[0])) };
}

export function fitAge41(pairs: Pair[]) {
  const fit = linearLogFit(pairs, days => 1 - Math.sqrt(28 / days));
  const fc28 = Math.exp(fit.intercept);
  const minAge = Math.min(...pairs.map(p => p[0]));
  const maxAge = Math.max(...pairs.map(p => p[0]));
  return { fc28, s: fit.slope, r2: fit.r2,
    estimate(days: number) {
      if (!Number.isFinite(days) || days <= 0) throw new Error('Idade inválida');
      return { strength: fc28 * Math.exp(fit.slope * (1 - Math.sqrt(28 / days))), extrapolation: days < minAge || days > maxAge };
    },
    daysTo(strength: number) {
      if (!Number.isFinite(strength) || strength <= 0 || fit.slope <= 0) throw new Error('Resistência inválida');
      const term = 1 - Math.log(strength / fc28) / fit.slope;
      if (term <= 0) throw new Error('Resistência fora do modelo');
      return 28 / term ** 2;
    }
  };
}

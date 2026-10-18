export interface ParAbrams { relacaoAguaCimento: number; resistenciaMPa: number }
export function estimarResistencia(A: number, B: number, relacaoAguaCimento: number): number {
  if (![A, B, relacaoAguaCimento].every(Number.isFinite) || A <= 0 || B <= 1 || relacaoAguaCimento <= 0) throw new Error('Parâmetros de Abrams inválidos.');
  return A / Math.pow(B, relacaoAguaCimento);
}
export function ajustarCurva(pares: ParAbrams[]): { A: number; B: number } {
  const validos = pares.filter(p => p.relacaoAguaCimento > 0 && p.resistenciaMPa > 0 && Number.isFinite(p.relacaoAguaCimento) && Number.isFinite(p.resistenciaMPa));
  if (validos.length < 2) throw new Error('Informe dois ou mais pares de a/c e resistência.');
  const n = validos.length, sx = validos.reduce((s, p) => s + p.relacaoAguaCimento, 0), sy = validos.reduce((s, p) => s + Math.log(p.resistenciaMPa), 0);
  const sxx = validos.reduce((s, p) => s + p.relacaoAguaCimento ** 2, 0), sxy = validos.reduce((s, p) => s + p.relacaoAguaCimento * Math.log(p.resistenciaMPa), 0);
  const den = n * sxx - sx ** 2;
  if (Math.abs(den) < 1e-12) throw new Error('Relações a/c iguais não permitem ajuste.');
  const slope = (n * sxy - sx * sy) / den;
  const intercept = (sy - slope * sx) / n;
  return { A: Math.exp(intercept), B: Math.exp(-slope) };
}

export type Preparation = 'A' | 'B' | 'C';
export type StrengthResult = { date: string; strength: number; family: string; valid: boolean };

const conditions = { A: { sd: 4, maxClass: Infinity }, B: { sd: 5.5, maxClass: 20 }, C: { sd: 7, maxClass: 15 } };
export function preparationAvailable41(fck: number, condition: Preparation) {
  return Number.isFinite(fck) && fck > 0 && fck <= conditions[condition].maxClass;
}
export function normativeSd41(results: StrengthResult[], condition: Preparation, family: string) {
  const fallback = conditions[condition].sd;
  const sorted = [...results].sort((a, b) => a.date.localeCompare(b.date));
  let run: StrengthResult[] = [];
  let selected: StrengthResult[] | null = null;
  for (const item of sorted) {
    if (!item.valid || item.family !== family || !Number.isFinite(item.strength) || item.strength <= 0 || !Number.isFinite(Date.parse(item.date))) { run = []; continue; }
    run.push(item);
    if (run.length > 20) run.shift();
    if (run.length === 20 && (Date.parse(run[19].date) - Date.parse(run[0].date)) <= 30 * 86400000) selected = [...run];
  }
  if (!selected) return { sd: fallback, normative: false, n: 0 };
  const mean = selected.reduce((sum, x) => sum + x.strength, 0) / 20;
  const sample = Math.sqrt(selected.reduce((sum, x) => sum + (x.strength - mean) ** 2, 0) / 19);
  return { sd: Math.max(2, sample), normative: true, n: 20 };
}

const maxWaterCement: Record<string, number> = { I: .65, II: .60, III: .55, IV: .45 };
export function approvalWaterCement41(ratio: number, exposure: keyof typeof maxWaterCement) {
  return Number.isFinite(ratio) && ratio <= maxWaterCement[exposure];
}

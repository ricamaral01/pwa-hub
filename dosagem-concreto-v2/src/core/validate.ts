import type { Pendencia, Traco } from './model';
export function validarTraco(t: Traco): Pendencia[] {
  const p: Pendencia[] = [];
  const erro = (campo: string, mensagem: string) => p.push({ campo, nivel: 'erro', mensagem });
  if (!t.nome.trim()) erro('nome', 'Informe o nome do traço.');
  if (!t.unidade.trim()) erro('unidade', 'Informe a unidade.');
  if (!Number.isFinite(t.objetivo.fckMPa) || t.objetivo.fckMPa <= 0) erro('fckMPa', 'Fck deve ser maior que zero.');
  if (!Number.isFinite(t.objetivo.sdMPa) || t.objetivo.sdMPa < 0) erro('sdMPa', 'Desvio padrão inválido.');
  if (!Number.isFinite(t.arIncorporadoPct) || t.arIncorporadoPct < 0 || t.arIncorporadoPct >= 100) erro('arIncorporadoPct', 'Ar incorporado deve estar entre 0 e 100%.');
  if (!t.itens.some(i => i.categoria === 'cimento' && Number.isFinite(i.massaKgM3) && (i.massaKgM3 ?? 0) > 0)) erro('itens', 'Informe cimento acima de zero.');
  for (const i of t.itens) {
    if (!i.nome.trim()) erro(`item.${i.id}.nome`, 'Informe o nome do material.');
    if (!Number.isFinite(i.massaEspecificaKgDm3) || i.massaEspecificaKgDm3 <= 0) erro(`item.${i.id}.massaEspecificaKgDm3`, 'Massa específica deve ser maior que zero.');
    if (i.massaKgM3 != null && (!Number.isFinite(i.massaKgM3) || i.massaKgM3 < 0)) erro(`item.${i.id}.massaKgM3`, 'Massa não pode ser negativa.');
    if (i.massaKgM3 == null && !(i.categoria === 'aditivo' && i.dosagemPct != null)) erro(`item.${i.id}.massaKgM3`, 'Informe a massa.');
    if (i.dosagemPct != null && (!Number.isFinite(i.dosagemPct) || i.dosagemPct < 0 || i.dosagemPct > 100)) erro(`item.${i.id}.dosagemPct`, 'Dosagem percentual inválida.');
    if (i.custoRsKg != null && (!Number.isFinite(i.custoRsKg) || i.custoRsKg < 0)) erro(`item.${i.id}.custoRsKg`, 'Custo inválido.');
    if (i.umidadeLivrePct != null && (!Number.isFinite(i.umidadeLivrePct) || i.umidadeLivrePct < 0 || i.umidadeLivrePct > 100)) erro(`item.${i.id}.umidadeLivrePct`, 'Umidade livre inválida.');
  }
  const aguaSeca = t.itens.filter(i => i.categoria === 'agua').reduce((s, i) => s + (i.massaKgM3 ?? 0), 0);
  const aguaAgregados = t.itens.filter(i => i.categoria === 'areia' || i.categoria === 'brita')
    .reduce((s, i) => s + (i.massaKgM3 ?? 0) * (i.umidadeLivrePct ?? 0) / 100, 0);
  if (Number.isFinite(aguaSeca) && Number.isFinite(aguaAgregados) && aguaAgregados > aguaSeca) {
    erro('aguaObra', 'A umidade dos agregados excede a água prevista; ajuste o traço antes de calcular.');
  }
  return p;
}

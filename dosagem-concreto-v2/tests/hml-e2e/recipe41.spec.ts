import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as XLSX from 'xlsx';
import { spawnSync } from 'node:child_process';

const money = (n: number, digits = 2) => n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

test.beforeEach(async ({ page }) => {
  try {
    await page.goto('/auth/login/', { waitUntil: 'domcontentloaded' });
  } catch (error) {
    if (!String(error).includes('ERR_ABORTED')) throw error;
    await page.goto('/auth/login/', { waitUntil: 'domcontentloaded' });
  }
  await page.locator('#email').fill('hml@example.test');
  await page.locator('#password').fill(process.env.HML_TEST_PASSWORD || 'Hml-Test-2026!');
  await page.getByRole('button', { name: 'Entrar com conta local' }).click();
  await expect(page.getByRole('heading', { name: 'O que precisa de você hoje' })).toBeVisible({ timeout: 20_000 });
});

test('R1-03: curva de Abrams P2 mostra coeficientes e tabela de projeto', async ({ page }) => {
  await page.goto('/#/ferramentas');
  await page.locator('#ferramenta').selectOption('abrams');
  await page.getByRole('button', { name: 'Calcular curva e projetos' }).click();
  const result = page.locator('#abrams-result');
  await expect(result).toContainText('A = 19,0964');
  await expect(result).toContainText('B = -1,36482');
  await expect(result).toContainText('k1 = 115,172');
  await expect(result).toContainText('k2 = 6,23232');
  await expect(result.locator('tbody tr')).toHaveCount(6);
  await expect(result.locator('tbody tr').first()).toContainText('194 kg/m³');
  await expect(result.locator('tbody tr').first()).toContainText('195 kg/m³');
  await expect(result.locator('tbody tr').last()).toContainText('Extrapolação');
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

for (const scenario of [
  { name: 'P1b', flow: 'R1-04', method: 'principal_abrams', mode: 'complete', volume: 1000, cement: 321, additionPct: 0,
    alpha: 0.4880, sands: [142.416, 569.663], gravels: [325.184, 758.762], fines: null },
  { name: 'P5', flow: 'R1-05', method: 'principal_abrams', mode: 'complete', volume: 1000, cement: 295.32, additionPct: 8,
    alpha: 0.4869, sands: [141.534, 566.137], gravels: [325.184, 758.762], fines: null },
  { name: 'A1', flow: '', method: 'alternativo_concrefer', mode: 'spreadsheet', volume: 999.97, cement: 351, additionPct: 0,
    alpha: 0.5234, sands: [156, 632], gravels: [1037], fines: 385.23 },
]) {
  test(`${scenario.flow ? `${scenario.flow}: ` : ''}${scenario.name} do objetivo à carta / R1-07: X1 painel, comparador, impressão e servidor`, async ({ page }) => {
    await page.goto('/#/comparacao-metodos');
    await page.locator('#r41-method').selectOption(scenario.method);
    await page.locator('#r41-mode').selectOption(scenario.mode);
    if (scenario.additionPct) await page.locator('#r41-addition').fill(String(scenario.additionPct));
    const panel = page.getByRole('heading', { name: 'Resultado calculado' }).locator('../..');
    const letter = page.locator('.ct-recipe41-letter');
    const comparison = page.getByRole('heading', { name: 'Comparação dos métodos' }).locator('../..');
    await expect(panel).toContainText(`${money(scenario.volume)} L`);
    await expect(panel).toContainText(`${money(scenario.cement)} kg/m³`);
    if (scenario.name === 'P5') {
      await expect(panel).toContainText('0,6400');
      await expect(panel).toContainText('0,5888');
    }
    await expect(letter).toContainText(`${money(scenario.volume)} L`);
    await expect(comparison).toContainText(`Volume ${money(scenario.volume)} L`);
    const server = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
      response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
    await page.getByRole('button', { name: 'Salvar no servidor' }).click();
    const body = await (await server).json();
    expect(body.ok).toBe(true);
    expect(body.dados.documento.resultadoCalculado.physicalVolumeL).toBeCloseTo(scenario.volume, 1);
    expect(body.dados.documento.resultadoCalculado.cementKg).toBe(scenario.cement);
    expect(body.dados.documento.resumoCalculado.alpha).toBeCloseTo(scenario.alpha, 4);
    for (const [index, expected] of scenario.sands.entries()) expect(body.dados.documento.resultadoCalculado.sandMassesKg[index]).toBeCloseTo(expected, 1);
    for (const [index, expected] of scenario.gravels.entries()) expect(body.dados.documento.resultadoCalculado.gravelMassesKg[index]).toBeCloseTo(expected, 1);
    if (scenario.fines !== null) {
      expect(body.dados.documento.resultadoCalculado.finesKg).toBeCloseTo(scenario.fines, 2);
      await expect(panel).toContainText('Finos');
      await expect(panel).toContainText(money(scenario.fines));
      await expect(letter).toContainText(money(scenario.fines));
      await expect(comparison).toContainText(money(scenario.fines));
    }
    const summary = body.dados.documento.resumoCalculado;
    const selected = comparison.getByRole('heading', { name: scenario.method === 'principal_abrams' ? 'Principal' : 'Alternativo' }).locator('..');
    for (const [key, digits] of [['physicalVolumeL', 2], ['cementKg', 2], ['waterCementRatio', 4],
      ['waterBinderRatio', 4], ['alpha', 4], ['costRsM3', 2]] as const) {
      const formatted = money(summary[key], digits);
      await expect(panel).toContainText(formatted);
      await expect(selected).toContainText(formatted);
      await expect(letter).toContainText(formatted);
    }
    for (const item of body.dados.documento.itens as Array<{ massaKgM3: number }>) {
      const formatted = money(item.massaKgM3, 3);
      await expect(panel).toContainText(formatted);
      await expect(letter).toContainText(formatted);
    }
    await expect(page.locator('.ct-recipe41 p[role="status"]')).toContainText('Salvo no servidor');
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ printBackground: true });
    const extraction = spawnSync('python', ['-c', 'import io,sys; from pypdf import PdfReader; sys.stdout.buffer.write(" ".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(sys.stdin.buffer.read())).pages).encode("utf-8"))'],
      { input: pdf, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    expect(extraction.status, extraction.stderr).toBe(0);
    const printed = extraction.stdout.replace(/\s+/g, ' ');
    expect(printed, printed.slice(0, 800)).toContain(money(scenario.volume));
    for (const [key, digits] of [['physicalVolumeL', 2], ['cementKg', 2], ['waterCementRatio', 4],
      ['waterBinderRatio', 4], ['alpha', 4], ['costRsM3', 2]] as const) {
      expect(printed).toContain(money(summary[key], digits));
    }
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });
}

test('R1-06: A1 mostra betonada corrigida e grava a correção SSS no servidor', async ({ page }, testInfo) => {
  await page.goto('/#/comparacao-metodos');
  await page.locator('#r41-method').selectOption('alternativo_concrefer');
  await page.locator('#r41-mode').selectOption('spreadsheet');
  const batch = page.locator('#r41-batch-result').locator('..');
  const letter = page.locator('.ct-recipe41-batch-letter');
  for (const value of ['173,160', '695,200', '1.042,185', '114,455', '2.176', '1.996,33']) {
    await expect(batch).toContainText(value);
  }
  await page.locator('#r41-batch-absorption-0').fill('1');
  await page.locator('#r41-batch-absorption-1').fill('0,8');
  await page.locator('#r41-batch-absorption-2').fill('0,5');
  for (const value of ['171,446', '689,683', '1.037,000', '126,872']) {
    await expect(batch).toContainText(value);
    await expect(letter).toContainText(value);
  }
  const server = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
  await page.getByRole('button', { name: 'Salvar no servidor' }).click();
  const response = await (await server).json();
  expect(response.ok).toBe(true);
  const corrected = response.dados.documento.betonadaCorrigida;
  expect(corrected.referenceCondition).toBe('sss');
  for (const [index, expected] of [171.446, 689.683, 1037].entries()) {
    expect(corrected.weighMassesKg[index]).toBeCloseTo(expected, 2);
  }
  expect(corrected.waterToDoseKg).toBeCloseTo(126.872, 2);
  expect(response.dados.documento.referenciaAgregados).toBe('sss');
  await expect(page.locator('.ct-recipe41 p[role="status"]')).toContainText('Salvo no servidor');
  await expect(page.locator('#r41-method')).toHaveValue('alternativo_concrefer');
  await expect(letter).toContainText('126,872');
  await batch.screenshot({ path: resolve(import.meta.dirname, `../e2e/__screenshots__/betonada-${testInfo.project.name}.png`) });
  await expect(letter).toContainText('126,872');
  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ printBackground: true });
  const extraction = spawnSync('python', ['-c', 'import io,sys; from pypdf import PdfReader; sys.stdout.buffer.write(" ".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(sys.stdin.buffer.read())).pages).encode("utf-8"))'],
    { input: pdf, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  expect(extraction.status, extraction.stderr).toBe(0);
  expect(extraction.stdout).toContain('126,872');
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

test('R1-13: Rica v4 simula e importa sem duplicar', async ({ page }) => {
  const source = resolve(import.meta.dirname, '../../../docs/dosagem-v2/referencia/Dosagem_Concreto_Rica_v4.xlsx');
  const workbook = XLSX.read(readFileSync(source), { type: 'buffer' });
  const names = ['R10 (2)', 'FILLER V2', 'MARCOS', 'TESTE AGREGADO V2'];
  const focused = XLSX.utils.book_new();
  for (const name of names) XLSX.utils.book_append_sheet(focused, workbook.Sheets[name], name);
  const buffer = XLSX.write(focused, { type: 'buffer', bookType: 'xlsx' });
  await page.goto('/#/importacao-r1');
  await expect(page.getByRole('heading', { name: 'Importação de planilhas da Release 1' })).toBeVisible();
  await page.locator('#import-r1-files').setInputFiles({ name: 'Dosagem_Concreto_Rica_v4.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer });
  await expect(page.locator('.ct-card p[role="status"]').first()).toContainText('4 aba(s) lidas');
  await expect(page.locator('.ct-alert--aviso')).toContainText('FILLER V2: volume físico');
  await page.getByRole('button', { name: 'Simular no servidor' }).click();
  await expect(page.getByRole('status').last()).toContainText('Simulação concluída');
  await page.getByRole('button', { name: 'Importar referências' }).click();
  await expect(page.getByRole('status').last()).toContainText('registro(s) gravados');
  await page.getByRole('button', { name: 'Importar referências' }).click();
  await expect(page.getByRole('status').last()).toContainText('4 já existiam');
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

test('módulos distintos gravam o método e as curvas de empacotamento no servidor', async ({ page }) => {
  await page.goto('/#/dosagem/empacotamento');
  await expect(page.getByRole('heading', { name: 'Dosagem por empacotamento' })).toBeVisible();
  await page.locator('#packing-sand-1').fill('100;95;80;65;50;35;20;12;8;5;2;1');
  await page.locator('#packing-sand-2').fill('100;100;98;90;75;60;42;25;12;6;3;1');
  await page.getByRole('button', { name: 'Aplicar proporção sugerida ao traço' }).click();
  const firstSave = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
  await page.getByRole('button', { name: 'Salvar no servidor' }).click();
  const first = await (await firstSave).json();
  expect(first.ok).toBe(true);
  expect(first.dados.documento.metodo).toBe('principal_abrams');
  expect(first.dados.documento.empacotamento.curvasPassantesPct).toHaveLength(2);
  expect(first.dados.documento.empacotamento.peneirasMm).toHaveLength(12);
  await expect(page.locator('.ct-recipe41 p[role="status"]')).toContainText('Salvo no servidor');
  const packingAxe = await new AxeBuilder({ page }).analyze();
  expect(packingAxe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);

  await page.goto('/#/dosagem/volume');
  await expect(page.getByRole('heading', { name: 'Dosagem por volume' })).toBeVisible();
  await expect(page.locator('#packing-sand-1')).toHaveCount(0);
  const secondSave = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
  await page.getByRole('button', { name: 'Salvar no servidor' }).click();
  const second = await (await secondSave).json();
  expect(second.ok).toBe(true);
  expect(second.dados.documento.metodo).toBe('alternativo_concrefer');
  expect(second.dados.documento.empacotamento).toBeUndefined();
  const volumeAxe = await new AxeBuilder({ page }).analyze();
  expect(volumeAxe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

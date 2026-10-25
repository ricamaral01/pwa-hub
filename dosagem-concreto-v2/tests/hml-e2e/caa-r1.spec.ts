import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';

test.beforeEach(async ({ page }) => {
  await page.goto('/auth/login/', { waitUntil: 'domcontentloaded' });
  await page.locator('#email').fill('hml@example.test');
  await page.locator('#password').fill(process.env.HML_TEST_PASSWORD || 'Hml-Test-2026!');
  await page.getByRole('button', { name: 'Entrar com conta local' }).click();
  await expect(page.getByRole('heading', { name: 'O que precisa de você hoje' })).toBeVisible();
});

test('R1-09: CAA exige classes, G11 e reprova espalhamento fora da SF2', async ({ page }, testInfo) => {
  await page.goto('/#/comparacao-metodos');
  await page.locator('#r41-concrete-type').selectOption('caa');
  await expect(page.locator('#r41-caa-sf')).toHaveValue('SF2');
  await expect(page.locator('#r41-caa-vs')).toHaveValue('VS1');
  await expect(page.locator('#r41-caa-iev')).toHaveValue('0');
  const savedResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
  await page.getByRole('button', { name: 'Salvar no servidor' }).click();
  const saved = await (await savedResponse).json();
  expect(saved.ok).toBe(true);
  expect(saved.dados.documento.tipoConcreto).toBe('caa');
  expect(saved.dados.documento.objetivo.classesCAA).toEqual({ SF: 'SF2', VS: 'VS1', IEV: 0 });
  const releaseResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.enviarAprovacao');
  await page.getByRole('button', { name: 'Liberar para ensaio' }).click();
  expect((await (await releaseResponse).json()).ok).toBe(true);
  const plan = page.getByRole('heading', { name: 'Plano experimental' }).locator('../..');
  await expect(plan.getByRole('img', { name: /G11/ })).toContainText('30 min');
  await page.locator('#r41-exp-1-espalhamentoMm').fill('650');
  await page.locator('#r41-exp-1-cp1MPa').fill('34');
  await page.locator('#r41-exp-2-cp2MPa').fill('37');
  const badSave = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
  await plan.getByRole('button', { name: 'Salvar ensaios do plano' }).click();
  expect((await (await badSave).json()).ok).toBe(true);
  const rejectedResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.aprovar');
  await plan.getByRole('button', { name: 'Aprovar traço' }).click();
  const rejected = await (await rejectedResponse).json();
  expect(rejected.ok).toBe(false);
  expect(rejected.erro.mensagem).toContain('Espalhamento fora da classe CAA exigida');

  await page.locator('#r41-exp-1-espalhamentoMm').fill('700');
  const goodSave = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
  await plan.getByRole('button', { name: 'Salvar ensaios do plano' }).click();
  const good = await (await goodSave).json();
  expect(good.ok).toBe(true);
  expect(good.dados.documento.experimentais[0].manutencaoEspalhamento).toHaveLength(3);
  await plan.screenshot({ path: resolve(import.meta.dirname, `../e2e/__screenshots__/caa-r1-${testInfo.project.name}.png`) });
  const approvedResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.aprovar');
  await plan.getByRole('button', { name: 'Aprovar traço' }).click();
  expect((await (await approvedResponse).json()).dados.documento.status).toBe('aprovado');
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

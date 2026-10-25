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

test('R1-08: plano experimental bloqueia aprovação incompleta e libera P1b conforme', async ({ page }, testInfo) => {
  await page.goto('/#/comparacao-metodos');
  await expect(page.locator('#r41-method')).toHaveValue('principal_abrams');
  const savedResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
  await page.getByRole('button', { name: 'Salvar no servidor' }).click();
  expect((await (await savedResponse).json()).ok).toBe(true);

  const releaseResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.enviarAprovacao');
  await expect(page.getByRole('button', { name: 'Liberar para ensaio' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Liberar para ensaio' }).click();
  const released = await (await releaseResponse).json();
  expect(released.ok).toBe(true);
  expect(released.dados.documento.status).toBe('em_teste');
  const plan = page.getByRole('heading', { name: 'Plano experimental' }).locator('../..');
  await expect(plan).toBeVisible();

  const blockedResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.aprovar');
  await plan.getByRole('button', { name: 'Aprovar traço' }).click();
  const blocked = await (await blockedResponse).json();
  expect(blocked.ok).toBe(false);
  expect(blocked.erro.codigo).toBe('BLOQUEIO_ESTADO');
  await expect(page.locator('.ct-recipe41 p[role="status"]')).toContainText('Faltam misturas');

  await page.locator('#r41-exp-1-cp1MPa').fill('34');
  await page.locator('#r41-exp-2-cp2MPa').fill('37');
  const experimentsResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.salvarVersao');
  await plan.getByRole('button', { name: 'Salvar ensaios do plano' }).click();
  const experiments = await (await experimentsResponse).json();
  expect(experiments.ok).toBe(true);
  expect(experiments.dados.documento.experimentais).toHaveLength(3);
  await plan.screenshot({ path: resolve(import.meta.dirname, `../e2e/__screenshots__/plano-experimental-${testInfo.project.name}.png`) });

  const approvedResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') &&
    response.request().postDataJSON()?.acao === 'tracos.aprovar');
  await plan.getByRole('button', { name: 'Aprovar traço' }).click();
  const approved = await (await approvedResponse).json();
  expect(approved.ok).toBe(true);
  expect(approved.dados.documento.status).toBe('aprovado');
  await expect(page.locator('.ct-recipe41 p[role="status"]')).toContainText('Traço aprovado');
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

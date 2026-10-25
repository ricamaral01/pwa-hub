import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function accessible(page: import('@playwright/test').Page) {
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(issue => issue.impact === 'serious' || issue.impact === 'critical')).toEqual([]);
}

test('R1-02: material, produto, granulometria MF 2,586 e massa específica', async ({ page }) => {
  await page.goto('/auth/login/');
  await page.locator('#email').fill('hml@example.test');
  await page.locator('#password').fill('Hml-Test-2026!');
  await page.getByRole('button', { name: 'Entrar com conta local' }).click();
  await expect(page.getByRole('heading', { name: /O que precisa de voc/ })).toBeVisible();

  await page.goto('/#/materiais');
  await page.getByRole('button', { name: '+ Novo material' }).click();
  await page.locator('#mat-nome').fill('Areia R1-02');
  await page.locator('#mat-rho').fill('2,65');
  await page.locator('#mat-abs').fill('1,0');
  await page.locator('#mat-mf').fill('2,586');
  const materialResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') && response.request().postDataJSON()?.acao === 'materiais.salvar');
  await page.getByRole('button', { name: 'Salvar material' }).click();
  const materialBody = await (await materialResponse).json();
  expect(materialBody.ok).toBe(true);
  const materialId = materialBody.dados.documento.id as string;
  expect(materialBody.dados.documento.massaEspecificaKgDm3).toBe(2.65);
  await accessible(page);

  await page.goto('/#/ensaios');
  await page.locator('#ens-material').fill(materialId);
  await page.locator('#ens-responsavel').fill('Laboratório R1');
  const retained = [
    ['6.3', '0,8'], ['4.75', '24,6'], ['2.36', '136,8'], ['1.18', '129,4'],
    ['0.6', '190'], ['0.3', '248,6'], ['0.15', '165'], ['0.075', '104,8'],
  ];
  for (const [sieve, mass] of retained) await page.getByRole('textbox', { name: `Massa retida na peneira ${sieve}` }).fill(mass);
  await page.getByRole('button', { name: 'Calcular ensaio' }).click();
  await expect(page.getByRole('heading', { name: 'Resultado calculado' }).locator('../..')).toContainText('MF 2,586');
  const granResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') && response.request().postDataJSON()?.acao === 'ensaios.salvar');
  await page.getByRole('button', { name: 'Salvar ensaio' }).click();
  const granBody = await (await granResponse).json();
  expect(granBody.ok).toBe(true);
  expect(granBody.dados.documento.resultado.moduloFinura).toBeCloseTo(2.5862, 4);
  await expect(page.getByRole('status').last()).toContainText('confirmado pelo servidor');
  await accessible(page);

  await page.locator('#ens-tipo').selectOption('massa_especifica_miudo');
  await page.locator('#ens-massa').fill('500');
  await page.locator('#ens-inicial').fill('200');
  await page.locator('#ens-final').fill('390');
  await page.getByRole('button', { name: 'Calcular ensaio' }).click();
  const rhoResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') && response.request().postDataJSON()?.acao === 'ensaios.salvar');
  await page.getByRole('button', { name: 'Salvar ensaio' }).click();
  const rhoBody = await (await rhoResponse).json();
  expect(rhoBody.ok).toBe(true);
  expect(rhoBody.dados.documento.resultado.rho).toBeCloseTo(500 / 190, 4);
  await accessible(page);

  await page.goto('/#/producao-r1');
  await page.locator('#r1-product-name').fill('Produto R1-02');
  await page.locator('#r1-product-strength').fill('20');
  await page.locator('#r1-product-age').fill('24');
  const productResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/rpc') && response.request().postDataJSON()?.acao === 'produtos.salvar');
  await page.getByRole('button', { name: 'Salvar produto' }).click();
  const productBody = await (await productResponse).json();
  expect(productBody.ok).toBe(true);
  expect(productBody.dados.documento.desformaMinMPa).toBe(20);
  await expect(page.getByRole('status').last()).toContainText('Produto salvo no servidor');
  await accessible(page);
});

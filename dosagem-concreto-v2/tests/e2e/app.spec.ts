import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.route('**/auth/config.js*', r => r.fulfill({ contentType: 'application/javascript', body: 'window.CONCRETRACK_AUTH_CONFIG={authEnabled:false};' }));
  await page.route('**/auth/client.js*', r => r.fulfill({ contentType: 'application/javascript', body: 'window.ConcretrackAuth={session:async()=>({access_token:"test-token",user:{email:"teste@example.com"}}),client:{auth:{refreshSession:async()=>({data:{session:null}})}}};' }));
  await page.route('**/auth/guard.js*', r => r.fulfill({ contentType: 'application/javascript', body: "document.documentElement.classList.remove('auth-checking');" }));
  await page.route('**/api', async r => {
    const body = r.request().postDataJSON() as { acao: string; dados: Record<string, unknown> };
    const dados = body.acao === 'tracos.listar' ? [] : body.acao === 'tracos.salvarVersao' ? { id: body.dados.id, versao: 1, revisao: 1, documento: { ...body.dados, codigo: 'TR-0001', versao: 1, revisao: 1 } } : [];
    await r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, dados, servidorEm: new Date().toISOString() }) });
  });
});

test('casca responsiva e acesso ao editor', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('h1')).toContainText('O que precisa');
  await page.screenshot({ path: `tests/e2e/__screenshots__/inicio-${testInfo.project.name}.png`, fullPage: true });
  await page.locator('.ct-page-heading button').click();
  await expect(page.locator('h1')).toContainText('Novo traço');
  await page.screenshot({ path: `tests/e2e/__screenshots__/editor-${testInfo.project.name}.png`, fullPage: true });
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true);
});

test('salvar com confirmação e reabrir rascunho', async ({ page }) => {
  await page.goto('./');
  await page.locator('.ct-page-heading button').click();
  await page.locator('.ct-stepper button').nth(1).click();
  const materiais = [
    { categoria: 'cimento', nome: 'Cimento', rho: '3,12', massa: '350' },
    { categoria: 'areia', nome: 'Areia 1', rho: '2,60', massa: '400' },
    { categoria: 'areia', nome: 'Areia 2', rho: '2,50', massa: '100' },
    { categoria: 'agua', nome: 'Água', rho: '1', massa: '175' },
    { categoria: 'aditivo', nome: 'Aditivo 1', rho: '1,10', massa: '3' },
    { categoria: 'aditivo', nome: 'Aditivo 2', rho: '1,20', massa: '4' }
  ];
  for (const [index, m] of materiais.entries()) {
    await page.getByRole('button', { name: /Material/ }).first().click();
    const card = page.locator('.ct-material').nth(index);
    await card.locator('select').selectOption(m.categoria);
    await card.locator('input[id^="nome-"]').fill(m.nome);
    await card.locator('input[id^="rho-"]').fill(m.rho);
  }
  await page.locator('.ct-stepper button').nth(2).click();
  for (const [index, m] of materiais.entries()) await page.locator('.ct-table tbody tr').nth(index).locator('input').fill(m.massa);
  await expect(page.locator('.ct-result-panel')).toContainText('0,500');
  if (page.viewportSize()!.width < 600) {
    await page.locator('.ct-editor-actions').getByRole('button', { name: 'Avançar' }).click();
    await page.locator('.ct-editor-actions').getByRole('button', { name: 'Avançar' }).click();
  }
  await page.getByRole('button', { name: 'Salvar traço' }).last().click();
  await expect(page.getByRole('status').first()).toContainText('Salvo no servidor');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.locator('.ct-material')).toHaveCount(0);
  await page.locator('.ct-stepper button').nth(1).click();
  await expect(page.locator('.ct-material')).toHaveCount(6);
});

test('axe na tela inicial', async ({ page }) => {
  await page.goto('./');
  const a = await new AxeBuilder({ page }).analyze();
  expect(a.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

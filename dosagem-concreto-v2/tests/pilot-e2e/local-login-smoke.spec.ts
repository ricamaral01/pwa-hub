import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function assertAccessible(page: import('@playwright/test').Page) {
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
}

test('piloto: login local, troca da senha inicial e saída', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const email = `smoke-${testInfo.project.name}@example.test`;
  await page.goto('/auth/login/');
  await assertAccessible(page);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('Hml-Test-2026!');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(page.locator('#password')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar senha' }).click();
  await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Entrar com conta local' }).click();
  await expect(page).toHaveURL(/\/auth\/trocar-senha\//);
  await assertAccessible(page);
  await page.locator('#old').fill('Hml-Test-2026!');
  await page.locator('#new').fill('Hml-Smoke-2026!');
  await page.getByRole('button', { name: 'Mostrar senhas' }).click();
  await expect(page.locator('#old')).toHaveAttribute('type', 'text');
  await expect(page.locator('#new')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar senhas' }).click();
  await page.getByRole('button', { name: 'Trocar senha' }).click();
  await expect(page.getByRole('heading', { name: /O que precisa de voc/ })).toBeVisible();
  await expect(page.locator('.ct-pilot-banner')).toContainText('PILOTO — o sistema oficial continua sendo o legado');
  await assertAccessible(page);
  await page.goto('/#/dosagem41');
  await expect(page.locator('.ct-recipe41-letter')).toContainText('PILOTO — NÃO LIBERADO PARA PRODUÇÃO');
  await assertAccessible(page);
  await page.getByRole('button', { name: 'Sair' }).first().click();
  await expect(page).toHaveURL(/\/auth\/login\//);
  const response = await page.request.get('/api/v1/auth/sessao');
  expect(response.status()).toBe(401);
});

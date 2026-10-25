import { test, expect } from '@playwright/test';

test('piloto: login e sessão persistem após recarregar', async ({ page }) => {
  await page.goto('/auth/login/');
  await page.locator('#email').fill('hml@example.test');
  await page.locator('#password').fill(process.env.HML_TEST_PASSWORD || 'Hml-Test-2026!');
  await page.getByRole('button', { name: 'Entrar com conta local' }).click();
  await expect(page.getByRole('heading', { name: /O que precisa de voc/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /O que precisa de voc/ })).toBeVisible();
  const session = await page.request.get('/api/v1/auth/sessao');
  expect(session.status()).toBe(200);
  expect((await session.json()).email).toBe('hml@example.test');
  await page.goto('/#/dosagem41');
  await expect(page.locator('.ct-recipe41-letter')).toBeVisible();
});

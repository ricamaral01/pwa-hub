import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function accessible(page: import('@playwright/test').Page) {
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(issue => issue.impact === 'serious' || issue.impact === 'critical')).toEqual([]);
}

test('R1-01: login local, troca de senha, saída e ponte Hub com ticket e PKCE', async ({ page }, testInfo) => {
  const localEmail = `r1-local-${testInfo.project.name}@example.test`;
  await page.goto('/auth/login/');
  await accessible(page);
  await page.locator('#email').fill(localEmail);
  await page.locator('#password').fill('Hml-Test-2026!');
  await page.getByRole('button', { name: 'Entrar com conta local' }).click();
  await expect(page).toHaveURL(/\/auth\/trocar-senha\//);
  await accessible(page);
  await page.locator('#old').fill('Hml-Test-2026!');
  await page.locator('#new').fill('Hml-R1-2026!');
  await page.getByRole('button', { name: 'Trocar senha' }).click();
  await expect(page.getByRole('heading', { name: /O que precisa de voc/ })).toBeVisible();
  await accessible(page);
  let session = await page.request.get('/api/v1/auth/sessao');
  expect(session.status()).toBe(200);
  expect((await session.json()).email).toBe(localEmail);
  await page.getByRole('button', { name: 'Sair' }).first().click();
  await expect(page).toHaveURL(/\/auth\/login\//);
  expect((await page.request.get('/api/v1/auth/sessao')).status()).toBe(401);

  const appOrigin = new URL(page.url()).origin;
  let bridgeUsed = false;
  await page.route('https://usina.concretrack.com.br/auth/ponte-dosagem.html?**', async route => {
    bridgeUsed = true;
    const state = new URL(route.request().url()).searchParams.get('estado');
    expect(state).toMatch(/^[A-Za-z0-9_-]{32,128}$/);
    const ticketResponse = await page.request.post(`${appOrigin}/api/v1/auth/hub/ticket`, {
      headers: { Origin: 'https://usina.concretrack.com.br', Authorization: 'Bearer hml-hub-token' },
      data: { estado: state },
    });
    expect(ticketResponse.status()).toBe(200);
    const { ticket } = await ticketResponse.json() as { ticket: string };
    const callback = `${appOrigin}/auth/retorno/?ticket=${encodeURIComponent(ticket)}&estado=${encodeURIComponent(state!)}`;
    await route.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><html lang="pt-BR"><title>Hub simulado</title><body><script>location.replace(${JSON.stringify(callback)})</script></body></html>` });
  });
  await page.getByRole('button', { name: 'Entrar com o Hub' }).click();
  await expect(page.getByRole('heading', { name: /O que precisa de voc/ })).toBeVisible({ timeout: 30_000 });
  expect(bridgeUsed).toBe(true);
  session = await page.request.get('/api/v1/auth/sessao');
  expect(session.status()).toBe(200);
  expect((await session.json()).email).toBe('r1-hub@example.test');
  await accessible(page);
});

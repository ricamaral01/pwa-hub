import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const password = readFileSync(process.argv[2], 'utf8').trimEnd();
if (!password) throw Error('Password file is empty');
const origin = process.env.DOSAGEM_TEST_ORIGIN || 'https://dosagem.concretrack.com.br';
const email = process.env.DOSAGEM_TEST_EMAIL || 'ricardo.rda@gmail.com';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ serviceWorkers: 'block', ignoreHTTPSErrors: origin.includes('127.0.0.1') });
  const page = await context.newPage();
  await page.goto(`${origin}/auth/login/`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  const loginResponse = page.waitForResponse(response => response.url().endsWith('/api/v1/auth/local/login'));
  await page.getByRole('button', { name: 'Entrar com conta local' }).click();
  const login = await loginResponse;
  if (login.status() !== 200) throw Error(`Login HTTP ${login.status()}`);
  const cookies = await context.cookies(origin);
  if (!cookies.some(cookie => cookie.name === 'ct_dosagem_sessao' && cookie.secure)) throw Error('Session cookie without Secure');
  await page.getByRole('heading', { name: /O que precisa de voc/ }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: /O que precisa de voc/ }).waitFor();
  const session = await page.request.get(`${origin}/api/v1/auth/sessao`);
  if (session.status() !== 200) throw Error(`Session after reload HTTP ${session.status()}`);
  const user = await session.json();
  if (user.email !== email || user.papel !== 'admin') throw Error('Admin session not confirmed');
  console.log('PUBLIC_LOGIN_RELOAD_OK');

  const examples = [
    { name: 'Exemplo Principal (P1b)', method: 'principal_abrams', mode: 'complete', addition: null },
    { name: 'Exemplo Metacaulim (P5)', method: 'principal_abrams', mode: 'complete', addition: '8' },
    { name: 'Exemplo Alternativo (A1)', method: 'alternativo_concrefer', mode: 'spreadsheet', addition: null },
  ];
  for (const example of examples) {
    await page.goto(`${origin}/#/tracos`);
    await page.reload();
    const card = page.locator('.ct-card').filter({ hasText: example.name }).first();
    if (!await card.count()) {
      await page.goto(`${origin}/#/dosagem41`);
      await page.locator('#r41-name').fill(example.name);
      await page.locator('#r41-method').selectOption(example.method);
      await page.locator('#r41-mode').selectOption(example.mode);
      if (example.addition) await page.locator('#r41-addition').fill(example.addition);
      await page.locator('.ct-recipe41-letter').getByText(example.name).waitFor();
      const response = page.waitForResponse(r => r.url().endsWith('/api/v1/rpc') && r.request().postDataJSON()?.acao === 'tracos.salvarVersao');
      await page.getByRole('button', { name: 'Salvar no servidor' }).click();
      const saved = await (await response).json();
      if (!saved.ok || saved.dados?.documento?.nome !== example.name) throw Error(`Save failed: ${example.name}`);
      await page.goto(`${origin}/#/tracos`);
      await page.reload();
    }
    await card.getByRole('button', { name: 'Abrir' }).click();
    await page.getByRole('heading', { name: example.name }).waitFor();
    await page.locator('.ct-stepper').getByRole('button', { name: /Carta/ }).click();
    await page.getByRole('heading', { name: 'Carta de traço' }).waitFor();
    console.log(`PUBLIC_EXAMPLE_OK ${example.name}`);
  }
} finally {
  await browser.close();
}

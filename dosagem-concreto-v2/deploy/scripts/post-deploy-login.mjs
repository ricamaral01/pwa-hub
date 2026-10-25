import { chromium } from '@playwright/test';
import { createInterface } from 'node:readline';

const lines = createInterface({ input: process.stdin, terminal: false });
const credentials = [];
for await (const line of lines) {
  credentials.push(line);
  if (credentials.length === 2) break;
}
lines.close();
process.stdin.pause();
const [email, password] = credentials;
if (!email || !password) throw new Error('Credentials missing from terminal input');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:18443/', serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto('/auth/login/');
  await page.getByRole('status').filter({ hasText: 'PILOTO' }).waitFor({ state: 'visible', timeout: 10000 });
  const banner = true;
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Entrar com conta local' }).click();
  await page.waitForURL(/\/auth\/trocar-senha\//, { timeout: 15000 });
  const session = await page.request.get('/api/v1/auth/sessao');
  console.log(JSON.stringify({ banner, loginRedirect: 'troca-obrigatoria', sessionStatus: session.status() }));
  await page.evaluate(() => fetch('/api/v1/auth/sair', { method: 'POST', headers: { 'X-Requested-With': 'dosagem' } }));
} finally {
  await browser.close();
}

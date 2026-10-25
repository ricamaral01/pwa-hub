import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'https://dosagem.concretrack.com.br';
const capture = resolve(import.meta.dirname, '../../../docs/dosagem-v2/capturas/login-oficial-20261022.png');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ serviceWorkers: 'block' });
  const response = await page.goto(`${origin}/auth/login/`);
  if (response?.status() !== 200) throw new Error(`Login page HTTP ${response?.status()}`);
  await page.locator('#email').waitFor({ state: 'visible' });
  await page.locator('#password').waitFor({ state: 'visible' });
  const health = await page.request.get(`${origin}/api/v1/saude`);
  const status = await health.json();
  if (health.status() !== 200 || !status.ok || status.banco !== 'ok' || status.piloto === true) {
    throw new Error(`Official health check failed: HTTP ${health.status()}`);
  }
  await page.waitForTimeout(1000);
  if (await page.getByRole('status').filter({ hasText: 'PILOTO' }).count()) {
    throw new Error('Pilot banner is visible on the official login page');
  }
  await mkdir(resolve(capture, '..'), { recursive: true });
  await page.screenshot({ path: capture, fullPage: true });
  console.log(`PUBLIC_OFFICIAL_LOGIN_OK health=${health.status()} capture=${capture}`);
} finally {
  await browser.close();
}

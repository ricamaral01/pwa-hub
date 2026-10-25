import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const session = JSON.parse(readFileSync('../.codex-tmp-dosagem-native/browser-session.json', 'utf8'));
const out = '../docs/dosagem-v2/capturas/nativo-unificado-20261022';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addCookies([{ name: 'mapa_unificado_session', value: session.cookie,
  domain: 'concrefer.concretrack.com.br', path: '/unificado/', secure: true, httpOnly: true, sameSite: 'Lax' }]);
await context.addInitScript(user => {
  localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify(user));
  localStorage.setItem('unificado_modulo', 'laboratorio');
}, session.user);
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
const base = 'https://concrefer.concretrack.com.br/unificado/';
const route = (path = '') => base + '?view=' + encodeURIComponent('laboratorio/dosagem/' + path);
try {
  await page.goto(route(), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByRole('heading', { name: /O que precisa de você hoje/i }).waitFor({ timeout: 30000 });
  console.log('Overview heading: visible');
  console.log('Active iframe count:', await page.locator('#module-host iframe.is-active').count());
  const menuCount = await page.locator('#sidebar-model-a a[href*="laboratorio%2Fdosagem"]').count();
  console.log('Dosagem menu links:', menuCount);
  if (menuCount !== 14) throw new Error(`Expected 14 native menu links, got ${menuCount}`);
  await page.screenshot({ path: out + '/visao-geral.png', fullPage: true });
  const sessionResponse = await context.request.get('https://concrefer.concretrack.com.br/unificado/laboratorio/dosagem/api/v1/auth/sessao');
  console.log('Native session HTTP:', sessionResponse.status());
  console.log('Native role:', (await sessionResponse.json()).papel);
  const requestId = crypto.randomUUID();
  const usersResponse = await context.request.post('https://concrefer.concretrack.com.br/unificado/laboratorio/dosagem/api/v1/rpc', {
    headers: { 'X-Requested-With': 'dosagem', 'Idempotency-Key': requestId,
      'Origin': 'https://concrefer.concretrack.com.br' },
    data: { acao: 'usuarios.listar', requestId, dados: {} },
  });
  console.log('Admin users RPC HTTP:', usersResponse.status());
  if (usersResponse.status() !== 200) throw new Error('Admin RPC failed');
  await page.getByRole('link', { name: 'Abrir módulo de empacotamento' }).click();
  await page.getByRole('heading', { name: 'Dosagem por empacotamento' }).first().waitFor({ timeout: 10000 });
  await page.locator('#sidebar-model-a a.is-active').filter({ hasText: 'Empacotamento' }).waitFor({ timeout: 5000 });
  console.log('In-app navigation active:', await page.locator('#sidebar-model-a a.is-active').allTextContents());
  await page.goto(route('#/dosagem/empacotamento'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByRole('heading', { name: 'Dosagem por empacotamento' }).first().waitFor({ timeout: 30000 });
  console.log('Empacotamento: visible');
  await page.screenshot({ path: out + '/empacotamento.png', fullPage: true });
  await page.emulateMedia({ media: 'print' });
  const printState = await page.evaluate(() => ({
    sidebar: getComputedStyle(document.querySelector('#sidebar-model-a')).display,
    overflow: getComputedStyle(document.querySelector('#module-host')).overflow,
    letter: getComputedStyle(document.querySelector('#dosagem-native-host').shadowRoot.querySelector('.ct-recipe41-letter')).visibility,
  }));
  console.log('Print styles:', JSON.stringify(printState));
  if (printState.sidebar !== 'none' || printState.overflow !== 'visible' || printState.letter !== 'visible')
    throw new Error('Native print styles invalid');
  await page.emulateMedia({ media: 'screen' });
  await page.goto(route('#/dosagem/volume'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByRole('heading', { name: 'Dosagem por volume' }).first().waitFor({ timeout: 30000 });
  console.log('Volume: visible');
  await page.screenshot({ path: out + '/volume.png', fullPage: true });
  await page.locator('#sidebar-model-a').getByRole('link', { name: 'Traços' }).click();
  await page.getByRole('heading', { name: 'Traços', exact: true }).waitFor({ timeout: 10000 });
  console.log('Sidebar Traços navigation: visible');
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.addCookies([{ name: 'mapa_unificado_session', value: session.cookie,
    domain: 'concrefer.concretrack.com.br', path: '/unificado/', secure: true, httpOnly: true, sameSite: 'Lax' }]);
  await mobile.addInitScript(user => {
    localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify(user));
    localStorage.setItem('unificado_modulo', 'laboratorio');
  }, session.user);
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(route('#/dosagem/volume'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mobilePage.getByRole('heading', { name: 'Dosagem por volume' }).first().waitFor({ timeout: 15000 });
  await mobilePage.screenshot({ path: out + '/volume-celular.png', fullPage: true });
  console.log('Mobile Volume: visible');
  await mobile.close();
  console.log('Page errors:', errors.length ? errors.join(' | ').slice(0, 800) : 'none');
} catch (error) {
  await page.screenshot({ path: out + '/falha-inicial.png', fullPage: true });
  console.log('URL:', page.url());
  console.log('Host classes:', await page.locator('#module-host').getAttribute('class'));
  console.log('Body:', (await page.locator('body').innerText()).slice(0, 800));
  console.log('Page errors:', errors.join(' | ').slice(0, 800));
  throw error;
} finally {
  await browser.close();
}

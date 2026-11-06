const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { chromium } = require('../../dosagem-concreto-v2/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem('pwa_mapa_auth_session_v1',
    JSON.stringify({id:'user-ricardo', name:'Ricardo', role:'GERENCIA'})));
  let oldDocument = true;
  await context.route('https://concrefer.concretrack.com.br/unificado/', route => {
    if (oldDocument) {
      oldDocument = false;
      return route.fulfill({status:200, contentType:'text/html',
        body:fs.readFileSync(path.resolve('deploy/unificado-ged-release-109/index.html'))});
    }
    return route.continue();
  });
  await context.route('**/unificado/shell/shell.js?v=20261106-ged-access-2', route => route.fulfill({
    status:200, contentType:'application/javascript',
    body:fs.readFileSync(path.resolve('deploy/unificado-ged-release-109/shell/shell.js'))
  }));
  await context.route('**/unificado/mapa/api/unified/screen-access/me', route => route.fulfill({
    status:200, contentType:'application/json', body:JSON.stringify({
      screens:['dashboard','liberacao'], preview_modules:true
    })
  }));
  const page = await context.newPage();
  const warnings = [];
  page.on('console', message => {if (message.type() === 'warning') warnings.push(message.text())});
  await page.goto('https://concrefer.concretrack.com.br/unificado/', {waitUntil:'domcontentloaded'});
  await page.locator('.nav-update-version').getByText('Versão 1.0.109').waitFor();
  await page.locator('.nav-update[data-state="available"]').waitFor({timeout:15000});
  await page.locator('.nav-update').click();
  await page.locator('.nav-update-version').getByText('Versão 1.0.110').waitFor({timeout:30000});
  await page.locator('.nav-update[data-state="current"]').waitFor({timeout:15000});
  assert.equal(await page.locator('.nav-update').textContent().then(s => s.includes('Nova versão')), false);
  console.log('Botão atualizou a tela 1.0.109 para 1.0.110.');
  if (warnings.length) console.log('Avisos:', warnings);
  await context.close();
  await browser.close();
})().catch(error => {console.error(error); process.exit(1)});

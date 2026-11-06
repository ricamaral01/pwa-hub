const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { chromium } = require('../../dosagem-concreto-v2/node_modules/playwright');

const base = 'https://concrefer.concretrack.com.br/unificado/';
const local = path.resolve('deploy/unificado-ged-release-109');

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  for (const id of ['user-ricardo', 'ilson', 'alex', 'marcelo']) {
    const context = await browser.newContext({serviceWorkers:'block'});
    await context.addInitScript(userId => localStorage.setItem('pwa_mapa_auth_session_v1',
      JSON.stringify({id:userId, name:userId, role:'GERENCIA'})), id);
    if (process.env.USE_LIVE !== '1') {
      for (const name of ['shell.js', 'router.js']) {
        await context.route(new RegExp(`/unificado/shell/${name.replace('.', '\.')}(?:\\?|$)`), route => route.fulfill({
          status:200, contentType:'application/javascript', body:fs.readFileSync(path.join(local, 'shell', name))
        }));
      }
    }
    if (process.env.USE_LIVE !== '1')
      await context.route('**/unificado/VERSION?*', route => route.fulfill({status:200, body:'1.0.109\n'}));
    await context.route('**/unificado/mapa/api/unified/screen-access/me', route => route.fulfill({
      status:200, contentType:'application/json', body:JSON.stringify({
        screens:['dashboard','liberacao'], preview_modules:false, ged_access:false
      })
    }));
    let bootstrapCalls = 0;
    await context.route('**/unificado/ged/api/auth/unified-session', route => {
      bootstrapCalls++;
      return route.fulfill({status:200, contentType:'application/json', body:'{"ok":true}'});
    });
    await context.route('**/unificado/ged/dashboard?embed=1', route => route.fulfill({
      status:200, contentType:'text/html', body:`<!doctype html><main><h1>GED Painel</h1></main><script>
        parent.postMessage({type:'unificado-ged-ready',path:'/unificado/ged/dashboard'},location.origin);
      </script>`
    }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '?view=ged/dashboard', {waitUntil:'domcontentloaded'});
    await page.frameLocator('iframe[src*="ged/dashboard"]').locator('h1').waitFor();
    await page.waitForFunction(() => document.querySelector('#module-host iframe.is-active'));
    assert.equal(await page.locator('.unificado-access-denied').isVisible(), false);
    assert.equal(await page.locator('.nav-update-version').first().textContent(), 'Versão 1.0.109');
    assert.equal(bootstrapCalls, 1);
    assert.deepEqual(errors, []);
    console.log(id + ': GED aberto, versão 1.0.109 no botão.');
    await context.close();
  }
  await browser.close();
})().catch(error => {console.error(error); process.exit(1)});

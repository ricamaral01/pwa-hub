const assert = require('node:assert/strict');
const { chromium } = require('../../dosagem-concreto-v2/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context = await browser.newContext({serviceWorkers:'block'});
  await context.route('http://localhost:13370/test-host', route => route.fulfill({
    status:200, contentType:'text/html', body:'<!doctype html><title>GED host</title><div id="app"></div>'
  }));
  let sessionCalls = 0;
  let authorizedDataCalls = 0;
  await context.route('**/unificado/ged/api/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/auth/unified-session')) {
      sessionCalls++;
      return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({
        token:'test-ged-token', user:{id:'ricardo', name:'Ricardo', role:'ADMIN_MASTER',
          company_id:'test-company', company_slug:'concrefer', permissions:[]}
      })});
    }
    if (route.request().headers().authorization === 'Bearer test-ged-token') authorizedDataCalls++;
    return route.fulfill({status:200, contentType:'application/json',
      body:url.pathname.endsWith('/stats') ? JSON.stringify({total:0}) : '[]'});
  });
  const page = await context.newPage();
  await page.goto('http://localhost:13370/test-host');
  const size = await page.evaluate(() => {
    let lo=0, hi=6*1024*1024;
    while (lo+1<hi) {
      const mid=(lo+hi)>>1;
      try {localStorage.setItem('ged-storage-probe','X'.repeat(mid));lo=mid}
      catch {hi=mid}
    }
    return lo;
  });
  assert.equal(await page.evaluate(() => {
    try {localStorage.setItem('ged_token','Y'.repeat(1000));return true}
    catch {return false}
  }), false);
  await page.evaluate(() => {
    const frame=document.createElement('iframe');
    frame.src='/unificado/ged/calibrations?embed=1';
    document.getElementById('app').append(frame);
  });
  await page.frameLocator('iframe').getByRole('heading', {name:'Certificados de calibração'}).waitFor({timeout:20000});
  assert.ok(sessionCalls >= 1);
  assert.ok(authorizedDataCalls >= 2);
  console.log(`GED abriu com armazenamento local cheio (${size} caracteres); ${authorizedDataCalls} chamadas com token em memória.`);
  await browser.close();
})().catch(error => {console.error(error);process.exit(1)});

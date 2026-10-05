"""Six authenticated browser sessions write concurrently to the isolated Mapa DB."""
from __future__ import annotations

import asyncio
import json
import subprocess
import time
from playwright.async_api import async_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DATE = "2099-02-15"


def credentials() -> dict[str, str]:
    raw = subprocess.check_output(
        ["ssh", "vps-staging", "cat", "/etc/mapa-unificado/auth-probe.env"],
        text=True, encoding="utf-8")
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


async def main() -> None:
    account = credentials()
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True, executable_path=CHROME)
        contexts = [await browser.new_context(viewport={"width": 1024, "height": 768},
                                              service_workers="block") for _ in range(6)]
        pages = [await context.new_page() for context in contexts]
        try:
            async def login(page):
                await page.goto(BASE + "/unificado/login.html")
                await page.locator('[name="username"]').fill(account["MAPA_TEST_USER"])
                await page.locator('[name="password"]').fill(account["MAPA_TEST_PASSWORD"])
                await page.locator('#unificado-login-form button[type="submit"]').click()
                await page.wait_for_url("**/unificado/index.html", timeout=20000)
                await page.goto(BASE + "/unificado/mapa/operacao/")
                await page.wait_for_function("state.authUser?.role === 'GERENCIA'", timeout=20000)
            await asyncio.gather(*(login(page) for page in pages))
            await pages[0].evaluate("""async day => {
              await fetch('/unificado/mapa/api/rest/v1/programacao_pcp?data_fabricacao=eq.'+day
                +'&forma=like.E2E-6-*',{method:'DELETE'});
            }""", DATE)

            async def write(index, page):
                started = time.perf_counter()
                result = await page.evaluate("""async ({day,index}) => {
                  const response=await fetch('/unificado/mapa/api/rest/v1/programacao_pcp',{
                    method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=representation'},
                    body:JSON.stringify({data_fabricacao:day,setor:'Setor '+((index%4)+1),
                      forma:'E2E-6-'+index,modelo:'TESTE',descricao_poste:'Sessao concorrente',
                      codigo_produto:'E2E6',quantidade:1,
                      data_hora:new Date().toISOString()})});
                  return {status:response.status,body:await response.json()};
                }""", {"day": DATE, "index": index})
                return {"session": index + 1, "status": result["status"],
                        "latency_ms": round((time.perf_counter() - started) * 1000),
                        "id": result["body"][0]["id"] if result["status"] < 300 else None}
            writes = await asyncio.gather(*(write(i, page) for i, page in enumerate(pages)))
            visibility = await asyncio.gather(*(page.evaluate("""async day => {
              const response=await fetch('/unificado/mapa/api/rest/v1/programacao_pcp?select=*'
                +'&data_fabricacao=eq.'+day+'&forma=like.E2E-6-*');
              return (await response.json()).length;
            }""", DATE) for page in pages))
            assert all(item["status"] < 300 for item in writes), writes
            assert visibility == [6] * 6, visibility
            print(json.dumps({"sessions": 6, "writes": writes,
                              "visible_rows_per_session": visibility,
                              "max_latency_ms": max(x["latency_ms"] for x in writes),
                              "errors": 0}, ensure_ascii=False))
        finally:
            if pages:
                await pages[0].evaluate("""async day => {
                  await fetch('/unificado/mapa/api/rest/v1/programacao_pcp?data_fabricacao=eq.'+day
                    +'&forma=like.E2E-6-*',{method:'DELETE'});
                }""", DATE)
            for context in contexts:
                await context.close()
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())

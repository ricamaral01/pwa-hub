"""Audita Indicadores S5 autenticado na casca da homologação."""
from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright

from check_layout_shell import AUDIT_JS, ROOT, SIZES, menu_state, active_frame
from check_f4_panel import authenticated_session, context_for

OUT = Path("docs/porting/suprimentos/capturas/f5")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    passwords = json.loads(Path("C:/Users/Admin/Downloads/suprimentos-homolog-logins-20261025.json").read_text(encoding="utf-8"))
    user, cookies = authenticated_session(passwords)
    results = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        for width,height in SIZES:
            for zoom in (100,125):
                ctx = context_for(browser,width,height,zoom,user,cookies)
                page=ctx.new_page()
                errors,missing,forbidden,not_found=[],[],[],[]
                page.on('console',lambda msg: errors.append(msg.text) if msg.type=='error' else None)
                page.on('pageerror',lambda err: errors.append(str(err)))
                page.on('response',lambda res: missing.append(res.url) if res.status==404 and any(x in res.url for x in ('.css','.js','.woff','.png','.webmanifest')) else None)
                page.on('response',lambda res: forbidden.append(res.url) if res.status==403 else None)
                page.on('response',lambda res: not_found.append(res.url) if res.status==404 else None)
                page.goto(ROOT+'/unificado/?view='+quote('suprimentos/analises/',safe=''),wait_until='domcontentloaded')
                active_frame(page)
                frame=page.frame_locator('#module-host iframe.is-active')
                try:
                    frame.locator('#sup-ana-form').wait_for(timeout=12000)
                except Exception:
                    print('F5_LOAD_DEBUG',frame.locator('body').inner_text()[:500],errors,missing,forbidden,not_found)
                    raise
                for menu in ('aberto','recolhido'):
                    menu_state(page,menu)
                    live=next((f for f in page.frames if '/unificado/suprimentos/analises/' in f.url),None)
                    shell=page.evaluate(AUDIT_JS)
                    inner=live.evaluate(AUDIT_JS) if live else None
                    stem=f'indicadores-{width}x{height}-z{zoom}-{menu}'
                    page.screenshot(path=str(OUT/(stem+'.png')))
                    results.append({'size':f'{width}x{height}','zoom':zoom,'menu':menu,
                        'shellHorizontal':shell['horizontal'],'frameHorizontal':inner['horizontal'] if inner else None,
                        'shellIssues':[e for e in shell['entries'] if not e['contained']],
                        'frameIssues':[e for e in inner['entries'] if not e['contained'] and not (e['element']=='div.table-scroll' and e['scroll'] and not e['outside'])] if inner else [],
                        'errors':list(errors),'missing':list(missing),'forbidden':list(forbidden),
                        'exportCsv':frame.get_by_text('Exportar CSV').count()>0,
                        'exportPdf':frame.get_by_text('Exportar PDF').count()>0})
                ctx.close()
        browser.close()
    (OUT/'diagnostico.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    failures=[r for r in results if r['shellHorizontal'] or r['frameHorizontal'] or r['shellIssues'] or r['frameIssues'] or r['errors'] or r['missing'] or not r['exportCsv'] or not r['exportPdf']]
    print(f'F5_LAYOUT {len(results)-len(failures)}/{len(results)}')
    if failures:
        print(json.dumps(failures[:3],ensure_ascii=False)[:4000])
        raise SystemExit(1)


if __name__=='__main__':
    main()

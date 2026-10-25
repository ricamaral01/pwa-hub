"""Exercise Office Viewer with a short-lived GED preview URL; print no URL or document text."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

ISSUE = r"""
const {Pool}=require('/app/node_modules/pg');
const {signature}=require('/app/src/controllers/previewController');
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:false}:false});
(async()=>{const {rows}=await pool.query("SELECT v.id,v.document_id,v.drive_file_id FROM versions v JOIN documents d ON d.id=v.document_id WHERE d.code='IT-CQC-03' AND v.id=d.current_version_id LIMIT 1");if(rows.length!==1)throw Error('FixtureUnavailable');const v=rows[0],exp=Math.floor(Date.now()/1000)+240,mac=signature(v.document_id,v.id,v.drive_file_id,exp);process.stdout.write(`https://concrefer.concretrack.com.br/unificado/ged/previews/${v.id}/${exp}/${mac}`)})().catch(e=>{process.exitCode=1}).finally(()=>pool.end());
"""


def main() -> None:
    code = sys.argv[1] if len(sys.argv) > 1 else 'IT-CQC-03'
    if code not in {'IT-CQC-03', 'FL-SGQ-01'}:
        raise ValueError('UnsupportedFixture')
    result = subprocess.run(
        ["ssh", "vps-staging", "docker", "exec", "-i", "ged_backend", "node"],
        input=ISSUE.replace('IT-CQC-03', code), text=True, capture_output=True, check=False, timeout=15,
    )
    if result.returncode or not result.stdout.startswith("https://concrefer.concretrack.com.br/unificado/ged/previews/"):
        raise RuntimeError("IssueFailed")
    viewer = "https://view.officeapps.live.com/op/embed.aspx?src=" + quote(result.stdout, safe="")
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=CHROME, headless=True)
        try:
            page = browser.new_page()
            response = page.goto(viewer, wait_until="domcontentloaded", timeout=30_000)
            page.wait_for_timeout(15_000)
            texts = []
            canvases = 0
            for frame in page.frames:
                try:
                    texts.append(frame.locator("body").inner_text(timeout=2_000).lower())
                    canvases += frame.locator("canvas").count()
                except Exception:
                    continue
            body = "\n".join(texts)
            error_terms = (
                "não conseguimos abrir", "ocorreu um erro", "we can't open", "something went wrong",
                "sorry", "couldn't open", "cannot open", "file not found", "não é possível", "error", "erro",
            )
            matches = [term for term in error_terms if term in body]
            failed = bool(matches)
            snapshot = Path(f'test-results/porting/office-viewer-{code}.png')
            snapshot.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(snapshot), full_page=False)
            print(f"office-browser-code={code}; http={response.status if response else 0}; visible-error={failed}; error-markers={len(matches)}; body-chars={len(body)}; frames={len(page.frames)}; canvases={canvases}")
            if not response or response.status != 200 or failed:
                raise RuntimeError("ViewerFailed")
        finally:
            browser.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"office-browser-probe-failed; type={type(error).__name__}")
        raise SystemExit(1) from None

"""Gera PDF A4 do mesmo HTML e preenche as páginas do sumário."""
from __future__ import annotations

import re
from pathlib import Path

import pymupdf
from playwright.sync_api import sync_playwright

BASE = Path(__file__).resolve().parent
HTML = BASE / "manual-suprimentos.html"
PDF = BASE / "manual-suprimentos.pdf"
HEADINGS = {
    "resumo": "Resumo executivo", "fluxo": "Fluxograma de processamento",
    "raci": "Matriz de responsabilidades", "telas": "Telas web e PWA",
    "instalacao": "Instalar e usar o PWA", "situacoes": "Situações da solicitação",
    "parametros": "Parâmetros e alçadas", "futuro": "Próximas fases",
    "glossario": "Glossário",
}


def render():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        errors = []
        page.on("requestfailed", lambda request: errors.append(request.url))
        page.goto(HTML.as_uri(), wait_until="load", timeout=60000)
        page.evaluate("""async () => {
          for (const img of document.images) img.loading='eager';
          await Promise.all([...document.images].map(img => img.decode().catch(()=>null)));
        }""")
        broken = page.evaluate("[...document.images].filter(img=>!img.complete||!img.naturalWidth).map(img=>img.src)")
        if broken or errors:
            raise RuntimeError(f"Recursos ausentes: {broken[:5]} {errors[:5]}")
        page.emulate_media(media="print")
        page.pdf(path=str(PDF), format="A4", print_background=True,
                 prefer_css_page_size=True, display_header_footer=True,
                 header_template='<div style="font:8px Arial;color:#536778;width:100%;margin:0 13mm;border-bottom:1px solid #d6e0e7;padding-bottom:3px">Suprimentos · Manual das telas</div>',
                 footer_template='<div style="font:8px Arial;color:#536778;width:100%;margin:0 13mm;border-top:1px solid #d6e0e7;padding-top:3px;display:flex;justify-content:space-between"><span>Campinas · Homologação v1.0.61 · 25/10/2026</span><span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>')
        browser.close()
    doc = pymupdf.open(PDF)
    return doc


def main():
    doc = render()
    page_map = {}
    for key, heading in HEADINGS.items():
        pages = [index + 1 for index, page in enumerate(doc) if heading.lower() in page.get_text().lower()]
        if not pages:
            raise RuntimeError(f"Seção ausente do PDF: {heading}")
        page_map[key] = pages[-1]
    doc.close()
    source = HTML.read_text(encoding="utf-8")
    for key, number in page_map.items():
        source, count = re.subn(r'(data-anchor="' + re.escape(key) + r'">)[^<]*(</span>)',
                                lambda match: match.group(1) + str(number) + match.group(2), source)
        if count != 2:  # índice lateral e sumário impresso
            raise RuntimeError(f"Âncora do sumário: {key} {count}")
    HTML.write_text(source, encoding="utf-8")
    doc = render()
    print("PDF_OK paginas=", len(doc), "sumario=", page_map)
    doc.close()


if __name__ == "__main__":
    main()

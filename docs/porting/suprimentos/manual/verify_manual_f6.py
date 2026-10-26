"""Renderiza todas as páginas e confere capturas, marcadores e limites do PDF."""
from __future__ import annotations

import json
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw
from bs4 import BeautifulSoup

BASE = Path(__file__).resolve().parent
OUT = BASE / "revisao" / "f6-paginas"
OUT.mkdir(parents=True, exist_ok=True)
captures = json.loads((BASE / "capturas.json").read_text(encoding="utf-8"))
soup = BeautifulSoup((BASE / "manual-suprimentos.html").read_text(encoding="utf-8"), "html.parser")
missing = []
for shot in captures:
    name = shot["arquivo"]
    if shot["erros"] or any(not marker["encontrado"] for marker in shot["marcadores"]):
        missing.append((shot["tela"], shot["tamanho"], "erro/marca não localizada"))
    if not (BASE / "img" / name).is_file() or not (BASE / "img" / name.replace(".png", "-anotada.png")).is_file():
        missing.append((shot["tela"], shot["tamanho"], "imagem ausente"))
    section = soup.find(id=shot["tela"])
    if section is None:
        missing.append((shot["tela"], shot["tamanho"], "seção ausente"))
    elif shot["tamanho"] == ("pc" if any(x["tamanho"] == "pc" and x["tela"] == shot["tela"] for x in captures) else "celular"):
        labels = [x.get_text(strip=True) for x in section.select(".marker-table td:nth-child(2)")]
        for marker in shot["marcadores"]:
            if marker["nome"] not in labels:
                missing.append((shot["tela"], shot["tamanho"], "marcador sem explicação: " + marker["nome"]))
if missing:
    raise RuntimeError(str(missing[:15]))
pdf = pymupdf.open(BASE / "manual-suprimentos.pdf")
if len(pdf) < 40 or len(pdf) > 100:
    raise RuntimeError(f"Paginação inesperada: {len(pdf)}")
bad_pages = []
thumbs = []
for index, page in enumerate(pdf):
    number = index + 1
    image = page.get_pixmap(matrix=pymupdf.Matrix(1, 1), alpha=False)
    output = OUT / f"pagina-{number:03d}.png"
    image.save(output)
    if len(page.get_text().strip()) < 90:
        bad_pages.append((number, "página quase vazia"))
    for block in page.get_text("blocks"):
        x0, y0, x1, y1 = block[:4]
        if x0 < -1 or y0 < -1 or x1 > page.rect.width + 1 or y1 > page.rect.height + 1:
            bad_pages.append((number, "texto além da página"))
            break
    thumb = Image.open(output).convert("RGB")
    thumb.thumbnail((288, 410))
    thumbs.append(thumb.copy())
for start in range(0, len(thumbs), 8):
    sheet = Image.new("RGB", (4 * 312, 2 * 440), "#e8edf2")
    draw = ImageDraw.Draw(sheet)
    for slot, thumb in enumerate(thumbs[start:start+8]):
        x, y = (slot % 4) * 312 + 12, (slot // 4) * 440 + 12
        sheet.paste(thumb, (x, y))
        draw.text((x, y + 412), f"Pág. {start + slot + 1}", fill="#102541")
    sheet.save(BASE / "revisao" / f"f6-contato-{start//8 + 1:02d}.png", optimize=True)
if bad_pages:
    raise RuntimeError(str(bad_pages[:15]))
print("MANUAL_F6_QA_OK paginas=", len(pdf), "capturas=", len(captures), "marcadores=",
      sum(len(x["marcadores"]) for x in captures), "contatos=", (len(thumbs)+7)//8)

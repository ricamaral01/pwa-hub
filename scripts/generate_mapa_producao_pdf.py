"""Gera o mapeamento funcional de produção a partir do Markdown versionado."""

from html import escape
from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "mapa-concretagem-producao-2026-10-01.md"
OUTPUT = ROOT / "mapa-concretagem" / "MAPEAMENTO_FUNCIONAL_PRODUCAO_2026-10-01.pdf"

FONT_DIR = Path("C:/Windows/Fonts")
if (FONT_DIR / "arial.ttf").exists():
    pdfmetrics.registerFont(TTFont("MapaArial", str(FONT_DIR / "arial.ttf")))
    pdfmetrics.registerFont(TTFont("MapaArialBold", str(FONT_DIR / "arialbd.ttf")))
else:
    FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
    pdfmetrics.registerFont(TTFont("MapaArial", str(FONT_DIR / "DejaVuSans.ttf")))
    pdfmetrics.registerFont(TTFont("MapaArialBold", str(FONT_DIR / "DejaVuSans-Bold.ttf")))
pdfmetrics.registerFontFamily("MapaArial", normal="MapaArial", bold="MapaArialBold")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="MapaTitle", fontName="MapaArialBold", fontSize=17, leading=22, textColor=colors.HexColor("#17365c"), spaceAfter=11))
styles.add(ParagraphStyle(name="MapaSection", fontName="MapaArialBold", fontSize=11, leading=15, textColor=colors.HexColor("#17365c"), spaceBefore=13, spaceAfter=7))
styles.add(ParagraphStyle(name="MapaBody", fontName="MapaArial", fontSize=8.6, leading=12.5, spaceAfter=6))
styles.add(ParagraphStyle(name="MapaCell", fontName="MapaArial", fontSize=7.6, leading=10))
styles.add(ParagraphStyle(name="MapaHead", fontName="MapaArialBold", fontSize=7.8, leading=10, textColor=colors.white))
styles.add(ParagraphStyle(name="MapaFooter", fontName="MapaArial", fontSize=7, leading=9, alignment=TA_CENTER, textColor=colors.HexColor("#64748b")))


def inline(text: str) -> str:
    value = escape(text)
    value = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"`(.+?)`", r'<font color="#1d4ed8">\1</font>', value)
    return value


def add_table(lines, story):
    rows = [[cell.strip() for cell in line.strip().strip("|").split("|")] for line in lines]
    rows = [row for row in rows if not all(re.fullmatch(r":?-+:?", cell or "") for cell in row)]
    if not rows:
        return
    widths = [142, 335, 305] if len(rows[0]) == 3 and rows[0][0] == "Seção ou link" else [142, 260, 380]
    data = []
    for index, row in enumerate(rows):
        style = styles["MapaHead"] if index == 0 else styles["MapaCell"]
        data.append([Paragraph(inline(cell), style) for cell in row])
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17365c")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f6fb")]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d7e0ea")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.extend([table, Spacer(1, 8)])


def build_story():
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    story = []
    index = 0
    while index < len(lines):
        line = lines[index].strip()
        if not line:
            index += 1
            continue
        if line.startswith("| "):
            table_lines = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                table_lines.append(lines[index])
                index += 1
            add_table(table_lines, story)
            continue
        if line.startswith("# "):
            story.append(Paragraph(inline(line[2:]), styles["MapaTitle"]))
        elif line.startswith("## "):
            story.append(Paragraph(inline(line[3:]), styles["MapaSection"]))
        elif line.startswith("- "):
            story.append(Paragraph("&#8226; " + inline(line[2:]), styles["MapaBody"]))
        else:
            story.append(Paragraph(inline(line), styles["MapaBody"]))
        index += 1
    return story


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#d7e0ea"))
    canvas.line(30, 27, landscape(A4)[0] - 30, 27)
    canvas.setFont("MapaArial", 7)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.drawString(31, 16, "Mapa de Concretagem · Produção · v5.29 · 01/10/2026")
    canvas.drawRightString(landscape(A4)[0] - 31, 16, f"Página {doc.page}")
    canvas.restoreState()


def main():
    document = SimpleDocTemplate(str(OUTPUT), pagesize=landscape(A4), leftMargin=30, rightMargin=30, topMargin=28, bottomMargin=39,
                                 title="Mapa de Concretagem — Mapeamento funcional da produção", author="ConcreTrack")
    document.build(build_story(), onFirstPage=footer, onLaterPages=footer)
    print(OUTPUT)


if __name__ == "__main__":
    main()

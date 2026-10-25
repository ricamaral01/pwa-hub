"""Paginated electronic RNC with all information from FL-SGQ-07.

The reference defines the content; long text and repeated entries flow onto
later pages instead of being clipped. All values come from the saved record.
"""
from __future__ import annotations

from datetime import date, datetime
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, LongTable, Paragraph, SimpleDocTemplate, Spacer, TableStyle


PAGE_W, PAGE_H = A4
MARGIN = 42
CONTENT_W = PAGE_W - MARGIN * 2
INK = colors.HexColor("#203247")
MUTED = colors.HexColor("#586C7D")
TEAL = colors.HexColor("#087F7A")
SURFACE = colors.HexColor("#F3F6F8")
LINE = colors.HexColor("#D9E2E7")


def _fonts() -> tuple[str, str]:
    regular = next((p for p in (
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"), Path("C:/Windows/Fonts/arial.ttf"),
    ) if p.is_file()), None)
    bold = next((p for p in (
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"), Path("C:/Windows/Fonts/arialbd.ttf"),
    ) if p.is_file()), None)
    if not regular or not bold:
        return "Helvetica", "Helvetica-Bold"
    if "RNCModern" not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont("RNCModern", str(regular)))
        pdfmetrics.registerFont(TTFont("RNCModernBold", str(bold)))
    return "RNCModern", "RNCModernBold"


def _value(value) -> str:
    return str(value).strip() if value is not None and str(value).strip() else "—"


def _date(value) -> str:
    return value.strftime("%d/%m/%Y") if isinstance(value, (date, datetime)) else _value(value)


def _yes_no(value) -> str:
    return "Sim" if value is True else "Não" if value is False else "Não informado"


def render_rnc_form(nc: dict, *, catalogs: dict[str, str] | None = None,
                    containments: list[dict] | None = None,
                    causes: list[dict] | None = None,
                    actions: list[dict] | None = None,
                    followups: list[dict] | None = None,
                    efficacies: list[dict] | None = None,
                    closures: list[dict] | None = None,
                    successor_number: str | None = None) -> bytes:
    catalogs = catalogs or {}
    containments = containments or []
    causes = causes or []
    actions = actions or []
    followups = followups or []
    efficacies = efficacies or []
    closures = closures or []
    regular, bold = _fonts()
    styles = {
        "eyebrow": ParagraphStyle("eyebrow", fontName=bold, fontSize=7.5, leading=11,
                                  textColor=TEAL, spaceAfter=5),
        "hero": ParagraphStyle("hero", fontName=bold, fontSize=17.5, leading=22,
                               textColor=INK, spaceAfter=5),
        "subtitle": ParagraphStyle("subtitle", fontName=regular, fontSize=9, leading=13,
                                   textColor=MUTED),
        "section": ParagraphStyle("section", fontName=bold, fontSize=10, leading=14,
                                  textColor=INK, spaceBefore=14, spaceAfter=6),
        "label": ParagraphStyle("label", fontName=bold, fontSize=7.2, leading=10,
                                textColor=MUTED, spaceAfter=4, keepWithNext=True),
        "body": ParagraphStyle("body", fontName=regular, fontSize=8.7, leading=12.8,
                               textColor=INK),
        "small": ParagraphStyle("small", fontName=regular, fontSize=7.6, leading=11,
                                textColor=INK),
        "th": ParagraphStyle("th", fontName=bold, fontSize=7.5, leading=10,
                             textColor=colors.white),
    }

    def p(value, style="body"):
        safe = escape(_value(value)).replace("\n", "<br/>")
        return Paragraph(safe, styles[style])

    def section(number, name):
        return Paragraph(f'<font color="#087F7A">{number:02d}</font>  {escape(name.upper())}',
                         styles["section"])

    def facts(items):
        """A compact two-column set of labeled values."""
        cells = [[p(label, "label"), p(value)] for label, value in items]
        if len(cells) % 2:
            cells.append([p("", "label"), p("", "body")])
        table = LongTable([cells[i:i + 2] for i in range(0, len(cells), 2)],
                          colWidths=[CONTENT_W / 2] * 2, hAlign="LEFT",
                          splitByRow=1, splitInRow=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
            ("BOX", (0, 0), (-1, -1), .5, LINE),
            ("INNERGRID", (0, 0), (-1, -1), .4, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        return table

    def narrative(label, value):
        return [p(label, "label"), p(value), Spacer(1, 6)]

    def page_header(canvas, doc):
        canvas.saveState()
        logo = Path(__file__).parent / "assets" / "logo-concrefer.png"
        if logo.is_file():
            canvas.drawImage(str(logo), MARGIN, PAGE_H - 51, width=122, height=31,
                             preserveAspectRatio=True, anchor="c", mask="auto")
        else:
            canvas.setFillColor(INK)
            canvas.setFont(bold, 11)
            canvas.drawString(MARGIN, PAGE_H - 39, "CONCREFER")
        canvas.setFillColor(MUTED)
        canvas.setFont(bold, 7.5)
        canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 32, "FL-SGQ-07  ·  REV. 00")
        canvas.setFont(regular, 7)
        canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 44, "Emissão do modelo: 21/09/2007")
        canvas.setStrokeColor(LINE)
        canvas.line(MARGIN, PAGE_H - 62, PAGE_W - MARGIN, PAGE_H - 62)
        canvas.line(MARGIN, 44, PAGE_W - MARGIN, 44)
        canvas.setFont(regular, 7.2)
        canvas.drawString(MARGIN, 29, "RNC - Eletrônico  |  Qualidade")
        canvas.drawRightString(PAGE_W - MARGIN, 29, f"Página {doc.page}")
        canvas.restoreState()

    output = BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4, leftMargin=MARGIN,
                            rightMargin=MARGIN, topMargin=76, bottomMargin=61,
                            title=f"RNC - Eletrônico - {nc.get('numero') or 'Rascunho'}",
                            author="Concrefer - Qualidade", pageCompression=1)
    story = [
        p("REGISTRO ELETRÔNICO  /  QUALIDADE", "eyebrow"),
        p("Registro de Não Conformidade", "hero"),
        p(f"{_value(nc.get('numero'))}  ·  {_value(nc.get('status')).replace('_', ' ').title()}",
          "subtitle"),
        Spacer(1, 11),
        HRFlowable(width="100%", thickness=2, color=TEAL),
        section(1, "Identificação"),
        facts([
            ("Processo emitente", nc.get("processo_texto") or catalogs.get("area_emissora_id")),
            ("Nome do emitente", nc.get("emitente_nome") or nc.get("criado_por")),
            ("Data da emissão", _date(nc.get("data_emissao") or nc.get("criado_em"))),
            ("Origem / tipo de RNC", catalogs.get("origem_id")),
            ("Identificação", nc.get("identificacao_texto")),
            ("Item normativo", nc.get("requisito_texto")),
            ("Nº da RNC atual", nc.get("numero")),
            ("Nº da RNC anterior", nc.get("numero_anterior_texto") or nc.get("numero_legado")),
        ]),
        section(2, "Ocorrência"),
        *narrative("O que aconteceu?", nc.get("descricao")),
        *narrative("Evidência objetiva", nc.get("evidencias_texto")),
        section(3, "Contenção imediata"),
    ]
    if containments:
        for index, item in enumerate(containments, 1):
            story.extend(narrative(f"Ação de contenção {index}", item.get("descricao")))
            story.extend([facts([
                ("Responsável", item.get("responsavel_texto") or item.get("criado_por")),
                ("Prazo", _date(item.get("prazo"))),
            ]), Spacer(1, 7)])
    else:
        story.extend(narrative("Ações de contenção / provisórias", None))
        story.append(facts([("Responsável", None), ("Prazo", None)]))

    story.extend([
        section(4, "Análise do problema"),
        facts([
            ("Onde ocorreu? · Local", catalogs.get("local_id")),
            ("Quando ocorreu? · Data", _date(nc.get("data_ocorrencia"))),
            ("Como ocorreu? · Atividade", catalogs.get("atividade_id")),
            ("Quem estava envolvido? · Funções", nc.get("envolvidos_funcoes")),
            ("Causas prováveis", nc.get("causas_provaveis")),
            ("Equipe", nc.get("equipe_texto")),
            ("A sistemática utilizada é adequada?", _yes_no(nc.get("sistematica_adequada"))),
            ("A sistemática documentada está sendo seguida?", _yes_no(nc.get("sistematica_seguida"))),
        ]),
    ])
    if causes:
        for index, item in enumerate(causes, 1):
            story.extend(narrative(f"Causa raiz · análise {index}", item.get("causa_raiz")))
    else:
        story.extend(narrative("Causa raiz · técnica dos 5 porquês", None))

    story.extend([
        section(5, "Ação corretiva"),
        facts([
            ("É possível implantar dispositivo à prova de erros? · Poka Yoke",
             _yes_no(nc.get("poka_yoke_possivel"))),
            ("É necessário alterar documentos e/ou formulários?",
             _yes_no(nc.get("alterar_documentos"))),
        ]),
        Spacer(1, 10),
        *narrative("Documentos / formulários a alterar", nc.get("documentos_alterar_texto")),
    ])
    if actions:
        for index, item in enumerate(actions, 1):
            story.extend(narrative(f"Ação {index} · {_value(item.get('tipo')).title()}", item.get("o_que")))
            story.extend([facts([
                ("Responsável", item.get("quem_id")),
                ("Prazo de conclusão", _date(item.get("quando"))),
            ]), Spacer(1, 7)])
    else:
        story.extend(narrative("Descrever a ação corretiva", None))
        story.append(facts([("Responsável", None), ("Prazo de conclusão", None)]))
    story.append(facts([("Verificar eficácia a partir de",
                         _date(nc.get("verificar_eficacia_a_partir")))]))

    story.append(section(6, "Acompanhamento da eficácia"))
    rows = [[p("DATA", "th"), p("EVIDÊNCIA", "th"), p("VERIFICADOR", "th")]]
    for item in followups:
        rows.append([p(_date(item.get("data")), "small"),
                     p(item.get("evidencia"), "small"),
                     p(item.get("verificador_id"), "small")])
    if not followups:
        rows.append([p(None, "small"), p("Nenhum acompanhamento registrado", "small"),
                     p(None, "small")])
    table = LongTable(rows, colWidths=[80, CONTENT_W - 195, 115], repeatRows=1,
                      hAlign="LEFT", splitByRow=1, splitInRow=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SURFACE]),
        ("LINEBELOW", (0, 0), (-1, -1), .45, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.extend([table, Spacer(1, 11)])
    latest = efficacies[-1] if efficacies else {}
    result = latest.get("resultado")
    outcome = "Sim" if result == "EFICAZ" else "Não" if result == "NAO_EFICAZ" else "Pendente"
    story.append(facts([
        ("Ação corretiva eficaz?", outcome),
        ("Nº da nova RNC", successor_number),
    ]))
    for item in efficacies:
        story.extend(narrative(f"Critério · rodada {item.get('rodada') or '—'}", item.get("criterio")))
        story.extend(narrative("Resultado / observações", item.get("notas")))

    closure = closures[-1] if closures else {}
    story.extend([
        section(7, "Encerramento"),
        facts([
            ("Responsável pelo encerramento", closure.get("aprovado_por")),
            ("Data", _date(closure.get("aprovado_em"))),
            ("RNC encerrada?", "Sim" if nc.get("status") == "ENCERRADA" else "Não"),
            ("Referência do formulário", "FL-SGQ-07 · Revisão 00"),
        ]),
    ])
    doc.build(story, onFirstPage=page_header, onLaterPages=page_header)
    return output.getvalue()

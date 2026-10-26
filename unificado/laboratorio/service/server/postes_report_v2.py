"""Detailed printable report, built from the saved criterion and inspection snapshots."""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from html import escape
from io import BytesIO
from pathlib import Path
import base64
import qrcode
import sys

from .postes_db import Equipment, Responsible, TestAttachment
from sqlalchemy import select
from .postes_rules import INSPECTION_ITEMS, MEASUREMENT_ITEMS

# Asset published at https://concrefer.com.br/wp-content/uploads/2023/04/logo-vetorizado.png
LOGO_PATH = Path(__file__).resolve().parent / "assets" / "concrefer_logo.png"


def logo_data_uri():
    return "data:image/png;base64," + base64.b64encode(LOGO_PATH.read_bytes()).decode("ascii")


def qr_data_uri(url: str):
    image = qrcode.make(url)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


def fmt(value, digits=1):
    if value is None or value == "":
        return "—"
    return f"{float(value):,.{digits}f}".replace(",", "_").replace(".", ",").replace("_", ".")


def pole_section(pole):
    return (f"conicidade {pole.get('conicidade') or 'A'}" if pole.get("tipo", "").upper() in {"C", "R"}
            else f"face {pole.get('face') or '—'}")


def date_br(value):
    return value.strftime("%d/%m/%Y") if value else "—"


def status(value):
    return {"DENTRO": "APROVADO", "FORA": "REPROVADO", "PENDENTE": "PENDENTE", "N/A": "N/A"}.get(value, value or "PENDENTE")


def usage(value, limit):
    try:
        reading, maximum = Decimal(str(value)), Decimal(str(limit))
        return fmt(reading / maximum * 100, 1) + "%" if maximum > 0 else "—"
    except (InvalidOperation, TypeError):
        return "—"


def limited(value, limit, minimum=False):
    if value is None or value == "":
        return "PENDENTE"
    try:
        read, boundary = Decimal(str(value)), Decimal(str(limit))
        return "DENTRO" if (read >= boundary if minimum else read <= boundary) else "FORA"
    except (InvalidOperation, TypeError):
        return "PENDENTE"


@dataclass(frozen=True)
class Row:
    group: str
    item: str
    source: str
    limit: str
    reading: str
    percent: str
    result: str


def report_rows(record):
    criteria = record.criterios_snapshot or {}
    par = record.parametros_calculados or {}
    results = record.resultados or {}
    steps = results.get("etapas", {})
    reads = record.leituras or {}
    rows = []
    inspection = results.get("inspecao")
    recorded_inspection = record.inspecao_data or {}
    if inspection:
        for key, label in INSPECTION_ITEMS.items():
            check = recorded_inspection.get("checklist", {}).get(key)
            rows.append(Row("Inspeção visual", label, "NBR 8451-1 · item 4.1",
                            "Conforme", "Sim" if check is True else "Não" if check is False else "—",
                            "—", status(inspection.get("checklist", {}).get(key))))
        source = recorded_inspection.get("fonte_limites") or "Fonte não informada"
        if source.startswith("ABNT NBR 8451-"):
            source = source.split(";", 1)[0]
        measured_keys = inspection.get("medidas", {})
        legacy_diameter = not any(key in measured_keys for key in ("largura_base", "espessura_base")) and "diametro_base" in measured_keys
        for key, (label, unit) in MEASUREMENT_ITEMS.items():
            if not legacy_diameter and key.startswith("diametro_") != ((record.poste_snapshot or {}).get("tipo", "").upper() in {"C", "R"}):
                continue
            if legacy_diameter and not key.startswith("diametro_"):
                continue
            value = inspection.get("medidas", {}).get(key, {})
            lower, upper, measured = value.get("min_mm"), value.get("max_mm"), value.get("leitura_mm")
            interval = (f"{fmt(lower, 1)} a {fmt(upper, 1)} {unit}"
                        if lower is not None and upper is not None else
                        "N/A — modelo sem seção parametrizada" if value.get("status") == "N/A" else "A informar")
            rows.append(Row("Medições", label, source, interval, f"{fmt(measured, 1)} {unit}",
                            f"{fmt(value.get('uso_tolerancia_pct'), 1)}%" if value.get("uso_tolerancia_pct") is not None else "—",
                            status(value.get("status"))))
    else:
        rows.append(Row("Inspeção visual", "Inspeção geral (registro anterior)",
                        "NBR 8451-1 · item 4.1", "Conforme", "Sim" if record.inspecao_geral_ok else "Não",
                        "—", status("DENTRO" if record.inspecao_geral_ok else "FORA")))

    e1 = steps.get("e1", {})
    rows.append(Row("Ensaio mecânico", "Acomodação / engaste", "NBR 8451-3 · 4.2.6.1",
                    f"{fmt(par.get('carga_nom_daN'), 0)} daN · 1 min",
                    "Confirmada" if reads.get("e1") else "Não confirmada", "—", status(e1.get("status"))))
    e2 = steps.get("e2", {})
    if e2.get("status") == "N/A":
        rows.append(Row("Ensaio mecânico", "Momento fletor MA", "NBR 8451-2 · tab. A.1/A.2",
                        "Não aplicável", "—", "—", "N/A"))
    else:
        ma_limit = (record.poste_snapshot or {}).get("ma_daNm")
        rows.append(Row("Ensaio mecânico", "Momento fletor MA", "NBR 8451-2 · tab. A.1/A.2",
                        f"{fmt(ma_limit, 0)} daN·m" if ma_limit is not None else "Catálogo não parametrizado",
                        f"{fmt(e2.get('ma_daNm'), 0)} daN·m", usage(e2.get("ma_daNm"), ma_limit), status(e2.get("status"))))
        rows.append(Row("Ensaio mecânico", "Fissura no MA", "FL-PRO-22 / critério v" + str(record.criterio_versao),
                        f"≤ {fmt(criteria.get('fissura_max_mm'), 2)} mm",
                        f"{fmt(e2.get('fissura_mm'), 2)} mm", usage(e2.get("fissura_mm"), criteria.get("fissura_max_mm")),
                        status(limited(e2.get("fissura_mm"), criteria.get("fissura_max_mm")))))
    for key, title, parameter in (("e3", "Flecha com carga nominal", "flecha_max_mm"),
                                  ("e4", "Flecha residual", "residual_max_mm")):
        step = steps.get(key, {})
        rows.append(Row("Ensaio mecânico", title, "NBR 8451-3 · 4.2.6.2 / FL-PRO-22",
                        f"≤ {fmt(par.get(parameter), 1)} mm", f"{fmt(step.get('valor_mm'), 1)} mm",
                        usage(step.get("valor_mm"), par.get(parameter)),
                        status(limited(step.get("valor_mm"), par.get(parameter)))))
        rows.append(Row("Ensaio mecânico", "Fissura " + ("nominal" if key == "e3" else "residual"),
                        "FL-PRO-22 / critério v" + str(record.criterio_versao),
                        f"≤ {fmt(criteria.get('fissura_max_mm'), 2)} mm",
                        f"{fmt(step.get('fissura_mm'), 2)} mm",
                        usage(step.get("fissura_mm"), criteria.get("fissura_max_mm")),
                        status(limited(step.get("fissura_mm"), criteria.get("fissura_max_mm")))))
    e5 = steps.get("e5", {})
    rows.append(Row("Ensaio mecânico", "Carga de ruptura", "NBR 8451-3 · 4.2.7 / FL-PRO-22",
                    f"≥ {fmt(par.get('ruptura_min_daN'), 0)} daN",
                    f"{fmt(e5.get('valor_daN'), 0)} daN", usage(e5.get("valor_daN"), par.get("ruptura_min_daN")),
                    status(e5.get("status"))))
    absorption = results.get("absorcao", {})
    for index, value in enumerate(absorption.get("valores_pct", []), 1):
        limit = criteria.get("absorcao_ind_max_pct")
        rows.append(Row("Absorção (informativa)", f"Corpo de prova {index}", "NBR 8451-4 / critério v" + str(record.criterio_versao),
                        f"≤ {fmt(limit, 2)}%", f"{fmt(value, 2)}%", usage(value, limit), status(limited(value, limit))))
    mean = absorption.get("media_pct")
    mean_limit = criteria.get("absorcao_media_max_pct")
    rows.append(Row("Absorção (informativa)", "Média de absorção", "NBR 8451-4 / critério v" + str(record.criterio_versao),
                    f"≤ {fmt(mean_limit, 2)}%", f"{fmt(mean, 2)}%", usage(mean, mean_limit),
                    status(limited(mean, mean_limit)) if len(absorption.get("valores_pct", [])) == 3 else "PENDENTE"))
    return rows


def report_html_v2(record, session, certificate_url: str | None = None, external: bool = False):
    equipment = session.get(Equipment, record.equipamento_id) if record.equipamento_id else None
    inspector = session.get(Responsible, record.inspetor_id) if record.inspetor_id else None
    engineer = session.get(Responsible, record.engenheiro_id) if record.engenheiro_id else None
    pole, par = record.poste_snapshot or {}, record.parametros_calculados or {}
    esc = lambda value: escape(str(value if value is not None else "—"))
    logo = logo_data_uri()
    body = "".join("<tr>" + "".join(f"<td>{esc(value)}</td>" for value in
                   (row.group, row.item, row.source, row.limit, row.reading, row.percent, row.result)) + "</tr>"
                   for row in report_rows(record))
    attachments = session.scalars(select(TestAttachment).where(TestAttachment.ensaio_id == record.id)
                                  .order_by(TestAttachment.criado_em)).all()
    files = "".join(f'<li><a href="{escape(certificate_url)}/anexos/{esc(row.id)}">{esc(row.nome_original)}</a></li>'
                    if external and certificate_url else f"<li>{esc(row.nome_original)}</li>" for row in attachments)
    notes = f'<h2>Observações</h2><p>{esc(record.observacoes or "Nenhuma observação informada.")}</p>'
    files_section = f'<h2>Anexos</h2><ul>{files}</ul>' if files else ''
    qr = (f'<div class="certificate-qr"><img src="{qr_data_uri(certificate_url)}" alt="QR Code do certificado">'
          f'<span>Verificar certificado<br>{escape(certificate_url)}</span></div>') if certificate_url else ''
    actions = '<button class="print" onclick="window.print()">Imprimir</button>'
    if external and certificate_url:
        actions += f'<a class="print" href="{escape(certificate_url)}/certificado.pdf">Abrir PDF</a>'
        actions += f'<form method="post" action="{escape(certificate_url)}/sair"><button class="print" type="submit">Sair</button></form>'
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Laudo · amostra {esc(record.numero_amostra)}</title>
<style>@page{{size:A4 landscape;margin:8mm}}*{{box-sizing:border-box}}body{{font:10px Arial,sans-serif;color:#18323c;margin:8px}}.report-page{{min-height:calc(100vh - 16px);display:flex;flex-direction:column}}h1{{font-size:17px;margin:0}}h2{{font-size:12px;margin:14px 0 6px;color:#114c5a}}header{{display:flex;justify-content:space-between;align-items:center;gap:15px;border-bottom:3px solid #114c5a;padding-bottom:8px}}.brand-head{{display:flex;align-items:center;gap:15px}}.brand-logo{{display:block;width:170px;height:auto;max-height:48px;object-fit:contain}}.muted{{color:#566d74}}.grid{{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:10px 0}}.cell{{border:1px solid #c4d0d2;padding:6px;min-height:35px}}.cell b{{display:block;color:#526a70;font-size:8px;margin-bottom:3px}}table{{width:100%;border-collapse:collapse;margin:7px 0}}th,td{{border:1px solid #b9c9cb;padding:2px;text-align:left;vertical-align:top}}th{{background:#dce9eb}}tr:nth-child(even){{background:#f2f6f6}}.verdict{{font-weight:bold;font-size:13px;border:2px solid #114c5a;padding:8px;margin:10px 0}}.equipment-details{{border-top:1px solid #b9c9cb;padding-top:4px;margin-top:0;break-inside:avoid}}.equipment-details .muted{{margin:2px 0 0}}footer{{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;border-top:1px solid #b9c9cb;padding-top:8px;margin-top:auto;break-inside:avoid}}footer::before{{content:""}}.print{{float:right;border:0;background:#114c5a;color:white;padding:8px 12px;cursor:pointer;text-decoration:none;margin-left:5px}}.certificate-qr{{display:flex;align-items:center;gap:8px;font-size:8px;word-break:break-all;margin:6px 0}}.certificate-qr img{{width:108px;height:108px}}@media print{{body{{margin:0}}.report-page{{min-height:194mm}}.print,form{{display:none}}thead{{display:table-header-group}}tr{{break-inside:avoid}}}}</style></head><body>
{actions}<div class="report-page"><header><div class="brand-head"><img class="brand-logo" src="{logo}" alt="Concrefer"><div><h1>LAUDO DE ENSAIO DE POSTES</h1><span class="muted">FL-PRO-22 · Rev. 00 · critérios salvos na versão {record.criterio_versao}</span></div></div><div>Amostra <b>{esc(record.numero_amostra)}</b><br>Revisão {record.revisao}</div></header>{qr}
<div class="grid"><div class="cell"><b>NÚMERO DE SÉRIE DO POSTE</b>{esc(record.numero_serie_poste)}</div><div class="cell"><b>POSTE</b>{esc(pole.get('tipo'))} {fmt(pole.get('altura_m'))}/{fmt(pole.get('resistencia_daN'),0)} · {esc(pole_section(pole))}</div><div class="cell"><b>ENSAIO</b>{date_br(record.data_ensaio)}</div><div class="cell"><b>FABRICAÇÃO</b>{date_br(record.data_fabricacao)}</div><div class="cell"><b>FÁBRICA</b>{esc(record.fabrica)}</div><div class="cell"><b>ENGASTE</b>{fmt(par.get('engaste_cm'),0)} cm</div><div class="cell"><b>CARRO DO TOPO</b>{fmt(par.get('carro_cm'),0)} cm</div><div class="cell"><b>STATUS</b>{esc(record.status)}</div></div>
<h2>Inspeção, medições e ensaio · limite, leitura, percentual e decisão</h2><table><thead><tr><th>Grupo</th><th>Item</th><th>Referência do limite</th><th>Limite adotado</th><th>Leitura</th><th>% do limite/tolerância</th><th>Resultado</th></tr></thead><tbody>{body}</tbody></table>
<div class="verdict">RESULTADO DA AMOSTRA: {esc(record.veredito)} · Inspeção geral: {status((record.resultados or {}).get('inspecao', {}).get('status')) if (record.resultados or {}).get('inspecao') else ('APROVADO' if record.inspecao_geral_ok else 'REPROVADO')}</div>
{notes}{files_section}
<p class="muted">% das medições: uso da tolerância (0% no centro; 100% no limite). % de ruptura: leitura / mínimo × 100. Absorção é informativa e não compõe o veredito mecânico. Valores FL-PRO-22 de fissura e absorção requerem confirmação normativa.</p>
<div class="equipment-details"><b>Equipamento</b><br>{esc(equipment.descricao if equipment else None)} · série {esc(equipment.numero_serie if equipment else None)}<br>Certificado {esc(equipment.certificado if equipment else None)} · calibração {date_br(equipment.data_calibracao if equipment else None)}<p class="muted">Registro {esc(record.id)} · gerado a partir do snapshot salvo no banco.</p></div>
<footer><div><b>Inspetor</b><br>{esc(inspector.nome if inspector else None)}<br>Assinatura: ____________________</div><div><b>Engenheiro responsável</b><br>{esc(engineer.nome if engineer else None)} · CREA {esc(engineer.registro if engineer else None)}<br>Assinatura: ____________________</div></footer>
</div></body></html>'''


def _reportlab_pdf_v2(record, session, certificate_url: str | None = None):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import Image, LongTable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    font_file = next((path for path in (
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ) if path.exists()), None)
    if font_file and "ArialReport" not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont("ArialReport", str(font_file)))
    font = "ArialReport" if font_file else "Helvetica"
    output = BytesIO()
    document = SimpleDocTemplate(output, pagesize=landscape(A4), leftMargin=24, rightMargin=24,
                                 topMargin=14, bottomMargin=14)
    styles = getSampleStyleSheet()
    normal = ParagraphStyle("pole_normal", parent=styles["Normal"], fontName=font, fontSize=7, leading=9)
    small = ParagraphStyle("pole_small", parent=normal, fontSize=6.4, leading=8)
    heading = ParagraphStyle("pole_heading", parent=normal, fontSize=14, leading=17, textColor=colors.HexColor("#114C5A"))
    cell = lambda value: Paragraph(escape(str(value)), small)
    pole = record.poste_snapshot or {}
    equipment = session.get(Equipment, record.equipamento_id) if record.equipamento_id else None
    inspector = session.get(Responsible, record.inspetor_id) if record.inspetor_id else None
    engineer = session.get(Responsible, record.engenheiro_id) if record.engenheiro_id else None
    logo = Image(str(LOGO_PATH), width=170, height=170 * 497 / 1849)
    header = Table([[logo, Paragraph("LAUDO DE ENSAIO DE POSTES", heading)]],
                   colWidths=[185, 592])
    header.setStyle(TableStyle([("VALIGN", (0,0),(-1,-1), "MIDDLE"),
                                ("LEFTPADDING", (0,0),(-1,-1), 0),
                                ("RIGHTPADDING", (0,0),(-1,-1), 0),
                                ("TOPPADDING", (0,0),(-1,-1), 0),
                                ("BOTTOMPADDING", (0,0),(-1,-1), 3)]))
    story = [header,
             Paragraph(f"FL-PRO-22 · Amostra {escape(record.numero_amostra)} · Série do poste: {escape(record.numero_serie_poste or '—')} · Revisão {record.revisao} · Critério v{record.criterio_versao}", normal), Spacer(1, 7)]
    if certificate_url:
        qr_image = qrcode.make(certificate_url)
        qr_buffer = BytesIO()
        qr_image.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)
        story += [Table([[Image(qr_buffer, width=95, height=95),
                          Paragraph("Verificar certificado: " + escape(certificate_url), small)]],
                        colWidths=[102, 675]), Spacer(1, 4)]
    info = [[cell(f"Poste: {pole.get('tipo')} {fmt(pole.get('altura_m'))}/{fmt(pole.get('resistencia_daN'),0)} · {pole_section(pole)}"),
             cell(f"Ensaio: {date_br(record.data_ensaio)}"), cell(f"Fabricação: {date_br(record.data_fabricacao)}"),
             cell(f"Fábrica: {record.fabrica}")]]
    info_table = Table(info, colWidths=[245, 145, 145, 242])
    info_table.setStyle(TableStyle([("BACKGROUND", (0,0),(-1,-1),colors.HexColor("#E7EFF0")),
                                    ("BOX", (0,0),(-1,-1),.5,colors.HexColor("#BAC8C9")),
                                    ("VALIGN", (0,0),(-1,-1),"TOP"), ("TOPPADDING",(0,0),(-1,-1),6),
                                    ("BOTTOMPADDING",(0,0),(-1,-1),6)]))
    story += [info_table, Spacer(1, 5)]
    header = ["Grupo", "Item", "Referência", "Limite adotado", "Leitura", "%", "Resultado"]
    data = [[cell(x) for x in header]]
    data.extend([[cell(x) for x in (r.group, r.item, r.source, r.limit, r.reading, r.percent, r.result)]
                 for r in report_rows(record)])
    table = LongTable(data, colWidths=[93, 143, 153, 105, 95, 61, 127], repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#DCE9EB")),
                              ("GRID",(0,0),(-1,-1),.35,colors.HexColor("#B9C9CB")),
                              ("VALIGN",(0,0),(-1,-1),"TOP"), ("TOPPADDING",(0,0),(-1,-1),2),
                              ("BOTTOMPADDING",(0,0),(-1,-1),2)]))
    story += [table, Spacer(1, 5), Paragraph(f"RESULTADO DA AMOSTRA: {escape(record.veredito)}", heading),
              Paragraph("% das medições: uso da tolerância (0% no centro; 100% no limite). Ruptura: leitura / mínimo × 100. Absorção informativa. Limites FL-PRO-22 de fissura e absorção pendentes de confirmação normativa.", small), Spacer(1, 5)]
    story += [Paragraph("Observações: " + escape(record.observacoes or "Nenhuma observação informada."), normal), Spacer(1, 6)]
    attachments = session.scalars(select(TestAttachment).where(TestAttachment.ensaio_id == record.id)).all()
    if attachments:
        story += [Paragraph("Anexos: " + escape(", ".join(row.nome_original for row in attachments)), small), Spacer(1, 6)]
    footer = [[cell(f"Equipamento: {equipment.descricao if equipment else '—'} · série {equipment.numero_serie if equipment else '—'} · certificado {equipment.certificado if equipment else '—'}"),
               cell(f"Inspetor: {inspector.nome if inspector else '—'}\nAssinatura: ____________________"),
               cell(f"Engenheiro: {engineer.nome if engineer else '—'} · CREA {engineer.registro if engineer else '—'}\nAssinatura: ____________________")]]
    foot = Table(footer, colWidths=[285, 225, 267])
    foot.setStyle(TableStyle([("BOX",(0,0),(-1,-1),.5,colors.HexColor("#B9C9CB")),
                              ("VALIGN",(0,0),(-1,-1),"TOP"), ("TOPPADDING",(0,0),(-1,-1),7)]))
    story.append(foot)
    document.build(story)
    return output.getvalue()


def report_pdf_v2(record, session, certificate_url: str | None = None):
    if sys.platform != "win32":
        try:
            from weasyprint import HTML
            return HTML(string=report_html_v2(record, session, certificate_url)).write_pdf()
        except (ImportError, OSError):
            pass
    return _reportlab_pdf_v2(record, session, certificate_url)

"""Demand derived from official post schedules; no writes to source programming."""
from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal
import hashlib
import json

from fastapi import HTTPException
from sqlalchemy import text


def rows(db, sql, **params):
    return [dict(row) for row in db.execute(text(sql), params).mappings()]


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), default=str)


def fingerprint(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def previous_workday(day, weekdays, exceptions):
    for offset in range(1, 367):
        prior = day - timedelta(days=offset)
        if prior.weekday() != 6 and exceptions.get(prior, prior.weekday() in weekdays):
            return prior
    raise HTTPException(422, "Calendário sem dia de trabalho anterior no intervalo de um ano")


def calendar(db):
    config = rows(db, "SELECT * FROM public.armaduras_calendario WHERE unidade_id=1")
    if not config:
        raise HTTPException(409, "Configure o calendário das armaduras antes de consultar a programação")
    config = config[0]
    config["excecoes"] = rows(db, """
      SELECT data,trabalha,motivo FROM public.armaduras_calendario_dia
      WHERE unidade_id=1 ORDER BY data
    """)
    return config


def source(db, start, end, group):
    """S1/S2 published version; S3/S4 specific forms are their own official source.

    Generic/final programming is deliberately not added: it duplicates some forms
    and is stale for S3/S4. The sector belongs to the source flow, not a cross-sector
    product lookup (DT15, for example, belongs to the current S3 layout).
    """
    if group == "12":
        return rows(db, """
          SELECT i.id,i.data,i.setor_id,i.produto_id,i.quantidade,
                 p.codigo,p.nome AS descricao,p.peso AS peso_poste_kg,
                 w.id AS origem_id,w.versao AS revisao,'semana_publicada' AS fonte,
                 d.produz
          FROM public.programacao_semana_item i
          JOIN public.programacao_semana w ON w.id=i.semana_id AND w.status='publicada'
          JOIN public.programacao_semana_dia d ON d.semana_id=i.semana_id AND d.data=i.data
          JOIN public.produtos p ON p.id=i.produto_id
          WHERE i.data BETWEEN :start AND :end AND i.quantidade>0 AND d.produz
          ORDER BY i.data,i.setor_id,i.produto_id
        """, start=start, end=end)
    result = []
    for sector in (3, 4):
        # Only this fixed allowlist may be interpolated into SQL identifiers.
        result.extend(rows(db, f"""
          SELECT a.id,a.data,{sector} AS setor_id,a.produto_id,1 AS quantidade,
                 COALESCE(NULLIF(a.codigo_produto,''),p.codigo) AS codigo,
                 a.modelo AS descricao,COALESCE(a.peso_kg,p.peso) AS peso_poste_kg,
                 a.codigo_forma,a.origem,a.atualizado_em,
                 a.id AS origem_id,NULL AS revisao,'formas_s{sector}' AS fonte
          FROM public.programacoes_circular_s{sector} a
          LEFT JOIN public.produtos p ON p.id=a.produto_id
          WHERE a.data BETWEEN :start AND :end
          ORDER BY a.data,a.codigo_forma
        """, start=start, end=end))
    return result


def build(db, start, group, arm_day=None):
    if start.weekday() != 0:
        raise HTTPException(422, "A semana dos postes deve iniciar na segunda-feira")
    config = calendar(db)
    exceptions = {item["data"]: item["trabalha"] for item in config["excecoes"]}
    weekdays = set(config["dias_semana"]) - {6}
    if arm_day:
        # All future attendance dates until the NEXT working day belong to this
        # fabrication day. Bound both directions to fail closed on bad calendars.
        if arm_day.weekday() == 6 or not exceptions.get(arm_day, arm_day.weekday() in weekdays):
            raise HTTPException(422, "A data selecionada está fechada no calendário das armaduras")
        start = arm_day + timedelta(days=1)
        end = start
        while end.weekday() == 6 or not exceptions.get(end, end.weekday() in weekdays):
            end += timedelta(days=1)
            if (end-start).days >= 366:
                raise HTTPException(422, "Calendário sem próximo dia de trabalho")
    else:
        end = start + timedelta(days=5)
    if start.year < 2025 or end.year > 2030:
        raise HTTPException(422, "Calendário de feriados disponível de 2025 a 2030. Cadastre o calendário do novo período antes de consultar")
    raw = [r for r in source(db, start, end, group) if r['data'].weekday() != 6]
    days = [start + timedelta(days=i) for i in range((end-start).days+1) if (start + timedelta(days=i)).weekday() != 6]
    columns = [{"poste": d.isoformat(), "armadura": previous_workday(d, weekdays, exceptions).isoformat()} for d in days]
    lines = {}
    pending = []
    for row in raw:
        if row.get("produto_id") is None or not row.get("codigo"):
            pending.append(f"Setor {row['setor_id']}: {row['descricao']} sem produto/código vinculado")
        key = (row["setor_id"], row.get("produto_id"), row.get("codigo"), row["descricao"])
        item = lines.setdefault(key, {
            "setor": row["setor_id"], "produto_id": row.get("produto_id"),
            "codigo": row.get("codigo") or "", "descricao": row["descricao"],
            "peso_poste_kg": float(row["peso_poste_kg"]) if row["peso_poste_kg"] is not None else None,
            "dias": {d.isoformat(): 0 for d in days}, "total": 0,
        })
        qty = int(row["quantidade"])
        item["dias"][row["data"].isoformat()] += qty
        item["total"] += qty
    ordered = sorted(lines.values(), key=lambda row: (row["setor"], row["descricao"], row["codigo"]))
    totals = {d.isoformat(): sum(row["dias"][d.isoformat()] for row in ordered) for d in days}
    by_arm = defaultdict(int)
    for column in columns:
        by_arm[column["armadura"]] += totals[column["poste"]]
    versions = sorted({row["revisao"] for row in raw if row.get("revisao") is not None})
    if group == "12":
        published = rows(db, """SELECT id,semana_inicio,versao FROM public.programacao_semana
          WHERE status='publicada' AND semana_inicio BETWEEN :first AND :last ORDER BY semana_inicio""",
          first=start-timedelta(days=start.weekday()), last=end)
        expected = {d-timedelta(days=d.weekday()) for d in days if d.weekday()<5}
        if expected - {r["semana_inicio"] for r in published}:
            pending.append("Existe semana de postes sem programação publicada para os setores 1 e 2")
    else:
        published = []
    if not config["confirmado"]:
        pending.append("Confirme o calendário de trabalho das armaduras antes da emissão oficial")
    payload = {
        "unidade": "Campinas", "grupo": group, "inicio": start.isoformat(), "fim": end.isoformat(),
        "data_armadura": arm_day.isoformat() if arm_day else None,
        "dias": columns, "linhas": ordered, "totais": totals,
        "total": sum(totals.values()), "totais_armadura": dict(sorted(by_arm.items())),
        "revisoes_origem": versions, "pendencias": sorted(set(pending)),
        "fonte": "Semana publicada S1/S2" if group == "12" else "Programação por forma S3/S4",
        "calendario": config, "programacoes_publicadas": published,
    }
    payload["assinatura"] = fingerprint({"dados": payload, "origem": raw})
    return payload


def pdf(snapshot, emission):
    """Render persisted data only: historical PDFs never read today's sources."""
    from io import BytesIO
    from html import escape
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image, KeepInFrame
    from copy import deepcopy
    from pathlib import Path
    from zoneinfo import ZoneInfo

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=25, leftMargin=25,
                            topMargin=25, bottomMargin=32, title="Programação de produção de armaduras")
    style = ParagraphStyle("cell", fontName="Helvetica", fontSize=8, leading=9)
    title = ParagraphStyle("title", parent=style, fontSize=12, leading=15)
    created_text = str(emission["criado_em"])
    try:
        created = datetime.fromisoformat(created_text)
        if created.tzinfo:
            created = created.astimezone(ZoneInfo("America/Sao_Paulo"))
        created_text = created.strftime("%d/%m/%Y %H:%M")
    except ValueError:
        pass
    story = []
    day_label = lambda value: date.fromisoformat(value).strftime("%d/%m")
    full_date = lambda value: date.fromisoformat(value).strftime("%d/%m/%Y")
    sheets = []
    for original in snapshot['grupos']:
        for sectors, caption in ([({1, 2},'1 e 2')] if original['grupo']=='12' else [({3},'3'),({4},'4')]):
            data = deepcopy(original)
            data['linhas'] = [r for r in data['linhas'] if r['setor'] in sectors]
            data['dias'] = [d for d in data['dias'] if date.fromisoformat(d['poste']).weekday() != 6]
            data['inicio'],data['fim'] = data['dias'][0]['poste'],data['dias'][-1]['poste']
            data['totais'] = {d['poste']:sum(r['dias'].get(d['poste'],0) for r in data['linhas']) for d in data['dias']}
            for row in data['linhas']:
                row['total'] = sum(row['dias'].get(d['poste'],0) for d in data['dias'])
            data['total'] = sum(data['totais'].values())
            sheets.append((data,caption))
    for index, (data, group) in enumerate(sheets):
        if index:
            story.append(PageBreak())
        sheet = []
        logo = Path(__file__).resolve().parents[3] / "public/unificado/pcp/static/img/logo-concrefer-relatorio.png"
        brand = Image(str(logo), width=120, height=45, kind="proportional") if logo.is_file() else Paragraph("<b>CONCREFER</b><br/>Planejamento - Campinas", title)
        metadata = Table([[brand,
            Paragraph(f"<b>PROGRAMAÇÃO DE PRODUÇÃO - ARMADURAS</b><br/>Setor {group}<br/>Postes: {full_date(data['inicio'])} a {full_date(data['fim'])}", style),
            Paragraph(f"<b>Emissão {emission['id']} / revisão {emission['revisao']}</b><br/>{escape(created_text)} (Brasília)<br/>{escape(emission['responsavel'])}", style)]], colWidths=[165,400,226])
        metadata.setStyle(TableStyle([("GRID",(0,0),(-1,-1),.6,colors.black),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("TOPPADDING",(0,0),(-1,-1),9),("BOTTOMPADDING",(0,0),(-1,-1),9)]))
        revisions = ", ".join(map(str,data["revisoes_origem"])) or "programação por forma"
        sheet.extend([metadata, Spacer(1,7), Paragraph("D-1: último dia de trabalho anterior. Fonte: "+escape(data["fonte"])+". Revisão da origem: "+escape(revisions)+". Uma armadura por poste.", style),Spacer(1,6)])
        days = data["dias"]
        header = ["Descrição do poste", "Cód. produto", "Peso poste\n(kg)"] + ["Poste\n"+day_label(c["poste"])+"\nArmadura\n"+day_label(c["armadura"]) for c in days]+["Total\n(un.)"]
        table_data = [[f"Setor {group} - Programação de produção de armaduras"]+[""]*(len(header)-1),header]
        totals_at = []
        for sector in sorted({r["setor"] for r in data["linhas"]}):
            selected = [r for r in data["linhas"] if r["setor"] == sector]
            table_data.append([f"Setor {sector}"]+[""]*(len(header)-1))
            totals_at.append((len(table_data)-1,True))
            for row in selected:
                weight = "-" if row["peso_poste_kg"] is None else f"{row['peso_poste_kg']:,.2f}".replace(",","@").replace(".",",").replace("@",".")
                table_data.append([Paragraph(escape(row["descricao"]),style),Paragraph(escape(row["codigo"]),style),weight]+[str(row["dias"][c["poste"]] or "-") for c in days]+[str(row["total"])])
            table_data.append([f"Subtotal setor {sector}","",""]+[str(sum(r["dias"][c["poste"]] for r in selected)) for c in days]+[str(sum(r["total"] for r in selected))])
            totals_at.append((len(table_data)-1,False))
        table_data.append(["Total de armaduras","",""]+[str(data["totais"][c["poste"]]) for c in days]+[str(data["total"])])
        totals_at.append((len(table_data)-1,False))
        width = (791-180-70-65-45)/len(days)
        table = Table(table_data,colWidths=[180,70,65]+[width]*len(days)+[45],repeatRows=2,hAlign="LEFT")
        commands=[("GRID",(0,0),(-1,-1),.4,colors.HexColor("#555555")),("SPAN",(0,0),(-1,0)),("BACKGROUND",(0,0),(-1,1),colors.HexColor("#e3e5e7")),("TEXTCOLOR",(0,0),(-1,-1),colors.black),("FONTNAME",(0,0),(-1,1),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),8),("ALIGN",(1,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3)]
        for row_index, sector_title in totals_at:
            commands.extend([("BACKGROUND",(0,row_index),(-1,row_index),colors.HexColor("#e7eee8")),("FONTNAME",(0,row_index),(-1,row_index),"Helvetica-Bold"),("SPAN",(0,row_index),((-1 if sector_title else 2),row_index))])
        table.setStyle(TableStyle(commands))
        sheet.extend([table,Spacer(1,7),Paragraph("Quantidades em unidades. Peso do poste não corresponde ao peso do aço. Calendário e programação preservados nesta emissão.",style),Spacer(1,16),Paragraph("Programação: ______________________________     Conferência / produção: ______________________________",style)])
        story.append(KeepInFrame(doc.width,doc.height-4,sheet,mode='shrink',hAlign='LEFT',vAlign='TOP'))
    def footer(canvas, document):
        canvas.setFont("Helvetica",8)
        canvas.drawString(25,18,f"CONCREFER | Armaduras | Emissão {emission['id']} | {snapshot['assinatura'][:12]}")
        canvas.drawRightString(816,18,f"Página {document.page}")
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    return buffer.getvalue()

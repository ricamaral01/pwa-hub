"""Indicadores S5. Leituras filtradas por unidade e centros de custo autorizados."""
from __future__ import annotations

import csv
import io
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..auth import Actor, check_action, context, current_actor
from ..db import session

router = APIRouter(prefix="/api/suprimentos/analises", tags=["Indicadores S5"])
UTC = timezone.utc


def filters(db: Session, user: Actor, unidade: str, inicio: date, fim: date,
            cc_id: str | None, categoria: str | None, fornecedor_id: str | None):
    ctx = context(unidade, user, db)
    if not any(role["papel"] in {"COMPRADOR", "ADMIN"} for role in ctx.roles):
        raise HTTPException(403, "Indicadores requerem Compras ou Admin")
    check_action(ctx, "catalogo.ver", write=True, phase="S5", db=db)
    if fim < inicio or (fim - inicio).days > 366:
        raise HTTPException(422, "Período deve ter até 367 dias e fim após início")
    allowed_roles = [role for role in ctx.roles if role["papel"] in {"COMPRADOR", "ADMIN"}]
    all_cc = any(role["cc_id"] is None for role in allowed_roles)
    centers = [str(role["cc_id"]) for role in allowed_roles if role["cc_id"] is not None]
    if cc_id:
        try:
            cc_id = str(UUID(cc_id))
        except ValueError:
            raise HTTPException(422, "Centro de custo inválido") from None
        if not all_cc and cc_id not in centers:
            raise HTTPException(403, "Centro de custo fora da sua alçada")
        found = db.execute(text("SELECT 1 FROM suprimentos.sup_centro_custo WHERE id=:cc AND unidade_id=:unit"),
                           {"cc": cc_id, "unit": ctx.unit_id}).scalar_one_or_none()
        if not found:
            raise HTTPException(422, "Centro de custo indisponível")
        centers = [cc_id]
        all_cc = False
    if categoria:
        found = db.execute(text("SELECT 1 FROM suprimentos.sup_material WHERE categoria=:category LIMIT 1"),
                           {"category": categoria}).scalar_one_or_none()
        if not found:
            raise HTTPException(422, "Categoria inválida")
    if fornecedor_id:
        try:
            fornecedor_id = str(UUID(fornecedor_id))
        except ValueError:
            raise HTTPException(422, "Fornecedor inválido") from None
        found = db.execute(text("SELECT 1 FROM suprimentos.sup_fornecedor_unidade WHERE id=:supplier AND unidade_id=:unit"),
                           {"supplier": fornecedor_id, "unit": ctx.unit_id}).scalar_one_or_none()
        if not found:
            raise HTTPException(422, "Fornecedor indisponível")
    return ctx, {"unit": ctx.unit_id, "start": datetime.combine(inicio, time.min, UTC),
                 "end": datetime.combine(fim + timedelta(days=1), time.min, UTC),
                 "all_cc": all_cc, "ccs": centers, "category": categoria,
                 "supplier": fornecedor_id}


def one(db, sql, p):
    return dict(db.execute(text(sql), p).mappings().one())


def many(db, sql, p):
    return [dict(row) for row in db.execute(text(sql), p).mappings().all()]


def compute(db: Session, p: dict) -> dict:
    scope = "(:all_cc OR r.cc_id = ANY(CAST(:ccs AS uuid[])))"
    cat = "(CAST(:category AS text) IS NULL OR m.categoria=:category)"
    supplier = "(CAST(:supplier AS uuid) IS NULL OR po.fornecedor_unidade_id=CAST(:supplier AS uuid))"
    request_lead = one(db, f"""SELECT count(*) AS amostra,
      round(avg(extract(epoch FROM r.entregue_em-r.criado_em)/86400)::numeric,2) AS media_dias,
      round((percentile_cont(.9) WITHIN GROUP (ORDER BY extract(epoch FROM r.entregue_em-r.criado_em)/86400))::numeric,2) AS p90_dias
      FROM suprimentos.sup_solicitacao r WHERE r.unidade_id=:unit AND r.criado_em>=:start AND r.criado_em<:end
      AND r.entregue_em IS NOT NULL AND {scope}
      AND (CAST(:category AS text) IS NULL OR EXISTS (SELECT 1 FROM suprimentos.sup_solicitacao_item i JOIN suprimentos.sup_material m ON m.id=i.material_id WHERE i.solicitacao_id=r.id AND {cat}))
      AND (CAST(:supplier AS uuid) IS NULL OR EXISTS (SELECT 1 FROM suprimentos.sup_pedido_item pi JOIN suprimentos.sup_pedido po ON po.id=pi.pedido_id JOIN suprimentos.sup_solicitacao_item i ON i.id=pi.solicitacao_item_id WHERE i.solicitacao_id=r.id AND {supplier}))""", p)
    order_lead = one(db, f"""WITH arrivals AS (
        SELECT pedido_id, recebido_em AS em FROM suprimentos.sup_pedido_entrega WHERE unidade_id=:unit
        UNION ALL SELECT pedido_id, atualizado_em FROM suprimentos.sup_recebimento WHERE unidade_id=:unit AND status='CONFIRMADO'
        UNION ALL SELECT pedido_id, recebido_em FROM suprimentos.sup_integracao_recebimento WHERE unidade_id=:unit
      ), first_arrival AS (SELECT pedido_id,min(em) em FROM arrivals GROUP BY pedido_id)
      SELECT count(*) AS amostra,
      round(avg(extract(epoch FROM a.em-po.enviado_em)/86400)::numeric,2) AS media_dias,
      round((percentile_cont(.9) WITHIN GROUP (ORDER BY extract(epoch FROM a.em-po.enviado_em)/86400))::numeric,2) AS p90_dias
      FROM suprimentos.sup_pedido po JOIN first_arrival a ON a.pedido_id=po.id
      WHERE po.unidade_id=:unit AND po.criado_em>=:start AND po.criado_em<:end AND po.enviado_em IS NOT NULL
      AND a.em>=po.enviado_em AND {supplier}
      AND EXISTS (SELECT 1 FROM suprimentos.sup_pedido_item pi JOIN suprimentos.sup_solicitacao_item i ON i.id=pi.solicitacao_item_id
        JOIN suprimentos.sup_solicitacao r ON r.id=i.solicitacao_id LEFT JOIN suprimentos.sup_material m ON m.id=i.material_id
        WHERE pi.pedido_id=po.id AND {scope} AND {cat})""", p)
    sla = many(db, f"""WITH decisions AS (
      SELECT a.nivel,a.decisao,a.em,r.urgencia,r.id,
        lag(a.em) OVER (PARTITION BY a.solicitacao_id ORDER BY a.nivel,a.em) AS previous_em,
        r.criado_em AS inicio_solicitacao
      FROM suprimentos.sup_aprovacao a JOIN suprimentos.sup_solicitacao r ON r.id=a.solicitacao_id
      WHERE a.unidade_id=:unit AND a.em>=:start AND a.em<:end AND {scope}
        AND (CAST(:category AS text) IS NULL OR EXISTS (SELECT 1 FROM suprimentos.sup_solicitacao_item i JOIN suprimentos.sup_material m ON m.id=i.material_id WHERE i.solicitacao_id=r.id AND {cat}))
    ) SELECT nivel,count(*) AS decisoes,
      count(*) FILTER (WHERE decisao='APROVADA' AND em-COALESCE(previous_em,inicio_solicitacao)
        <= (CASE WHEN urgencia='NORMAL' THEN :sla_normal ELSE :sla_urgente END)*interval '1 hour') AS cumpridas
      FROM decisions GROUP BY nivel ORDER BY nivel""", {
          **p, "sla_normal": db.execute(text("SELECT valor FROM suprimentos.sup_parametro WHERE unidade_id=:unit AND chave='sla_aprovacao_normal_horas' AND ativo"), p).scalar_one_or_none() or 24,
          "sla_urgente": db.execute(text("SELECT valor FROM suprimentos.sup_parametro WHERE unidade_id=:unit AND chave='sla_aprovacao_urgente_horas' AND ativo"), p).scalar_one_or_none() or 4})
    consumption = many(db, f"""SELECT cc.id AS cc_id,cc.nome AS centro_custo,coalesce(cc.setor,'Sem setor') AS setor,
      m.id AS material_id,m.descricao AS material,m.categoria,
      round(sum(-mov.quantidade)::numeric,4) AS quantidade,
      round(sum(mov.custo_total)::numeric,2) AS valor
      FROM suprimentos.sup_movimento mov JOIN suprimentos.sup_material m ON m.id=mov.material_id
      LEFT JOIN suprimentos.sup_solicitacao_item i ON mov.referencia_tipo='SOLICITACAO' AND i.id=mov.referencia_id
      LEFT JOIN suprimentos.sup_solicitacao r ON r.id=i.solicitacao_id
      LEFT JOIN suprimentos.sup_centro_custo cc ON cc.id=r.cc_id
      WHERE mov.unidade_id=:unit AND mov.tipo='ENTREGA' AND mov.quantidade<0
        AND mov.efetivado_em>=:start AND mov.efetivado_em<:end AND {cat}
        AND (r.id IS NULL OR {scope})
        AND NOT EXISTS (SELECT 1 FROM suprimentos.sup_movimento rev WHERE rev.estorna_movimento_id=mov.id)
      GROUP BY cc.id,cc.nome,cc.setor,m.id,m.descricao,m.categoria
      ORDER BY valor DESC LIMIT 500""", p)
    total_consumption = sum(Decimal(str(row["valor"] or 0)) for row in consumption)
    running = Decimal(0)
    for row in consumption:
        running += Decimal(str(row["valor"] or 0))
        share = running / total_consumption if total_consumption else Decimal(0)
        row["abc"] = "A" if share <= Decimal("0.8") else "B" if share <= Decimal("0.95") else "C"
    stock = one(db, f"""SELECT round(coalesce(sum(c.quantidade*c.custo_medio),0)::numeric,2) AS valor,
        round(coalesce(sum(c.quantidade),0)::numeric,4) AS quantidade,
        count(*) FILTER (WHERE c.quantidade=0) AS itens_zerados
      FROM suprimentos.sup_custo_medio c JOIN suprimentos.sup_material m ON m.id=c.material_id
      WHERE c.unidade_id=:unit AND m.dominio='almoxarifado' AND {cat}""", p)
    days = max(1, int((p["end"]-p["start"]).days))
    consumed = sum(Decimal(str(row["quantidade"] or 0)) for row in consumption)
    stock["giro_periodo"] = round(float(total_consumption / Decimal(str(stock["valor"]))) if stock["valor"] else 0, 2)
    stock["cobertura_dias"] = round(float(Decimal(str(stock["quantidade"])) / (consumed / days)) if consumed else 0, 1)
    stock["valor_consumido"] = total_consumption
    iqf = many(db, f"""SELECT fu.id AS fornecedor_id,coalesce(fu.fantasia,f.razao) AS fornecedor,
      count(*) AS avaliacoes,round(avg(av.iqf)::numeric,2) AS iqf,
      date_trunc('month',av.avaliado_em)::date AS mes
      FROM suprimentos.sup_fornecedor_avaliacao av JOIN suprimentos.sup_fornecedor_unidade fu ON fu.id=av.fornecedor_unidade_id
      JOIN suprimentos.sup_fornecedor f ON f.id=fu.fornecedor_id
      WHERE av.unidade_id=:unit AND av.estornada_em IS NULL AND av.avaliado_em>=:start AND av.avaliado_em<:end
        AND (CAST(:supplier AS uuid) IS NULL OR fu.id=CAST(:supplier AS uuid))
        AND EXISTS (SELECT 1 FROM suprimentos.sup_pedido_item pi JOIN suprimentos.sup_solicitacao_item i ON i.id=pi.solicitacao_item_id
          JOIN suprimentos.sup_solicitacao r ON r.id=i.solicitacao_id LEFT JOIN suprimentos.sup_material m ON m.id=i.material_id
          WHERE pi.pedido_id=av.pedido_id AND {scope} AND {cat})
      GROUP BY fu.id,fu.fantasia,f.razao,date_trunc('month',av.avaliado_em)::date
      ORDER BY mes,iqf DESC LIMIT 200""", p)
    economy = one(db, f"""WITH priced AS (
      SELECT ci.id,ci.qtd,pr.custo_posto,pr.escolhido,
        first_value(pr.custo_posto) OVER (PARTITION BY ci.id ORDER BY pr.criado_em,pr.id) AS primeira,
        min(pr.custo_posto) OVER (PARTITION BY ci.id) AS menor
      FROM suprimentos.sup_cotacao_item ci JOIN suprimentos.sup_cotacao_preco pr ON pr.cotacao_item_id=ci.id
      JOIN suprimentos.sup_solicitacao_item i ON i.id=ci.solicitacao_item_id
      JOIN suprimentos.sup_solicitacao r ON r.id=i.solicitacao_id
      LEFT JOIN suprimentos.sup_material m ON m.id=i.material_id
      JOIN suprimentos.sup_cotacao q ON q.id=ci.cotacao_id
      WHERE ci.unidade_id=:unit AND q.criado_em>=:start AND q.criado_em<:end AND {scope} AND {cat}
        AND (CAST(:supplier AS uuid) IS NULL OR pr.fornecedor_unidade_id=CAST(:supplier AS uuid))
    ) SELECT count(*) AS itens,
      round(coalesce(sum(primeira),0)::numeric,2) AS primeira,
      round(coalesce(sum(custo_posto),0)::numeric,2) AS escolhida,
      round(coalesce(sum(menor),0)::numeric,2) AS menor,
      round(coalesce(sum(primeira-custo_posto),0)::numeric,2) AS economia
      FROM priced WHERE escolhido""", p)
    delayed = many(db, f"""SELECT po.id,po.numero,po.entrega_prevista,po.valor_total,
      coalesce(fu.fantasia,f.razao) AS fornecedor
      FROM suprimentos.sup_pedido po JOIN suprimentos.sup_fornecedor_unidade fu ON fu.id=po.fornecedor_unidade_id
      JOIN suprimentos.sup_fornecedor f ON f.id=fu.fornecedor_id
      WHERE po.unidade_id=:unit AND po.status IN ('EMITIDO','ENVIADO','PARCIAL')
        AND po.entrega_prevista<current_date AND po.criado_em>=:start AND po.criado_em<:end AND {supplier}
        AND EXISTS (SELECT 1 FROM suprimentos.sup_pedido_item pi JOIN suprimentos.sup_solicitacao_item i ON i.id=pi.solicitacao_item_id
          JOIN suprimentos.sup_solicitacao r ON r.id=i.solicitacao_id LEFT JOIN suprimentos.sup_material m ON m.id=i.material_id
          WHERE pi.pedido_id=po.id AND {scope} AND {cat})
      ORDER BY po.entrega_prevista,po.numero LIMIT 100""", p)
    zero = many(db, f"""SELECT m.id,m.codigo,m.descricao,m.categoria,coalesce(sum(s.quantidade),0) AS saldo
      FROM suprimentos.sup_material_unidade mu JOIN suprimentos.sup_material m ON m.id=mu.material_id
      LEFT JOIN suprimentos.sup_saldo s ON s.unidade_id=mu.unidade_id AND s.material_id=mu.material_id
      WHERE mu.unidade_id=:unit AND mu.ativo AND m.ativo AND m.dominio='almoxarifado' AND {cat}
      GROUP BY m.id,m.codigo,m.descricao,m.categoria HAVING coalesce(sum(s.quantidade),0)=0
      ORDER BY m.descricao LIMIT 100""", p)
    if not p["all_cc"]:
        # O saldo do almoxarifado não pertence a um CC; não divulgar o total da unidade
        # numa consulta filtrada ou num papel restrito a CCs específicos.
        stock = {key: None for key in stock}
        zero = []
    return jsonable_encoder({"periodo": {"inicio": p["start"].date(), "fim": (p["end"]-timedelta(days=1)).date()},
        "filtros": {"cc_ids": p["ccs"], "todos_cc": p["all_cc"], "categoria": p["category"], "fornecedor_id": p["supplier"]},
        "lead_solicitacao": request_lead, "lead_oc": order_lead,
        "sla": sla, "consumo": consumption, "estoque": stock,
        "iqf": iqf, "economia": economy, "pedidos_atrasados": delayed,
        "itens_zerados": zero,
        "fontes": {
            "lead_solicitacao": "sup_solicitacao.criado_em → entregue_em; coorte de criação no período",
            "lead_oc": "sup_pedido.enviado_em → primeira entrada F1/F3/S4; coorte de criação da OC",
            "sla": "sup_aprovacao.em − decisão anterior ou criação; parâmetros SLA normal/urgente da unidade",
            "consumo": "sup_movimento ENTREGA sem estorno no período, ligado ao CC da solicitação; máximo 500 linhas",
            "estoque": "sup_custo_medio atual; giro=valor consumido/valor atual, cobertura=quantidade atual/consumo diário médio. Totais da unidade ocultos em filtro por CC",
            "iqf": "sup_fornecedor_avaliacao não estornada, agrupada por fornecedor/mês",
            "economia": "sup_cotacao_preco: primeira proposta, escolhida e menor por item",
            "pedidos_atrasados": "sup_pedido aberto com entrega_prevista anterior a hoje; máximo 100 linhas",
            "itens_zerados": "sup_material_unidade ativo sem saldo positivo; máximo 100 linhas; oculto em filtro por CC"}})


def parsed_dates(inicio: str | None, fim: str | None):
    try:
        end = date.fromisoformat(fim) if fim else date.today()
        start = date.fromisoformat(inicio) if inicio else end - timedelta(days=29)
        return start, end
    except ValueError:
        raise HTTPException(422, "Datas devem estar em AAAA-MM-DD") from None


@router.get("/indicadores")
def indicators(inicio: str | None = None, fim: str | None = None, cc_id: str | None = None,
               categoria: str | None = None, fornecedor_id: str | None = None,
               unidade: str = "campinas", user: Actor = Depends(current_actor),
               db: Session = Depends(session)):
    start, end = parsed_dates(inicio, fim)
    _, p = filters(db, user, unidade, start, end, cc_id, categoria, fornecedor_id)
    return compute(db, p)


@router.get("/exportar.csv")
def export_csv(inicio: str | None = None, fim: str | None = None, cc_id: str | None = None,
               categoria: str | None = None, fornecedor_id: str | None = None,
               unidade: str = "campinas", user: Actor = Depends(current_actor),
               db: Session = Depends(session)):
    start, end = parsed_dates(inicio, fim)
    _, p = filters(db, user, unidade, start, end, cc_id, categoria, fornecedor_id)
    report = compute(db, p)
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow(["Seção", "Registro", "Campo", "Valor", "Início", "Fim", "Fonte e regra"])
    for key in ("lead_solicitacao", "lead_oc", "sla", "consumo", "estoque", "iqf",
                "economia", "pedidos_atrasados", "itens_zerados"):
        rows = report[key] if isinstance(report[key], list) else [report[key]]
        for index, row in enumerate(rows, 1):
            for field, value in row.items():
                writer.writerow([key, index, field, value, start.isoformat(), end.isoformat(),
                                 report["fontes"].get(key, "")])
    return Response("\ufeff" + output.getvalue(), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": "attachment; filename=suprimentos-indicadores.csv"})


@router.get("/exportar.pdf")
def export_pdf(inicio: str | None = None, fim: str | None = None, cc_id: str | None = None,
               categoria: str | None = None, fornecedor_id: str | None = None,
               unidade: str = "campinas", user: Actor = Depends(current_actor),
               db: Session = Depends(session)):
    from pathlib import Path
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.utils import simpleSplit
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfgen import canvas
    start, end = parsed_dates(inicio, fim)
    _, p = filters(db, user, unidade, start, end, cc_id, categoria, fornecedor_id)
    report = compute(db, p)
    stream = io.BytesIO()
    pdf = canvas.Canvas(stream, pagesize=A4)
    w, h = A4
    pdf.setTitle("Suprimentos — Indicadores")
    font_dir = Path('/usr/share/fonts/truetype/dejavu')
    if (font_dir/'DejaVuSans.ttf').exists() and (font_dir/'DejaVuSans-Bold.ttf').exists():
        if 'SupSans' not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont('SupSans', str(font_dir/'DejaVuSans.ttf')))
            pdfmetrics.registerFont(TTFont('SupSansBold', str(font_dir/'DejaVuSans-Bold.ttf')))
        regular,bold='SupSans','SupSansBold'
    else:
        regular,bold='Helvetica','Helvetica-Bold'
    page = 1
    def page_head():
        pdf.setFillColorRGB(.04,.18,.20); pdf.rect(0,h-90,w,90,fill=1,stroke=0)
        pdf.setFillColorRGB(1,1,1); pdf.setFont(bold,16)
        pdf.drawString(42,h-46,"Suprimentos - Indicadores")
        pdf.setFont(regular,9)
        pdf.drawString(42,h-67,f"Campinas  |  {start:%d/%m/%Y} a {end:%d/%m/%Y}  |  {date.today():%d/%m/%Y}")
        pdf.setFillColorRGB(.36,.43,.46); pdf.setFont(regular,8)
        pdf.drawString(42,28,"Fonte: banco Suprimentos da unidade. Valores conforme filtros do relatório.")
        pdf.drawRightString(w-42,28,f"Página {page}")
        pdf.setFillColorRGB(.05,.17,.19)
        return h-112
    y = page_head()
    def line(value, font=None, size=8, gap=12):
        nonlocal y,page
        font = font or regular
        value = str(value)
        for part in simpleSplit(value,font,size,w-84) or [""]:
            if y < 51:
                pdf.showPage(); page += 1; y = page_head()
            pdf.setFont(font,size); pdf.drawString(42,y,part); y -= gap
    for key,title in (("lead_solicitacao","Lead time solicitação → entrega"),
                      ("lead_oc","Lead time OC → recebimento"),
                      ("sla","SLA por nível"),("consumo","Consumo / curva ABC"),
                      ("estoque","Valor, giro e cobertura"),("iqf","IQF por fornecedor/mês"),
                      ("economia","Economia de cotação"),
                      ("pedidos_atrasados","Pedidos atrasados"),("itens_zerados","Itens zerados")):
        if y < 90:
            pdf.showPage(); page += 1; y = page_head()
        line(title,bold,11,16)
        line("Fonte e regra: "+report["fontes"][key],regular,7,11)
        rows = report[key] if isinstance(report[key],list) else [report[key]]
        if not rows:
            line("Sem registros no período.")
        for idx,row in enumerate(rows,1):
            def display(value):
                if value is None: return "—"
                if isinstance(value, (Decimal,float)):
                    return f"{float(value):,.2f}".replace(",","_").replace(".",",").replace("_",".")
                return str(value)
            line(f"{idx}. "+"  |  ".join(f"{name.replace('_',' ')}: {display(value)}" for name,value in row.items()))
        y -= 12
    pdf.save()
    return Response(stream.getvalue(), media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=suprimentos-indicadores.pdf"})

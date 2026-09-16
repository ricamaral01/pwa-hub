import html
import logging
from datetime import datetime

from jinja2 import Template

import config

logger = logging.getLogger("pcp_producao_agent")


def fmt_pct(value):
    return f"{value * 100:.1f}%".replace(".", ",")


def fmt_num(value, digits=0):
    return f"{value:,.{digits}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def status_badge(status):
    normalized = str(status or "").upper()
    if normalized in ("REALIZADO", "CONFERE"):
        return "realizado"
    if normalized in ("NÃO PRODUZIDO", "NÃƒO PRODUZIDO", "NAO APONTADO", "NÃO APONTADO", "NÃO REALIZADO"):
        return "nao-produzido"
    if normalized == "PARCIAL":
        return "parcial"
    if normalized == "EXCEDENTE":
        return "excedente"
    if normalized in ("NÃO PROGRAMADO", "NÃƒO PROGRAMADO", "NAO INFORMADO"):
        return "nao-programado"
    return "warn"


def point_color(point, meta, current_label):
    if point["label"] == current_label:
        return "#0f172a"
    if point["pct"] <= meta:
        return "#10b981"
    if point["pct"] <= 0.15:
        return "#f59e0b"
    if point["pct"] <= 0.30:
        return "#ef4444"
    return "#7f1d1d"


def line_chart(points, meta, width, height, current_label):
    if not points:
        return ""
    left, right, top, bottom = 48, 78, 30, 40
    plot_w = width - left - right
    plot_h = height - top - bottom
    max_pct = max(0.40, max(p["pct"] for p in points) * 1.15, meta * 1.4)
    coords = []
    for i, p in enumerate(points):
        x = left + plot_w * i / max(1, len(points) - 1)
        y = top + plot_h - (p["pct"] / max_pct * plot_h)
        coords.append((x, y, p))

    poly = " ".join(f"{x:.1f},{y:.1f}" for x, y, _ in coords)
    area = f"M{poly.replace(' ', ' L')} L{coords[-1][0]:.1f},{top + plot_h:.1f} L{coords[0][0]:.1f},{top + plot_h:.1f} Z"
    grid = []
    for mark in (0, 0.10, 0.25, 0.40):
        y = top + plot_h - (mark / max_pct * plot_h)
        grid.append(f'<line x1="{left}" y1="{y:.1f}" x2="{width - right}" y2="{y:.1f}" stroke="#e2e8f0" stroke-dasharray="2 2"/>')
        grid.append(f'<text x="{left - 8}" y="{y + 5:.1f}" text-anchor="end" font-size="12" fill="#94a3b8">{fmt_pct(mark)}</text>')
    meta_y = top + plot_h - (meta / max_pct * plot_h)
    circles, labels, dates = [], [], []
    for x, y, p in coords:
        color = point_color(p, meta, current_label)
        radius = 6.5 if p["label"] == current_label else 5.5
        circles.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{radius}" fill="{color}" stroke="#fff" stroke-width="2"/>')
        labels.append(f'<text x="{x:.1f}" y="{max(16, y - 12):.1f}" text-anchor="middle" font-size="14" font-weight="600" fill="{color}">{html.escape(fmt_pct(p["pct"]))}</text>')
        dates.append(f'<text x="{x:.1f}" y="{height - 12}" text-anchor="middle" font-size="13" fill="#64748b">{html.escape(p["label"])}</text>')

    return f"""<svg viewBox="0 0 {width} {height}" style="width:100%;height:auto">
<defs><linearGradient id="areaFill{width}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ef4444" stop-opacity=".22"/><stop offset="100%" stop-color="#ef4444" stop-opacity=".02"/></linearGradient></defs>
{''.join(grid)}<line x1="{left}" y1="{meta_y:.1f}" x2="{width - 12}" y2="{meta_y:.1f}" stroke="#10b981" stroke-dasharray="5 3" stroke-width="1.8"/>
<rect x="{width - 116}" y="8" width="104" height="22" rx="6" fill="#f0fdf4" stroke="#bbf7d0"/>
<line x1="{width - 106}" y1="19" x2="{width - 82}" y2="19" stroke="#10b981" stroke-dasharray="5 3" stroke-width="1.8"/>
<text x="{width - 16}" y="23" text-anchor="end" font-size="13" font-weight="600" fill="#15803d">meta {fmt_pct(meta)}</text>
<path d="{area}" fill="url(#areaFill{width})"/><polyline points="{poly}" fill="none" stroke="#dc2626" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
{''.join(circles)}{''.join(labels)}{''.join(dates)}</svg>"""


def stacked_bar_chart(points):
    if not points:
        return ""
    left, base, plot_h, width = 56, 340, 270, 900
    max_total = max(250, max(p["total"] for p in points))
    gap = 18
    bar_w = max(22, (width - left - 28 - gap * (len(points) - 1)) / max(1, len(points)))
    grid = []
    for mark in (0, 50, 100, 150, 200, 250):
        y = base - (mark / max_total * plot_h)
        grid.append(f'<line x1="{left - 8}" y1="{y:.1f}" x2="880" y2="{y:.1f}" stroke="#e2e8f0" stroke-dasharray="2 2"/><text x="44" y="{y + 5:.1f}" text-anchor="end" font-size="13" fill="#94a3b8">{mark}</text>')
    groups = []
    for i, p in enumerate(points):
        x = left + i * (bar_w + gap)
        ok = p["total"] - p["fora_padrao"]
        bad = p["fora_padrao"]
        ok_h = ok / max_total * plot_h
        bad_h = bad / max_total * plot_h
        ok_y = base - ok_h
        bad_y = ok_y - bad_h
        bad_label = ""
        if bad:
            if bad_h >= 32:
                bad_label = f'<text x="{x + bar_w / 2:.1f}" y="{bad_y + bad_h / 2 - 5:.1f}" text-anchor="middle" font-size="13" font-weight="600" fill="#fff">{bad}</text><text x="{x + bar_w / 2:.1f}" y="{bad_y + bad_h / 2 + 10:.1f}" text-anchor="middle" font-size="11" fill="#fee2e2">{fmt_pct(p["pct"])}</text>'
            else:
                bad_label = f'<text x="{x + bar_w / 2:.1f}" y="{bad_y + min(14, max(10, bad_h)):.1f}" text-anchor="middle" font-size="11" font-weight="600" fill="#fff">{fmt_pct(p["pct"])}</text>'
        groups.append(f"""<g><rect x="{x:.1f}" y="{ok_y:.1f}" width="{bar_w:.1f}" height="{ok_h:.1f}" fill="#1e40af"/>
<rect x="{x:.1f}" y="{bad_y:.1f}" width="{bar_w:.1f}" height="{bad_h:.1f}" fill="#be123c" rx="4"/>
<text x="{x + bar_w / 2:.1f}" y="{max(16, bad_y - 12):.1f}" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">{p["total"]}</text>
<text x="{x + bar_w / 2:.1f}" y="{ok_y + ok_h / 2 - 8:.1f}" text-anchor="middle" font-size="13" font-weight="600" fill="#fff">{ok}</text>
<text x="{x + bar_w / 2:.1f}" y="{ok_y + ok_h / 2 + 8:.1f}" text-anchor="middle" font-size="12" fill="#dbeafe">{fmt_pct(ok / p["total"]) if p["total"] else "0,0%"}</text>
{bad_label}<text x="{x + bar_w / 2:.1f}" y="366" text-anchor="middle" font-size="13" fill="#64748b">{html.escape(p["label"])}</text></g>""")
    return f'<svg viewBox="0 0 900 380" style="width:100%;height:auto">{"".join(grid)}{"".join(groups)}</svg>'


def build_divergencias_por_setor(data):
    divergencias = []
    for setor_nome, stats in data.get("setores", {}).items():
        cobrar_pcp, cobrar_encarregado, cobrar_apontador = [], [], []
        for row in stats.get("rows", []):
            p = row["programado"]
            r = row["realizado_encarregado"]
            produzido = row["produzido"]
            if p == 0 and produzido > 0:
                cobrar_pcp.append({**row, "peso": produzido, "motivo": f"Produzido {produzido}, mas PCP programou 0. Verificar programação, código ou cadastro."})
            if p > 0 and r != p:
                cobrar_encarregado.append({**row, "peso": abs(r - p), "motivo": f"PCP programou {p}, mas encarregado lançou R {r}. Diferença no R: {r - p:+d}."})
            if r != produzido:
                cobrar_apontador.append({**row, "peso": abs(produzido - r), "motivo": f"Encarregado lançou R {r}, mas Supabase tem {produzido}. Conferir apontamento no Mapa de Concretagem."})
            elif p > 0 and produzido < p:
                cobrar_apontador.append({**row, "peso": p - produzido, "motivo": f"PCP programou {p}, porém Supabase tem {produzido}. Falta {p - produzido} peça(s)."})
        if cobrar_pcp or cobrar_encarregado or cobrar_apontador or stats.get("diferenca") != 0:
            divergencias.append({
                "setor": setor_nome,
                "programado": stats["programado"],
                "realizado_encarregado": stats["realizado_encarregado"],
                "produzido": stats["produzido"],
                "diferenca": stats["diferenca"],
                "cobrar_pcp": sorted(cobrar_pcp, key=lambda r: r["peso"], reverse=True),
                "cobrar_encarregado": sorted(cobrar_encarregado, key=lambda r: r["peso"], reverse=True),
                "cobrar_apontador": sorted(cobrar_apontador, key=lambda r: r["peso"], reverse=True)[:12],
            })
    return divergencias


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatório PCP x Produção e Qualidade - {{ q.data }}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#ececec;color:#111827;padding:16px;line-height:1.5}.toggle-bar{max-width:1180px;margin:0 auto 16px;background:#fff;border-radius:10px;padding:10px 14px;display:flex;gap:8px;align-items:center}.toggle-btn{border:1px solid #d4d4d4;background:#fff;border-radius:8px;padding:8px 14px;font:inherit;font-size:13px;cursor:pointer}.toggle-btn.active{background:#0f172a;color:#fff;border-color:#0f172a}.view{display:none}.view.active{display:block}.page{background:#fff;border-radius:12px;overflow:hidden;margin:0 auto}.view-whatsapp .page{max-width:560px}.view-desktop .page{max-width:1180px}.header{background:#0f172a;color:#fff;padding:20px}.view-desktop .header{display:flex;justify-content:space-between;align-items:end;padding:28px 40px}.brand{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:6px}h1{font-size:18px;font-weight:600}.view-desktop h1{font-size:26px}.gen{font-size:12px;color:#94a3b8;margin-top:6px}.section{padding:20px;border-bottom:8px solid #f5f5f5}.view-desktop .section{padding:32px 40px;border-bottom:1px solid #f1f5f9}.tag{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;margin-bottom:4px}.title{font-size:17px;font-weight:650;margin-bottom:14px}.view-desktop .title{font-size:20px}.subtitle{font-size:12px;color:#64748b;margin-top:-8px;margin-bottom:14px;font-style:italic}.hero{display:flex;align-items:baseline;gap:10px;margin-bottom:4px}.num{font-size:48px;font-weight:650;line-height:1}.view-desktop .num{font-size:72px}.delta{display:inline-flex;gap:4px;font-size:12px;padding:2px 8px;border-radius:10px;font-weight:600;background:#fef2f2;color:#b91c1c}.meta{font-size:13px;color:#64748b;margin-bottom:12px}.ratio-bar{display:flex;height:24px;border-radius:4px;overflow:hidden;margin:12px 0 6px}.part{display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff}.ok-fill{background:#10b981}.bad-fill{background:#ef4444}.labels{display:flex;justify-content:space-between;font-size:11px;color:#64748b}.alert{background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #dc2626;border-radius:8px;padding:14px 16px;margin-top:16px}.alert strong{color:#991b1b;font-weight:600}.alert p{font-size:13px;color:#7f1d1d;margin-top:6px}.sector-card{border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:10px}.sector-card.warn{border-color:#fcd34d;background:#fffbeb}.sector-card.ok{border-color:#a7f3d0;background:#f0fdf4}.sector-head{display:flex;gap:10px;align-items:center}.sector-head .name{font-weight:650;flex:1}.pct{font-weight:650}.forms{margin-top:8px;padding-top:8px;border-top:1px dashed #e2e8f0}.form{display:flex;gap:10px;padding:6px 0;font-size:12px}.code{background:#fff;border:1px solid #e2e8f0;border-radius:4px;padding:2px 8px;font-family:Consolas,monospace}.desc{flex:1;color:#475569}.type-list{display:grid;gap:8px}.type-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;font-size:13px}.type-row.def{background:#fff7f7;border-color:#fecaca}.type-row.ok{background:#f7fefb;border-color:#bbf7d0}.type-main{display:flex;align-items:center;gap:10px;min-width:0}.type-name{font-weight:650}.type-metrics{display:flex;align-items:baseline;gap:10px;margin-left:auto;font-variant-numeric:tabular-nums}.type-count{min-width:28px;text-align:right;font-weight:700}.type-percent{min-width:48px;text-align:right;color:#475569}.insight{display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px}.badge{display:inline-flex;gap:4px;align-items:center;border-radius:12px;padding:3px 8px;font-size:11px;font-weight:650;white-space:nowrap}.badge.ok{background:#d1fae5;color:#065f46}.badge.def{background:#fee2e2;color:#991b1b}.badge.warn{background:#fef3c7;color:#92400e}.badge.realizado{background:#dcfce7;color:#166534;border:1px solid #86efac}.badge.nao-produzido{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}.badge.parcial{background:#fef3c7;color:#92400e;border:1px solid #fcd34d}.badge.excedente{background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe}.badge.nao-programado{background:#ede9fe;color:#5b21b6;border:1px solid #ddd6fe}.empty{margin-top:12px;padding:12px;background:#f0fdf4;color:#15803d;border-radius:8px;text-align:center;font-size:13px}.kpis,.op-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.view-desktop .kpis{grid-template-columns:repeat(4,1fr);gap:12px}.view-desktop .op-grid{grid-template-columns:repeat(5,1fr);gap:10px}.kpi,.op-card{background:#f8fafc;border-radius:8px;padding:12px;border:1px solid #eef2f7}.kpi .lbl,.op-card .lbl{font-size:11px;color:#64748b;text-transform:uppercase;font-weight:650}.kpi .val,.op-card .val{font-size:22px;font-weight:700}.chart{margin-top:12px;background:#fafafa;border-radius:8px;padding:16px 12px 8px;overflow-x:auto}.legend{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:10px;font-size:11px;color:#64748b}.dot{width:8px;height:8px;border-radius:50%;display:inline-block}.exec-grid,.two-col,.div-grid{display:grid;gap:20px}.view-desktop .exec-grid{grid-template-columns:320px 1fr}.view-desktop .two-col,.view-desktop .div-grid{grid-template-columns:1fr 1fr}.div-card{border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;padding:14px}.div-card h3{font-size:15px;margin-bottom:4px}.div-card h4{font-size:11px;text-transform:uppercase;color:#64748b;margin:10px 0 4px}.div-card li{font-size:12px;margin-left:16px;margin-bottom:4px;color:#334155}.table-wrap{overflow-x:auto;margin-top:12px}.data-table{width:100%;border-collapse:collapse;font-size:12px}.data-table th{background:#f8fafc;color:#64748b;text-align:left;font-size:10px;text-transform:uppercase;font-weight:700;padding:10px;border-bottom:1px solid #e2e8f0;white-space:nowrap}.data-table td{border-bottom:1px solid #eef2f7;padding:10px}.num-cell{text-align:right;font-variant-numeric:tabular-nums}.status-REALIZADO{background:#fff}.status-PARCIAL{background:#fffbeb}.status-EXCEDENTE{background:#eff6ff}.status-NÃO\\ PRODUZIDO,.status-NÃƒO\\ PRODUZIDO{background:#fff5f5}.status-NÃO\\ PROGRAMADO,.status-NÃƒO\\ PROGRAMADO{background:#faf5ff}.pcp-sector-card{position:relative;background:#fff;border:1px solid #dbe5f1;border-radius:18px;padding:28px 32px 22px;margin:22px 0;box-shadow:0 14px 34px rgba(15,23,42,.08);overflow:hidden}.pcp-sector-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:7px;background:#2563eb}.pcp-sector-head{display:flex;align-items:center;gap:18px;margin-bottom:14px}.pcp-sector-icon{width:56px;height:56px;border:1px solid #93c5fd;border-radius:12px;display:grid;place-items:center;color:#2563eb;background:#f8fbff;box-shadow:0 6px 18px rgba(37,99,235,.16);font-size:28px}.pcp-sector-title{font-size:30px;font-weight:800;color:#0b2f55;letter-spacing:0}.sector-metrics{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:0 0 20px 74px}.metric-chip{height:44px;display:inline-flex;align-items:center;gap:10px;background:#fff;border:1px solid #dbe5f1;border-radius:11px;padding:0 14px;color:#15416f;box-shadow:0 3px 10px rgba(15,65,111,.04)}.metric-chip .metric-icon{color:#2563eb;font-size:18px}.metric-chip .metric-label{font-size:13px;color:#334155}.metric-chip .metric-value{font-size:20px;font-weight:800;color:#2563eb}.metric-chip.item-count{margin-left:auto;background:#eaf2ff;border-color:#dbeafe}.pcp-table-wrap{border:1px solid #dbe5f1;border-radius:12px;overflow-x:auto;box-shadow:0 8px 22px rgba(15,23,42,.05)}.pcp-table{min-width:980px;table-layout:fixed}.pcp-table th{height:54px;background:linear-gradient(135deg,#15416F 0%,#0d3560 100%);color:#fff;border-bottom:0;font-size:11px;letter-spacing:.02em}.pcp-table th:first-child{border-top-left-radius:10px}.pcp-table th:last-child{border-top-right-radius:10px}.pcp-table td{height:56px;color:#111827;font-size:13px;font-weight:600}.pcp-table tbody tr:nth-child(even):not(.status-NÃO\\ PRODUZIDO):not(.status-NÃƒO\\ PRODUZIDO){background:#fbfdff}.pcp-table tbody tr:hover{background:#f2f7ff}.pcp-table .col-model{width:28%;text-align:left}.pcp-table .col-code{width:12%;text-align:center}.pcp-table .col-num{width:15%;text-align:center}.pcp-table .col-diff{width:10%;text-align:center}.pcp-table .col-status{width:15%;text-align:center}.model-cell{display:flex;align-items:center;gap:12px}.model-icon{width:34px;height:34px;display:grid;place-items:center;border:1px solid #dbeafe;border-radius:9px;color:#2563eb;background:#fff;font-size:17px;flex:0 0 auto}.diff-zero{color:#111827}.diff-neg{color:#dc2626!important;font-weight:800}.diff-pos{color:#2563eb!important;font-weight:800}.badge.realizado:before{content:"✓";display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;background:#16a34a;color:#fff;font-size:11px}.badge.nao-produzido:before{content:"×";display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;background:#ef4444;color:#fff;font-size:12px}.badge.parcial:before{content:"!";display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;background:#f59e0b;color:#fff;font-size:11px}@media(max-width:900px){.pcp-sector-card{padding:22px 18px}.sector-metrics{margin-left:0}.metric-chip.item-count{margin-left:0}.pcp-sector-title{font-size:24px}}.footer{background:#f8fafc;color:#94a3b8;font-size:11px;padding:14px 20px;text-align:center}.view-desktop .footer{display:flex;justify-content:space-between;text-align:left;padding:20px 40px}@media(max-width:760px){.view-desktop .exec-grid,.view-desktop .two-col,.view-desktop .kpis,.view-desktop .op-grid,.view-desktop .div-grid{grid-template-columns:1fr}.toggle-bar{overflow:auto}.form,.type-main{flex-wrap:wrap}.type-row{align-items:flex-start}}
.pcp-table{min-width:1000px}.pcp-table th,.pcp-table td{padding-left:10px;padding-right:10px}.pcp-table th{white-space:normal;line-height:1.25}.pcp-table .col-model{width:20%}.pcp-table .col-code{width:8%}.pcp-table .col-num{width:10%}.pcp-table .col-diff{width:12%}.pcp-table .col-status{width:15%}
</style></head><body>
<div class="toggle-bar"><span class="tag">Visualização:</span><button class="toggle-btn active" data-view="whatsapp">WhatsApp</button><button class="toggle-btn" data-view="desktop">Desktop / Apresentação</button></div>
{% macro alert_block() %}{% if q.outlier %}<div class="alert"><strong>{{ q.outlier.setor }} concentrou {{ pct(q.outlier.share) }} dos desvios do dia</strong><p>{{ q.outlier.fora_padrao }} de {{ q.day_bad }} desvios vieram de {{ q.outlier.label }}. Investigar se é problema real de processo ou erro de classificação/parametrização.</p></div>{% endif %}{% endmacro %}
{% macro ratio() %}<div class="ratio-bar"><div class="part ok-fill" style="width:{{ q.ok_width }}%">{{ pct(q.ok_ratio) }} padrão</div><div class="part bad-fill" style="width:{{ q.bad_width }}%">{{ pct(q.day_pct) }}</div></div><div class="labels"><span>{{ q.day_ok }} formas conformes</span><span>{{ q.day_bad }} desvios</span></div>{% endmacro %}
{% macro operational_kpis() %}<div class="op-grid"><div class="op-card"><div class="lbl">PCP Programado (P)</div><div class="val">{{ total_programado }}</div><div class="meta">Programado pelo PCP</div></div><div class="op-card"><div class="lbl">PCP Realizado (R)</div><div class="val">{{ total_realizado_encarregado }}</div><div class="meta">Lançado na planilha</div></div><div class="op-card"><div class="lbl">Fábrica/Supabase</div><div class="val">{{ total_produzido }}</div><div class="meta">Apontado no mapa</div></div><div class="op-card"><div class="lbl">Diferença Fábrica x R</div><div class="val" style="color:{{ '#2563eb' if diferenca_total >= 0 else '#dc2626' }}">{{ '%+d' | format(diferenca_total) }}</div><div class="meta">Fábrica - Realizado</div></div><div class="op-card"><div class="lbl">Aderência</div><div class="val">{{ num(aderencia_pct, 1) }}%</div><div class="meta">Fábrica / Realizado</div></div></div>{% endmacro %}
{% macro sector_cards() %}{% if q.outlier %}<div class="subtitle">Incluindo {{ q.outlier.setor }} na análise; alerta mantido acima por concentração de desvios.</div>{% endif %}{% for s in q.visible_sectors %}<div class="sector-card {{ 'warn' if s.fora_padrao else 'ok' }}"><div class="sector-head"><span class="name">{{ s.label }}</span><span class="pct">{{ pct(s.pct) }}</span></div><div class="meta">{{ s.fora_padrao }} desvio(s) em {{ s.total }} formas · {{ num(s.volume_fora_padrao, 2) }} m³ fora do padrão</div>{% if s.formas %}<div class="forms">{% for f in s.formas %}<div class="form"><span class="code">{{ f.codigo }}</span><span class="desc">{{ f.descricao }}</span><span>{{ num(f.volume, 2) }} m³</span></div>{% endfor %}</div>{% endif %}</div>{% endfor %}{% endmacro %}
{% macro day_types() %}<div class="type-list">{% for t in q.day_types %}<div class="type-row {{ 'def' if t.fora_padrao else 'ok' }}"><div class="type-main"><span class="badge {{ 'def' if t.fora_padrao else 'ok' }}">{{ 'Desvio' if t.fora_padrao else 'Padrão' }}</span><span class="type-name">{{ t.tipo }}</span></div><div class="type-metrics"><span class="type-count">{{ t.total }}</span><span class="type-percent">{{ pct(t.total / q.day_types_total) }}</span></div></div>{% endfor %}</div>{% endmacro %}
{% macro divergence_cards(limit=None) %}{% set setores_div = divergencias_por_setor[:limit] if limit else divergencias_por_setor %}{% if setores_div %}<div class="div-grid">{% for d in setores_div %}<div class="div-card"><h3>{{ d.setor }}</h3><div class="meta">P {{ d.programado }} · R {{ d.realizado_encarregado }} · Fábrica {{ d.produzido }} · Dif. {{ '%+d' | format(d.diferenca) }}</div>{% if d.cobrar_pcp %}<h4>Cobrar PCP / cadastro</h4><ul>{% for item in d.cobrar_pcp[:6] %}<li>{{ item.codigo }} · {{ item.modelo }}: {{ item.motivo }}</li>{% endfor %}</ul>{% endif %}{% if d.cobrar_encarregado %}<h4>Cobrar encarregado</h4><ul>{% for item in d.cobrar_encarregado[:6] %}<li>{{ item.codigo }} · {{ item.modelo }}: {{ item.motivo }}</li>{% endfor %}</ul>{% endif %}{% if d.cobrar_apontador %}<h4>Conferir apontamento</h4><ul>{% for item in d.cobrar_apontador[:6] %}<li>{{ item.codigo }} · {{ item.modelo }}: {{ item.motivo }}</li>{% endfor %}</ul>{% endif %}</div>{% endfor %}</div>{% else %}<div class="empty">Nenhuma divergência operacional relevante.</div>{% endif %}{% endmacro %}
{% macro massada_table(limit=None) %}{% set rows = massada_problems[:limit] if limit else massada_problems %}{% if rows %}<div class="table-wrap"><table class="data-table"><thead><tr><th>Hora</th><th>Setor</th><th>Forma</th><th>Modelo</th><th>Tipo concreto</th><th>Apontador</th><th>Problema</th></tr></thead><tbody>{% for r in rows %}<tr><td>{{ r.hora }}</td><td>{{ r.setor }}</td><td>{{ r.forma }}</td><td>{{ r.modelo }}</td><td>{{ r.tipo_concreto }}</td><td>{{ r.apontador }}</td><td>{{ r.problema }}</td></tr>{% endfor %}</tbody></table></div>{% else %}<div class="empty">Nenhuma forma/massada com problema encontrada por este critério.</div>{% endif %}{% endmacro %}
{% macro sector_tables() %}{% for setor_nome, stats in setores.items() %}<div class="pcp-sector-card"><div class="pcp-sector-head"><div class="pcp-sector-icon"><i class="ti ti-building-factory-2"></i></div><h2 class="pcp-sector-title">{{ setor_nome }}</h2></div><div class="sector-metrics"><div class="metric-chip"><i class="ti ti-calendar-stats metric-icon"></i><span class="metric-label">Programado</span><span class="metric-value">{{ stats.programado }}</span></div><div class="metric-chip"><i class="ti ti-clipboard-check metric-icon"></i><span class="metric-label">Realizado planilha</span><span class="metric-value">{{ stats.realizado_encarregado }}</span></div><div class="metric-chip"><i class="ti ti-building-factory metric-icon"></i><span class="metric-label">Fábrica</span><span class="metric-value">{{ stats.produzido }}</span></div><div class="metric-chip"><i class="ti ti-target-arrow metric-icon"></i><span class="metric-label">Aderência</span><span class="metric-value">{{ num(stats.aderencia_pct, 1) }}%</span></div><div class="metric-chip item-count"><i class="ti ti-layers-subtract metric-icon"></i><span class="metric-value">{{ stats.rows|length }}</span><span class="metric-label">itens</span></div></div><div class="pcp-table-wrap"><table class="data-table pcp-table"><thead><tr><th class="col-model">Modelo</th><th class="col-code">Código</th><th class="col-num">Programado (P)</th><th class="col-num">Realizado PCP (R)</th><th class="col-num">Fábrica</th><th class="col-diff">Desvio R x Fábrica</th><th class="col-status">Conferência P x R</th><th class="col-status">Conferência R x Fábrica</th></tr></thead><tbody>{% for row in stats.rows %}<tr class="status-{{ row.status_realizado_fabrica }}"><td class="col-model"><div class="model-cell"><span class="model-icon"><i class="ti ti-cube"></i></span><span>{{ row.modelo }}</span></div></td><td class="col-code">{{ row.codigo }}</td><td class="col-num">{{ row.programado }}</td><td class="col-num">{{ row.realizado_encarregado }}</td><td class="col-num">{{ row.produzido }}</td><td class="col-diff {{ 'diff-neg' if row.diferenca < 0 else 'diff-pos' if row.diferenca > 0 else 'diff-zero' }}">{{ '%+d' | format(row.diferenca) if row.diferenca else '0' }}</td><td class="col-status"><span class="badge {{ status_badge(row.status_programado_realizado) }}">{{ row.status_programado_realizado }}</span></td><td class="col-status"><span class="badge {{ status_badge(row.status_realizado_fabrica) }}">{{ row.status_realizado_fabrica }}</span></td></tr>{% else %}<tr><td colspan="8">Nenhuma atividade ou planejamento registrado.</td></tr>{% endfor %}</tbody></table></div>{% if stats.desvios_detalhes %}<div class="alert" style="margin-top:16px"><strong>Resumo:</strong><p>{{ stats.resumo_geral }}</p><ul style="margin-left:18px;margin-top:6px">{% for desvio in stats.desvios_detalhes[:8] %}<li>{{ desvio }}</li>{% endfor %}</ul></div>{% endif %}</div>{% endfor %}{% endmacro %}
{% macro month_block(desktop=False) %}<div class="kpis"><div class="kpi"><div class="lbl">Total</div><div class="val">{{ q.month_total }}</div><div class="meta">formas · {{ num(q.month_volume, 1) }} m³</div></div><div class="kpi"><div class="lbl">Fora padrão</div><div class="val" style="color:#ef4444">{{ pct(q.month_pct) }}</div><div class="meta">{{ q.month_bad }} formas</div></div><div class="kpi"><div class="lbl">Média/dia</div><div class="val">{{ num(q.avg_day, 0) }}</div><div class="meta">com {{ num(q.avg_bad_day, 0) }} desvios/dia</div></div><div class="kpi"><div class="lbl">Meta</div><div class="val">{{ pct(q.meta) }}</div><div class="meta">{{ q.meta_label }}</div></div></div><div class="chart"><div class="title">Fechamento diário · padrão x fora do padrão</div>{{ stacked_svg }}</div><div class="chart"><div class="title">Evolução diária · % fora do padrão</div>{{ line_svg_desktop if desktop else line_svg_mobile }}<div class="legend"><span><span class="dot" style="background:#7f1d1d"></span> pico crítico</span><span><span class="dot" style="background:#ef4444"></span> acima da meta</span><span><span class="dot" style="background:#f59e0b"></span> melhor dia</span><span><span class="dot" style="background:#0f172a"></span> dia atual</span></div></div><div class="chart"><div class="title">Fechamento diário · incluindo Setor 3</div>{{ stacked_svg_incluindo_setor3 }}</div><div class="chart"><div class="title">Evolução diária · incluindo Setor 3</div>{{ line_svg_desktop_incluindo_setor3 if desktop else line_svg_mobile_incluindo_setor3 }}</div>{% endmacro %}
<div class="view view-whatsapp active" id="view-whatsapp"><div class="page"><div class="header"><div class="brand">Concrefer · {{ unidade }} · PCP x Produção + Qualidade</div><h1>Relatório do dia {{ q.data }}</h1><div class="gen">Gerado {{ data_geracao }} às {{ hora_geracao }}</div></div><div class="section"><div class="tag">Resumo executivo</div><div class="title">{{ q.titulo }}</div><div class="hero"><span class="num">{{ pct(q.day_pct).replace(',0%', '%') }}</span><span class="delta">{{ q.delta_label }}</span></div><div class="meta">{{ q.day_bad }} formas fora do padrão de {{ q.day_total }} produzidas · {{ num(q.day_volume_bad, 2) }} m³</div>{{ ratio() }}{{ alert_block() }}</div><div class="section"><div class="tag">PCP x Produção</div><div class="title">Resumo operacional</div>{{ operational_kpis() }}</div><div class="section"><div class="tag">Por setor · dia {{ q.data_curta }}</div><div class="title">Concentração de desvios</div>{{ sector_cards() }}</div><div class="section"><div class="tag">Por tipo · dia {{ q.data_curta }}</div><div class="title">Detalhamento dos desvios</div>{{ day_types() }}</div><div class="section"><div class="tag">Divergências</div><div class="title">Responsáveis por conferência</div>{{ divergence_cards(2) }}</div><div class="section"><div class="tag">Massadas</div><div class="title">Formas com problema</div>{{ massada_table(20) }}</div><div class="section"><div class="tag">Mês corrente · {{ q.mes_ano }}</div><div class="title">Consolidado 01 a {{ q.data_curta }}</div>{{ month_block(False) }}</div><div class="footer">Concrefer · Sistema ConcreTrack · Enviado pelo Kartrak Agent<br>Dúvidas: Ricardo (Gerência) · {{ data_geracao }} {{ hora_geracao }}</div></div></div>
<div class="view view-desktop" id="view-desktop"><div class="page"><div class="header"><div><div class="brand">Concrefer · {{ unidade }} · PCP x Produção + Qualidade</div><h1>Relatório do dia {{ q.data }}</h1></div><div class="gen" style="text-align:right"><div style="font-size:24px;color:#fff;font-weight:650">{{ q.data_curta }}</div>Gerado {{ data_geracao }} às {{ hora_geracao }}</div></div><div class="section"><div class="exec-grid"><div><div class="tag">Resumo executivo</div><div class="title">{{ q.titulo }}</div><div class="hero"><span class="num">{{ pct(q.day_pct).replace(',0%', '%') }}</span></div><span class="delta">{{ q.delta_label }}</span><div class="meta">{{ q.day_bad }} de {{ q.day_total }} formas · {{ num(q.day_volume_bad, 2) }} m³</div>{{ ratio() }}</div><div>{{ alert_block() }}</div></div></div><div class="section"><div class="tag">PCP x Produção</div><div class="title">Resumo operacional</div>{{ operational_kpis() }}</div><div class="section two-col"><div><div class="tag">Por setor · dia {{ q.data_curta }}</div><div class="title">Concentração de desvios</div>{{ sector_cards() }}</div><div><div class="tag">Por tipo · dia {{ q.data_curta }}</div><div class="title">Detalhamento dos desvios</div>{{ day_types() }}</div></div><div class="section"><div class="tag">Divergências operacionais</div><div class="title">Quem precisa conferir o quê</div>{{ divergence_cards() }}</div><div class="section"><div class="tag">Massadas / liberação</div><div class="title">Formas com problema</div>{{ massada_table() }}</div><div class="section"><div class="tag">Mês corrente · {{ q.mes_ano }}</div><div class="title">Consolidado 01 a {{ q.data_curta }}</div>{{ month_block(True) }}<div class="table-wrap"><table class="data-table"><thead><tr><th>Tipo</th><th>Classificação</th><th class="num-cell">Qtd</th><th class="num-cell">% total</th><th class="num-cell">Volume</th><th class="num-cell">Vol %</th><th>Status</th></tr></thead><tbody>{% for t in q.month_types %}<tr><td>{{ t.tipo }}</td><td><span class="badge {{ 'def' if t.fora_padrao else 'ok' }}">{{ 'Desvio' if t.fora_padrao else 'Padrão' }}</span></td><td class="num-cell">{{ t.total }}</td><td class="num-cell">{{ pct(t.total / q.month_total) if q.month_total else '0%' }}</td><td class="num-cell">{{ num(t.volume, 2) }} m³</td><td class="num-cell">{{ pct(t.volume / q.month_volume) if q.month_volume else '0%' }}</td><td class="num-cell"><span class="badge {{ 'def' if t.fora_padrao else 'ok' }}">{{ 'Defeito' if t.fora_padrao else 'Conforme' }}</span></td></tr>{% endfor %}</tbody></table></div></div><div class="section"><div class="tag">Detalhe completo antigo</div><div class="title">Tabelas PCP x Produção por setor</div>{{ sector_tables() }}</div><div class="footer"><div>Concrefer · Sistema ConcreTrack · Enviado pelo Kartrak Agent</div><div>Dúvidas: Ricardo (Gerência) · {{ data_geracao }} {{ hora_geracao }}</div></div></div></div><script>const buttons=document.querySelectorAll(".toggle-btn");const views=document.querySelectorAll(".view");buttons.forEach(btn=>btn.addEventListener("click",()=>{const target=btn.dataset.view;buttons.forEach(b=>b.classList.toggle("active",b===btn));views.forEach(v=>v.classList.toggle("active",v.id==="view-"+target));}));</script></body></html>"""


class HtmlReportGenerator:
    def generate(self, data, date_str):
        now = datetime.now()
        q = data["qualidade"]
        q["ok_ratio"] = (q["day_ok"] / q["day_total"]) if q["day_total"] else 0
        q["bad_width"] = max(6, q["day_pct"] * 100) if q["day_bad"] else 0
        q["ok_width"] = 100 - q["bad_width"]
        if q["day_pct"] > q["meta"] and q["meta"]:
            q["delta_label"] = f"{q['day_pct'] / q['meta']:.0f}x acima da meta {fmt_pct(q['meta'])}"
        else:
            q["delta_label"] = f"dentro da meta {fmt_pct(q['meta'])}"
        q["meta_label"] = "nenhum dia atingiu" if q["insights"] and q["insights"][0].startswith("Nenhum") else "há dias dentro da meta"
        q["day_types_total"] = max(1, sum(t["total"] for t in q["day_types"]))
        q["day_types_bad"] = sum(t["fora_padrao"] for t in q["day_types"])

        context = {
            "q": q,
            "unidade": "Ribeirão",
            "data_geracao": now.strftime("%d/%m/%Y"),
            "hora_geracao": now.strftime("%H:%M"),
            "pct": fmt_pct,
            "num": fmt_num,
            "line_svg_mobile": line_chart(q["daily_points"], q["meta"], 480, 200, q["data_curta"]),
            "line_svg_desktop": line_chart(q["daily_points"], q["meta"], 900, 300, q["data_curta"]),
            "stacked_svg": stacked_bar_chart(q["daily_points"]),
            "line_svg_mobile_incluindo_setor3": line_chart(q["daily_points_incluindo_setor3"], q["meta"], 480, 200, q["data_curta"]),
            "line_svg_desktop_incluindo_setor3": line_chart(q["daily_points_incluindo_setor3"], q["meta"], 900, 300, q["data_curta"]),
            "stacked_svg_incluindo_setor3": stacked_bar_chart(q["daily_points_incluindo_setor3"]),
            "total_programado": data["total_programado"],
            "total_realizado_encarregado": data["total_realizado_encarregado"],
            "total_produzido": data["total_produzido"],
            "diferenca_total": data["diferenca_total"],
            "aderencia_pct": data["aderencia_pct"],
            "setores": data["setores"],
            "divergencias_por_setor": build_divergencias_por_setor(data),
            "massada_problems": data.get("massada_problems", []),
            "status_badge": status_badge,
        }

        logger.info("Renderizando relatório combinado PCP x Produção + Qualidade...")
        html_content = Template(HTML_TEMPLATE).render(context)
        filepath = config.REPORTS_DIR / f"relatorio_pcp_producao_{date_str}.html"
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(html_content)
        logger.info(f"Relatório HTML criado com sucesso em: {filepath}")
        return str(filepath)

from __future__ import annotations

import html
import sys
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / "pcp_producao_agent"))

import config  # noqa: E402


VOLUME_POR_LANCAMENTO_M3 = 0.25
REPORT_DIR = ROOT / "relatorios" / "defeitos-concreto"
REPORT_DIR.mkdir(parents=True, exist_ok=True)


@dataclass(frozen=True)
class MonthSpec:
    key: str
    label: str
    start: str
    end: str


AVAILABLE_MONTHS = {
    "2026-06": MonthSpec("2026-06", "Junho/2026", "2026-06-01", "2026-06-30"),
    "2026-07": MonthSpec("2026-07", "Julho/2026", "2026-07-01", "2026-07-31"),
    "2026-08": MonthSpec("2026-08", "Agosto/2026", "2026-08-01", "2026-08-31"),
}

MONTHS = list(AVAILABLE_MONTHS.values())


def fetch_month_rows(month: MonthSpec) -> list[dict]:
    headers = {
        "apikey": config.SUPABASE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_KEY}",
    }

    rows: list[dict] = []
    offset = 0
    limit = 1000
    while True:
        params = [
            ("data_fabricacao", f"gte.{month.start}"),
            ("data_fabricacao", f"lte.{month.end}"),
            ("select", "id,data_fabricacao,tipo_concreto,setor,forma,modelo,status"),
            ("order", "data_fabricacao.asc"),
            ("limit", str(limit)),
            ("offset", str(offset)),
        ]
        response = requests.get(f"{config.SUPABASE_URL}/rest/v1/producao", headers=headers, params=params, timeout=30)
        response.raise_for_status()
        batch = response.json()
        rows.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
    return rows


def normalize_tipo(value: str | None) -> str:
    tipo = (value or "Sem tipo").strip()
    if tipo == "Padrão":
        return "Concreto Padrão"
    if tipo == "Concreto Seco - Vibrado":
        return "Concreto Vibrado"
    return tipo


def classify_tipo(tipo: str) -> tuple[str, str]:
    if tipo == "Concreto Padrão":
        return "Padrão", "conforme"
    if tipo == "Concreto Vibrado":
        return "Sub-tipo", "normal"
    if tipo == "Teste Lab.":
        return "Teste", "normal"
    return "Defeito", "defeito"


def fmt_int(value: int) -> str:
    return f"{value:,}".replace(",", ".")


def fmt_pct(value: float) -> str:
    return f"{value:.2f}".replace(".", ",") + " %"


def fmt_m3(value: float) -> str:
    return f"{value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") + " m³"


def pct(part: float | int, total: float | int) -> float:
    return (part / total * 100) if total else 0.0


def build_month_summary(month: MonthSpec, rows: list[dict]) -> dict:
    latest_by_form = {}
    for row in rows:
        key = (
            row.get("data_fabricacao") or "",
            (row.get("setor") or "").strip(),
            (row.get("forma") or "").strip().upper(),
        )
        if not key[2]:
            continue
        if key not in latest_by_form or (row.get("data_hora") or "") > (latest_by_form[key].get("data_hora") or ""):
            latest_by_form[key] = row

    raw_total = len(rows)
    duplicate_extra = raw_total - len(latest_by_form)
    rows = list(latest_by_form.values())

    counter = Counter(normalize_tipo(row.get("tipo_concreto")) for row in rows)

    june_reallocation_note = ""
    if month.key == "2026-06" and counter.get("Fora de Padrão", 0):
        fora_padrao = counter["Fora de Padrão"]
        exsudado_add = (fora_padrao + 1) // 2
        vibrado_add = fora_padrao // 2
        counter["Concreto Exsudado"] += exsudado_add
        counter["Concreto Vibrado"] += vibrado_add
        counter["Fora de Padrão"] = 0
        june_reallocation_note = (
            f"Junho: {fora_padrao} ocorrências 'Fora de Padrão' redistribuídas somente para este mês: "
            f"{exsudado_add} em Concreto Exsudado e {vibrado_add} em Concreto Vibrado."
        )

    total = sum(counter.values())
    total_volume = total * VOLUME_POR_LANCAMENTO_M3

    padrao = counter.get("Concreto Padrão", 0)
    nao_padrao = total - padrao

    detail_order = [
        "Concreto Vibrado",
        "Fora de Padrão",
        "Concreto Exsudado",
        "Concreto Segregado",
        "Teste Lab.",
        "Sem tipo",
    ]
    detail_rows = []
    for tipo in detail_order:
        count = counter.get(tipo, 0)
        if not count:
            continue
        classificacao, status = classify_tipo(tipo)
        detail_rows.append(
            {
                "tipo": tipo,
                "classificacao": classificacao,
                "status": status,
                "count": count,
                "pct": pct(count, total),
                "volume": count * VOLUME_POR_LANCAMENTO_M3,
                "vol_pct": pct(count * VOLUME_POR_LANCAMENTO_M3, total_volume),
            }
        )

    setor_rows = []
    setores = sorted({(row.get("setor") or "Sem setor").strip() or "Sem setor" for row in rows})
    for setor in setores:
        setor_counter = Counter(normalize_tipo(row.get("tipo_concreto")) for row in rows if ((row.get("setor") or "Sem setor").strip() or "Sem setor") == setor)
        setor_total = sum(setor_counter.values())
        setor_padrao = setor_counter.get("Concreto Padrão", 0)
        setor_nao_padrao = setor_total - setor_padrao
        setor_rows.append(
            {
                "setor": setor,
                "total": setor_total,
                "padrao": setor_padrao,
                "nao_padrao": setor_nao_padrao,
                "nao_padrao_pct": pct(setor_nao_padrao, setor_total),
                "volume_total": setor_total * VOLUME_POR_LANCAMENTO_M3,
                "volume_defeito": setor_nao_padrao * VOLUME_POR_LANCAMENTO_M3,
            }
        )

    return {
        "month": month,
        "raw_total": raw_total,
        "duplicate_extra": duplicate_extra,
        "june_reallocation_note": june_reallocation_note,
        "total": total,
        "total_volume": total_volume,
        "padrao": padrao,
        "nao_padrao": nao_padrao,
        "padrao_pct": pct(padrao, total),
        "nao_padrao_pct": pct(nao_padrao, total),
        "padrao_volume": padrao * VOLUME_POR_LANCAMENTO_M3,
        "nao_padrao_volume": nao_padrao * VOLUME_POR_LANCAMENTO_M3,
        "detail_rows": detail_rows,
        "setor_rows": setor_rows,
    }


def bar(width: float, color: str) -> str:
    width = max(0.0, min(100.0, width))
    return f'<span class="bar"><span style="width:{width:.2f}%; background:{color};"></span></span>'


def row_html(label: str, classification: str, count: int, pct_value: float, volume: float, vol_pct: float, status: str, *, child=False) -> str:
    is_defect = status == "defeito"
    is_warning = status == "normal"
    color = "#ef4444" if is_defect else "#f59e0b" if is_warning else "#2563eb"
    status_label = "Defeito" if is_defect else "Normal" if is_warning else "Conforme"
    status_class = "defeito" if is_defect else "normal" if is_warning else "conforme"
    classification_class = "defeito" if is_defect else ("normal" if classification in ("Não Padrão", "Sub-tipo", "Teste") else "padrao")
    return f"""
      <tr class="{'child' if child else ''} {'defect-row' if is_defect else ''}">
        <td class="tipo">{'↳ ' if child else ''}{html.escape(label)}</td>
        <td><span class="pill {classification_class}">{html.escape(classification)}</span></td>
        <td class="metric"><strong>{fmt_int(count)}</strong>{bar(pct_value, color)}</td>
        <td>{fmt_pct(pct_value)}</td>
        <td class="volume {'red' if is_defect else 'orange' if is_warning else 'green'}">{fmt_m3(volume)}</td>
        <td>{fmt_pct(vol_pct)}{bar(vol_pct, color)}</td>
        <td><span class="status {status_class}">{status_label}</span></td>
      </tr>
    """


def month_table(summary: dict) -> str:
    total = summary["total"]
    total_volume = summary["total_volume"]
    rows = [
        row_html("Concreto Padrão", "Padrão", summary["padrao"], summary["padrao_pct"], summary["padrao_volume"], pct(summary["padrao_volume"], total_volume), "conforme"),
        row_html("Não Padrão", "Não Padrão", summary["nao_padrao"], summary["nao_padrao_pct"], summary["nao_padrao_volume"], pct(summary["nao_padrao_volume"], total_volume), "normal"),
    ]
    for item in summary["detail_rows"]:
        rows.append(row_html(item["tipo"], item["classificacao"], item["count"], item["pct"], item["volume"], item["vol_pct"], item["status"], child=True))
    rows.append(
        f"""
      <tr class="total-row">
        <td class="tipo">Total de Lançamentos</td>
        <td><span class="pill total">Total</span></td>
        <td class="metric"><strong>{fmt_int(total)}</strong>{bar(100, "#0f172a")}</td>
        <td>{fmt_pct(100)}</td>
        <td class="volume">{fmt_m3(total_volume)}</td>
        <td>{fmt_pct(100)}{bar(100, "#0f172a")}</td>
        <td><span class="status total">Base</span></td>
      </tr>
    """
    )
    return "\n".join(rows)


def sector_table(summary: dict) -> str:
    rows = []
    for item in summary["setor_rows"]:
        status_class = "defeito" if item["nao_padrao_pct"] >= 15 else "normal" if item["nao_padrao"] else "conforme"
        status_label = "Atenção" if status_class == "defeito" else "Monitorar" if status_class == "normal" else "Conforme"
        rows.append(
            f"""
            <tr>
              <td class="tipo">{html.escape(item["setor"])}</td>
              <td>{fmt_int(item["total"])}</td>
              <td>{fmt_int(item["padrao"])}</td>
              <td class="bad">{fmt_int(item["nao_padrao"])}</td>
              <td class="bad">{fmt_pct(item["nao_padrao_pct"])}</td>
              <td>{fmt_m3(item["volume_total"])}</td>
              <td class="bad">{fmt_m3(item["volume_defeito"])}</td>
              <td><span class="status {status_class}">{status_label}</span></td>
            </tr>
            """
        )
    return "\n".join(rows)


def comparison_table_html(summaries: list[dict]) -> str:
    # Hierarchy:
    # 1. Concreto Padrão
    # 2. Não Padrão
    #    ↳ Concreto Vibrado
    #    ↳ Concreto Exsudado
    #    ↳ Concreto Segregado
    #    ↳ Teste Lab.
    # 3. Total Geral
    hierarchy = [
        {"tipo": "Concreto Padrão", "is_child": False, "category": "padrao"},
        {"tipo": "Não Padrão", "is_child": False, "category": "nao_padrao"},
        {"tipo": "Concreto Vibrado", "is_child": True, "category": "subtipo"},
        {"tipo": "Concreto Exsudado", "is_child": True, "category": "defeito"},
        {"tipo": "Concreto Segregado", "is_child": True, "category": "defeito"},
        {"tipo": "Teste Lab.", "is_child": True, "category": "teste"},
    ]

    prev_summary = summaries[-2] if len(summaries) >= 2 else summaries[0]
    curr_summary = summaries[-1]

    # Calculate totals
    totals_by_month = [s["total"] for s in summaries]

    rows = []
    for item in hierarchy:
        t = item["tipo"]
        is_child = item["is_child"]
        cat = item["category"]

        counts = []
        for s in summaries:
            if t == "Concreto Padrão":
                cnt = s["padrao"]
            elif t == "Não Padrão":
                cnt = s["nao_padrao"]
            else:
                match = next((x for x in s["detail_rows"] if x["tipo"] == t), None)
                cnt = match["count"] if match else 0
            counts.append(cnt)

        # Delta (Julho -> Agosto)
        cnt_prev = counts[-2] if len(counts) >= 2 else counts[0]
        cnt_curr = counts[-1]
        delta = cnt_curr - cnt_prev
        delta_pct = ((delta / cnt_prev) * 100) if cnt_prev else (100.0 if cnt_curr else 0.0)
        delta_vol = delta * VOLUME_POR_LANCAMENTO_M3

        # Trend coloring logic
        if t == "Concreto Padrão":
            trend_class = "trend-pos" if delta >= 0 else "trend-neg"
            arrow = "▲" if delta > 0 else "▼" if delta < 0 else "="
        elif cat == "defeito":
            # For real defects, reduction is positive (green), increase is critical (red)
            trend_class = "trend-pos" if delta < 0 else "trend-neg" if delta > 0 else "trend-neu"
            arrow = "▼" if delta < 0 else "▲" if delta > 0 else "="
        elif cat == "subtipo":
            trend_class = "trend-warn" if delta > 0 else "trend-pos" if delta < 0 else "trend-neu"
            arrow = "▲" if delta > 0 else "▼" if delta < 0 else "="
        elif t == "Não Padrão":
            trend_class = "trend-warn" if delta > 0 else "trend-pos" if delta < 0 else "trend-neu"
            arrow = "▲" if delta > 0 else "▼" if delta < 0 else "="
        else:
            trend_class = "trend-neu"
            arrow = "▲" if delta > 0 else "▼" if delta < 0 else "="

        sign = "+" if delta > 0 else ""
        sign_pct = "+" if delta_pct > 0 else ""
        vol_str = fmt_m3(abs(delta_vol))
        if delta_vol < 0:
            vol_str = f"-{vol_str}"
        elif delta_vol > 0:
            vol_str = f"+{vol_str}"

        # Category pill
        if cat == "padrao":
            pill = '<span class="pill padrao">Padrão</span>'
        elif cat == "nao_padrao":
            pill = '<span class="pill normal">Não Padrão</span>'
        elif cat == "defeito":
            pill = '<span class="pill defeito">Defeito</span>'
        elif cat == "subtipo":
            pill = '<span class="pill normal">Sub-tipo</span>'
        else:
            pill = '<span class="pill normal">Teste</span>'

        cols_html = "".join(f'<td class="cell-num">{fmt_int(c)}</td>' for c in counts)

        row_classes = []
        if is_child:
            row_classes.append("row-child")
        if cat == "defeito":
            row_classes.append("row-defect")
        elif not is_child:
            row_classes.append("row-parent")

        class_attr = f' class="{" ".join(row_classes)}"' if row_classes else ""
        prefix = '<span class="tree-branch">↳</span> ' if is_child else ""

        rows.append(f"""
        <tr{class_attr}>
          <td class="cell-tipo">{prefix}<strong>{html.escape(t)}</strong></td>
          <td class="cell-cat">{pill}</td>
          {cols_html}
          <td class="cell-delta {trend_class}"><span class="delta-badge {trend_class}">{arrow} {sign}{fmt_int(delta)}</span></td>
          <td class="cell-delta {trend_class}"><span class="delta-badge {trend_class}">{sign_pct}{delta_pct:.1f}%</span></td>
          <td class="cell-vol {trend_class}">{vol_str}</td>
        </tr>
        """)

    # Total Row
    tot_prev = totals_by_month[-2]
    tot_curr = totals_by_month[-1]
    tot_delta = tot_curr - tot_prev
    tot_delta_pct = (tot_delta / tot_prev * 100) if tot_prev else 0.0
    tot_vol = tot_delta * VOLUME_POR_LANCAMENTO_M3
    tot_sign = "+" if tot_delta > 0 else ""
    tot_sign_pct = "+" if tot_delta_pct > 0 else ""
    tot_vol_str = fmt_m3(abs(tot_vol))
    if tot_vol < 0:
        tot_vol_str = f"-{tot_vol_str}"
    elif tot_vol > 0:
        tot_vol_str = f"+{tot_vol_str}"

    total_cols = "".join(f'<td class="cell-num"><strong>{fmt_int(t_val)}</strong></td>' for t_val in totals_by_month)

    total_row = f"""
    <tr class="row-total">
      <td class="cell-tipo" colspan="2"><strong>TOTAL DE FORMAS PRODUZIDAS</strong></td>
      {total_cols}
      <td class="cell-delta"><span class="delta-badge trend-neu">{tot_sign}{fmt_int(tot_delta)}</span></td>
      <td class="cell-delta"><span class="delta-badge trend-neu">{tot_sign_pct}{tot_delta_pct:.1f}%</span></td>
      <td class="cell-vol">{tot_vol_str}</td>
    </tr>
    """

    th_months = "".join(f'<th class="th-month">{s["month"].label.split("/")[0].upper()}</th>' for s in summaries)
    prev_label = prev_summary["month"].label.split("/")[0].upper()
    curr_label = curr_summary["month"].label.split("/")[0].upper()

    return f"""
    <div class="table-container presentation-card">
      <div class="table-header-block">
        <div>
          <h2 class="section-title">Comparação Mês a Mês</h2>
          <div class="section-sub">Evolução do volume de formas e desvios ({prev_label} → {curr_label})</div>
        </div>
        <div class="legend-pills">
          <span class="legend-item"><span class="dot-indicator dot-good"></span> Melhoria / Redução Defeito</span>
          <span class="legend-item"><span class="dot-indicator dot-warn"></span> Variação de Sub-tipo</span>
          <span class="legend-item"><span class="dot-indicator dot-bad"></span> Atenção / Queda Padrão</span>
        </div>
      </div>
      <table class="presentation-table">
        <thead>
          <tr class="th-group-row">
            <th rowspan="2" class="th-tipo">Tipo de Concreto</th>
            <th rowspan="2" class="th-cat">Classificação</th>
            <th colspan="{len(summaries)}" class="th-group text-center">Volume Histórico (Formas Únicas)</th>
            <th colspan="3" class="th-group th-group-delta text-center">Evolução ({prev_label} → {curr_label})</th>
          </tr>
          <tr class="th-sub-row">
            {th_months}
            <th class="th-delta">Δ Lançamentos</th>
            <th class="th-delta">Δ %</th>
            <th class="th-delta">Δ Volume</th>
          </tr>
        </thead>
        <tbody>
          {''.join(rows)}
          {total_row}
        </tbody>
      </table>
    </div>
    """


def render_report(
    current_summaries: list[dict],
    all_history_summaries: list[dict],
    title: str,
    subtitle: str
) -> str:
    generated_at = datetime.now().strftime("%d/%m/%Y %H:%M")
    
    # Top KPI Cards: Show each month with clear presentation layout
    cards_html = []
    for s in all_history_summaries:
        m_name = s["month"].label.split("/")[0]
        is_latest = s == all_history_summaries[-1]
        card_class = "card card-featured" if is_latest else "card"
        cards_html.append(f"""
        <div class="{card_class}">
          <div class="card-header">
            <span class="card-title">{m_name} / 2026</span>
            {'<span class="badge-curr">Mês Atual</span>' if is_latest else ''}
          </div>
          <div class="card-metrics">
            <div class="metric-main">
              <span class="metric-val">{fmt_int(s["total"])}</span>
              <span class="metric-lbl">Formas Únicas</span>
            </div>
            <div class="metric-sec">
              <span class="metric-val text-warn">{fmt_int(s["nao_padrao"])}</span>
              <span class="metric-lbl">Não Padrão ({fmt_pct(s["nao_padrao_pct"])})</span>
            </div>
          </div>
          <div class="card-bar">
            <div class="card-bar-inner" style="width:{s['padrao_pct']:.1f}%"></div>
          </div>
          <div class="card-foot">
            <span>{fmt_pct(s['padrao_pct'])} Padrão</span>
            <span>{fmt_m3(s['total_volume'])}</span>
          </div>
        </div>
        """)

    # Notes
    notes = []
    for s in all_history_summaries:
        note_text = f"<strong>{s['month'].label}:</strong> {fmt_int(s['raw_total'])} registros brutos auditados ({fmt_int(s['duplicate_extra'])} duplicadas descartadas) → <strong>{fmt_int(s['total'])}</strong> formas únicas."
        if s.get("june_reallocation_note"):
            note_text += f" {s['june_reallocation_note']}"
        notes.append(note_text)

    # Monthly sections for current_summaries
    month_sections = []
    for s in current_summaries:
        month_sections.append(f"""
        <div class="presentation-card">
          <h2 class="section-title">{s['month'].label} — Detalhamento por Tipo</h2>
          <table class="presentation-table">
            <thead>
              <tr>
                <th class="th-tipo">Tipo de Concreto</th>
                <th class="th-cat">Classificação</th>
                <th class="th-num">Qtd. Lançamentos</th>
                <th class="th-num">% do Total</th>
                <th class="th-num">Volume Estimado</th>
                <th class="th-num">Vol. % Total</th>
                <th class="th-status">Status</th>
              </tr>
            </thead>
            <tbody>{month_table(s)}</tbody>
          </table>
        </div>

        <div class="presentation-card">
          <h2 class="section-title">{s['month'].label} — Resumo por Setor</h2>
          <table class="presentation-table">
            <thead>
              <tr>
                <th class="th-tipo">Setor</th>
                <th class="th-num">Total Formas</th>
                <th class="th-num">Padrão</th>
                <th class="th-num">Defeitos / Não Padrão</th>
                <th class="th-num">% Não Padrão</th>
                <th class="th-num">Volume Total</th>
                <th class="th-num">Volume Desvio</th>
                <th class="th-status">Status</th>
              </tr>
            </thead>
            <tbody>{sector_table(s)}</tbody>
          </table>
        </div>
        """)

    # Comparison section
    comparison_section = comparison_table_html(all_history_summaries)

    return f"""<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{html.escape(title)}</title>
  <style>
    :root {{
      --text: #0f172a;
      --text-muted: #64748b;
      --line: #e2e8f0;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --blue: #2563eb;
      --blue-subtle: #eff6ff;
      --orange: #f59e0b;
      --orange-subtle: #fffbeb;
      --red: #ef4444;
      --red-subtle: #fef2f2;
      --green: #10b981;
      --green-subtle: #f0fdf4;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 32px 24px;
      font-feature-settings: "cv02", "cv03", "cv04", "cv11";
      -webkit-font-smoothing: antialiased;
    }}
    .wrap {{ max-width: 1240px; margin: 0 auto; }}

    /* Header */
    header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 28px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #fff;
      padding: 24px 32px;
      border-radius: 18px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.15);
    }}
    header h1 {{ margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; }}
    header .sub {{ color: #94a3b8; font-weight: 500; font-size: 14px; margin-top: 6px; }}
    header .header-meta {{ text-align: right; color: #cbd5e1; font-size: 12px; font-weight: 600; }}

    /* Cards Grid */
    .cards-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 18px;
      margin-bottom: 28px;
    }}
    .card {{
      background: var(--card-bg);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
      transition: transform 0.2s, box-shadow 0.2s;
    }}
    .card:hover {{ transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06); }}
    .card-featured {{ border: 2px solid var(--blue); background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); }}
    .card-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }}
    .card-title {{ font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }}
    .badge-curr {{ background: #dbeafe; color: var(--blue); font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 999px; text-transform: uppercase; }}
    .card-metrics {{ display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }}
    .metric-main .metric-val {{ font-size: 28px; font-weight: 800; color: var(--text); display: block; }}
    .metric-main .metric-lbl {{ font-size: 12px; color: var(--text-muted); font-weight: 600; }}
    .metric-sec {{ text-align: right; }}
    .metric-sec .metric-val {{ font-size: 18px; font-weight: 700; display: block; }}
    .metric-sec .metric-lbl {{ font-size: 11px; color: var(--text-muted); font-weight: 600; }}
    .text-warn {{ color: var(--orange); }}
    .card-bar {{ height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 10px; }}
    .card-bar-inner {{ height: 100%; background: var(--blue); border-radius: 999px; }}
    .card-foot {{ display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: var(--text-muted); }}

    /* Presentation Card & Containers */
    .presentation-card {{
      background: var(--card-bg);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
      margin-bottom: 28px;
      overflow: hidden;
    }}
    .table-header-block {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
      flex-wrap: wrap;
      gap: 12px;
    }}
    .section-title {{ font-size: 18px; font-weight: 800; letter-spacing: -0.02em; margin: 0; color: #0f172a; }}
    .section-sub {{ font-size: 13px; color: var(--text-muted); font-weight: 500; margin-top: 4px; }}

    /* Legend */
    .legend-pills {{ display: flex; gap: 14px; font-size: 12px; font-weight: 600; color: var(--text-muted); }}
    .legend-item {{ display: flex; align-items: center; gap: 6px; }}
    .dot-indicator {{ width: 8px; height: 8px; border-radius: 50%; }}
    .dot-good {{ background: var(--green); }}
    .dot-warn {{ background: var(--orange); }}
    .dot-bad {{ background: var(--red); }}

    /* Tables */
    .presentation-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      font-variant-numeric: tabular-nums;
    }}
    .presentation-table th {{
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.06em;
      padding: 12px 14px;
      border-top: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
    }}
    .th-group-row th {{ background: #f1f5f9; font-size: 11px; border-bottom: none; }}
    .th-sub-row th {{ background: #f8fafc; padding-top: 8px; padding-bottom: 8px; }}
    .th-group-delta {{ background: #ede9fe; color: #5b21b6; }}
    .th-tipo {{ text-align: left; width: 24%; }}
    .th-cat {{ text-align: center; width: 11%; }}
    .th-month {{ text-align: right; width: 11%; }}
    .th-delta {{ text-align: right; width: 11%; }}
    .th-num {{ text-align: right; }}
    .th-status {{ text-align: center; }}
    .text-center {{ text-align: center !important; }}

    .presentation-table td {{
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }}
    .cell-tipo {{ text-align: left; font-weight: 600; color: #1e293b; }}
    .cell-cat {{ text-align: center; }}
    .cell-num {{ text-align: right; font-weight: 700; color: #0f172a; }}
    .cell-delta {{ text-align: right; font-weight: 700; }}
    .cell-vol {{ text-align: right; font-weight: 700; color: #334155; }}

    /* Row Highlights */
    .row-parent {{ background: #ffffff; font-size: 14px; }}
    .row-parent td {{ padding-top: 14px; padding-bottom: 14px; border-top: 1px solid #f1f5f9; }}
    .row-child {{ background: #fbfcfe; color: var(--text-muted); }}
    .row-child .cell-tipo {{ padding-left: 28px; font-weight: 500; }}
    .row-defect {{ background: #fffaf9; }}
    .row-total {{ background: #f8fafc; font-weight: 900; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; }}
    .row-total td {{ padding: 14px; font-size: 13px; }}

    .tree-branch {{ color: #94a3b8; font-family: monospace; font-size: 14px; margin-right: 4px; }}

    /* Badges & Delta Pills */
    .pill, .status {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      padding: 4px 10px;
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    .pill.padrao {{ background: #dbeafe; color: #1d4ed8; }}
    .pill.normal {{ background: #f1f5f9; color: #475569; }}
    .pill.defeito {{ background: #fee2e2; color: #dc2626; }}
    .status.conforme {{ background: #d1fae5; color: #047857; }}
    .status.normal {{ background: #fef3c7; color: #b45309; }}
    .status.defeito {{ background: #fee2e2; color: #dc2626; }}

    .delta-badge {{
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 800;
    }}
    .delta-badge.trend-pos {{ background: #d1fae5; color: #047857; }}
    .delta-badge.trend-warn {{ background: #fef3c7; color: #b45309; }}
    .delta-badge.trend-neg {{ background: #fee2e2; color: #dc2626; }}
    .delta-badge.trend-neu {{ background: #f1f5f9; color: #475569; }}

    .trend-pos {{ color: #059669; }}
    .trend-warn {{ color: #d97706; }}
    .trend-neg {{ color: #dc2626; }}
    .trend-neu {{ color: #64748b; }}

    .metric {{ min-width: 170px; }}
    .bar {{ display: inline-block; width: 90px; height: 6px; margin-left: 10px; background: #e2e8f0; border-radius: 999px; vertical-align: middle; overflow: hidden; }}
    .bar span {{ display: block; height: 100%; border-radius: 999px; }}
    .volume.green {{ color: #059669; }} .volume.orange {{ color: #d97706; }} .volume.red {{ color: #dc2626; }}
    .good {{ color: #059669; font-weight: 800; }} .bad {{ color: #dc2626; font-weight: 800; }} .neutral {{ color: #64748b; font-weight: 800; }}

    .note {{
      background: #ffffff;
      border-left: 4px solid var(--orange);
      padding: 14px 18px;
      border-radius: 12px;
      color: #334155;
      font-weight: 500;
      font-size: 13px;
      margin-bottom: 24px;
      line-height: 1.6;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
    }}

    @media(max-width: 900px) {{
      body {{ padding: 14px; }}
      .cards-grid {{ grid-template-columns: 1fr; }}
      .presentation-table {{ font-size: 12px; }}
      .presentation-table th, .presentation-table td {{ padding: 8px 6px; }}
    }}
  </style>
</head>
<body>
<div class="wrap">
  <header>
    <div>
      <h1>{html.escape(title)}</h1>
      <div class="sub">{html.escape(subtitle)}</div>
    </div>
    <div class="header-meta">
      <div>RELATÓRIO EXECUTIVO</div>
      <div style="margin-top:4px; opacity:0.8;">{generated_at}</div>
    </div>
  </header>

  <div class="cards-grid">
    {''.join(cards_html)}
  </div>

  <div class="note">
    <strong>Critério de consolidação:</strong> Cada lançamento é contado como <strong>forma única por data + setor + forma</strong>, usando o registro mais recente em caso de duplicidade. Volume estimado: <strong>0,25 m³ por forma única</strong>.<br>
    {'<br>'.join(notes)}
  </div>

  {comparison_section}

  {''.join(month_sections)}
</div>
</body>
</html>"""



def generate_reports() -> None:
    # 1. Fetch data for all available months
    summaries_by_key = {}
    for key, spec in AVAILABLE_MONTHS.items():
        print(f"Buscando dados de {spec.label}...")
        rows = fetch_month_rows(spec)
        summaries_by_key[key] = build_month_summary(spec, rows)

    history_all = [summaries_by_key["2026-06"], summaries_by_key["2026-07"], summaries_by_key["2026-08"]]

    # 2. Generate August/2026 report with full historical comparison & cards
    output_august = REPORT_DIR / "relatorio_defeitos_concreto_agosto_2026.html"
    html_august = render_report(
        current_summaries=[summaries_by_key["2026-08"]],
        all_history_summaries=history_all,
        title="Relatório de Defeitos de Concreto — Agosto/2026",
        subtitle="Consolidado Mensal de Concretagem e Comparativo com Meses Anteriores"
    )
    output_august.write_text(html_august, encoding="utf-8")
    print(f"Gerado: {output_august}")

    # 3. Generate 3-Month Full Report (Junho + Julho + Agosto)
    output_trimestre = REPORT_DIR / "relatorio_defeitos_concreto_junho_julho_agosto_2026.html"
    html_trimestre = render_report(
        current_summaries=history_all,
        all_history_summaries=history_all,
        title="Relatório de Defeitos de Concreto — Junho a Agosto 2026",
        subtitle="Evolução Mensal e Comparativo Completo de Tipos de Concreto e Desvios"
    )
    output_trimestre.write_text(html_trimestre, encoding="utf-8")
    print(f"Gerado: {output_trimestre}")

    # 4. Update the 2-Month report (Junho x Julho)
    output_jun_jul = REPORT_DIR / "relatorio_defeitos_concreto_junho_julho_2026.html"
    html_jun_jul = render_report(
        current_summaries=[summaries_by_key["2026-06"], summaries_by_key["2026-07"]],
        all_history_summaries=[summaries_by_key["2026-06"], summaries_by_key["2026-07"]],
        title="Relatório de Defeitos de Concreto — Junho x Julho 2026",
        subtitle="Comparativo Mês a Mês — Junho x Julho/2026"
    )
    output_jun_jul.write_text(html_jun_jul, encoding="utf-8")
    print(f"Gerado: {output_jun_jul}")



def main() -> None:
    generate_reports()


if __name__ == "__main__":
    main()


from __future__ import annotations

import argparse
import html
import json
import math
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import requests

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except AttributeError:
    pass

def find_project_root() -> Path:
    """
    Localiza a raiz do projeto independentemente da pasta onde este script
    foi salvo/executado.

    A raiz válida deve conter:
      - pcp_producao_agent/config.py
      - scripts/generate_defeitos_concreto_report.py

    Também pode ser informada explicitamente pela variável de ambiente
    PCP_PRODUCAO_ROOT.
    """
    import os

    script_dir = Path(__file__).resolve().parent
    cwd = Path.cwd().resolve()
    home = Path.home().resolve()

    candidates: list[Path] = []

    # 1) Configuração explícita, se existir.
    env_root = os.getenv("PCP_PRODUCAO_ROOT")
    if env_root:
        candidates.append(Path(env_root).expanduser().resolve())

    # 2) Pasta do próprio script e seus pais.
    candidates.append(script_dir)
    candidates.extend(script_dir.parents)

    # 3) Pasta corrente do terminal e seus pais.
    candidates.append(cwd)
    candidates.extend(cwd.parents)

    # 4) Local padrão já utilizado neste projeto no Windows.
    candidates.extend(
        [
            home / "Documents" / "pwa-hub-fase1",
            home / "Documents" / "pwa-hub",
            home / "Documents" / "pwa-hub-fase1" / "pcp_producao_agent",
        ]
    )

    # Remove duplicados preservando a ordem.
    unique_candidates: list[Path] = []
    seen: set[str] = set()
    for candidate in candidates:
        key = str(candidate).lower()
        if key not in seen:
            seen.add(key)
            unique_candidates.append(candidate)

    def is_root(candidate: Path) -> bool:
        return (
            (candidate / "pcp_producao_agent" / "config.py").is_file()
            and (candidate / "scripts" / "generate_defeitos_concreto_report.py").is_file()
        )

    # Caso o candidato seja diretamente a pasta pcp_producao_agent,
    # testa também seu diretório pai como raiz.
    expanded_candidates: list[Path] = []
    for candidate in unique_candidates:
        expanded_candidates.append(candidate)
        if candidate.name.lower() == "pcp_producao_agent":
            expanded_candidates.append(candidate.parent)

    for candidate in expanded_candidates:
        try:
            if is_root(candidate):
                return candidate
        except OSError:
            continue

    checked = "\n".join(f"  - {p}" for p in expanded_candidates[:20])
    raise RuntimeError(
        "\nNão encontrei a raiz do projeto PCP Produção.\n\n"
        "Este relatório depende de dois arquivos do projeto:\n"
        "  pcp_producao_agent\\config.py\n"
        "  scripts\\generate_defeitos_concreto_report.py\n\n"
        "Locais verificados:\n"
        f"{checked}\n\n"
        "Solução recomendada:\n"
        "1. Confirme que o projeto existe em "
        "C:\\Users\\Admin\\Documents\\pwa-hub-fase1\n"
        "2. Ou defina PCP_PRODUCAO_ROOT apontando para a raiz do projeto."
    )


ROOT = find_project_root()

sys.path.insert(0, str(ROOT / "pcp_producao_agent"))
sys.path.insert(0, str(ROOT / "scripts"))

try:
    import config  # noqa: E402
    import generate_defeitos_concreto_report as monthly  # noqa: E402
except ModuleNotFoundError as exc:
    raise RuntimeError(
        f"Projeto encontrado em {ROOT}, mas não foi possível carregar "
        f"uma dependência Python: {exc}"
    ) from exc

REPORT_DIR = Path(r"C:\Users\Admin\Documents\pwa-hub-fase1\relatorios\defeitos-concreto\diario")
REPORT_DIR.mkdir(parents=True, exist_ok=True)
TZ = ZoneInfo("America/Sao_Paulo")

MONTH_NAMES = {
    1: "Janeiro",
    2: "Fevereiro",
    3: "Março",
    4: "Abril",
    5: "Maio",
    6: "Junho",
    7: "Julho",
    8: "Agosto",
    9: "Setembro",
    10: "Outubro",
    11: "Novembro",
    12: "Dezembro",
}

# Campos mais comuns para data. Se a fonte real usar outro nome, o código
# automaticamente cai no fallback de consulta dia a dia.
ROW_DATE_KEYS = (
    "data",
    "Data",
    "DATA",
    "date",
    "Date",
    "data_concretagem",
    "data_producao",
    "data_apontamento",
    "data_lancamento",
    "created_at",
    "timestamp",
)


def parse_target_date(value: str | None) -> str:
    if not value or value.lower() in {"ontem", "d-1"}:
        return (datetime.now(TZ).date() - timedelta(days=1)).isoformat()
    if value.lower() == "hoje":
        return datetime.now(TZ).date().isoformat()
    datetime.strptime(value, "%Y-%m-%d")
    return value


def month_label(day: date) -> str:
    return f"{MONTH_NAMES[day.month]}/{day.year}"


def month_to_date_bounds(target_date: str) -> tuple[str, str, str]:
    target = datetime.strptime(target_date, "%Y-%m-%d").date()
    start = target.replace(day=1)
    return start.isoformat(), target.isoformat(), month_label(target)


def iter_dates(start: str, end: str):
    current = datetime.strptime(start, "%Y-%m-%d").date()
    finish = datetime.strptime(end, "%Y-%m-%d").date()
    while current <= finish:
        yield current
        current += timedelta(days=1)


def build_summary_for_range(key: str, label: str, start: str, end: str) -> dict:
    spec = monthly.MonthSpec(key, label, start, end)
    rows = monthly.fetch_month_rows(spec)
    return monthly.build_month_summary(spec, rows)


def build_monthly_summaries() -> list[dict]:
    return [
        build_summary_for_range(m.key, m.label, m.start, m.end)
        for m in monthly.MONTHS
    ]


def parse_any_date(value: Any) -> date | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value

    text = str(value).strip()
    if not text:
        return None

    # ISO completo / ISO apenas data.
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date()
    except ValueError:
        pass

    for fmt in (
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%Y/%m/%d",
        "%d/%m/%Y %H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
    ):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def extract_row_date(row: Any) -> date | None:
    if not isinstance(row, dict):
        return None

    for key in ROW_DATE_KEYS:
        if key in row:
            parsed = parse_any_date(row.get(key))
            if parsed:
                return parsed

    # Fallback: tenta qualquer chave cujo nome contenha "data" ou "date".
    for key, value in row.items():
        key_lower = str(key).lower()
        if "data" in key_lower or "date" in key_lower:
            parsed = parse_any_date(value)
            if parsed:
                return parsed
    return None


def empty_daily_summary(day: date) -> dict:
    return {
        "date": day.isoformat(),
        "label": day.strftime("%d/%m"),
        "total": 0,
        "padrao": 0,
        "nao_padrao": 0,
        "nao_padrao_pct": 0.0,
    }


def compact_daily_summary(day: date, summary: dict) -> dict:
    total = int(summary.get("total", 0) or 0)
    padrao = int(summary.get("padrao", 0) or 0)
    nao_padrao = int(summary.get("nao_padrao", 0) or 0)
    pct = (nao_padrao / total * 100.0) if total else 0.0
    return {
        "date": day.isoformat(),
        "label": day.strftime("%d/%m"),
        "total": total,
        "padrao": padrao,
        "nao_padrao": nao_padrao,
        "nao_padrao_pct": pct,
    }


def build_current_month_data(target_date: str) -> tuple[dict, list[dict], str]:
    """
    Busca o mês uma única vez e tenta separar as linhas por data localmente.

    Se não for possível identificar a coluna de data nas linhas retornadas por
    fetch_month_rows(), usa fallback seguro: consulta cada dia separadamente.
    Assim o gráfico não depende do nome exato da coluna da fonte.
    """
    start, end, label = month_to_date_bounds(target_date)
    key = target_date[:7]
    spec = monthly.MonthSpec(key, label, start, end)
    rows = monthly.fetch_month_rows(spec)
    month_summary = monthly.build_month_summary(spec, rows)

    grouped: dict[date, list[dict]] = defaultdict(list)
    parsed_rows = 0
    for row in rows:
        row_date = extract_row_date(row)
        if row_date is not None:
            grouped[row_date].append(row)
            parsed_rows += 1

    daily_series: list[dict] = []
    all_days = list(iter_dates(start, end))

    # Caminho preferencial: uma consulta mensal e agregação local.
    if not rows or parsed_rows > 0:
        for day in all_days:
            day_rows = grouped.get(day, [])
            if not day_rows:
                daily_series.append(empty_daily_summary(day))
                continue

            day_spec = monthly.MonthSpec(
                day.strftime("%Y-%m-%d"),
                day.strftime("%d/%m/%Y"),
                day.isoformat(),
                day.isoformat(),
            )
            day_summary = monthly.build_month_summary(day_spec, day_rows)
            daily_series.append(compact_daily_summary(day, day_summary))
        mode = "agregação local a partir de uma consulta mensal"
        return month_summary, daily_series, mode

    # Fallback: a fonte não expôs uma data identificável nas linhas.
    for day in all_days:
        day_iso = day.isoformat()
        day_summary = build_summary_for_range(day_iso, day.strftime("%d/%m/%Y"), day_iso, day_iso)
        daily_series.append(compact_daily_summary(day, day_summary))

    mode = "fallback de consulta dia a dia"
    return month_summary, daily_series, mode


def fmt_decimal_pt(value: float, decimals: int = 1) -> str:
    return f"{value:.{decimals}f}".replace(".", ",")


def fmt_pct_value(value: float) -> str:
    return f"{fmt_decimal_pt(value)}%"


def build_month_analysis(summary: dict, daily_series: list[dict], label: str) -> list[str]:
    total = int(summary.get("total", 0) or 0)
    padrao = int(summary.get("padrao", 0) or 0)
    nao_padrao = int(summary.get("nao_padrao", 0) or 0)
    pct = (nao_padrao / total * 100.0) if total else 0.0

    productive_days = [row for row in daily_series if row["total"] > 0]
    days_count = len(productive_days)

    analysis = [
        (
            f"No acumulado de {label}, foram registrados <strong>{total}</strong> lançamentos/formas, "
            f"sendo <strong>{padrao}</strong> de concreto padrão e <strong>{nao_padrao}</strong> fora do padrão "
            f"(<strong>{fmt_pct_value(pct)}</strong> do total)."
        )
    ]

    if not productive_days:
        analysis.append("Não há dias com produção registrada no período analisado.")
        return analysis

    avg_total = total / days_count
    avg_nonstandard = nao_padrao / days_count
    worst_count = max(productive_days, key=lambda row: (row["nao_padrao"], row["nao_padrao_pct"], row["date"]))
    worst_pct = max(productive_days, key=lambda row: (row["nao_padrao_pct"], row["nao_padrao"], row["date"]))
    best_pct = min(productive_days, key=lambda row: (row["nao_padrao_pct"], -row["total"], row["date"]))

    analysis.append(
        f"Foram identificados <strong>{days_count}</strong> dias com produção, com média de "
        f"<strong>{fmt_decimal_pt(avg_total)}</strong> lançamentos/dia e "
        f"<strong>{fmt_decimal_pt(avg_nonstandard)}</strong> fora do padrão/dia."
    )
    analysis.append(
        f"O maior volume diário de ocorrências fora do padrão foi em <strong>{worst_count['label']}</strong>: "
        f"<strong>{worst_count['nao_padrao']}</strong> registros de um total de {worst_count['total']}."
    )
    analysis.append(
        f"A maior taxa diária de fora do padrão ocorreu em <strong>{worst_pct['label']}</strong>: "
        f"<strong>{fmt_pct_value(worst_pct['nao_padrao_pct'])}</strong>."
    )
    analysis.append(
        f"A menor taxa diária de fora do padrão entre os dias produtivos foi em <strong>{best_pct['label']}</strong>: "
        f"<strong>{fmt_pct_value(best_pct['nao_padrao_pct'])}</strong>."
    )

    # Compara as duas metades dos dias produtivos para dar uma leitura de direção.
    if days_count >= 4:
        split = days_count // 2
        first = productive_days[:split]
        second = productive_days[split:]

        first_total = sum(r["total"] for r in first)
        first_bad = sum(r["nao_padrao"] for r in first)
        second_total = sum(r["total"] for r in second)
        second_bad = sum(r["nao_padrao"] for r in second)
        first_pct = (first_bad / first_total * 100) if first_total else 0.0
        second_pct = (second_bad / second_total * 100) if second_total else 0.0
        delta = second_pct - first_pct

        if abs(delta) < 0.05:
            trend_text = "permaneceu praticamente estável"
        elif delta < 0:
            trend_text = f"melhorou {fmt_pct_value(abs(delta))} p.p."
        else:
            trend_text = f"piorou {fmt_pct_value(delta)} p.p."

        analysis.append(
            f"Comparando a primeira metade com a segunda metade dos dias produtivos, a taxa de fora do padrão "
            f"{trend_text} ({fmt_pct_value(first_pct)} → {fmt_pct_value(second_pct)})."
        )

    return analysis


def build_daily_columns_svg(daily_series: list[dict]) -> str:
    """Gera gráfico SVG empilhado, exibindo somente dias com produção."""
    productive_series = [row for row in daily_series if int(row.get("total", 0) or 0) > 0]
    if not productive_series:
        return '<div class="empty">Sem dias com produção para exibir no gráfico.</div>'

    chart_height = 390
    top = 38
    bottom = 62
    left = 58
    right = 24
    plot_height = chart_height - top - bottom

    # Uma coluna por dia produtivo. Espaçamento cresce apenas quando necessário.
    group_width = 66
    chart_width = max(760, left + right + group_width * len(productive_series))

    # Como as séries são empilhadas, a escala deve considerar o TOTAL diário.
    max_value = max(int(row.get("total", 0) or 0) for row in productive_series)
    max_value = max(max_value, 1)

    # Arredonda o topo da escala para um número agradável.
    step_candidates = (1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000)
    raw_step = max_value / 5
    step = next((candidate for candidate in step_candidates if candidate >= raw_step), step_candidates[-1])
    y_max = max(step * 5, max_value)

    parts: list[str] = [
        f'<svg class="daily-chart" viewBox="0 0 {chart_width} {chart_height}" role="img" '
        f'aria-label="Gráfico diário empilhado de concreto padrão e fora do padrão, somente dias com produção">'
    ]

    # Grade e eixo Y.
    for i in range(6):
        value = y_max - i * (y_max / 5)
        y = top + i * (plot_height / 5)
        parts.append(
            f'<line x1="{left}" y1="{y:.1f}" x2="{chart_width-right}" y2="{y:.1f}" '
            'stroke="#dbe3ec" stroke-width="1" />'
        )
        parts.append(
            f'<text x="{left-10}" y="{y+4:.1f}" text-anchor="end" font-size="11" fill="#64748b">'
            f'{int(round(value))}</text>'
        )

    base_y = top + plot_height
    bar_width = 34

    for idx, row in enumerate(productive_series):
        center_x = left + idx * group_width + group_width / 2
        x = center_x - bar_width / 2

        padrao = int(row.get("padrao", 0) or 0)
        nao_padrao = int(row.get("nao_padrao", 0) or 0)
        total = padrao + nao_padrao
        padrao_pct = (padrao / total * 100.0) if total else 0.0
        nao_padrao_pct = (nao_padrao / total * 100.0) if total else 0.0

        standard_height = (padrao / y_max) * plot_height if y_max else 0
        defect_height = (nao_padrao / y_max) * plot_height if y_max else 0

        standard_y = base_y - standard_height
        defect_y = standard_y - defect_height

        # Padrão na base da coluna.
        if padrao > 0:
            parts.append(
                f'<rect x="{x:.1f}" y="{standard_y:.1f}" width="{bar_width}" height="{standard_height:.1f}" '
                f'fill="#15416F"><title>{html.escape(row["label"])} — Padrão: {padrao}</title></rect>'
            )

        # Fora do padrão empilhado no topo, formando uma única coluna diária.
        if nao_padrao > 0:
            parts.append(
                f'<rect x="{x:.1f}" y="{defect_y:.1f}" width="{bar_width}" height="{defect_height:.1f}" '
                f'rx="3" fill="#A72141"><title>{html.escape(row["label"])} — Fora do padrão: {nao_padrao}</title></rect>'
            )

        # Total no topo da coluna.
        top_y = defect_y if nao_padrao > 0 else standard_y
        parts.append(
            f'<text x="{center_x:.1f}" y="{max(top_y-7, 14):.1f}" text-anchor="middle" '
            f'font-size="11" font-weight="800" fill="#0f172a">{total}</text>'
        )

        # Valores dos segmentos quando houver espaço visual suficiente.
        if padrao > 0 and standard_height >= 36:
            parts.append(
                f'<text x="{center_x:.1f}" y="{standard_y + standard_height/2 - 2:.1f}" text-anchor="middle" '
                f'font-size="10" font-weight="800" fill="#ffffff">{padrao}</text>'
            )
            parts.append(
                f'<text x="{center_x:.1f}" y="{standard_y + standard_height/2 + 11:.1f}" text-anchor="middle" '
                f'font-size="8.5" font-weight="800" fill="#dbeafe">{fmt_pct_value(padrao_pct)}</text>'
            )

        if nao_padrao > 0 and defect_height >= 30:
            parts.append(
                f'<text x="{center_x:.1f}" y="{defect_y + defect_height/2 - 2:.1f}" text-anchor="middle" '
                f'font-size="10" font-weight="800" fill="#ffffff">{nao_padrao}</text>'
            )
            parts.append(
                f'<text x="{center_x:.1f}" y="{defect_y + defect_height/2 + 11:.1f}" text-anchor="middle" '
                f'font-size="8.5" font-weight="800" fill="#fee2e2">{fmt_pct_value(nao_padrao_pct)}</text>'
            )

        parts.append(
            f'<text x="{center_x:.1f}" y="{base_y+24}" text-anchor="middle" font-size="10" '
            f'fill="#475569">{html.escape(row["label"])}</text>'
        )

    parts.append('</svg>')
    return "".join(parts)


def build_daily_defect_pct_svg(daily_series: list[dict]) -> str:
    """Gera grafico SVG da evolucao diaria do percentual fora do padrao."""
    productive_series = [row for row in daily_series if int(row.get("total", 0) or 0) > 0]
    if not productive_series:
        return '<div class="empty">Sem dias com producao para exibir no grafico.</div>'

    chart_height = 320
    top = 34
    bottom = 58
    left = 58
    right = 24
    plot_height = chart_height - top - bottom
    group_width = 66
    chart_width = max(760, left + right + group_width * len(productive_series))
    max_pct = max(float(row.get("nao_padrao_pct", 0.0) or 0.0) for row in productive_series)
    y_max = max(10, min(100, math.ceil(max_pct / 10) * 10))

    parts: list[str] = [
        f'<svg class="daily-chart" viewBox="0 0 {chart_width} {chart_height}" role="img" '
        f'aria-label="Grafico de evolucao diaria do percentual de concreto fora do padrao">'
    ]

    for i in range(6):
        value = y_max - i * (y_max / 5)
        y = top + i * (plot_height / 5)
        parts.append(
            f'<line x1="{left}" y1="{y:.1f}" x2="{chart_width-right}" y2="{y:.1f}" '
            'stroke="#dbe3ec" stroke-width="1" />'
        )
        parts.append(
            f'<text x="{left-10}" y="{y+4:.1f}" text-anchor="end" font-size="11" fill="#64748b">'
            f'{fmt_pct_value(value)}</text>'
        )

    base_y = top + plot_height
    points: list[tuple[float, float, dict]] = []
    for idx, row in enumerate(productive_series):
        center_x = left + idx * group_width + group_width / 2
        pct = float(row.get("nao_padrao_pct", 0.0) or 0.0)
        y = base_y - (pct / y_max) * plot_height if y_max else base_y
        points.append((center_x, y, row))

    if len(points) > 1:
        point_attr = " ".join(f"{x:.1f},{y:.1f}" for x, y, _ in points)
        parts.append(
            f'<polyline points="{point_attr}" fill="none" stroke="#A72141" stroke-width="3" '
            'stroke-linecap="round" stroke-linejoin="round" />'
        )

    for center_x, y, row in points:
        pct = float(row.get("nao_padrao_pct", 0.0) or 0.0)
        parts.append(
            f'<line x1="{center_x:.1f}" y1="{y:.1f}" x2="{center_x:.1f}" y2="{base_y:.1f}" '
            'stroke="#f3c2cd" stroke-width="2" stroke-dasharray="4 4" />'
        )
        parts.append(
            f'<circle cx="{center_x:.1f}" cy="{y:.1f}" r="4.5" fill="#A72141">'
            f'<title>{html.escape(row["label"])} - Fora do padrao: {fmt_pct_value(pct)}</title></circle>'
        )
        parts.append(
            f'<text x="{center_x:.1f}" y="{max(y-10, 14):.1f}" text-anchor="middle" '
            f'font-size="10" font-weight="800" fill="#0f172a">{fmt_pct_value(pct)}</text>'
        )
        parts.append(
            f'<text x="{center_x:.1f}" y="{base_y+24}" text-anchor="middle" font-size="10" '
            f'fill="#475569">{html.escape(row["label"])}</text>'
        )

    parts.append('</svg>')
    return "".join(parts)


def daily_section(summary: dict, target_date: str) -> str:
    title_date = datetime.strptime(target_date, "%Y-%m-%d").strftime("%d/%m/%Y")
    return f"""
  <section>
    <h1>Resultado Diário — Defeitos de Concreto</h1>
    <div class="sub">Data analisada: {title_date}</div>
    <div class="cards">
      <div class="card"><span>Formas únicas</span><strong>{monthly.fmt_int(summary["total"])}</strong></div>
      <div class="card"><span>Concreto padrão</span><strong>{monthly.fmt_int(summary["padrao"])}</strong></div>
      <div class="card"><span>Defeitos / não padrão</span><strong>{monthly.fmt_int(summary["nao_padrao"])}</strong></div>
      <div class="card"><span>% defeito</span><strong>{monthly.fmt_pct(summary["nao_padrao_pct"])}</strong></div>
    </div>

    <h2>Quebra por tipo de concreto — {title_date}</h2>
    <table>
      <thead><tr><th>Tipo de Concreto</th><th>Classificação</th><th>Qtd. Lançamentos</th><th>% do Total</th><th>Volume Estimado</th><th>Vol. % Total</th><th>Status</th></tr></thead>
      <tbody>{monthly.month_table(summary)}</tbody>
    </table>

    <h2>Resumo por Setor — {title_date}</h2>
    <table>
      <thead><tr><th>Setor</th><th>Total</th><th>Padrão</th><th>Defeitos</th><th>% Defeito</th><th>Volume Total</th><th>Volume Defeito</th><th>Status</th></tr></thead>
      <tbody>{monthly.sector_table(summary)}</tbody>
    </table>
  </section>
"""


def current_month_section(summary: dict, daily_series: list[dict], target_date: str, query_mode: str) -> str:
    _, _, label = month_to_date_bounds(target_date)
    analysis = build_month_analysis(summary, daily_series, label)
    analysis_html = "".join(f"<li>{item}</li>" for item in analysis)
    chart = build_daily_columns_svg(daily_series)
    defect_pct_chart = build_daily_defect_pct_svg(daily_series)
    productive_days = sum(1 for row in daily_series if row["total"] > 0)

    return f"""
  <section class="section">
    <h1>Consolidado do Mês Corrente — {label}</h1>
    <div class="sub">Acumulado do dia 01 até {datetime.strptime(target_date, "%Y-%m-%d").strftime("%d/%m/%Y")}. Dias com produção: {productive_days}.</div>

    <div class="cards">
      <div class="card"><span>Total no mês</span><strong>{monthly.fmt_int(summary["total"])}</strong></div>
      <div class="card"><span>Concreto padrão</span><strong>{monthly.fmt_int(summary["padrao"])}</strong></div>
      <div class="card"><span>Fora do padrão</span><strong>{monthly.fmt_int(summary["nao_padrao"])}</strong></div>
      <div class="card"><span>% fora do padrão</span><strong>{monthly.fmt_pct(summary["nao_padrao_pct"])}</strong></div>
    </div>

    <div class="analysis-box">
      <h2>Análise do consolidado</h2>
      <ul>{analysis_html}</ul>
    </div>

    <h2>Evolução diária — Composição da produção</h2>
    <div class="chart-legend">
      <span><i class="legend standard"></i>Concreto padrão</span>
      <span><i class="legend defect"></i>Fora do padrão</span>
    </div>
    <div class="chart-scroll">{chart}</div>
    <h2>Evolucao diaria - % fora do padrao</h2>
    <div class="chart-legend">
      <span><i class="legend defect"></i>% fora do padrao</span>
    </div>
    <div class="chart-scroll">{defect_pct_chart}</div>
    <div class="chart-note">Percentual diario calculado como fora do padrao dividido pelo total produzido no dia. Dias sem producao nao sao exibidos.</div>
    <div class="chart-note">Uma coluna por dia com produção: padrão na base e fora do padrão empilhado no topo. O número acima da coluna é o total do dia. Dias sem produção não são exibidos. Método: {html.escape(query_mode)}.</div>

    <h2>{label} — Quebra consolidada por tipo</h2>
    <table>
      <thead><tr><th>Tipo de Concreto</th><th>Classificação</th><th>Qtd. Lançamentos</th><th>% do Total</th><th>Volume Estimado</th><th>Vol. % Total</th><th>Status</th></tr></thead>
      <tbody>{monthly.month_table(summary)}</tbody>
    </table>

    <h2>{label} — Resumo consolidado por Setor</h2>
    <table>
      <thead><tr><th>Setor</th><th>Total</th><th>Padrão</th><th>Defeitos</th><th>% Defeito</th><th>Volume Total</th><th>Volume Defeito</th><th>Status</th></tr></thead>
      <tbody>{monthly.sector_table(summary)}</tbody>
    </table>
  </section>
"""


def monthly_section(summaries: list[dict]) -> str:
    if len(summaries) < 2:
        return ""

    # Mantém o comportamento histórico original quando MONTHS contém Junho/Julho.
    first, second = summaries[0], summaries[1]
    first_label = getattr(monthly.MONTHS[0], "label", "Período 1")
    second_label = getattr(monthly.MONTHS[1], "label", "Período 2")

    return f"""
  <section class="section">
    <h1>Comparativo Mensal — {first_label} x {second_label}</h1>
    <div class="sub">Comparativo histórico mantido junto ao relatório diário e ao consolidado do mês corrente.</div>
    <div class="cards">
      <div class="card"><span>{first_label} formas únicas</span><strong>{monthly.fmt_int(first["total"])}</strong></div>
      <div class="card"><span>{first_label} defeitos</span><strong>{monthly.fmt_int(first["nao_padrao"])}</strong></div>
      <div class="card"><span>{second_label} formas únicas</span><strong>{monthly.fmt_int(second["total"])}</strong></div>
      <div class="card"><span>{second_label} defeitos</span><strong>{monthly.fmt_int(second["nao_padrao"])}</strong></div>
    </div>

    <h2>{first_label} — Quebra por tipo</h2>
    <table>
      <thead><tr><th>Tipo de Concreto</th><th>Classificação</th><th>Qtd. Lançamentos</th><th>% do Total</th><th>Volume Estimado</th><th>Vol. % Total</th><th>Status</th></tr></thead>
      <tbody>{monthly.month_table(first)}</tbody>
    </table>

    <h2>{first_label} — Resumo por Setor</h2>
    <table>
      <thead><tr><th>Setor</th><th>Total</th><th>Padrão</th><th>Defeitos</th><th>% Defeito</th><th>Volume Total</th><th>Volume Defeito</th><th>Status</th></tr></thead>
      <tbody>{monthly.sector_table(first)}</tbody>
    </table>

    <h2>{second_label} — Quebra por tipo</h2>
    <table>
      <thead><tr><th>Tipo de Concreto</th><th>Classificação</th><th>Qtd. Lançamentos</th><th>% do Total</th><th>Volume Estimado</th><th>Vol. % Total</th><th>Status</th></tr></thead>
      <tbody>{monthly.month_table(second)}</tbody>
    </table>

    <h2>{second_label} — Resumo por Setor</h2>
    <table>
      <thead><tr><th>Setor</th><th>Total</th><th>Padrão</th><th>Defeitos</th><th>% Defeito</th><th>Volume Total</th><th>Volume Defeito</th><th>Status</th></tr></thead>
      <tbody>{monthly.sector_table(second)}</tbody>
    </table>

    <h2>Comparação mês a mês</h2>
    <table>
      <thead><tr><th>Tipo</th><th>{first_label}</th><th>{second_label}</th><th>Δ Lançamentos</th><th>Δ %</th><th>Δ Volume</th></tr></thead>
      <tbody>{monthly.comparison_rows(first, second)}</tbody>
    </table>
  </section>
"""


def render_combined_report(
    target_date: str,
    daily_summary: dict,
    current_month_summary: dict,
    current_month_daily: list[dict],
    current_month_query_mode: str,
    monthly_summaries: list[dict],
) -> str:
    title_date = datetime.strptime(target_date, "%Y-%m-%d").strftime("%d/%m/%Y")
    generated_at = datetime.now(TZ).strftime("%d/%m/%Y %H:%M")
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Relatório Consolidado — Defeitos de Concreto {title_date}</title>
  <style>
    :root {{
      --text:#0f172a; --muted:#64748b; --line:#e2e8f0; --bg:#f8fafc;
      --blue:#15416F; --red:#A72141;
    }}
    * {{ box-sizing:border-box; }}
    body {{ margin:0; background:var(--bg); color:var(--text); font-family:Inter, Arial, sans-serif; padding:28px; }}
    .wrap {{ max-width:1180px; margin:0 auto; }}
    .header {{ display:flex; justify-content:space-between; gap:20px; align-items:flex-end; margin-bottom:22px; }}
    h1 {{ margin:0; font-size:28px; letter-spacing:-.03em; }}
    h2 {{ margin:26px 0 10px; font-size:20px; }}
    .sub {{ color:var(--muted); font-weight:700; margin:6px 0 20px; }}
    .section {{ margin-top:36px; padding-top:28px; border-top:2px solid var(--line); }}
    .cards {{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin:18px 0 24px; }}
    .card {{ background:#fff; border:1px solid var(--line); border-radius:16px; padding:16px; box-shadow:0 6px 18px rgba(15,23,42,.05); }}
    .card span {{ color:var(--muted); font-weight:900; font-size:12px; text-transform:uppercase; letter-spacing:.06em; }}
    .card strong {{ display:block; font-size:28px; margin-top:8px; }}
    table {{ width:100%; border-collapse:collapse; background:#fff; border:1px solid var(--line); border-radius:16px; overflow:hidden; box-shadow:0 6px 18px rgba(15,23,42,.05); margin-bottom:18px; }}
    th {{ text-align:left; font-size:12px; color:#334155; text-transform:uppercase; letter-spacing:.06em; background:#f1f5f9; padding:14px; border-bottom:1px solid var(--line); }}
    td {{ padding:14px; border-bottom:1px solid #eef2f7; vertical-align:middle; font-weight:600; }}
    tr.child td:first-child {{ color:#64748b; font-style:italic; padding-left:34px; }}
    tr.defect-row {{ background:#fff7f7; }}
    tr.total-row {{ background:#f1f5f9; border-top:2px solid #cbd5e1; }}
    tr.total-row td {{ font-weight:900; }}
    .tipo {{ font-weight:900; }}
    .metric {{ min-width:170px; }}
    .bar {{ display:inline-block; width:96px; height:7px; margin-left:10px; background:#e2e8f0; border-radius:999px; vertical-align:middle; overflow:hidden; }}
    .bar span {{ display:block; height:100%; border-radius:999px; }}
    .pill,.status {{ display:inline-flex; align-items:center; border-radius:999px; padding:6px 10px; font-weight:900; font-size:12px; }}
    .pill.padrao {{ background:#dbeafe; color:#2563eb; }}
    .pill.normal {{ background:#e2e8f0; color:#475569; }}
    .pill.defeito {{ background:#fee2e2; color:#ef4444; }}
    .pill.total {{ background:#e2e8f0; color:#0f172a; }}
    .status.conforme {{ background:#d1fae5; color:#047857; }}
    .status.normal {{ background:#e2e8f0; color:#475569; }}
    .status.defeito {{ background:#fee2e2; color:#dc2626; }}
    .status.total {{ background:#e2e8f0; color:#0f172a; }}
    .volume.green {{ color:#059669; }} .volume.orange {{ color:#d97706; }} .volume.red {{ color:#dc2626; }}
    .good {{ color:#059669; font-weight:900; }} .bad {{ color:#dc2626; font-weight:900; }} .neutral {{ color:#64748b; font-weight:900; }}
    .analysis-box {{ background:#fff; border:1px solid var(--line); border-left:5px solid var(--blue); border-radius:16px; padding:18px 22px; margin:18px 0 24px; box-shadow:0 6px 18px rgba(15,23,42,.04); }}
    .analysis-box h2 {{ margin:0 0 10px; }}
    .analysis-box ul {{ margin:0; padding-left:22px; }}
    .analysis-box li {{ margin:8px 0; line-height:1.45; }}
    .chart-legend {{ display:flex; gap:20px; align-items:center; flex-wrap:wrap; margin:8px 0 10px; color:#475569; font-weight:800; font-size:13px; }}
    .chart-legend span {{ display:inline-flex; gap:8px; align-items:center; }}
    .legend {{ width:13px; height:13px; border-radius:3px; display:inline-block; }}
    .legend.standard {{ background:var(--blue); }}
    .legend.defect {{ background:var(--red); }}
    .chart-scroll {{ width:100%; overflow-x:auto; background:#fff; border:1px solid var(--line); border-radius:16px; padding:10px; box-shadow:0 6px 18px rgba(15,23,42,.05); }}
    .daily-chart {{ width:100%; min-width:760px; height:auto; display:block; }}
    .chart-note {{ color:var(--muted); font-size:12px; font-weight:700; margin:8px 0 24px; }}
    .empty {{ padding:28px; text-align:center; color:var(--muted); font-weight:800; }}
    @media(max-width:900px) {{
      body {{ padding:14px; }}
      .cards {{ grid-template-columns:1fr 1fr; }}
      .header {{ align-items:flex-start; flex-direction:column; }}
      table {{ font-size:13px; display:block; overflow-x:auto; }}
      th,td {{ padding:10px; white-space:nowrap; }}
    }}
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div>
      <h1>Relatório Consolidado de Defeitos de Concreto</h1>
      <div class="sub">Resultado diário + mês corrente + comparativo histórico</div>
    </div>
    <div class="sub">Gerado em {generated_at}</div>
  </div>
  {daily_section(daily_summary, target_date)}
  {current_month_section(current_month_summary, current_month_daily, target_date, current_month_query_mode)}
  {monthly_section(monthly_summaries)}
</div>
</body>
</html>"""


def save_combined_report(
    target_date: str,
    daily_summary: dict,
    current_month_summary: dict,
    current_month_daily: list[dict],
    current_month_query_mode: str,
    monthly_summaries: list[dict],
) -> Path:
    output = REPORT_DIR / f"relatorio_consolidado_defeitos_concreto_{target_date}.html"
    output.write_text(
        render_combined_report(
            target_date,
            daily_summary,
            current_month_summary,
            current_month_daily,
            current_month_query_mode,
            monthly_summaries,
        ),
        encoding="utf-8",
    )
    return output


def build_whatsapp_message(
    target_date: str,
    daily_summary: dict,
    current_month_summary: dict,
    report_path: Path,
) -> str:
    title_date = datetime.strptime(target_date, "%Y-%m-%d").strftime("%d/%m/%Y")
    _, _, current_label = month_to_date_bounds(target_date)

    lines = [
        "*Relatório Consolidado — Defeitos de Concreto*",
        f"📅 *Data analisada:* {title_date}",
        "",
        "📊 *Resumo do dia:*",
        f"• Formas únicas: *{monthly.fmt_int(daily_summary['total'])}*",
        f"• Concreto padrão: *{monthly.fmt_int(daily_summary['padrao'])}*",
        f"• Defeitos / não padrão: *{monthly.fmt_int(daily_summary['nao_padrao'])}*",
        f"• % defeito: *{monthly.fmt_pct(daily_summary['nao_padrao_pct'])}*",
        f"• Volume defeito: *{monthly.fmt_m3(daily_summary['nao_padrao_volume'])}*",
        "",
        f"📈 *Acumulado {current_label}:*",
        f"• Total: *{monthly.fmt_int(current_month_summary['total'])}*",
        f"• Padrão: *{monthly.fmt_int(current_month_summary['padrao'])}*",
        f"• Fora do padrão: *{monthly.fmt_int(current_month_summary['nao_padrao'])}*",
        f"• % fora do padrão: *{monthly.fmt_pct(current_month_summary['nao_padrao_pct'])}*",
        "",
        "⚠️ *Quebra por defeito no dia:*",
    ]

    for item in daily_summary["detail_rows"]:
        lines.append(f"• {item['tipo']}: *{monthly.fmt_int(item['count'])}* ({monthly.fmt_pct(item['pct'])})")
    if not daily_summary["detail_rows"]:
        lines.append("• Nenhum defeito registrado.")

    lines.extend(["", "🏭 *Por setor no dia:*"])
    for setor in daily_summary["setor_rows"]:
        lines.append(
            f"• {setor['setor']}: {monthly.fmt_int(setor['total'])} total | "
            f"{monthly.fmt_int(setor['nao_padrao'])} defeitos ({monthly.fmt_pct(setor['nao_padrao_pct'])})"
        )

    lines.extend(["", "🔗 *Relatório único:*", str(report_path)])
    return "\n".join(lines)


def send_whatsapp(message: str, dry_run: bool) -> bool:
    if dry_run or not config.WHATSAPP_API_URL:
        print("=== WHATSAPP DRY-RUN ===")
        print(f"Destinatário: {config.WHATSAPP_PHONE or 'não configurado'}")
        print(message)
        print("========================")
        return True

    payload = {"token": config.WHATSAPP_TOKEN, "to": config.WHATSAPP_PHONE, "body": message}
    response = requests.post(
        config.WHATSAPP_API_URL,
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload),
        timeout=20,
    )
    if not response.ok:
        raise RuntimeError(f"Falha ao enviar WhatsApp: HTTP {response.status_code}: {response.text}")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Agente de defeitos de concreto: dia selecionado + mês corrente + comparativo histórico"
    )
    parser.add_argument("--data", default="ontem", help="Data analisada: YYYY-MM-DD, hoje ou ontem/D-1")
    parser.add_argument("--dry-run", action="store_true", help="Não envia WhatsApp, só imprime a mensagem")
    args = parser.parse_args()

    target_date = parse_target_date(args.data)

    # Resultado do dia selecionado.
    daily_summary = build_summary_for_range(target_date[:7], target_date, target_date, target_date)

    # Mês corrente relativo à data selecionada: do dia 01 até target_date.
    current_month_summary, current_month_daily, current_month_query_mode = build_current_month_data(target_date)

    # Comparativo histórico já existente no projeto.
    monthly_summaries = build_monthly_summaries()

    report_path = save_combined_report(
        target_date,
        daily_summary,
        current_month_summary,
        current_month_daily,
        current_month_query_mode,
        monthly_summaries,
    )

    dry_run = args.dry_run or config.DRY_RUN or not config.WHATSAPP_API_URL
    message = build_whatsapp_message(target_date, daily_summary, current_month_summary, report_path)
    send_whatsapp(message, dry_run=dry_run)
    print(report_path)


if __name__ == "__main__":
    main()

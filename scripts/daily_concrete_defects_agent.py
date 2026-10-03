from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import requests

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except AttributeError:
    pass

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / "pcp_producao_agent"))
sys.path.append(str(ROOT / "scripts"))

import config  # noqa: E402
import generate_defeitos_concreto_report as monthly  # noqa: E402

REPORT_DIR = ROOT / "relatorios" / "defeitos-concreto" / "diario"
REPORT_DIR.mkdir(parents=True, exist_ok=True)
TZ = ZoneInfo("America/Sao_Paulo")


def parse_target_date(value: str | None) -> str:
    if not value or value.lower() in {"ontem", "d-1"}:
        return (datetime.now(TZ).date() - timedelta(days=1)).isoformat()
    if value.lower() == "hoje":
        return datetime.now(TZ).date().isoformat()
    datetime.strptime(value, "%Y-%m-%d")
    return value


def build_summary_for_range(key: str, label: str, start: str, end: str) -> dict:
    spec = monthly.MonthSpec(key, label, start, end)
    rows = monthly.fetch_month_rows(spec)
    return monthly.build_month_summary(spec, rows)


def build_monthly_summaries() -> list[dict]:
    return [
        build_summary_for_range(m.key, m.label, m.start, m.end)
        for m in monthly.MONTHS
    ]


def daily_section(summary: dict, target_date: str) -> str:
    title_date = datetime.strptime(target_date, "%Y-%m-%d").strftime("%d/%m/%Y")
    return f"""
  <section>
    <h1>Relatório D-1 — Defeitos de Concreto</h1>
    <div class="sub">Data analisada: {title_date}</div>
    <div class="cards">
      <div class="card"><span>Formas únicas</span><strong>{monthly.fmt_int(summary["total"])}</strong></div>
      <div class="card"><span>Concreto padrão</span><strong>{monthly.fmt_int(summary["padrao"])}</strong></div>
      <div class="card"><span>Defeitos / não padrão</span><strong>{monthly.fmt_int(summary["nao_padrao"])}</strong></div>
      <div class="card"><span>% defeito</span><strong>{monthly.fmt_pct(summary["nao_padrao_pct"])}</strong></div>
    </div>

    <h2>D-1 — Quebra por tipo de concreto</h2> - Resultado do Dia {title_date}
    <table>
      <thead><tr><th>Tipo de Concreto</th><th>Classificação</th><th>Qtd. Lançamentos</th><th>% do Total</th><th>Volume Estimado</th><th>Vol. % Total</th><th>Status</th></tr></thead>
      <tbody>{monthly.month_table(summary)}</tbody>
    </table>

    <h2>D-1 — Resumo por Setor</h2> - Resultado do Dia {title_date}
    <table>
      <thead><tr><th>Setor</th><th>Total</th><th>Padrão</th><th>Defeitos</th><th>% Defeito</th><th>Volume Total</th><th>Volume Defeito</th><th>Status</th></tr></thead>
      <tbody>{monthly.sector_table(summary)}</tbody>
    </table>
  </section>
"""


def monthly_section(summaries: list[dict]) -> str:
    jun, jul = summaries
    return f"""
  <section class="section">
    <h1>Comparativo Mensal — Junho x Julho/2026</h1>
    <div class="sub">Mantido junto ao relatório diário para acompanhamento histórico.</div>
    <div class="cards">
      <div class="card"><span>Junho formas únicas</span><strong>{monthly.fmt_int(jun["total"])}</strong></div>
      <div class="card"><span>Junho defeitos</span><strong>{monthly.fmt_int(jun["nao_padrao"])}</strong></div>
      <div class="card"><span>Julho formas únicas</span><strong>{monthly.fmt_int(jul["total"])}</strong></div>
      <div class="card"><span>Julho defeitos</span><strong>{monthly.fmt_int(jul["nao_padrao"])}</strong></div>
    </div>

    <h2>Junho/2026 — Quebra por tipo</h2>
    <table>
      <thead><tr><th>Tipo de Concreto</th><th>Classificação</th><th>Qtd. Lançamentos</th><th>% do Total</th><th>Volume Estimado</th><th>Vol. % Total</th><th>Status</th></tr></thead>
      <tbody>{monthly.month_table(jun)}</tbody>
    </table>

    <h2>Junho/2026 — Resumo por Setor</h2>
    <table>
      <thead><tr><th>Setor</th><th>Total</th><th>Padrão</th><th>Defeitos</th><th>% Defeito</th><th>Volume Total</th><th>Volume Defeito</th><th>Status</th></tr></thead>
      <tbody>{monthly.sector_table(jun)}</tbody>
    </table>

    <h2>Julho/2026 — Quebra por tipo</h2>
    <table>
      <thead><tr><th>Tipo de Concreto</th><th>Classificação</th><th>Qtd. Lançamentos</th><th>% do Total</th><th>Volume Estimado</th><th>Vol. % Total</th><th>Status</th></tr></thead>
      <tbody>{monthly.month_table(jul)}</tbody>
    </table>

    <h2>Julho/2026 — Resumo por Setor</h2>
    <table>
      <thead><tr><th>Setor</th><th>Total</th><th>Padrão</th><th>Defeitos</th><th>% Defeito</th><th>Volume Total</th><th>Volume Defeito</th><th>Status</th></tr></thead>
      <tbody>{monthly.sector_table(jul)}</tbody>
    </table>

    <h2>Comparação mês a mês</h2>
    <table>
      <thead><tr><th>Tipo</th><th>Junho</th><th>Julho</th><th>Δ Lançamentos</th><th>Δ %</th><th>Δ Volume</th></tr></thead>
      <tbody>{monthly.comparison_rows(jun, jul)}</tbody>
    </table>
  </section>
"""


def render_combined_report(target_date: str, daily_summary: dict, monthly_summaries: list[dict]) -> str:
    title_date = datetime.strptime(target_date, "%Y-%m-%d").strftime("%d/%m/%Y")
    generated_at = datetime.now(TZ).strftime("%d/%m/%Y %H:%M")
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Relatório Consolidado — Defeitos de Concreto {title_date}</title>
  <style>
    :root {{ --text:#0f172a; --muted:#64748b; --line:#e2e8f0; --bg:#f8fafc; }}
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
    @media(max-width:900px) {{ body {{ padding:14px; }} .cards {{ grid-template-columns:1fr 1fr; }} table {{ font-size:13px; }} th,td {{ padding:10px; }} }}
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div>
      <h1>Relatório Consolidado de Defeitos de Concreto</h1>
      <div class="sub">D-1 + comparativo mensal no mesmo arquivo</div>
    </div>
    <div class="sub">Gerado em {generated_at}</div>
  </div>
  {daily_section(daily_summary, target_date)}
  {monthly_section(monthly_summaries)}
</div>
</body>
</html>"""


def save_combined_report(target_date: str, daily_summary: dict, monthly_summaries: list[dict]) -> Path:
    output = REPORT_DIR / f"relatorio_consolidado_defeitos_concreto_d1_{target_date}.html"
    output.write_text(render_combined_report(target_date, daily_summary, monthly_summaries), encoding="utf-8")
    return output


def build_whatsapp_message(target_date: str, summary: dict, report_path: Path) -> str:
    title_date = datetime.strptime(target_date, "%Y-%m-%d").strftime("%d/%m/%Y")
    lines = [
        "*Relatório Consolidado — Defeitos de Concreto*",
        f"📅 *D-1:* {title_date}",
        "",
        "📊 *Resumo D-1:*",
        f"• Formas únicas: *{monthly.fmt_int(summary['total'])}*",
        f"• Concreto padrão: *{monthly.fmt_int(summary['padrao'])}*",
        f"• Defeitos / não padrão: *{monthly.fmt_int(summary['nao_padrao'])}*",
        f"• % defeito: *{monthly.fmt_pct(summary['nao_padrao_pct'])}*",
        f"• Volume defeito: *{monthly.fmt_m3(summary['nao_padrao_volume'])}*",
        "",
        "⚠️ *Quebra por defeito:*",
    ]
    for item in summary["detail_rows"]:
        lines.append(f"• {item['tipo']}: *{monthly.fmt_int(item['count'])}* ({monthly.fmt_pct(item['pct'])})")
    if not summary["detail_rows"]:
        lines.append("• Nenhum defeito registrado.")

    lines.extend(["", "🏭 *Por setor:*"])
    for setor in summary["setor_rows"]:
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
    parser = argparse.ArgumentParser(description="Agente diário D-1 de defeitos de concreto com relatório consolidado")
    parser.add_argument("--data", default="ontem", help="Data analisada: YYYY-MM-DD, hoje ou ontem/D-1")
    parser.add_argument("--dry-run", action="store_true", help="Não envia WhatsApp, só imprime a mensagem")
    args = parser.parse_args()

    target_date = parse_target_date(args.data)
    daily_summary = build_summary_for_range(target_date[:7], target_date, target_date, target_date)
    monthly_summaries = build_monthly_summaries()
    report_path = save_combined_report(target_date, daily_summary, monthly_summaries)

    dry_run = args.dry_run or config.DRY_RUN or not config.WHATSAPP_API_URL
    message = build_whatsapp_message(target_date, daily_summary, report_path)
    send_whatsapp(message, dry_run=dry_run)
    print(report_path)


if __name__ == "__main__":
    main()

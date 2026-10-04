"""Prepare the 24 original PCP pages for the isolated test host and unified shell."""

from __future__ import annotations

from pathlib import Path
import re
import shutil


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "unificado" / "pcp"
TARGET = ROOT / ".work-mapa-unificado" / "pcp-publish"
PAGES = (
    "acompanhamento-mensal", "acompanhamento-mensal-setor-34", "apontamento-mega",
    "comparacao", "dashboard", "etiquetas", "etiquetas-armaduras", "etiquetas-sc",
    "formas-por-setor", "maodeobra", "maodeobra-rateio", "pcp-diario", "primeiro-acesso",
    "producao", "programacao", "programacao-alex", "programacao-circular-s3",
    "programacao-circular-s4", "programacao-final", "relatorio-producao",
    "relatorio-programacao-s3", "relatorio-programacao-s4", "teste-programacao", "usuarios",
)


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    for page in PAGES:
        source = SOURCE / page / "index.html"
        html = source.read_text(encoding="utf-8")
        html, guards = re.subn(
            r'<script src="/unificado/pcp/readonly-guard\.js"></script>\s*', "", html)
        if guards != 1:
            raise ValueError(f"Read-only guard count changed in {page}: {guards}")
        html, heads = re.subn(
            r"<head>", '<head>\n  <script src="/unificado/pcp/unificado-bridge.js"></script>\n'
            '  <script src="/unificado/pcp/unificado-shell.js"></script>', html, count=1, flags=re.I)
        html, tails = re.subn(
            r"</head>", '  <link rel="stylesheet" href="/unificado/pcp/static/css/inter-original.css">\n'
            '  <link rel="stylesheet" href="/unificado/pcp/unificado-shell.css">\n</head>',
            html, count=1, flags=re.I)
        if heads != 1 or tails != 1:
            raise ValueError(f"HTML head changed in {page}")
        output = TARGET / page / "index.html"
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(html, encoding="utf-8", newline="\n")
    shutil.copytree(SOURCE / "static", TARGET / "static", dirs_exist_ok=True)
    app_script = TARGET / "static" / "js" / "app.js"
    script = app_script.read_text(encoding="utf-8")
    old_mapa_link = "https://usina.concretrack.com.br/mapa-concretagem/index.html"
    if script.count(old_mapa_link) != 1:
        raise ValueError("Original PCP Mapa menu link changed")
    app_script.write_text(script.replace(old_mapa_link, "/unificado/mapa/operacao/"),
                          encoding="utf-8", newline="\n")
    for name in ("unificado-bridge.js", "unificado-shell.js", "unificado-shell.css"):
        shutil.copy2(SOURCE / name, TARGET / name)
    (TARGET / "index.html").write_text(
        '<!doctype html><html lang="pt-BR"><meta charset="utf-8">'
        '<meta http-equiv="refresh" content="0;url=/unificado/pcp/dashboard/">'
        '<title>Planejamento</title><a href="/unificado/pcp/dashboard/">Abrir Planejamento</a></html>',
        encoding="utf-8", newline="\n")
    print(f"pcp_pages_prepared={len(PAGES)} target={TARGET}")


if __name__ == "__main__":
    main()

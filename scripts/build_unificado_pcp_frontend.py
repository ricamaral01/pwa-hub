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
    if TARGET.exists():
        shutil.rmtree(TARGET)
    TARGET.mkdir(parents=True, exist_ok=True)
    version = (ROOT / "unificado" / "VERSION").read_text(encoding="utf-8").strip()
    for page in PAGES:
        source = SOURCE / page / "index.html"
        html = source.read_text(encoding="utf-8")
        if page == "producao":
            visible_label = "          Producao Realizada -- Supabase"
            if html.count(visible_label) != 1:
                raise ValueError("PCP production source label changed")
            html = html.replace(visible_label, "          Producao Realizada -- banco local")
        if page == "formas-por-setor":
            for asset in ("css/formas-por-setor.css", "js/formas-por-setor.js"):
                original = f"/unificado/pcp/static/{asset}"
                if html.count(original + '"') != 1:
                    raise ValueError(f"Formas por Setor asset changed: {asset}")
                html = html.replace(original + '"', f'{original}?v={version}"')
        html = re.sub(r'(/unificado/pcp/static/js/app\.js)(?:\?v=[^"\']+)?(?=["\'])',
                      rf'\g<1>?v={version}', html)
        html, guards = re.subn(
            r'<script src="/unificado/pcp/readonly-guard\.js"></script>\s*', "", html)
        if guards != 1:
            raise ValueError(f"Read-only guard count changed in {page}: {guards}")
        menu_script = ('  <script src="/unificado/shell/menu.config.js"></script>\n'
                       if page == "formas-por-setor" else "")
        redirect = ('  <script>if(top===self&&matchMedia("(min-width:1025px)").matches){location.replace("/unificado/?view="+encodeURIComponent(location.pathname.slice("/unificado/".length)+location.search))}</script>\n'
                    if page != "primeiro-acesso" else "")
        html, heads = re.subn(
            r"<head>", '<head>\n  <style>@media screen{html{background:#0B1730}}@media screen and (min-width:1025px){body{background:#0B1730!important}}</style>\n'
            + redirect
            + f'  <script src="/unificado/pcp/unificado-bridge.js?v={version}"></script>\n'
            + menu_script + f'  <script src="/unificado/pcp/unificado-shell.js?v={version}"></script>',
            html, count=1, flags=re.I)
        inter_link = ('  <link rel="stylesheet" href="/unificado/pcp/static/css/inter-original.css">\n'
                      if page != "formas-por-setor" else "")
        html, tails = re.subn(
            r"</head>", inter_link
            + f'  <link rel="stylesheet" href="/unificado/pcp/unificado-shell.css?v={version}">\n</head>',
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
        '<style>html{background:#0B1730}</style>'
        '<script>location.replace("/unificado/pcp/dashboard/")</script></html>',
        encoding="utf-8", newline="\n")
    print(f"pcp_pages_prepared={len(PAGES)} target={TARGET}")


if __name__ == "__main__":
    main()

"""Build the test operation from original Mapa, changing only its API config."""

from __future__ import annotations

import hashlib
from pathlib import Path
import re
import shutil

from patch_mapa_defects_unificado import OLD as ORIGINAL_DEFECT_FUNCTION
from patch_mapa_defects_unificado import NEW as PATCHED_DEFECT_FUNCTION
from patch_mapa_defects_unificado import apply as patch_defects
from patch_mapa_second_inspection_unificado import apply as patch_second_inspection
from utf8_guard_unificado import repair


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "mapa-concretagem"
TARGET = ROOT / ".work-mapa-unificado" / "operacao"
BRIDGE = ROOT / "unificado" / "mapa" / "operacao"

DATABASE_TEXT_REPLACEMENTS = {
    "Manutencao: usando cache local; falha ao carregar Supabase:":
        "Manutencao: usando cache local; falha ao carregar o servidor:",
    "Relatorio: usando cache local apos falha no Supabase:":
        "Relatorio: usando cache local apos falha no servidor:",
    "Supabase não configurado: salvando apenas localmente.":
        "Servidor não configurado: salvando apenas localmente.",
    "Conectado ao Supabase: sincronização online ativa.":
        "Conectado: sincronização online ativa.",
    "Falha ao verificar banco Supabase.":
        "Falha ao verificar o banco de dados.",
    "Sem conexão com Supabase no momento.":
        "Sem conexão com o servidor no momento.",
    "Falha ao salvar programação no Supabase, usando local:":
        "Falha ao salvar programação no servidor, usando local:",
    "Falha ao excluir programação no Supabase, usando local:":
        "Falha ao excluir programação no servidor, usando local:",
    "Erro ao buscar concretagens do Supabase:": "Erro ao buscar concretagens do servidor:",
    "Erro ao buscar programação do Supabase, usando local:":
        "Erro ao buscar programação do servidor, usando local:",
    "[fetchSetor3Models] Fallback silencioso do Supabase executado:":
        "[fetchSetor3Models] Fallback silencioso do servidor executado:",
    "Erro ao buscar montagem_poste específico do Supabase:":
        "Erro ao buscar montagem_poste específico do servidor:",
    "Erro ao carregar montagem_poste do Supabase:":
        "Erro ao carregar montagem_poste do servidor:",
    "Erro ao sincronizar fôrmas do Supabase para Mandril Circular:":
        "Erro ao sincronizar fôrmas do servidor para Mandril Circular:",
    "Erro ao buscar no Supabase, tentando local...":
        "Erro ao buscar no servidor, tentando local...",
    "Erro Supabase em produtividade, buscando local:":
        "Erro do servidor em produtividade, buscando local:",
    "Supabase indisponivel para consultar a base de montagem.":
        "Servidor indisponível para consultar a base de montagem.",
    "Erro ao carregar do Supabase:": "Erro ao carregar do servidor:",
}


def main() -> None:
    if TARGET.exists():
        shutil.rmtree(TARGET)
    TARGET.mkdir(parents=True, exist_ok=True)
    for name in ("styles.css", "dashboard-defeitos-v4.css", "chart.min.js",
                 "chartjs-plugin-datalabels.min.js", "xlsx.full.min.js",
                 "modelos-formas.js", "supabase.js", "manifest.json"):
        shutil.copy2(SOURCE / name, TARGET / name)
    assets = TARGET / "assets"
    assets.mkdir(exist_ok=True)
    for name in ("msgbox.css", "msgbox.js"):
        shutil.copy2(ROOT / "assets" / name, assets / name)
    (assets / "img").mkdir(exist_ok=True)
    shutil.copy2(ROOT / "assets" / "img" / "icon.png", assets / "img" / "icon.png")
    for name in ("bridge.js", "sw.js", "unificado-bridge.css", "unificado-bridge.js", "unificado-icon.png"):
        shutil.copy2(BRIDGE / name, TARGET / name)
    version = (ROOT / "unificado" / "VERSION").read_text(encoding="utf-8").strip()
    sw = (TARGET / "sw.js").read_text(encoding="utf-8")
    (TARGET / "sw.js").write_text(sw.replace("__UNIFICADO_VERSION__", version), encoding="utf-8", newline="\n")
    shutil.copytree(ROOT / "unificado" / "shell" / "fonts", TARGET / "fonts", dirs_exist_ok=True)
    if (SOURCE / "data").is_dir():
        shutil.copytree(SOURCE / "data", TARGET / "data", dirs_exist_ok=True)
    manifest = (TARGET / "manifest.json").read_text(encoding="utf-8")
    (TARGET / "manifest.json").write_text(
        manifest.replace("../assets/img/icon.png", "unificado-icon.png")
                .replace('"sizes": "512x512"', '"sizes": "1536x1536"')
                .replace('"Mapa de Concretagem"', '"Concrefer Produção"')
                .replace('"Mapa Concretagem"', '"Produção Concrefer"')
                .replace('"index.html?cache-reset=v5.31"', '"index.html"'),
        encoding="utf-8", newline="\n",
    )
    source_app = (SOURCE / "app.js").read_text(encoding="utf-8")
    config = re.compile(r'const SUPABASE_CONFIG = \{\s*URL: "[^"]+",\s*KEY: "[^"]+"\s*\};')
    matches = config.findall(source_app)
    if len(matches) != 1:
        raise RuntimeError("Mapa original config changed")
    replacement = 'const SUPABASE_CONFIG = {\n  URL: location.origin + "/unificado/mapa/api",\n  KEY: "unificado-test-only"\n};'
    output_app = patch_defects(config.sub(replacement, source_app))
    output_app = output_app.replace('"./sw.js?v=v5.31"', f'"./sw.js?v={version}"', 1)
    assert output_app.replace(replacement, matches[0], 1).replace(
        PATCHED_DEFECT_FUNCTION, ORIGINAL_DEFECT_FUNCTION, 1
    ).replace(f'"./sw.js?v={version}"', '"./sw.js?v=v5.31"', 1) == source_app
    for original, neutral in DATABASE_TEXT_REPLACEMENTS.items():
        if original not in output_app:
            raise RuntimeError(f"Texto de banco mudou na origem: {original}")
        output_app = output_app.replace(original, neutral)
    output_app = patch_second_inspection(output_app)
    (TARGET / "app.js").write_text(repair(output_app), encoding="utf-8", newline="\n")

    html = (SOURCE / "index.html").read_text(encoding="utf-8")
    html = html.replace('class="auth-checking"', "", 1)
    html = html.replace('  <script defer src="/auth/config.js?v=2"></script><script defer src="/auth/client.js"></script><script defer src="/auth/guard.js?v=2"></script>\n', "", 1)
    html = html.replace('../assets/msgbox.', 'assets/msgbox.')
    html = html.replace('<script src="app.js?v=v5.31"></script>',
                        '<script src="bridge.js"></script><script src="app.js?v=unificado-operacao-1"></script><script src="unificado-bridge.js"></script>', 1)
    html = html.replace('?v=v5.31', f'?v={version}')
    html = html.replace('src="bridge.js"', f'src="bridge.js?v={version}"')
    html = html.replace('src="app.js?v=unificado-operacao-1"', f'src="app.js?v={version}"')
    html = html.replace('src="unificado-bridge.js"', f'src="unificado-bridge.js?v={version}"')
    html = html.replace('src="unificado-bridge.css"', f'src="unificado-bridge.css?v={version}"')
    html = html.replace('<div class="modal-box modal-box-loading">',
                        '<div class="modal-box modal-box-loading"><div class="unificado-loading-logos" aria-label="Concrefer e ConcreTrack"><img src="/unificado/assets/img/logo-concrefer.png" alt="Concrefer"><img src="/unificado/assets/img/logo-concretrack.png" alt="ConcreTrack"></div>', 1)
    html = html.replace('</body>',
                        f'<small id="unificado-version" style="position:fixed;right:6px;bottom:5px;z-index:99999;background:#0B1730;color:white;padding:3px 7px;border-radius:6px;font:11px monospace">v{version}</small></body>', 1)
    html = html.replace('</head>', '<style>@media(min-width:1025px){html,body:not(.kiosk-active){background:#0B1730!important}}</style><link rel="stylesheet" href="unificado-bridge.css"></head>', 1)
    html = html.replace('href="unificado-bridge.css"', f'href="unificado-bridge.css?v={version}"')
    (TARGET / "index.html").write_text(repair(html), encoding="utf-8", newline="\n")
    print("source_app_sha256=" + hashlib.sha256((SOURCE / "app.js").read_bytes()).hexdigest())
    print("built=" + str(TARGET))


if __name__ == "__main__":
    main()

"""Build the test operation from original Mapa, changing only its API config."""

from __future__ import annotations

import hashlib
from pathlib import Path
import re
import shutil


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "mapa-concretagem"
TARGET = ROOT / ".work-mapa-unificado" / "operacao"
BRIDGE = ROOT / "unificado" / "mapa" / "operacao"


def main() -> None:
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
    for name in ("bridge.js", "sw.js"):
        shutil.copy2(BRIDGE / name, TARGET / name)
    if (SOURCE / "data").is_dir():
        shutil.copytree(SOURCE / "data", TARGET / "data", dirs_exist_ok=True)
    manifest = (TARGET / "manifest.json").read_text(encoding="utf-8")
    (TARGET / "manifest.json").write_text(
        manifest.replace("../assets/img/icon.png", "assets/img/icon.png"),
        encoding="utf-8", newline="\n",
    )
    source_app = (SOURCE / "app.js").read_text(encoding="utf-8")
    config = re.compile(r'const SUPABASE_CONFIG = \{\s*URL: "[^"]+",\s*KEY: "[^"]+"\s*\};')
    matches = config.findall(source_app)
    if len(matches) != 1:
        raise RuntimeError("Mapa original config changed")
    replacement = 'const SUPABASE_CONFIG = {\n  URL: location.origin + "/unificado/mapa/api",\n  KEY: "unificado-test-only"\n};'
    output_app = config.sub(replacement, source_app)
    assert output_app.replace(replacement, matches[0], 1) == source_app
    (TARGET / "app.js").write_text(output_app, encoding="utf-8", newline="\n")

    html = (SOURCE / "index.html").read_text(encoding="utf-8")
    html = html.replace('class="auth-checking"', "", 1)
    html = html.replace('  <script defer src="/auth/config.js?v=2"></script><script defer src="/auth/client.js"></script><script defer src="/auth/guard.js?v=2"></script>\n', "", 1)
    html = html.replace('../assets/msgbox.', 'assets/msgbox.')
    html = html.replace('<body data-app-key="mapa-concretagem">',
                        '<body data-app-key="mapa-concretagem"><div id="ambiente-teste" role="status">AMBIENTE DE TESTE — lançamentos aqui não valem como produção</div>', 1)
    html = html.replace('<script src="app.js?v=v5.31"></script>',
                        '<script src="bridge.js"></script><script src="app.js?v=unificado-operacao-1"></script>', 1)
    html = html.replace('</head>', '<style>#ambiente-teste{position:sticky;top:0;z-index:100000;background:#ffdc6e;color:#3b2700;padding:11px 16px;text-align:center;font:800 16px/1.3 system-ui,sans-serif;box-shadow:0 2px 8px #0003}</style></head>', 1)
    (TARGET / "index.html").write_text(html, encoding="utf-8", newline="\n")
    print("source_app_sha256=" + hashlib.sha256((SOURCE / "app.js").read_bytes()).hexdigest())
    print("built=" + str(TARGET))


if __name__ == "__main__":
    main()

"""Copy the approved TV mockup without changing its visual rules, then attach live data."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / "docs/painel-tv/mockup-painel-formas.html").read_text(encoding="utf-8")
shell = source.split("<script>", 1)[0]
shell = shell.replace("<title>Painel de Formas</title>", "<title>Painel TV — Programação × Realizado</title>", 1)
shell = shell.replace('<div class="app">', '<div id="tv-alert" role="alert" hidden></div>\n<div class="app">', 1)
shell = shell.replace("Dados de exemplo · atualiza a cada 60 s", "Atualização a cada 60 s", 1)
shell = shell.replace("<span><i class=\"f lib\"></i>Liberada</span>",
                      "<span><i class=\"f lib\"></i>Liberada para concretar</span>", 1)
shell = shell.replace("</style>", """\n#tv-alert:not([hidden]){position:fixed;top:0;left:0;right:0;z-index:20;background:#822D23;color:#fff;
  font:700 20px var(--body);padding:12px 24px;text-align:center;box-shadow:0 3px 18px #0009}
.warning{color:var(--prog);font-size:14px;line-height:1.3;max-width:900px}
.loading{display:grid;place-items:center;min-height:55vh;font:600 32px var(--display);color:var(--muted)}
.f[title]{cursor:default}
.det.dense{gap:8px}
.det.dense .tipo{padding:2px 0;min-height:64px}
.det.dense .tipo h3{font-size:clamp(24px,1.55vw,32px)}
.det.dense .tres{gap:2px}
.det.dense .tres .big{font-size:clamp(30px,1.8vw,38px)}
.det.dense .tres .mini{font-size:14px}
.det.dense .tbar{height:7px}
@media(max-width:1100px){.warning{font-size:13px}}
</style>""", 1)
shell = shell.replace('<main id="view"></main>', '<main id="view"><div class="loading">Carregando apontamento da produção…</div></main>', 1)
shell = shell.replace('<div class="note">', '<div class="warning" id="warnings"></div><div class="note">', 1)
html = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        + shell.replace('</style>\n\n<div id="tv-alert"', '</style>\n</head>\n<body>\n<div id="tv-alert"', 1)
        + '<script src="./tv.js" defer></script>\n</body>\n</html>\n')
output = ROOT / "unificado/tv/formas/index.html"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(html, encoding="utf-8")
print(output)

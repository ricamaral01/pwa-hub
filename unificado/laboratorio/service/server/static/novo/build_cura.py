"""Refresh the thermal preview from the current thermal page.

Only files under static/novo are written. The live page remains untouched.
"""
from pathlib import Path

static = Path(__file__).resolve().parent.parent
source = (static / "index.html").read_text(encoding="utf-8")
source = source.replace(
    "const channelColors=['#e8753e','#d8a025','#428bd9','#329982']",
    "const channelColors=['#2F6FED','#12A5A5','#8A5CF6','#7A8496']",
)
source = source.replace("if(busy||(!demo&&!token))return", "if(busy)return")
source = source.replace(
    "<title>",
    '<link rel="stylesheet" href="/novo/assets/tokens.css">'
    '<link rel="stylesheet" href="/novo/assets/cura.css"><title>',
    1,
)
source = source.replace(
    "</body>", '<script src="/novo/assets/cura.js"></script></body>', 1
)
(static / "novo" / "index.html").write_text(source, encoding="utf-8")

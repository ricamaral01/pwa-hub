"""Gera os ícones do PWA Mão de Obra a partir de formas vetoriais simples."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "unificado/m/maodeobra/icons"
OUT.mkdir(parents=True, exist_ok=True)
NAVY = "#0F2C4C"
ORANGE = "#C2561A"
WHITE = "#FFFFFF"


def render(size: int, maskable: bool = False) -> Image.Image:
    scale = 4
    s = size * scale
    image = Image.new("RGB", (s, s), NAVY)
    draw = ImageDraw.Draw(image)
    # Keep the glyph inside the central safe zone used by adaptive masks.
    inset = int(s * (0.19 if maskable else 0.13))
    draw.rounded_rectangle((inset, inset, s - inset, s - inset),
                           radius=int(s * 0.14), fill=WHITE)
    cx = s // 2
    head_r = int(s * 0.085)
    head_y = int(s * 0.36)
    draw.ellipse((cx - head_r, head_y - head_r, cx + head_r, head_y + head_r), fill=ORANGE)
    draw.rounded_rectangle((int(s * 0.32), int(s * 0.49), int(s * 0.68), int(s * 0.67)),
                           radius=int(s * 0.09), fill=ORANGE)
    draw.rounded_rectangle((int(s * 0.28), int(s * 0.73), int(s * 0.72), int(s * 0.785)),
                           radius=int(s * 0.025), fill=NAVY)
    return image.resize((size, size), Image.Resampling.LANCZOS)


render(192).save(OUT / "icon-192.png", optimize=True)
render(512).save(OUT / "icon-512.png", optimize=True)
render(512, maskable=True).save(OUT / "icon-maskable-512.png", optimize=True)
render(180).save(OUT / "apple-touch-icon.png", optimize=True)

"""Generate the dedicated inspection PWA icons."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / 'unificado/m/inspecao/icons'
OUT.mkdir(parents=True, exist_ok=True)


def make(size, maskable=False):
    scale = size / 512
    image = Image.new('RGB', (size, size), '#f1f5f8' if maskable else '#0f2c4c')
    draw = ImageDraw.Draw(image)
    def box(values):
        return tuple(round(value * scale) for value in values)
    if maskable:
        draw.rounded_rectangle(box((68, 68, 444, 444)), radius=round(84 * scale), fill='#0f2c4c')
    else:
        draw.rounded_rectangle(box((8, 8, 504, 504)), radius=round(105 * scale), fill='#0f2c4c')
    draw.polygon([box((111, 185))[:2], box((393, 208))[:2], box((393, 307))[:2], box((111, 330))[:2]], fill='#ffffff')
    draw.ellipse(box((172, 215, 196, 239)), fill='#e8762a')
    draw.ellipse(box((223, 246, 249, 272)), fill='#e8762a')
    draw.ellipse(box((276, 215, 300, 239)), fill='#e8762a')
    draw.ellipse(box((317, 254, 339, 276)), fill='#e8762a')
    draw.ellipse(box((142, 368, 204, 430)), fill='#e8762a')
    draw.line([box((155, 396))[:2], box((170, 411))[:2], box((193, 382))[:2]], fill='#ffffff', width=max(4, round(9 * scale)), joint='curve')
    return image


for width in (192, 512):
    make(width).save(OUT / f'icon-{width}.png')
make(512, True).save(OUT / 'icon-maskable-512.png')
make(180).save(OUT / 'apple-touch-icon.png')

"""Create original, distinct install icons for both Pederneiras PWAs."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "unificado/producao/pederneiras/frontend"
FONT = Path("C:/Windows/Fonts/arialbd.ttf")


def generate(target: Path, monogram: str):
    target.mkdir(parents=True, exist_ok=True)
    for size, name in ((192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png")):
        image = Image.new("RGB", (size, size), "#f3f6fa")
        draw = ImageDraw.Draw(image)
        margin = round(size * .035)
        draw.rounded_rectangle((margin, margin, size-margin, size-margin), radius=round(size*.19), fill="#123b5d")
        draw.rounded_rectangle((round(size*.15), round(size*.17), round(size*.20), round(size*.83)),
                               radius=round(size*.025), fill="#ee8a3c")
        font = ImageFont.truetype(str(FONT), round(size*(.40 if len(monogram)==1 else .30)))
        label = ImageFont.truetype(str(FONT), round(size*.075))
        draw.text((round(size*.53), round(size*.46)), monogram, fill="white", font=font, anchor="mm")
        draw.text((round(size*.52), round(size*.79)), "PEDERNEIRAS", fill="#bcdce9", font=label, anchor="mm")
        image.save(target / name, optimize=True)


if __name__ == "__main__":
    generate(ROOT / "pwa-production/public/icons", "P")
    generate(ROOT / "pwa-labor/public/icons", "MO")

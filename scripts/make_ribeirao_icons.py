"""Draw Ribeirão PWA icons with distinct production and labor marks."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1] / "unificado/producao/ribeirao/frontend"
font_file = next((font for font in (
    Path("C:/Windows/Fonts/arialbd.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
) if font.exists()), None)
if font_file is None:
    raise FileNotFoundError("Arial Bold or DejaVu Sans Bold")


def render(mark: str, folder: Path) -> None:
    canvas = Image.new("RGB", (512, 512), "white")
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((18, 18, 494, 494), radius=78, fill="#173b5d")
    draw.rounded_rectangle((76, 77, 99, 433), radius=11, fill="#ff933e")
    mark_font = ImageFont.truetype(str(font_file), 218 if mark == "R" else 177)
    label_font = ImageFont.truetype(str(font_file), 42)
    draw.text((292, 248), mark, font=mark_font, fill="white", anchor="mm")
    draw.text((292, 417), "RIBEIRÃO", font=label_font, fill="white", anchor="mm")
    folder.mkdir(parents=True, exist_ok=True)
    for size, name in ((192, "icon-192.png"), (512, "icon-512.png"),
                       (180, "apple-touch-icon.png")):
        canvas.resize((size, size), Image.Resampling.LANCZOS).save(folder / name)


render("R", root / "pwa-production/public/icons")
render("MO", root / "pwa-labor/public/icons")

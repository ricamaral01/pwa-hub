"""OCR for steel coil labels, with a focused pass over orange mill tags."""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
import re
import unicodedata

from PIL import Image, ImageOps
import pytesseract


@dataclass(frozen=True)
class OcrResult:
    text: str
    fields: dict
    confidence: float


class OcrProvider:
    def read(self, image_path: str) -> OcrResult:
        raise NotImplementedError


def _plain(value: str) -> str:
    return "".join(char for char in unicodedata.normalize("NFKD", value)
                   if not unicodedata.combining(char)).upper().replace("\u00a0", " ")


def parse_label(raw: str) -> dict:
    text = _plain(raw)
    patterns = {
        "bitola_mm": r"(?:BITOLA|DIAMETRO)\s*[:=-]?\s*(\d{1,2}(?:[,.]\d{1,2})?)\s*MM\b|\b(\d{1,2}[,.]\d{1,2})\s*MM\b",
        "norma": r"\b(?:ABNT\s*)?NBR\s*7480(?::\s*\d{4})?\b|\b7480(?::\s*\d{4})?\b",
        "corrida": r"\bCORRIDA\s*[:;#-]?\s*([A-Z0-9./-]{3,40})",
        "lote_fornecedor": r"\b(?:LOTE|BOBINA)\s*[:;#-]?\s*([A-Z0-9./-]{2,40})",
        "peso_liquido_kg": r"\bPESO\s*(?:LIQ(?:UIDO)?|NETO)\s*[:=-]?\s*(\d{1,5}(?:[.,]\d{1,2})?)\s*KG\b",
        "data_fabricacao": r"\b(?:FAB(?:RICACAO)?|DATA)\.?\s*[:=-]?\s*(\d{2}[/-]\d{2}[/-]\d{2,4})",
        "fornecedor": r"\b(?:FABRICANTE|FORNECEDOR|USINA)\s*[:=-]?\s*([^\n]{3,60})",
    }
    result: dict = {}
    direct_class = re.search(r"\bCA\s*[- ]?\s*(50|60)\b", text)
    fuzzy_class = re.search(r"\bCA\s*([5S][0O)]|[6G][0O)])(?=\W|$)", text)
    grade = (direct_class.group(1) if direct_class else
             (fuzzy_class.group(1).translate(str.maketrans("SGO)", "5600")) if fuzzy_class else None))
    if not grade:
        designation = re.search(r"\b(50|60)S\b", text)
        grade = designation.group(1) if designation else None
    result["classe"] = {"valor": "CA" + grade if grade else None,
                         "status": "lido" if direct_class else "confira"}
    for key, pattern in patterns.items():
        match = re.search(pattern, text)
        value = next((part for part in match.groups() if part is not None), None) if match and match.lastindex else (match.group(0) if match else None)
        if key in {"bitola_mm", "peso_liquido_kg"} and value:
            value = str(Decimal(value.replace(",", ".")))
        if key == "fornecedor" and not value and "ARCELORMITTAL" in text:
            value = "ArcelorMittal"
        result[key] = {"valor": value.strip() if value else None,
                       "status": "lido" if match else "confira"}
    return result


def _orange_label(image: Image.Image) -> Image.Image | None:
    """Locate the main orange tag so background steel does not swamp OCR."""
    width, height = image.size
    if width < 100 or height < 100:
        return None
    if max(width, height) > 1800:
        ratio = 1800 / max(width, height)
        image = image.resize((int(width * ratio), int(height * ratio)))
        width, height = image.size
    pixels = image.load()
    rows = [0] * height
    columns = [0] * width
    for y in range(height):
        for x in range(width):
            red, green, blue = pixels[x, y][:3]
            if red > 140 and red > green * 1.4 and green > blue * 1.15 and red - green > 55:
                rows[y] += 1
                columns[x] += 1

    def longest_run(values: list[int], minimum: float) -> tuple[int, int] | None:
        start = None
        best = (0, 0)
        for index, count in enumerate([*values, 0]):
            if count >= minimum and start is None:
                start = index
            elif count < minimum and start is not None:
                if index - start > best[1] - best[0]:
                    best = (start, index)
                start = None
        return best if best[1] > best[0] else None

    vertical = longest_run(rows, width * .15)
    if not vertical or vertical[1] - vertical[0] < height * .12:
        return None
    horizontal = longest_run(columns, (vertical[1] - vertical[0]) * .25)
    if not horizontal or horizontal[1] - horizontal[0] < width * .12:
        return None
    pad = max(8, int(width * .015))
    box = (max(0, horizontal[0] - pad), max(0, vertical[0] - pad),
           min(width, horizontal[1] + pad), min(height, vertical[1] + pad))
    return image.crop(box)


class TesseractOcrProvider(OcrProvider):
    def read(self, image_path: str) -> OcrResult:
        with Image.open(image_path) as source:
            source.load()
            image = ImageOps.exif_transpose(source).convert("RGB")
        focused = _orange_label(image)
        if focused and focused.width > 40 and focused.height > 80:
            trimmed = focused.crop((10, 10, focused.width, focused.height - 40))
            enlarged = trimmed.resize((trimmed.width * 2, trimmed.height * 2))
            candidates = [(focused, 6), (enlarged, 6), (image, 11)]
        else:
            candidates = [(image, 6), (image, 11)]
        readings = []
        for candidate, psm in candidates:
            raw = pytesseract.image_to_string(candidate, lang="por", config=f"--psm {psm}").strip()
            fields = parse_label(raw)
            readings.append((raw, fields, candidate, psm))
            merged = {key: dict(value) for key, value in readings[0][1].items()}
            for _, other, _, _ in readings[1:]:
                for key, value in other.items():
                    if not merged[key]["valor"] and value["valor"]:
                        merged[key] = dict(value)
                    elif merged[key]["valor"] and value["valor"] and merged[key]["valor"] != value["valor"]:
                        merged[key]["status"] = "confira"
            if all(merged[key]["valor"] for key in
                   ("classe", "bitola_mm", "peso_liquido_kg", "fornecedor", "corrida")):
                break
        raw = "\n--- segunda leitura ---\n".join(item[0] for item in readings)
        fields = merged
        candidate = readings[0][2]
        psm = readings[0][3]
        data = pytesseract.image_to_data(candidate, lang="por", config=f"--psm {psm}",
                                         output_type=pytesseract.Output.DICT)
        values = [float(value) for value in data["conf"] if float(value) >= 0]
        confidence = sum(values) / (100 * len(values)) if values else 0.0
        if confidence < .75:
            for field in fields.values():
                field["status"] = "confira"
        return OcrResult(raw, fields, round(confidence, 3))

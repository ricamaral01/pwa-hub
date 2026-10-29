"""Parse the complete armature label catalogue from a Word document."""

import hashlib
import io
import re
import unicodedata
import xml.etree.ElementTree as ET
from zipfile import BadZipFile, ZipFile

_NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
_HEADING = re.compile(r'\((\d{1,3})\)?\s*POSTE\s+SC\b', re.I)
_MODEL = re.compile(r'POSTE\s+SC\s*(\d+(?:[,.]\d+)?\s*[X×]\s*\d+)', re.I)


def _plain(value: str) -> str:
    return unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().upper()


def parse_word(data: bytes) -> tuple[str, list[dict]]:
    if not data or len(data) > 10_000_000:
        raise ValueError('Envie um arquivo Word de até 10 MB.')
    try:
        with ZipFile(io.BytesIO(data)) as archive:
            root = ET.fromstring(archive.read('word/document.xml'))
    except (BadZipFile, KeyError, ET.ParseError) as exc:
        raise ValueError('O arquivo não é um Word .docx válido.') from exc
    paragraphs = [''.join(node.text or '' for node in para.findall('.//w:t', _NS))
                  for para in root.findall('.//w:p', _NS)]
    content = '\n'.join(text.strip() for text in paragraphs if text.strip())
    headings = list(_HEADING.finditer(content))
    if len(headings) < 80:
        raise ValueError('O Word precisa conter o catálogo completo de etiquetas de armaduras.')
    sha = hashlib.sha256(data).hexdigest()
    entries = []
    for index, heading in enumerate(headings):
        block = content[heading.start():headings[index+1].start() if index+1 < len(headings) else None].strip()
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        number = int(heading.group(1))
        model_match = _MODEL.search(lines[0])
        if not model_match:
            raise ValueError(f'Modelo ausente na ficha {number}.')
        model = re.sub(r'\s*[X×]\s*', 'X', model_match.group(1).upper())
        title = re.sub(r'^\(\d+\)?\s*', '', lines[0]).replace('–', '-').strip()
        suffix = lines[0][model_match.end():].strip(' -–—\t')
        fields = {}
        for line in lines[1:]:
            if ':' not in line:
                continue
            name, value = line.split(':', 1)
            key = _plain(name).strip()
            fields[key] = ' '.join(value.split())
        weight_text = fields.get('PESO')
        weight = None
        if weight_text:
            match = re.search(r'\d[\d.,]*', weight_text)
            if match:
                weight = float(match.group().replace('.', '').replace(',', '.'))
        entries.append({
            'source_index': number, 'source_sha256': sha,
            'modelo': model[:80], 'variante': suffix[:80] or None,
            'titulo': title[:160],
            'engastamento': (fields.get('ENGASTAMENTO') or fields.get('EMGASTAMENTO') or '')[:80] or None,
            'cg': (fields.get('CG') or '')[:80] or None,
            'entrada_pino': (fields.get('ENTRADA PINO') or '')[:80] or None,
            'saida_pino': (fields.get('SAIDA PINO') or '')[:80] or None,
            'peso_kg': weight, 'peso_texto': weight_text[:80] if weight_text else None,
            'source_raw': block,
            'ativo': True,
        })
    numbers = [row['source_index'] for row in entries]
    if len(set(numbers)) != len(numbers) or numbers != list(range(1, len(numbers)+1)):
        raise ValueError('As fichas do Word devem ter numeração contínua sem repetições.')
    return sha, entries

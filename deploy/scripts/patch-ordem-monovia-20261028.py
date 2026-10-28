"""Atribui programação automática por profundidade no mapa físico do Mapa.

Uso: python patch-ordem-monovia-20261028.py /caminho/app.js
O arquivo original deve ser copiado antes da execução.
"""
from pathlib import Path
import sys

source = Path(sys.argv[1])
text = source.read_text(encoding='utf-8')
old = '''function getOperationalFormsForSector(setor) {
  const groups = SECTOR_FORMS[setor] || {};
  return ["left", "right", "col1", "col2", "col3"]
    .flatMap((key) => Array.isArray(groups[key]) ? groups[key] : []);
}'''
new = '''function getOperationalFormsForSector(setor) {
  const groups = SECTOR_FORMS[setor] || {};
  const lanes = (groups.left || groups.right)
    ? [groups.left || [], groups.right || []]
    : [groups.col1 || [], groups.col2 || [], groups.col3 || []];
  const ordered = [];
  const depth = Math.max(0, ...lanes.map((lane) => lane.length));
  for (let position = 0; position < depth; position++) {
    for (const lane of lanes) {
      if (lane[position]) ordered.push(lane[position]);
    }
  }
  return ordered;
}'''
if new in text:
    print('already patched')
elif old in text:
    source.write_text(text.replace(old, new, 1), encoding='utf-8')
    print('patched', source)
else:
    raise SystemExit('Original function not found; no file changed.')

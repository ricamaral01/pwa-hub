"""Evita consumir quantidade da programação PCP em forma já programada explicitamente."""
from pathlib import Path
import sys

path = Path(sys.argv[1])
source = path.read_text(encoding='utf-8')
old = '''    if (!produtoCodigo || restante <= 0) return;
    programmed.add(normalizeUpper(item.forma));
    remainingByProduct.set(produtoCodigo, restante - 1);'''
new = '''    if (!produtoCodigo || restante <= 0 || programmed.has(normalizeUpper(item.forma))) return;
    programmed.add(normalizeUpper(item.forma));
    remainingByProduct.set(produtoCodigo, restante - 1);'''
if new in source:
    print('already patched')
elif old in source:
    path.write_text(source.replace(old, new, 1), encoding='utf-8')
    print('patched', path)
else:
    raise SystemExit('Expected code missing; no file changed')

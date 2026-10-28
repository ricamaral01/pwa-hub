"""Aplica a prioridade da monovia na programação manual do Mapa operacional."""
from pathlib import Path
import sys

path = Path(sys.argv[1])
source = path.read_text(encoding='utf-8')
old = '''  } else {
    state.programmedFormas.add(normalized);
    card.classList.add("is-programmed");
    await programFormaInApiOrLocal(data, setor, normalized);'''
new = '''  } else {
    const ordered = getOperationalFormsForSector(setor);
    const selected = ordered.find((item) => normalizeUpper(item.forma) === normalized);
    const selectedProduct = normalizeUpper(withPosteData(selected, setor).codigoProduto);
    const selectedGroup = selectedProduct || normalizeUpper(selected?.modelo);
    const nearest = selectedGroup && ordered.find((item) => {
      const product = normalizeUpper(withPosteData(item, setor).codigoProduto);
      const group = product || normalizeUpper(item.modelo);
      return group === selectedGroup && !state.programmedFormas.has(normalizeUpper(item.forma))
        && !isFormaEmManutencao(setor, item.forma);
    });
    if (nearest && normalizeUpper(nearest.forma) !== normalized) {
      showLibFeedback(`Programe primeiro a forma ${nearest.forma}, mais próxima da monovia para este produto.`, "error");
      return;
    }
    state.programmedFormas.add(normalized);
    card.classList.add("is-programmed");
    await programFormaInApiOrLocal(data, setor, normalized);'''
if new in source:
    print('already patched')
elif old in source:
    path.write_text(source.replace(old, new, 1), encoding='utf-8')
    print('patched', path)
else:
    raise SystemExit('Expected manual programming block missing; no file changed')

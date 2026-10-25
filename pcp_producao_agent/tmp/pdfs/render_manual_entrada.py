from pathlib import Path
import fitz
pdf = Path('output/pdf/manual_entrada_materiais_frete_unitario_concretrack.pdf')
out = Path('tmp/pdfs/rendered_manual_entrada')
out.mkdir(parents=True, exist_ok=True)
doc = fitz.open(pdf)
print('pages', doc.page_count)
for i, page in enumerate(doc, 1):
    pix = page.get_pixmap(matrix=fitz.Matrix(1.6, 1.6), alpha=False)
    path = out / f'manual_entrada_page_{i}.png'
    pix.save(path)
    print(path)

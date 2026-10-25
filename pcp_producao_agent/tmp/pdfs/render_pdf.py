from pathlib import Path
import fitz
pdf = Path('output/pdf/plano_implantacao_icms_frete_estoque_concretrack.pdf')
outdir = Path('tmp/pdfs/rendered')
outdir.mkdir(parents=True, exist_ok=True)
doc = fitz.open(pdf)
print('pages', doc.page_count)
for i, page in enumerate(doc, 1):
    pix = page.get_pixmap(matrix=fitz.Matrix(1.6, 1.6), alpha=False)
    path = outdir / f'icms_frete_plan_page_{i}.png'
    pix.save(path)
    print(path)

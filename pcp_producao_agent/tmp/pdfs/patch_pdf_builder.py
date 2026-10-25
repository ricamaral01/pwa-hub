from pathlib import Path
p=Path('tmp/pdfs/build_icms_frete_plan.py')
s=p.read_text(encoding='utf-8')
s=s.replace("def tbl(data, widths):\n    t = Table(data, colWidths=widths, hAlign='LEFT')", "def _cell(v, header=False):\n    if isinstance(v, Paragraph):\n        return v\n    style = 'SmallCT' if not header else 'BodyCT'\n    return Paragraph(str(v), styles[style])\n\ndef tbl(data, widths):\n    wrapped = []\n    for ri, row in enumerate(data):\n        wrapped.append([_cell(v, header=(ri==0)) for v in row])\n    t = Table(wrapped, colWidths=widths, hAlign='LEFT')")
s=s.replace("('FONTSIZE',(0,0),(-1,-1),8.2),\n        ('LEADING',(0,0),(-1,-1),10),", "('FONTSIZE',(0,0),(-1,-1),8.0),\n        ('LEADING',(0,0),(-1,-1),10),")
p.write_text(s, encoding='utf-8')

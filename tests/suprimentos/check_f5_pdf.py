"""Baixa a exportação PDF da homologação, rende páginas e confere texto."""
from __future__ import annotations

import json
from pathlib import Path

import pypdfium2 as pdfium
import requests
from pypdf import PdfReader

ROOT='https://concrefer.concretrack.com.br:18446'
OUT=Path('docs/porting/suprimentos/capturas/f5')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    passwords=json.loads(Path('C:/Users/Admin/Downloads/suprimentos-homolog-logins-20261025.json').read_text(encoding='utf-8'))
    session=requests.Session()
    response=session.post(ROOT+'/unificado/mapa/api/login',json={
        'name':'e2e-suprimentos-compras','password':passwords['e2e-suprimentos-compras']},timeout=15)
    assert response.status_code==200,response.status_code
    response=session.post(ROOT+'/unificado/mapa/api/unified/suprimentos-bootstrap',timeout=15)
    assert response.status_code==200,response.status_code
    response=session.get(ROOT+'/api/suprimentos/analises/exportar.pdf',timeout=30)
    assert response.status_code==200,response.status_code
    assert response.content.startswith(b'%PDF-')
    path=OUT/'indicadores-homolog.pdf';path.write_bytes(response.content)
    reader=PdfReader(str(path));assert len(reader.pages)>=1
    content='\n'.join(page.extract_text() or '' for page in reader.pages)
    for label in ('Suprimentos - Indicadores','Lead time','Consumo / curva ABC','Itens zerados'):
        assert label in content,label
    document=pdfium.PdfDocument(str(path))
    for index in range(len(document)):
        page=document[index]
        image=page.render(scale=1.5).to_pil()
        image.save(OUT/f'indicadores-pagina-{index+1}.png')
    (OUT/'pdf-conferencia.json').write_text(json.dumps({'paginas':len(reader.pages),
        'bytes':len(response.content),'rotulos_verificados':4},ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'F5_PDF_OK paginas={len(reader.pages)}')


if __name__=='__main__': main()

"""One-page A4 certificate. Raises instead of silently adding a second page."""
from datetime import date
from decimal import Decimal
from io import BytesIO
from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen.canvas import Canvas

BLUE = colors.HexColor('#173D73')
INK = colors.HexColor('#1D2B3B')
MUTED = colors.HexColor('#64748B')
PALE = colors.HexColor('#EEF4FC')
WIDTH, HEIGHT = A4


def _fonts():
    regular = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
    bold = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
    if regular.exists():
        pdfmetrics.registerFont(TTFont('CQ', str(regular)))
        pdfmetrics.registerFont(TTFont('CQ-Bold', str(bold)))
        return 'CQ', 'CQ-Bold'
    return 'Helvetica', 'Helvetica-Bold'


def _text(c, x, y, value, size=8, bold=False, color=INK):
    regular, heavy = _fonts()
    c.setFont(heavy if bold else regular, size)
    c.setFillColor(color)
    c.drawString(x, y, str(value or ''))


def _date(value):
    if not value:
        return '—'
    if isinstance(value, str):
        value = date.fromisoformat(value[:10])
    return value.strftime('%d/%m/%Y')


def _num(value):
    return '—' if value is None else f'{float(value):.2f}'.replace('.', ',')


def make_pdf(cert: dict, items: list[dict], results: list[dict], *, issued: bool,
             signature_path: str = '', logo_path: str = '', verify_base: str = '') -> bytes:
    if len({str(row['data_producao']) for row in items}) > 10:
        raise ValueError('O certificado admite no máximo 10 datas.')
    if not items or not results or len(items) > 18:
        raise ValueError('Quantidade de itens incompatível com uma folha A4.')
    buff = BytesIO()
    c = Canvas(buff, pagesize=A4, pageCompression=1)
    c.setTitle(f"Certificado de Qualidade {cert.get('numero') or 'Rascunho'}")
    left, right = 40, WIDTH - 40
    if logo_path and Path(logo_path).is_file():
        c.drawImage(logo_path, left, HEIGHT-85, width=110, height=40, preserveAspectRatio=True, mask='auto')
    _text(c, 168, HEIGHT-54, 'CERTIFICADO DE QUALIDADE', 14, True, BLUE)
    _text(c, 168, HEIGHT-71, 'POSTES DE CONCRETO · CONCREFER', 8, False, MUTED)
    _text(c, right-125, HEIGHT-93, cert.get('numero') or 'RASCUNHO', 8, True, BLUE)
    c.setStrokeColor(BLUE); c.setLineWidth(1.5); c.line(left, HEIGHT-104, right, HEIGHT-104)
    y = HEIGHT-124
    for label, value in [
        ('Cliente', cert['cliente']), ('Endereço', cert.get('endereco')),
        ('Nota fiscal', cert.get('nota_fiscal')), ('Emissão', _date(cert.get('data_emissao')))
    ]:
        _text(c, left, y, label.upper(), 7, True, MUTED)
        _text(c, left+83, y, str(value or '—')[:78], 8)
        y -= 20
    y -= 8
    def heading(title, labels, widths):
        nonlocal y
        _text(c, left, y, title, 9, True, BLUE)
        y -= 23
        c.setFillColor(PALE); c.roundRect(left, y-5, right-left, 22, 3, fill=1, stroke=0)
        x = left+7
        for label, width in zip(labels, widths):
            _text(c, x, y+3, label, 7, True, BLUE)
            x += width
        y -= 14
    widths = [194, 45, 57, 58, 42, 83]
    heading('POSTES CERTIFICADOS', ['Modelo', 'Altura', 'Carga', 'Peso', 'Qtd.', 'Produção'], widths)
    item_height = 17 if len(items) <= 5 and len(results) <= 5 else 15
    for item in items:
        model = str(item['modelo'])
        model_size = 7.3
        while pdfmetrics.stringWidth(model, _fonts()[0], model_size) > widths[0]-12 and model_size > 6:
            model_size -= .2
        if pdfmetrics.stringWidth(model, _fonts()[0], model_size) > widths[0]-12:
            raise ValueError('Modelo longo demais para uma folha A4.')
        values = [model, _num(item.get('altura_m')), _num(item.get('carga_dan')),
                  _num(item.get('peso_kg')), str(item['quantidade']), _date(item['data_producao'])]
        x = left+7
        for index,(value, width) in enumerate(zip(values, widths)):
            _text(c, x, y-1, value, model_size if index==0 else 7.3)
            x += width
        c.setStrokeColor(colors.HexColor('#E3E9F1')); c.line(left,y-5,right,y-5)
        y -= item_height
    y -= 8
    heading('RESISTÊNCIA À COMPRESSÃO POR DATA DE PRODUÇÃO',
            ['Produção / lote', 'CPs', '3 dias', '7 dias', '28 dias', 'Resultado'],
            [138, 51, 70, 70, 70, 80])
    for result in results:
        day = result['data_producao']
        values = [f"{_date(day)}  L{str(day).replace('-', '')}", str(result.get('n_cps') or 0),
                  _num(result.get('r3_media')), _num(result.get('r7_media')),
                  _num(result.get('r28_media')), result['resultado'].replace('_',' ').title()]
        x = left+7
        for value, width in zip(values, [138,51,70,70,70,80]):
            _text(c, x, y-1, value, 7)
            x += width
        c.setStrokeColor(colors.HexColor('#E3E9F1')); c.line(left,y-5,right,y-5)
        y -= 17 if len(results) <= 5 else 15
    y -= 8
    if y < (293 if len(results) <= 5 else 190):
        raise ValueError('O conteúdo excede uma folha A4; reduza os itens.')
    press = cert.get('prensa_snapshot') or {}
    c.setFillColor(PALE); c.roundRect(left, y-50, right-left, 61, 5, fill=1, stroke=0)
    _text(c, left+10, y-3, 'NORMAS E PRENSA DE AFERIÇÃO', 8, True, BLUE)
    _text(c, left+10, y-18, 'ABNT NBR 8451-1 a 8451-5 · fck ' + _num(cert.get('fck_mpa')) + ' MPa', 7.5)
    _text(c, left+10, y-31, f"{press.get('fabricante','')} {press.get('modelo','')} · série {press.get('serie','')}"[:108], 7)
    _text(c, left+10, y-44, f"Calibração {press.get('certificado_calibracao','')} · RBC {press.get('laboratorio_rbc','')} · validade {_date(press.get('validade'))}"[:108], 7)
    footer_y = 185 if len(results) <= 5 else 76
    c.setStrokeColor(colors.HexColor('#D5DFEA')); c.line(left, footer_y+50, right, footer_y+50)
    _text(c, left, footer_y+28, cert.get('resp_laboratorio') or '', 8, True)
    _text(c, left, footer_y+15, 'Responsável pelo laboratório', 7, False, MUTED)
    _text(c, 225, footer_y+28, 'Eng. Marcelo Eduardo Ishizaki de Sousa', 7.5, True)
    _text(c, 225, footer_y+15, 'CREA 5063392251 · Responsável técnico', 7, False, MUTED)
    if issued and signature_path and Path(signature_path).is_file():
        c.drawImage(signature_path, 300, footer_y+35, width=95 if len(results)>5 else 120,
                    height=28 if len(results)>5 else 38, preserveAspectRatio=True, mask='auto')
    if issued and cert.get('numero') and verify_base:
        url = verify_base.rstrip('/') + '/v/' + cert['numero']
        qr = QrCodeWidget(url)
        box = qr.getBounds(); size = 36 if len(results)>5 else 50
        drawing = Drawing(size,size,transform=[size/(box[2]-box[0]),0,0,size/(box[3]-box[1]),0,0]); drawing.add(qr)
        renderPDF.draw(drawing,c,right-size,footer_y+6)
        _text(c,left,footer_y-2,'Documento emitido eletronicamente' if len(results)<=5 else 'Emissão eletrônica',7,True,BLUE)
        _text(c,left,footer_y-14,url[:80],6,False,MUTED)
    if not issued:
        c.saveState(); c.translate(WIDTH/2,HEIGHT/2); c.rotate(35)
        c.setFillColor(colors.HexColor('#DCE5F0')); c.setFont(_fonts()[1],55)
        c.drawCentredString(0,0,'RASCUNHO'); c.restoreState()
    c.showPage(); c.save()
    return buff.getvalue()

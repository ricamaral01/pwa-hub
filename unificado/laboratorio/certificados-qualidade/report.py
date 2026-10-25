"""A4 certificate laid out against the approved 03/03b PDF mockups."""
from __future__ import annotations

import os
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from html import escape
from io import BytesIO
from pathlib import Path
from zoneinfo import ZoneInfo

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph, Table, TableStyle

BLUE = colors.HexColor('#0F2C4C')
INK = colors.HexColor('#111820')
MUTED = colors.HexColor('#3D4855')
GRID = colors.HexColor('#9AA6B4')
HEADER = colors.HexColor('#E9EEF4')
TOTAL = colors.HexColor('#F6F8FA')
W, H = A4
LEFT, RIGHT = 33, W - 33
CONTENT = RIGHT - LEFT
_FONTS = None


def _fonts():
    global _FONTS
    if _FONTS:
        return _FONTS
    candidates = [
        (Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'),
         Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')),
        (Path('C:/Windows/Fonts/arial.ttf'), Path('C:/Windows/Fonts/arialbd.ttf')),
    ]
    for normal, bold in candidates:
        if normal.is_file() and bold.is_file():
            pdfmetrics.registerFont(TTFont('CQ', str(normal)))
            pdfmetrics.registerFont(TTFont('CQ-Bold', str(bold)))
            pdfmetrics.registerFontFamily('CQ', normal='CQ', bold='CQ-Bold')
            _FONTS = ('CQ', 'CQ-Bold')
            return _FONTS
    _FONTS = ('Helvetica', 'Helvetica-Bold')
    return _FONTS


def _text(canvas, x, y, value, size=8, bold=False, color=INK, align='left'):
    regular, heavy = _fonts()
    canvas.setFont(heavy if bold else regular, size)
    canvas.setFillColor(color)
    value = str(value or '')
    if align == 'center': canvas.drawCentredString(x, y, value)
    elif align == 'right': canvas.drawRightString(x, y, value)
    else: canvas.drawString(x, y, value)


def _paragraph(value, size=8, leading=10, bold=False, color=INK, align=0):
    normal, heavy = _fonts()
    style = ParagraphStyle('cell', fontName=heavy if bold else normal,
                           fontSize=size, leading=leading, textColor=color,
                           alignment=align, spaceBefore=0, spaceAfter=0)
    return Paragraph(escape(str(value or '—')).replace('\n', '<br/>'), style)


def _rich(value, size=8, leading=11):
    normal,_=_fonts()
    return Paragraph(value,ParagraphStyle('rich',fontName=normal,fontSize=size,
                                          leading=leading,textColor=INK,
                                          spaceBefore=0,spaceAfter=0))


def _date(value):
    if not value: return '—'
    if isinstance(value, str): value = date.fromisoformat(value[:10])
    return value.strftime('%d/%m/%Y')


def _whole(value):
    if value is None or value == '': return '—'
    number = Decimal(str(value)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
    return f'{number:,.0f}'.replace(',', '.')


def _one(value):
    if value is None or value == '': return '—'
    number = Decimal(str(value)).quantize(Decimal('0.1'), rounding=ROUND_HALF_UP)
    return f'{number:.1f}'.replace('.', ',')


def _table(canvas, data, widths, row_heights, top, *, total=False, bold_columns=()):
    normal, heavy = _fonts()
    last = len(data)-1
    styles = [
        ('GRID', (0,0),(-1,-1), .75, GRID),
        ('BACKGROUND',(0,0),(-1,0),HEADER),
        ('FONTNAME',(0,0),(-1,0),heavy),
        ('FONTNAME',(0,1),(-1,-1),normal),
        ('FONTSIZE',(0,0),(-1,-1),8),
        ('TEXTCOLOR',(0,0),(-1,-1),INK),
        ('ALIGN',(0,0),(-1,-1),'CENTER'),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LEFTPADDING',(0,0),(-1,-1),4),
        ('RIGHTPADDING',(0,0),(-1,-1),4),
        ('TOPPADDING',(0,0),(-1,-1),2),
        ('BOTTOMPADDING',(0,0),(-1,-1),2),
    ]
    if total:
        styles += [('BACKGROUND',(0,last),(-1,last),TOTAL),
                   ('SPAN',(0,last),(3,last)), ('SPAN',(5,last),(6,last)),
                   ('FONTNAME',(0,last),(-1,last),heavy)]
    else:
        styles.append(('FONTNAME',(0,1),(0,last),heavy))
    for column in bold_columns:
        styles.append(('FONTNAME',(column,1),(column,last-1 if total else last),heavy))
    table=Table(data,colWidths=widths,rowHeights=row_heights,style=TableStyle(styles))
    _,height=table.wrapOn(canvas,CONTENT,H)
    table.drawOn(canvas,LEFT,top-height)
    return top-height


def _qr(canvas, value, x, y, size):
    widget=QrCodeWidget(value)
    x0,y0,x1,y1=widget.getBounds()
    scale=size/(x1-x0)
    drawing=Drawing(size,size,transform=[scale,0,0,scale,-x0*scale,-y0*scale])
    drawing.add(widget)
    renderPDF.draw(drawing,canvas,x,y)


def _footer(canvas, cert, issued, verify_base, expanded):
    size=69 if expanded else 33  # 92/44 CSS px at 0.75 pt/px
    line_y=88 if expanded else 49
    qr_y=12
    canvas.setStrokeColor(GRID); canvas.setLineWidth(.75)
    canvas.line(LEFT,line_y,RIGHT,line_y)
    number=cert.get('numero') if issued else 'CQ-RASCUNHO'
    url=verify_base.rstrip('/')+'/v/'+str(number)
    _qr(canvas,url,LEFT,qr_y,size)
    x=LEFT+size+(12 if expanded else 10)
    if expanded:
        _text(canvas,x,67,'Documento emitido eletronicamente',10,True)
        y=52
    else:
        y=36
    if issued:
        moment=cert.get('emitido_em')
        if isinstance(moment,str): moment=datetime.fromisoformat(moment)
        if isinstance(moment,datetime):
            if moment.tzinfo is None: moment=moment.replace(tzinfo=ZoneInfo('America/Sao_Paulo'))
            moment=moment.astimezone(ZoneInfo('America/Sao_Paulo')).strftime('%d/%m/%Y %H:%M')
        else: moment=_date(cert.get('data_emissao'))
        actor=cert.get('emitido_por_nome') or cert.get('emitido_por') or 'Concretrack Laboratório'
        first=f'Emitido eletronicamente em {moment} por {actor} · Concretrack Laboratório.'
        second=f'Verificação: {url}. Válido somente para os lotes e produtos relacionados.'
    else:
        first='Prévia de rascunho, sem validade comercial. QR de prévia; verificação ativa após emissão.'
        second='Válido somente após emissão e assinatura eletrônica do certificado.'
    font=8.4 if expanded else 7.2
    width=RIGHT-x
    first_para=_paragraph(first,font,font+2,color=MUTED)
    second_para=_paragraph(second,font,font+2,color=MUTED)
    _,first_h=first_para.wrap(width,35)
    _,second_h=second_para.wrap(width,35)
    first_para.drawOn(canvas,x,y-first_h+font)
    second_para.drawOn(canvas,x,y-first_h-second_h+font-2)


def _signatures(canvas, cert, issued, signature_path, expanded):
    line_y=128 if expanded else 85
    gap=30
    col=(CONTENT-36-gap)/2
    x1=LEFT+18
    x2=x1+col+gap
    canvas.setStrokeColor(INK); canvas.setLineWidth(.75)
    canvas.line(x1,line_y,x1+col,line_y)
    canvas.line(x2,line_y,x2+col,line_y)
    if issued and signature_path and Path(signature_path).is_file():
        height=54 if expanded else 37
        canvas.drawImage(signature_path,x2+col/2-58,line_y+2,
                         width=116,height=height,preserveAspectRatio=True,mask='auto')
    _text(canvas,x1+col/2,line_y-14,cert.get('resp_laboratorio') or '—',8.5,True,align='center')
    _text(canvas,x1+col/2,line_y-27,'Responsável pelo laboratório',7.8,False,MUTED,align='center')
    _text(canvas,x2+col/2,line_y-14,'Eng. Marcelo Eduardo Ishizaki de Sousa',8.2,True,align='center')
    _text(canvas,x2+col/2,line_y-27,'Engenheiro responsável · CREA 5063392251',7.4,False,MUTED,align='center')
    return line_y+(54 if expanded else 37)


def make_pdf(cert: dict, items: list[dict], results: list[dict], *, issued: bool,
             signature_path: str = '', logo_path: str = '', verify_base: str = '') -> bytes:
    distinct={str(row['data_producao']) for row in items}
    if len(distinct)>10: raise ValueError('O certificado admite no máximo 10 datas.')
    if not items or not results or len(items)>18:
        raise ValueError('Quantidade de itens incompatível com uma folha A4.')
    expanded=len(distinct)<=5
    verify_base=verify_base or 'https://concrefer.concretrack.com.br'
    stream=BytesIO(); canvas=Canvas(stream,pagesize=A4,pageCompression=1)
    canvas.setTitle(f"Certificado de Qualidade {cert.get('numero') or 'Rascunho'}")
    normal,heavy=_fonts()

    # The watermark is behind all text and grid lines, at roughly 6% opacity.
    if not issued:
        canvas.saveState()
        canvas.translate(W/2,H/2);canvas.rotate(32)
        canvas.setFillColor(BLUE);canvas.setFillAlpha(.06)
        canvas.setFont(heavy,52);canvas.drawCentredString(0,0,'RASCUNHO')
        canvas.restoreState()

    # Header: logo, title/subtitle, and number/revision/date panel.
    if logo_path and Path(logo_path).is_file():
        canvas.drawImage(logo_path,LEFT,775,width=105,height=42,
                         preserveAspectRatio=True,anchor='c',mask='auto')
    else:
        canvas.setStrokeColor(GRID);canvas.roundRect(LEFT,775,105,42,4,stroke=1,fill=0)
        _text(canvas,LEFT+52,795,'Concrefer',8,False,MUTED,align='center')
    _text(canvas,LEFT+117,799,'Certificado de Qualidade',15.5,True,BLUE)
    _text(canvas,LEFT+117,782,'Postes de concreto armado · ABNT NBR 8451',8.2,False,MUTED)
    card_x=RIGHT-129
    canvas.setStrokeColor(BLUE);canvas.setLineWidth(.9)
    canvas.roundRect(card_x,771,129,48,5,stroke=1,fill=0)
    for y,label,value in [(805,'Nº',cert.get('numero') or 'RASCUNHO'),
                          (791,'Revisão',str(cert.get('revisao',0))),
                          (777,'Emissão',_date(cert.get('data_emissao')))]:
        _text(canvas,card_x+8,y,label,7.8,False,MUTED)
        _text(canvas,RIGHT-8,y,value,7.8,True,INK,align='right')
    canvas.setStrokeColor(BLUE);canvas.setLineWidth(1.5)
    canvas.line(LEFT,763,RIGHT,763)

    # Two-by-two customer panel.
    customer=[
        [_paragraph('CLIENTE',7.4,bold=True,color=MUTED),
         _paragraph(cert.get('cliente'),8.1,bold=True),
         _paragraph('NF',7.4,bold=True,color=MUTED),
         _paragraph(cert.get('nota_fiscal'),8.1,bold=True)],
        [_paragraph('ENTREGA',7.4,bold=True,color=MUTED),
         _paragraph(cert.get('endereco'),8),
         _paragraph('UNIDADE',7.4,bold=True,color=MUTED),
         _paragraph(cert.get('unidade') or os.getenv('CQ_UNIDADE','Campinas'),8)],
    ]
    customer_table=Table(customer,colWidths=[52,CONTENT-52-55-110,55,110],
                         rowHeights=[22,22],style=TableStyle([
        ('BOX',(0,0),(-1,-1),.75,GRID),('LINEBELOW',(0,0),(-1,0),.75,GRID),
        ('LINEBEFORE',(2,0),(2,-1),.75,GRID),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),4),
        ('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),2)]))
    customer_table.wrapOn(canvas,CONTENT,H);customer_table.drawOn(canvas,LEFT,709)

    _text(canvas,LEFT,691,'1. PRODUTOS FORNECIDOS',9.5,True,BLUE)
    products=[[ _paragraph('Modelo',8,bold=True,align=1),
                _paragraph('Altura\n(m)',7.8,bold=True,align=1),
                _paragraph('Carga\n(daN)',7.8,bold=True,align=1),
                _paragraph('Peso\n(kg)',7.8,bold=True,align=1),
                _paragraph('Qtd',8,bold=True,align=1),
                _paragraph('Data de\nprodução',7.8,bold=True,align=1),
                _paragraph('Lote',8,bold=True,align=1)]]
    product_heights=[25]
    for item in items:
        model=_paragraph(item.get('modelo'),7.6,9)
        _,height=model.wrap(196,100)
        product_heights.append(max(17,height+5))
        day=item['data_producao']
        lot=item.get('lote') or 'L'+str(day).replace('-','')
        products.append([model,_whole(item.get('altura_m')),_whole(item.get('carga_dan')),
                         _whole(item.get('peso_kg')),str(item['quantidade']),_date(day),lot])
    total=sum(int(item['quantidade']) for item in items)
    products.append(['Total de postes','','','',str(total),'',''])
    product_heights.append(18)
    product_bottom=_table(canvas,products,[201,46,52,52,28,81,69],product_heights,
                          678,total=True)

    _text(canvas,LEFT,product_bottom-17,
          '2. RESISTÊNCIA À COMPRESSÃO POR DATA DE PRODUÇÃO (MPa)',9.5,True,BLUE)
    resistance=[[_paragraph(label,7.7,bold=True,align=1) for label in
                 ('Data de produção','CPs','3 dias','7 dias','28 dias','fck','Resultado')]]
    for row in results:
        status={'conforme':'CONFORME','nao_conforme':'NÃO CONFORME',
                'aguardando_28_dias':'AGUARDANDO 28 DIAS','sem_resultado':'SEM RESULTADO'}.get(row['resultado'],row['resultado'].upper())
        resistance.append([_date(row['data_producao']),str(row.get('n_cps') or 0),
                           _one(row.get('r3_media')),_one(row.get('r7_media')),
                           _one(row.get('r28_media')),_one(cert.get('fck_mpa')),status])
    resistance_top=product_bottom-28
    resistance_bottom=_table(canvas,resistance,[123,40,65,65,65,50,121],
                             [24]+[17]*len(results),resistance_top,bold_columns=(4,6))

    note=_paragraph('Média dos corpos de prova moldados na data de produção dos postes '
                    '(ABNT NBR 5738 e NBR 5739). Conforme quando a média aos 28 dias supera o fck. '
                    'Fonte: controle estatístico do laboratório.',7.4,10,color=MUTED)
    _,note_h=note.wrap(CONTENT,45)
    note.drawOn(canvas,LEFT,resistance_bottom-note_h-5)

    # Compact two-column standards/press block.
    press=cert.get('prensa_snapshot') or {}
    press_identity=' '.join(str(press.get(key) or '').strip() for key in ('fabricante','modelo')).strip() or '—'
    serial=str(press.get('serie') or '—')
    patrimonio=str(press.get('patrimonio') or '—')
    capacity=_one(press.get('capacidade_kn'))
    press_line=f'{press_identity} · série {serial} · patrimônio {patrimonio} · {capacity} kN · classe {press.get("classe") or "—"}'
    calibration=f'Calibração: certificado {press.get("certificado_calibracao") or "—"} · {press.get("laboratorio_rbc") or "—"} · em {_date(press.get("data_calibracao"))} · válida até {_date(press.get("validade"))}'
    norms=[[
        _rich('<b><font color="#0F2C4C">NORMAS</font></b><br/>ABNT NBR 8451-1 a 8451-5<br/>ABNT NBR 5738 · ABNT NBR 5739',8,11),
        _rich('<b><font color="#0F2C4C">PRENSA DE ENSAIO (AFERIÇÃO)</font></b><br/>'+
              escape(press_line)+'<br/>'+escape(calibration),8,11),
    ]]
    norms_table=Table(norms,colWidths=[158,CONTENT-158],style=TableStyle([
        ('BOX',(0,0),(-1,-1),.75,GRID),('LINEBEFORE',(1,0),(1,0),.75,GRID),
        ('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),
        ('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),
        ('BOTTOMPADDING',(0,0),(-1,-1),6)]))
    _,norms_h=norms_table.wrapOn(canvas,CONTENT,H)
    norms_top=resistance_bottom-note_h-13
    norms_bottom=norms_top-norms_h
    signature_top=128+54 if expanded else 85+37
    if norms_bottom<signature_top+13:
        raise ValueError('O conteúdo excede uma folha A4; reduza os itens.')
    norms_table.drawOn(canvas,LEFT,norms_bottom)

    _signatures(canvas,cert,issued,signature_path,expanded)
    _footer(canvas,cert,issued,verify_base,expanded)
    canvas.showPage();canvas.save()
    return stream.getvalue()

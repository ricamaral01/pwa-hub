"""Readable daily/weekly serial handoff reports, preserving forecast status."""
from __future__ import annotations

from datetime import date,datetime
from html import escape
from io import BytesIO
from pathlib import Path
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from app.services.armaduras import fingerprint


def range_text(values):
    return ', '.join(str(a) if a==b else f'{a} a {b}' for a,b in values) or '-'


def number_text(values):
    """Print every serial, keeping gaps between confirmed ranges intact."""
    return ', '.join(str(number) for start,end in values for number in range(start,end+1)) or '-'


def build(data,scope='dia',day=None,mode='previsao'):
    data=jsonable_encoder(data)
    if scope not in {'dia','semana'} or mode not in {'previsao','confirmados'}:
        raise HTTPException(422,'Tipo de relatório inválido')
    if scope=='dia':
        if not day:raise HTTPException(422,'Selecione o dia do relatório')
        day=str(day)
        if day not in data['dias']:raise HTTPException(422,'O dia deve pertencer à semana selecionada, de segunda a sábado')
        selected=[day]
    else:selected=data['dias']
    lines=[]
    for source in data['linhas']:
        cells={d:source['dias'][d] for d in selected if d in source['dias']}
        relevant=any(c.get('quantidade_confirmada',0)>0 for c in cells.values()) if mode=='confirmados' else any(
            c.get('programado',0)>0 or c.get('quantidade_confirmada',0)>0 or c.get('quantidade_prevista',0)>0 for c in cells.values())
        if not relevant:continue
        lines.append({**{k:source.get(k) for k in ('modelo_id','descricao','codigo','ano','saldo_inicial','ultimo_confirmado','pendencia_saldo')},'dias':cells})
    missing=sum(bool(r['pendencia_saldo']) for r in lines)
    totals={d:{'programado':sum(r['dias'].get(d,{}).get('programado',0) for r in lines),
               'confirmado':sum(r['dias'].get(d,{}).get('quantidade_confirmada',0) for r in lines),
               'previsto':sum(r['dias'].get(d,{}).get('quantidade_prevista',0) for r in lines)} for d in selected}
    result={'layout':'series-individuais-v2','escopo':scope,'modo':mode,'semana':data['inicio'],'dias':selected,
            'linhas':lines,'totais':totals,'saldos_pendentes':missing,'execucoes_pendentes':data['execucoes_pendentes'],
            'divergencias_execucao':data.get('divergencias_execucao',0),'ultima_sincronizacao':data['ultima_sincronizacao'],
            'fonte_assinatura':fingerprint(data),
            'aviso':'NÚMEROS PREVISTOS - CONFERIR ANTES DA MARCAÇÃO. Previsões não reservam nem confirmam números.' if mode=='previsao' else 'SOMENTE NÚMEROS DE SÉRIE CONFIRMADOS NO REGISTRO DE PRODUÇÃO.'}
    result['assinatura']=fingerprint(result)
    return result


def pdf(data,emission):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4,landscape
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate,Paragraph,Table,TableStyle,Spacer,Image,KeepInFrame

    data=jsonable_encoder(data);emission=jsonable_encoder(emission)
    stream=BytesIO()
    doc=SimpleDocTemplate(stream,pagesize=landscape(A4),leftMargin=25,rightMargin=25,topMargin=25,bottomMargin=32,
                          title='Números de série dos postes - Setor 3')
    small=ParagraphStyle('small',fontName='Helvetica',fontSize=8,leading=10)
    strong=ParagraphStyle('strong',parent=small,fontName='Helvetica-Bold')
    number=ParagraphStyle('number',parent=strong,fontSize=10,leading=12)
    title=ParagraphStyle('title',parent=strong,fontSize=11,leading=14)
    caption=lambda d:date.fromisoformat(d).strftime('%d/%m/%Y')
    short=lambda d:date.fromisoformat(d).strftime('%d/%m')
    names=['seg.','ter.','qua.','qui.','sex.','sáb.','dom.']
    created=datetime.fromisoformat(str(emission['criado_em'])).astimezone(ZoneInfo('America/Sao_Paulo'))
    logo=Path(__file__).resolve().parents[3]/'public/unificado/pcp/static/img/logo-concrefer-relatorio.png'
    brand=Image(str(logo),width=120,height=45,kind='proportional') if logo.is_file() else Paragraph('<b>CONCREFER</b><br/>Planejamento - Campinas',title)
    period=caption(data['dias'][0]) if data['escopo']=='dia' else caption(data['dias'][0])+' a '+caption(data['dias'][-1])
    heading='NÚMEROS DE SÉRIE DOS POSTES - SETOR 3'
    metadata=Table([[brand,Paragraph(f'<b>{heading}</b><br/>Produção: {period}<br/>Campinas - entrega à produção',small),
                    Paragraph(f"<b>Emissão {emission['id']} / revisão {emission['revisao']}</b><br/>{created.strftime('%d/%m/%Y %H:%M')} (Brasília)<br/>{escape(emission['responsavel'])}",small)]],colWidths=[165,400,226],hAlign='LEFT')
    metadata.setStyle(TableStyle([('GRID',(0,0),(-1,-1),.6,colors.black),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
    story=[metadata,Spacer(1,8),Paragraph(escape(data['aviso']),strong),Spacer(1,5)]
    if data['modo']=='previsao':
        story.append(Paragraph(f"Execuções da semana a conferir: {data['execucoes_pendentes']}. Modelos deste relatório sem saldo inicial: {data['saldos_pendentes']}. As faixas previstas podem mudar após a conferência da execução.",small))
        story.append(Spacer(1,6))
    if data['divergencias_execucao']:
        story.extend([Paragraph(f"Origem alterada em {data['divergencias_execucao']} registro(s): conferir rastreabilidade.",strong),Spacer(1,5)])
    if data['escopo']=='dia':
        day=data['dias'][0]
        table_rows=[[Paragraph(f"{names[date.fromisoformat(day).weekday()]} {caption(day)} - Séries por modelo",strong)]+['']*7,
          ['Modelo do poste','Cód. produto','Ano','Qtd.\nprog.','Séries CONFIRMADAS','Séries PREVISTAS\npara este dia','Qtd.\nprev.','Situação']]
        for row in data['linhas']:
            cell=row['dias'][day]
            predicted=number_text(cell.get('previsao',[])) if data['modo']=='previsao' else '-'
            situation='Saldo inicial pendente' if row['pendencia_saldo'] else 'Há faixas previstas' if cell.get('quantidade_prevista') and data['modo']=='previsao' else 'Confirmado' if cell.get('quantidade_confirmada') else 'Sem série confirmada'
            table_rows.append([Paragraph(escape(row['descricao']),strong),Paragraph(escape(row['codigo'] or '-'),small),row['ano'],cell.get('programado',0),
              Paragraph(escape(number_text(cell.get('confirmados',[]))),number),
              Paragraph(escape(predicted if predicted!='-' or not row['pendencia_saldo'] else 'Saldo pendente'),number),
              cell.get('quantidade_prevista',0) if data['modo']=='previsao' else '-',Paragraph(situation,small)])
        totals=data['totais'][day]
        table_rows.append(['Total de postes','','',totals['programado'],str(totals['confirmado'])+' confirmados','',totals['previsto'] if data['modo']=='previsao' else '-',''])
        widths=[155,65,43,40,170,190,43,85]
    else:
        table_rows=[[Paragraph('Setor 3 - Todos os números de série por dia da semana',strong)]+['']*9,
          ['Modelo do poste','Cód. produto','Ano','Última\nconfirmada']+[names[date.fromisoformat(d).weekday()]+'\n'+short(d) for d in data['dias']]]
        for row in data['linhas']:
            values=[]
            for day in data['dias']:
                cell=row['dias'].get(day)
                if not cell:values.append('-');continue
                text=[]
                if cell.get('quantidade_confirmada'):text.append('<b>C: '+escape(number_text(cell['confirmados']))+'</b>')
                if data['modo']=='previsao':
                    if cell.get('quantidade_prevista'):text.append('<b>P: '+escape(number_text(cell['previsao']))+'</b>')
                    elif row['pendencia_saldo'] and cell.get('programado'):text.append('Saldo pendente')
                values.append(Paragraph('<br/>'.join(text) or '-',small))
            table_rows.append([Paragraph(escape(row['descricao']),strong),Paragraph(escape(row['codigo'] or '-'),small),row['ano'],row['ultimo_confirmado'] if row['ultimo_confirmado'] is not None else '-']+values)
        table_rows.append(['Total de postes','','','']+[Paragraph('C: '+str(data['totais'][d]['confirmado'])+('<br/>P: '+str(data['totais'][d]['previsto'])+'<br/>Prog.: '+str(data['totais'][d]['programado']) if data['modo']=='previsao' else ''),small) for d in data['dias']])
        widths=[122,52,36,57]+[(791-267)/6]*6
    # Keep the same compact A4 landscape page standard as Armaduras.
    table=Table(table_rows,colWidths=widths,repeatRows=2,hAlign='LEFT')
    table.setStyle(TableStyle([('GRID',(0,0),(-1,-1),.4,colors.HexColor('#555555')),
      ('SPAN',(0,0),(-1,0)),('BACKGROUND',(0,0),(-1,1),colors.HexColor('#e3e5e7')),
      ('BACKGROUND',(0,-1),(-1,-1),colors.HexColor('#e7eee8')),('SPAN',(0,-1),(2,-1)),
      ('FONTNAME',(0,0),(-1,1),'Helvetica-Bold'),('FONTNAME',(0,-1),(-1,-1),'Helvetica-Bold'),
      ('FONTSIZE',(0,0),(-1,-1),8),('ALIGN',(1,0),(-1,-1),'CENTER'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
      ('TOPPADDING',(0,0),(-1,-1),4 if data['escopo']=='dia' else 2),('BOTTOMPADDING',(0,0),(-1,-1),4 if data['escopo']=='dia' else 2)]))
    story.extend([table,Spacer(1,7),Paragraph('C = confirmado no registro. P = previsto pela programação. Números únicos por modelo e ano; em janeiro o primeiro número é 1.',small),
                  Spacer(1,17),Paragraph('Planejamento: ______________________________     Recebido pela produção: ______________________________',small)])
    def footer(canvas,document):
        canvas.setFont('Helvetica',8)
        canvas.drawString(25,18,f"CONCREFER | Séries Setor 3 | Emissão {emission['id']} | {data['assinatura'][:12]}")
        canvas.drawRightString(816,18,f'Página {document.page}')
    doc.build([KeepInFrame(doc.width,doc.height-4,story,mode='shrink',hAlign='LEFT',vAlign='TOP')],onFirstPage=footer,onLaterPages=footer)
    return stream.getvalue()

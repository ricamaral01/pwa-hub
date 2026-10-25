from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

out = Path('output/pdf/plano_implantacao_icms_frete_estoque_concretrack.pdf')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleCT', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=18, leading=22, alignment=TA_CENTER, textColor=colors.HexColor('#0D3B66'), spaceAfter=10))
styles.add(ParagraphStyle(name='H1CT', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=14, leading=17, textColor=colors.HexColor('#343B43'), spaceBefore=10, spaceAfter=6))
styles.add(ParagraphStyle(name='H2CT', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=11.5, leading=14, textColor=colors.HexColor('#0D3B66'), spaceBefore=8, spaceAfter=4))
styles.add(ParagraphStyle(name='BodyCT', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.4, leading=12.5, spaceAfter=5))
styles.add(ParagraphStyle(name='SmallCT', parent=styles['BodyText'], fontName='Helvetica', fontSize=8.3, leading=10.5, textColor=colors.HexColor('#475569')))
styles.add(ParagraphStyle(name='CodeCT', parent=styles['BodyText'], fontName='Courier', fontSize=8.4, leading=10.5, backColor=colors.HexColor('#F8FAFC'), borderColor=colors.HexColor('#E2E8F0'), borderWidth=0.5, borderPadding=5, spaceAfter=6))

P = lambda txt, style='BodyCT': Paragraph(txt, styles[style])

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#64748B'))
    canvas.drawString(1.5*cm, 1.05*cm, 'ConcreTrack - Plano de Implantacao - ICMS do Frete em Percentual')
    canvas.drawRightString(19.5*cm, 1.05*cm, f'Pagina {doc.page}')
    canvas.restoreState()

def _cell(v, header=False):
    if isinstance(v, Paragraph):
        return v
    style = 'SmallCT' if not header else 'BodyCT'
    return Paragraph(str(v), styles[style])

def tbl(data, widths):
    wrapped = []
    for ri, row in enumerate(data):
        wrapped.append([_cell(v, header=(ri==0)) for v in row])
    t = Table(wrapped, colWidths=widths, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#0D3B66')),
        ('TEXTCOLOR',(0,0),(-1,0),colors.white),
        ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),
        ('FONTSIZE',(0,0),(-1,-1),8.0),
        ('LEADING',(0,0),(-1,-1),10),
        ('FONTNAME',(0,1),(-1,-1),'Helvetica'),
        ('GRID',(0,0),(-1,-1),0.35,colors.HexColor('#CBD5E1')),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, colors.HexColor('#F8FAFC')]),
        ('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
    ]))
    return t

story = []
story.append(P('Plano de Implantacao - Entrada de Materiais', 'TitleCT'))
story.append(P('Ajuste do ICMS do frete de valor em R$ para percentual, considerando o frete informado como valor unitario por ton/unidade.', 'SmallCT'))
story.append(Spacer(1, 8))
story.append(tbl([
    ['Sistema', 'ERP ConcreTrack - https://dautomacao.com/concretrack/'],
    ['Modulo', 'Controle de Estoque > Entrada de Materiais'],
    ['Arquivos analisados', '/var/www/concretrack-erp/public/estoque/entrada/index.html; /var/www/concretrack-erp/api/routers/estoque.py'],
    ['Status deste documento', 'Plano para aprovacao. Nenhuma alteracao funcional aplicada nesta etapa.'],
], [4.0*cm, 13.0*cm]))

story.append(P('1. Diagnostico Atual', 'H1CT'))
story.append(P('Hoje a tela apresenta o campo <b>Valor ICMS Frete (R$)</b>. O backend tambem recebe <b>icms_frete</b> como valor monetario, valida que ele nao seja maior que o valor do frete e subtrai esse valor diretamente do total liquido.', 'BodyCT'))
story.append(P('Formula atual identificada no backend:', 'BodyCT'))
story.append(P('total_liquido = valor_nota * (1 - icms_perc / 100) + valor_frete - icms_frete\nvalor_unitario_liquido = total_liquido / quantidade_convertida', 'CodeCT'))
story.append(P('Problema: o ICMS do frete deve ser informado em percentual, nao em R$. Alem disso, o valor do frete informado na entrada deve ser interpretado como valor unitario por ton/unidade, e nao como valor total da nota.', 'BodyCT'))

story.append(P('2. Objetivo da Alteracao', 'H1CT'))
story.append(tbl([
    ['Item', 'Como fica apos aprovacao'],
    ['Campo da tela', 'Trocar "Valor ICMS Frete (R$)" por "% ICMS do Frete".'],
    ['Entrada do usuario', 'Usuario informa a aliquota percentual do ICMS sobre o frete. Ex.: 12,00%.'],
    ['Calculo do ICMS do frete', 'valor_icms_frete = (frete_unitario_bruto * quantidade_convertida) * (icms_frete_perc / 100).'],
    ['Frete unitario', 'O valor do frete informado na tela e o frete unitario por ton/unidade. O sistema calcula o frete bruto total multiplicando esse valor pela quantidade convertida.'],
    ['Persistencia', 'Manter compatibilidade com a coluna atual icms_frete, armazenando a aliquota percentual enquanto nao houver migracao estrutural maior. Recomendacao futura: renomear para icms_frete_perc ou criar coluna nova.'],
], [4.2*cm, 12.8*cm]))

story.append(P('3. Memoria Completa de Calculo', 'H1CT'))
story.append(P('A memoria abaixo considera entrada de material com quantidade informada na tela e unidade convertida para a unidade canonica do material no estoque. Para solidos controlados em tonelada, se o usuario informar kg, o sistema converte kg para ton antes do calculo unitario.', 'BodyCT'))
steps = [
    ['1', 'Quantidade canonica', 'quantidade_convertida = converter(quantidade_informada, unidade_informada, unidade_material). Ex.: 30.000 kg -> 30 ton.'],
    ['2', 'Valor bruto unitario do produto', 'valor_unitario_bruto = valor_nota / quantidade_convertida.'],
    ['3', 'ICMS da nota em R$', 'valor_icms_nota = valor_nota * (icms_nota_perc / 100).'],
    ['4', 'ICMS unitario da nota', 'icms_unitario_produto = valor_icms_nota / quantidade_convertida.'],
    ['5', 'Produto liquido total sem frete', 'produto_liquido_total = valor_nota - valor_icms_nota.'],
    ['6', 'Produto liquido unitario sem frete', 'produto_liquido_unitario = produto_liquido_total / quantidade_convertida.'],
    ['7', 'ICMS do frete em R$', 'valor_icms_frete = (frete_unitario_bruto * quantidade_convertida) * (icms_frete_perc / 100).'],
    ['8', 'Frete liquido total', 'frete_liquido_total = frete_unitario_bruto - valor_icms_frete.'],
    ['9', 'Frete liquido por ton/unidade', 'frete_liquido_unitario = frete_unitario_liquido.'],
    ['10', 'Valor liquido total integrado', 'total_liquido = produto_liquido_total + frete_liquido_total.'],
    ['11', 'Custo final unitario integrado', 'valor_unitario_liquido = total_liquido / quantidade_convertida = produto_liquido_unitario + frete_liquido_unitario.'],
]
story.append(tbl([['#','Etapa','Formula']] + steps, [0.8*cm, 4.3*cm, 11.9*cm]))

story.append(P('4. Exemplo Numerico', 'H1CT'))
story.append(P('Exemplo para cimento controlado em tonelada: quantidade 30 ton, valor da nota R$ 18.000,00, ICMS da nota 18%, frete unitario R$ 40,00 por ton e ICMS do frete 12%.', 'BodyCT'))
story.append(tbl([
    ['Calculo', 'Resultado'],
    ['Valor unitario bruto', '18.000,00 / 30 = R$ 600,00 por ton'],
    ['ICMS da nota', '18.000,00 * 18% = R$ 3.240,00'],
    ['Produto liquido total', '18.000,00 - 3.240,00 = R$ 14.760,00'],
    ['Produto liquido unitario', '14.760,00 / 30 = R$ 492,00 por ton'],
    ['Frete bruto total', '40,00 * 30 = R$ 1.200,00'],
    ['ICMS do frete', '1.200,00 * 12% = R$ 144,00'],
    ['Frete liquido total', '1.200,00 - 144,00 = R$ 1.056,00'],
    ['Frete liquido por ton', '1.056,00 / 30 = R$ 35,20 por ton'],
    ['Total liquido integrado', '14.760,00 + 1.056,00 = R$ 15.816,00'],
    ['Custo final unitario', '15.816,00 / 30 = R$ 527,20 por ton'],
], [5.0*cm, 12.0*cm]))

story.append(PageBreak())
story.append(P('5. Plano de Implantacao', 'H1CT'))
story.append(tbl([
    ['Fase', 'Acao', 'Arquivos/impacto'],
    ['1 - Backup', 'Criar backup datado dos arquivos e, se aprovado, dump ou backup seletivo da tabela de movimentos.', 'public/estoque/entrada/index.html; api/routers/estoque.py; schema tbl_est_movimentos.'],
    ['2 - Frontend', 'Alterar label do campo para "% ICMS do Frete", placeholder percentual e resumo de calculo exibindo aliquota e valor calculado em R$.', 'public/estoque/entrada/index.html.'],
    ['3 - Backend', 'Alterar validacao de icms_frete para percentual entre 0 e 100; calcular valor_icms_frete internamente antes de subtrair.', 'api/routers/estoque.py.'],
    ['4 - Persistencia compativel', 'Manter envio do campo icms_frete como percentual. Em relatorios/listagens, tratar esse valor como aliquota. Se houver historico antigo em R$, preservar sem recalcular retroativo nesta etapa.', 'Sem migracao obrigatoria na primeira etapa.'],
    ['5 - Testes', 'Executar testes manuais de entrada, edicao, conversao kg->ton, frete zerado, ICMS zerado, frete com ICMS, validacao acima de 100%.', 'Ambiente de producao com cuidado e registro de evidencias.'],
    ['6 - Homologacao', 'Usuario confere memoria de calculo na tela e uma nota real antes de liberar uso operacional.', 'Aprovacao solicitada antes do deploy.'],
], [2.4*cm, 7.2*cm, 7.4*cm]))

story.append(P('6. Regras de Validacao Propostas', 'H1CT'))
story.append(tbl([
    ['Campo', 'Regra'],
    ['Quantidade', 'Obrigatoria e maior que zero. Convertida para a unidade canonica do material.'],
    ['Valor da nota', 'Maior ou igual a zero.'],
    ['ICMS da nota (%)', 'Entre 0 e 100.'],
    ['Valor do frete unitario', 'Maior ou igual a zero. Representa o valor por ton/unidade digitado na entrada.'],
    ['ICMS do frete (%)', 'Entre 0 e 100. Nao e mais comparado com o valor do frete em R$.'],
    ['Total liquido', 'Nao pode ser negativo.'],
], [4.0*cm, 13.0*cm]))

story.append(P('7. Criterios de Aceite', 'H1CT'))
for item in [
    'A tela deve exibir % ICMS do Frete, nao Valor ICMS Frete (R$).',
    'Ao informar frete unitario e percentual de ICMS do frete, a tela deve mostrar frete bruto total, ICMS do frete em R$ e frete liquido unitario no resumo.',
    'O frete total deve ser calculado como frete unitario bruto multiplicado pela quantidade convertida; o frete liquido unitario deve descontar o ICMS percentual do frete.',
    'O valor_unitario_liquido persistido deve bater com a memoria de calculo ate 4 casas decimais.',
    'Edicao de nota existente deve recalcular com a mesma regra.',
    'Entradas sem frete ou sem ICMS devem continuar funcionando.',
]:
    story.append(P(f'- {item}', 'BodyCT'))

story.append(P('8. Pontos de Atencao', 'H1CT'))
story.append(P('O banco atual usa a coluna <b>icms_frete</b>. Pela urgencia e baixo risco, a implantacao inicial pode manter essa coluna armazenando o percentual. Se houver relatorios historicos que interpretem a coluna como R$, eles precisarao ser revisados. Como mitigacao mais robusta, podemos criar uma nova coluna <b>icms_frete_perc</b> e preservar <b>icms_frete</b> como valor calculado em R$; isso exige migracao e ajustes adicionais.', 'BodyCT'))
story.append(P('Recomendacao tecnica: para evitar ambiguidade futura, aprovar a criacao de duas informacoes: <b>icms_frete_perc</b> (aliquota) e <b>icms_frete_valor</b> (valor calculado). Se a aprovacao for para menor prazo, manteremos apenas o comportamento compativel na coluna atual.', 'BodyCT'))

story.append(P('9. Decisao Solicitada', 'H1CT'))
story.append(P('Aguardar aprovacao do usuario para implementar. Decisao necessaria: (A) ajuste compativel usando a coluna atual icms_frete como percentual; ou (B) ajuste estrutural criando coluna percentual e coluna valor calculado para maior clareza historica.', 'BodyCT'))

doc = SimpleDocTemplate(str(out), pagesize=A4, rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=1.4*cm, bottomMargin=1.6*cm)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(out.resolve())

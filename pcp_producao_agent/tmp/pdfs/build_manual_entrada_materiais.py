from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OUT = Path("output/pdf/manual_entrada_materiais_frete_unitario_concretrack.pdf")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleCT", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=18, leading=22, alignment=TA_CENTER, textColor=colors.HexColor("#0D3B66"), spaceAfter=10))
styles.add(ParagraphStyle(name="H1CT", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=13.5, leading=16, textColor=colors.HexColor("#343B43"), spaceBefore=10, spaceAfter=6))
styles.add(ParagraphStyle(name="BodyCT", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.4, leading=12.5, spaceAfter=5))
styles.add(ParagraphStyle(name="SmallCT", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.3, leading=10.5, textColor=colors.HexColor("#475569")))


def p(text, style="BodyCT"):
    return Paragraph(text, styles[style])


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(1.5 * cm, 1.05 * cm, "ConcreTrack - Manual de Entrada de Materiais")
    canvas.drawRightString(19.5 * cm, 1.05 * cm, f"Página {doc.page}")
    canvas.restoreState()


def table(data, widths):
    rows = [[Paragraph(str(value), styles["BodyCT" if idx == 0 else "SmallCT"]) for value in row] for idx, row in enumerate(data)]
    result = Table(rows, colWidths=widths, hAlign="LEFT")
    result.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0D3B66")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return result


story = [
    p("Como Usar - Entrada de Materiais", "TitleCT"),
    p("Manual operacional para lançar nota fiscal por digitação, foto ou PDF, com frete unitário e ICMS do frete em percentual.", "SmallCT"),
    Spacer(1, 8),
    table([
        ["Aplicações implantadas", "Campinas, Pederneiras, Ribeirão e Noroeste"],
        ["Tela", "Controle de Estoque > Entrada de Materiais"],
        ["Modelo de leitura", "Foto JPG/PNG/WEBP ou PDF da nota fiscal, com preenchimento automático para conferência."],
    ], [4.2 * cm, 12.8 * cm]),
    p("1. Fluxo Recomendado", "H1CT"),
]

for item in [
    "Entre no ERP da unidade e acesse Controle de Estoque > Entrada de Materiais.",
    "Selecione primeiro o material que está entrando. A leitura da nota usa esse material como contexto.",
    "Clique em Tirar foto ou Escolher arquivo para enviar a nota fiscal em imagem ou PDF.",
    "Aguarde a leitura por IA. O sistema preencherá os campos encontrados na nota.",
    "Confira todos os campos preenchidos. A IA sugere dados; a responsabilidade final é a conferência da nota.",
    "Se a leitura veio de foto/PDF, marque a confirmação de conferência antes de salvar.",
    "Selecione o silo de destino quando o material exigir controle por silo.",
    "Clique em Salvar Entrada.",
]:
    story.append(p(f"- {item}"))

story += [
    p("2. Como Preencher os Campos", "H1CT"),
    table([
        ["Campo", "Como preencher"],
        ["Material", "Selecione o insumo recebido. Para cimento/aditivo com silo fixo, o sistema pode travar o silo correto."],
        ["Quantidade", "Informe a quantidade recebida conforme a nota. Para sólidos, pode informar kg ou ton; o sistema converte para a unidade de estoque."],
        ["Unidade", "Use kg, ton, L ou m³ conforme o documento. O custo será salvo na unidade canônica do material."],
        ["Data de Recebimento", "Informe a data de entrada do material no estoque."],
        ["Fornecedor", "Informe o nome do fornecedor ou confira o que a IA preencheu."],
        ["Nota Fiscal / Referência", "Número da NF ou referência de controle."],
        ["Valor da Nota Fiscal", "Valor bruto do produto/material na nota, sem somar frete manualmente se o frete será lançado no campo próprio."],
        ["% ICMS da Nota", "Alíquota de ICMS do produto. Ex.: para 18%, digite 18."],
        ["Valor do Frete Unitário", "Valor bruto do frete por ton/unidade. Ex.: se o frete é R$ 40,00 por ton, digite 40."],
        ["% ICMS do Frete", "Alíquota do ICMS sobre o frete. Ex.: para 12%, digite 12."],
        ["Observação", "Use para CNPJ, chave NF-e, item da nota ou observação operacional."],
    ], [4.6 * cm, 12.4 * cm]),
    p("3. Memória de Cálculo", "H1CT"),
    table([
        ["Etapa", "Fórmula"],
        ["Produto líquido total", "valor_nota - (valor_nota * %ICMS_nota / 100)"],
        ["Frete bruto total", "valor_frete_unitário * quantidade_convertida"],
        ["ICMS do frete em R$", "frete_bruto_total * %ICMS_frete / 100"],
        ["Frete líquido total", "frete_bruto_total - ICMS_do_frete"],
        ["Total líquido da entrada", "produto_líquido_total + frete_líquido_total"],
        ["Custo final unitário", "total_líquido_da_entrada / quantidade_convertida"],
    ], [5.0 * cm, 12.0 * cm]),
    p("4. Exemplo Prático", "H1CT"),
    p("Quantidade 30 ton, valor da nota R$ 18.000,00, ICMS da nota 18%, frete unitário R$ 40,00 por ton e ICMS do frete 12%.", "BodyCT"),
    table([
        ["Cálculo", "Resultado"],
        ["Produto líquido total", "18.000,00 - 3.240,00 = R$ 14.760,00"],
        ["Frete bruto total", "40,00 * 30 = R$ 1.200,00"],
        ["ICMS do frete", "1.200,00 * 12% = R$ 144,00"],
        ["Frete líquido total", "1.200,00 - 144,00 = R$ 1.056,00"],
        ["Custo final unitário", "(14.760,00 + 1.056,00) / 30 = R$ 527,20 por ton"],
    ], [5.0 * cm, 12.0 * cm]),
    p("5. Cuidados Antes de Salvar", "H1CT"),
]

for item in [
    "Não informe o valor total da nota do frete no campo Valor do Frete Unitário.",
    "Se a nota trouxer frete total, divida pelo volume antes de preencher o campo unitário.",
    "Confira se a unidade usada na quantidade é a mesma base usada para o frete unitário.",
    "Se o ICMS do frete não existir, deixe % ICMS do Frete como zero.",
    "Se a IA não conseguir ler algum dado, preencha manualmente antes de salvar.",
]:
    story.append(p(f"- {item}"))

OUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=1.5 * cm, leftMargin=1.5 * cm, topMargin=1.4 * cm, bottomMargin=1.6 * cm)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT.resolve())

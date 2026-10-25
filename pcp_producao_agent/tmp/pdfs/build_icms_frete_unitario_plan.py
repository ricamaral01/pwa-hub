from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OUT = Path("output/pdf/plano_implantacao_icms_frete_unitario_estoque_concretrack.pdf")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleCT", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=18, leading=22, alignment=TA_CENTER, textColor=colors.HexColor("#0D3B66"), spaceAfter=10))
styles.add(ParagraphStyle(name="H1CT", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=14, leading=17, textColor=colors.HexColor("#343B43"), spaceBefore=10, spaceAfter=6))
styles.add(ParagraphStyle(name="BodyCT", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.4, leading=12.5, spaceAfter=5))
styles.add(ParagraphStyle(name="SmallCT", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.3, leading=10.5, textColor=colors.HexColor("#475569")))
styles.add(ParagraphStyle(name="CodeCT", parent=styles["BodyText"], fontName="Courier", fontSize=8.4, leading=10.5, backColor=colors.HexColor("#F8FAFC"), borderColor=colors.HexColor("#E2E8F0"), borderWidth=0.5, borderPadding=5, spaceAfter=6))


def p(text, style="BodyCT"):
    return Paragraph(text, styles[style])


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(1.5 * cm, 1.05 * cm, "ConcreTrack - Plano - Frete Unitário e ICMS do Frete em Percentual")
    canvas.drawRightString(19.5 * cm, 1.05 * cm, f"Página {doc.page}")
    canvas.restoreState()


def cell(value, header=False):
    if isinstance(value, Paragraph):
        return value
    return Paragraph(str(value), styles["BodyCT" if header else "SmallCT"])


def table(data, widths):
    wrapped = [[cell(value, header=row_index == 0) for value in row] for row_index, row in enumerate(data)]
    result = Table(wrapped, colWidths=widths, hAlign="LEFT")
    result.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0D3B66")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("LEADING", (0, 0), (-1, -1), 10),
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
    p("Plano de Implantação - Entrada de Materiais", "TitleCT"),
    p("Ajuste para tratar o frete como valor unitário por ton/unidade e o ICMS do frete como percentual.", "SmallCT"),
    Spacer(1, 8),
    table([
        ["Sistema", "ERP ConcreTrack - https://dautomacao.com/concretrack/"],
        ["Módulo", "Controle de Estoque > Entrada de Materiais"],
        ["Arquivos analisados", "/var/www/concretrack-erp/public/estoque/entrada/index.html; /var/www/concretrack-erp/api/routers/estoque.py"],
        ["Status", "Plano para aprovação. Nenhuma alteração funcional aplicada nesta etapa."],
    ], [3.2 * cm, 13.8 * cm]),
    p("1. Diagnóstico Atual", "H1CT"),
    p("Hoje a tela mostra <b>Valor ICMS Frete (R$)</b> e o backend recebe <b>icms_frete</b> como valor monetário. O cálculo atual subtrai esse valor diretamente do total líquido.", "BodyCT"),
    p("Fórmula atual identificada:", "BodyCT"),
    p("total_liquido = valor_nota * (1 - icms_perc / 100) + valor_frete - icms_frete\nvalor_unitario_liquido = total_liquido / quantidade_convertida", "CodeCT"),
    p("A regra correta solicitada agora é diferente: <b>Valor do Frete</b> deve ser o frete unitário por ton/unidade, e <b>ICMS do Frete</b> deve ser uma alíquota percentual.", "BodyCT"),
    p("2. Regra Revisada", "H1CT"),
    table([
        ["Campo", "Regra após aprovação"],
        ["Valor do Frete", "Valor unitário bruto do frete, em R$/ton ou R$/unidade. Não representa o total da nota do frete."],
        ["ICMS do Frete", "Percentual da alíquota. Ex.: informar 12 para 12%."],
        ["Frete bruto total", "frete_unitario_bruto * quantidade_convertida."],
        ["Valor do ICMS do frete", "frete_bruto_total * (icms_frete_perc / 100)."],
        ["Frete líquido total", "frete_bruto_total - valor_icms_frete."],
        ["Frete líquido unitário", "frete_liquido_total / quantidade_convertida."],
    ], [4.2 * cm, 12.8 * cm]),
    p("3. Memória Completa de Cálculo", "H1CT"),
    p("A quantidade usada no cálculo é sempre a quantidade convertida para a unidade canônica do material. Para material controlado em tonelada, kg deve ser convertido para ton antes do rateio.", "BodyCT"),
    table([
        ["#", "Etapa", "Fórmula"],
        ["1", "Quantidade canônica", "quantidade_convertida = converter(quantidade_informada, unidade_informada, unidade_material)"],
        ["2", "Produto bruto unitário", "produto_bruto_unitario = valor_nota / quantidade_convertida"],
        ["3", "ICMS da nota em R$", "valor_icms_nota = valor_nota * (icms_nota_perc / 100)"],
        ["4", "Produto líquido total", "produto_liquido_total = valor_nota - valor_icms_nota"],
        ["5", "Produto líquido unitário", "produto_liquido_unitario = produto_liquido_total / quantidade_convertida"],
        ["6", "Frete bruto total", "frete_bruto_total = frete_unitario_bruto * quantidade_convertida"],
        ["7", "ICMS do frete em R$", "valor_icms_frete = frete_bruto_total * (icms_frete_perc / 100)"],
        ["8", "Frete líquido total", "frete_liquido_total = frete_bruto_total - valor_icms_frete"],
        ["9", "Frete líquido unitário", "frete_liquido_unitario = frete_liquido_total / quantidade_convertida"],
        ["10", "Total líquido da entrada", "total_liquido = produto_liquido_total + frete_liquido_total"],
        ["11", "Custo final unitário", "valor_unitario_liquido = total_liquido / quantidade_convertida"],
    ], [0.8 * cm, 4.3 * cm, 11.9 * cm]),
    p("4. Exemplo Numérico", "H1CT"),
    p("Exemplo: quantidade 30 ton, valor da nota R$ 18.000,00, ICMS da nota 18%, frete unitário R$ 40,00 por ton e ICMS do frete 12%.", "BodyCT"),
    table([
        ["Cálculo", "Resultado"],
        ["Produto bruto unitário", "18.000,00 / 30 = R$ 600,00 por ton"],
        ["ICMS da nota", "18.000,00 * 18% = R$ 3.240,00"],
        ["Produto líquido total", "18.000,00 - 3.240,00 = R$ 14.760,00"],
        ["Produto líquido unitário", "14.760,00 / 30 = R$ 492,00 por ton"],
        ["Frete bruto total", "40,00 * 30 = R$ 1.200,00"],
        ["ICMS do frete", "1.200,00 * 12% = R$ 144,00"],
        ["Frete líquido total", "1.200,00 - 144,00 = R$ 1.056,00"],
        ["Frete líquido por ton", "1.056,00 / 30 = R$ 35,20 por ton"],
        ["Total líquido da entrada", "14.760,00 + 1.056,00 = R$ 15.816,00"],
        ["Custo final unitário", "15.816,00 / 30 = R$ 527,20 por ton"],
    ], [5.2 * cm, 11.8 * cm]),
    p("5. Plano de Implantação", "H1CT"),
    table([
        ["Fase", "Ação", "Impacto"],
        ["1 - Backup", "Criar backup datado dos arquivos e preservar uma cópia da regra atual.", "Baixo risco e retorno rápido em caso de necessidade."],
        ["2 - Frontend", "Alterar o label para Valor do Frete Unitário e % ICMS do Frete. Atualizar placeholders e o resumo em tempo real.", "Usuário passa a enxergar alíquota e valor calculado em R$."],
        ["3 - Backend", "Validar icms_frete entre 0 e 100. Calcular frete bruto total a partir do valor unitário multiplicado pela quantidade convertida.", "O custo líquido salvo passa a refletir a nova regra."],
        ["4 - Compatibilidade", "Decidir se a coluna atual icms_frete armazenará percentual ou se criaremos colunas explícitas.", "Colunas explícitas reduzem ambiguidade histórica."],
        ["5 - Testes", "Testar entrada, edição, frete zerado, ICMS zerado, ICMS 100%, kg para ton e comparação com memória manual.", "Evita divergência no custo médio e nos relatórios de estoque."],
        ["6 - Homologação", "Validar uma nota real com o usuário antes de liberar o uso operacional.", "Aprovação final antes de mexer em produção."],
    ], [3.0 * cm, 6.9 * cm, 7.1 * cm]),
    PageBreak(),
    p("6. Persistência Recomendada", "H1CT"),
    p("A opção mais clara é criar campos separados: <b>valor_frete_unitario</b>, <b>icms_frete_perc</b> e <b>icms_frete_valor</b>. Assim o sistema guarda tanto a alíquota digitada quanto o valor calculado em R$, sem misturar significado em uma coluna antiga.", "BodyCT"),
    p("Para implantação mais curta, também é possível manter <b>valor_frete</b> como frete unitário e <b>icms_frete</b> como percentual. Essa alternativa exige revisar relatórios que hoje possam ler icms_frete como R$.", "BodyCT"),
    p("7. Critérios de Aceite", "H1CT"),
]

for item in [
    "A tela deve exibir Valor do Frete Unitário e % ICMS do Frete.",
    "O sistema deve calcular o frete bruto total pela quantidade convertida.",
    "O ICMS do frete deve ser calculado em R$ a partir da alíquota percentual.",
    "O valor_unitario_liquido deve bater com a memória de cálculo até 4 casas decimais.",
    "Entradas com frete zero ou ICMS zero devem continuar funcionando.",
    "A edição de uma entrada deve recalcular pela mesma regra.",
]:
    story.append(p(f"- {item}", "BodyCT"))

story += [
    p("8. Decisão Solicitada", "H1CT"),
    p("Antes da implantação, preciso da aprovação da regra e da escolha de persistência: <b>A</b>) ajuste compatível usando as colunas atuais com novo significado; ou <b>B</b>) ajuste estrutural criando colunas explícitas para frete unitário, percentual de ICMS e valor calculado.", "BodyCT"),
]

OUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=1.5 * cm, leftMargin=1.5 * cm, topMargin=1.4 * cm, bottomMargin=1.6 * cm)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT.resolve())

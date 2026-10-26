"""Atualiza o manual visual S1 para as fases F1–F5 já disponíveis em :18446."""
from __future__ import annotations

import base64
import mimetypes
from datetime import date
from pathlib import Path
import matplotlib

from bs4 import BeautifulSoup

import build_manual as old

BASE = Path(__file__).resolve().parent
VERSION = "1.0.89"


def section(key, title, what, who, steps, rules, messages):
    return (key, title, what, who, steps, rules, messages)


ADDITIONAL = [
    section("fornecedor-ficha", "Fornecedor · ficha", "Cadastro, documentos, homologação, IQF e histórico de compras.",
        "Comprador, Qualidade e administrador, conforme o papel.",
        ["Abra o fornecedor na lista.", "Confira a aba Cadastro e os documentos com validade.", "A Qualidade registra a decisão em Homologação; consulte IQF antes de convidá-lo para cotar."],
        "Somente homologado ou homologado condicional pode receber pedido. Uma exceção emergencial requer parecer da Qualidade.",
        "CNPJ inválido ou duplicado bloqueia o cadastro; documento vencido fica em destaque."),
    section("cotacoes-lista", "Cotações · lista", "Mostra a fila de itens para compra, as cotações e os pedidos.",
        "Comprador; aprovador, almoxarife e Qualidade veem as abas permitidas.",
        ["Abra Cotações e pedidos.", "Escolha a aba Cotações ou Fila para compra.", "Abra o número para conferir propostas e condições."],
        "A cotação pode reunir itens de solicitações diferentes, sem ultrapassar a quantidade aprovada.",
        "Sem itens elegíveis, a fila informa que não há compra pendente."),
    section("cotacao-mapa", "Cotação · mapa comparativo", "Compara preço, tributos, frete, prazo e IQF por fornecedor.",
        "Comprador; Qualidade e aprovador podem consultar.",
        ["Convide fornecedores homologados para as categorias do item.", "Registre as propostas e confira o custo posto.", "Escolha por item e feche a cotação; gere o pedido de compra."],
        "A escolha fora do menor custo exige justificativa. Acima do limite configurado, a regra inicial pede três propostas válidas; limites a confirmar.",
        "Fornecedor bloqueado não pode receber pedido; proposta faltante aparece como Sem proposta."),
    section("pedidos-lista", "Pedidos de compra · lista", "Acompanha pedidos abertos, atrasados e recebidos.",
        "Comprador, almoxarife e Qualidade, dentro de seus acessos.",
        ["Abra a aba Pedidos.", "Compare a entrega prevista com a situação e o selo Em atraso.", "Abra o pedido para baixar o PDF e acompanhar o recebimento."],
        "O e-mail automático está desligado; o comprador baixa o PDF e registra o envio.",
        "Atraso é exibido quando a data prevista passou e o pedido continua aberto."),
    section("pedido-detalhe", "Pedido de compra · detalhe", "Reúne fornecedor, condições, itens, prazo, PDF e acompanhamento.",
        "Comprador para emissão; almoxarife e Qualidade para consulta e recebimento.",
        ["Confira itens, preço e condições antes de emitir.", "Baixe o PDF e envie pelo canal definido pela empresa.", "Registre o envio; o almoxarife inicia o recebimento vinculado."],
        "Diferença de valor acima da tolerância configurada devolve a OC à aprovação. O recebimento com NF segue na tela Recebimento.",
        "Pedido sem fornecedor habilitado ou sem aprovação exigida não pode ser enviado."),
    section("almoxarifado-saldos", "Almoxarifado · saldos", "Saldo, reservado, disponível, custo médio e ponto de pedido.",
        "Almoxarife; comprador consulta as informações permitidas.",
        ["Abra Almoxarifado geral.", "Filtre por código, categoria ou itens abaixo do ponto de pedido.", "Confira saldo menos reservado antes de separar ou registrar uma entrada."],
        "Disponível = saldo − reservado. O estoque é o almoxarifado geral; silos da usina ficam fora deste módulo.",
        "Saída maior que o disponível é bloqueada; lançamentos ficam no livro de movimentos."),
    section("almoxarifado-reservas", "Almoxarifado · reservas e entregas", "Exibe o que foi reservado para solicitações aprovadas.",
        "Almoxarife.",
        ["Abra Separação e entregas.", "Confira material, reservado e entregue.", "Abra a solicitação para separar e registrar entrega total ou parcial."],
        "A reserva surge na aprovação final quando há saldo. O que falta segue para compra.",
        "Não é possível entregar mais que o solicitado nem consumir reserva de outro pedido."),
    section("almoxarifado-epi", "Almoxarifado · ficha de EPI", "Entrega individual de EPI com CA e confirmação.",
        "Almoxarife e colaborador que confirma o recebimento.",
        ["Abra Fichas de EPI.", "Selecione colaborador, item, CA e quantidade.", "Registre a entrega e a confirmação; consulte o histórico."],
        "CA vencido impede a entrega. O cadastro do colaborador guarda apenas nome, matrícula, setor e situação.",
        "Colaborador inexistente, CA vencido ou saldo insuficiente bloqueiam a ficha."),
    section("inventario", "Inventário · contagem", "Contagem cega, divergência, revisão e ajuste rastreável.",
        "Almoxarife; outro almoxarife revisa diferença acima do limite ou EPI.",
        ["Abra Inventário e crie uma contagem por endereço.", "Imprima a ficha, conte fisicamente e registre as quantidades.", "Confira divergências e peça revisão quando o sistema exigir."],
        "A ficha não mostra o saldo antes da contagem. Movimentos após o horário de corte continuam preservados.",
        "Diferença acima do limite inicial de R$ 200 ou em EPI exige aprovação de outra pessoa; valor a confirmar."),
    section("recebimentos", "Recebimento · lista", "Documentos fiscais vinculados a pedidos de compra.",
        "Almoxarife; Compras e Qualidade entram conforme a etapa.",
        ["Abra Recebimento.", "Escolha Novo recebimento e vincule uma OC aberta.", "Informe os dados da NF e confira a situação na lista."],
        "Leitura de NF por IA está desligada sem provedor; a digitação e conferência manual funcionam.",
        "A Qualidade vê pendências de NC; a abertura automática em outro módulo depende de contrato futuro."),
    section("recebimento-detalhe", "Recebimento · NF e inspeção", "Conferência de NF, quantidade, preço, inspeção e destino.",
        "Almoxarife, Compras e Qualidade, cada um em sua etapa.",
        ["Anexe a NF e confira os dados e itens digitados.", "Compras resolve divergências de preço, quantidade ou CNPJ.", "Qualidade inspeciona; o almoxarife confirma a entrada ou o atendimento direto."],
        "Item reprovado abre pendência de NC. Com solicitação de origem, material liberado segue por cross-docking.",
        "O resultado sugerido pela IA nunca confirma sozinho; NF acima de 12 MB é recusada."),
    section("indicadores", "Indicadores", "Prazo, SLA, consumo, estoque, IQF, economia, atrasos e itens zerados.",
        "Comprador e administração; outros papéis com acesso veem apenas seu escopo.",
        ["Defina período e filtros de CC, categoria e fornecedor.", "Leia a fonte exibida junto de cada indicador.", "Use Exportar CSV ou PDF para compartilhar a leitura filtrada."],
        "Um filtro por CC oculta o valor total do estoque da unidade; o relatório explica a fonte e o período.",
        "Sem dados no período, o cartão informa ausência de amostra; não interprete traço como zero."),
]


def replace_section(soup, id_, html_fragment):
    target = soup.find(id=id_)
    if target is None:
        raise RuntimeError(f"Seção ausente: {id_}")
    target.clear()
    fragment = BeautifulSoup(html_fragment, "html.parser")
    for child in list(fragment.contents):
        target.append(child)


def main():
    old.SECTIONS[:] = [
        (key, title,
         {"fornecedores": "Cadastro, documentos, homologação e desempenho dos fornecedores."}.get(key, what),
         who, steps,
         {"painel": "O painel reúne solicitações, compras e alertas do estoque conforme o papel e as fases ligadas.",
          "detalhe-almoxarife": "A aprovação final reserva o saldo disponível. A entrega baixa o reservado; a falta vai para compra.",
          "fornecedores": "Homologação, IQF, documentos e pedidos já funcionam. Apenas o e-mail automático está desligado.",
          "cadastros-materiais": "Insumos da usina só aparecem quando a integração S4 estiver ligada; silos pertencem ao Laboratório.",
          "cadastros-parametros": "Valores iniciais de aprovação, inventário, cotação e compra estão a confirmar na gestão de Campinas."}.get(key, rules), messages)
        for key, title, what, who, steps, rules, messages in old.SECTIONS
    ]
    old.SECTIONS.extend(ADDITIONAL)
    old.main()
    path = BASE / "manual-suprimentos.html"
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    soup.select_one(".cover h1").string = "Suprimentos — Manual das telas"
    soup.select_one(".cover .lead").string = "Campinas · Homologação: solicitações, compras, estoque, recebimento e indicadores no PC, tablet e celular."
    soup.select_one(".cover .version").string = "Homologação v" + VERSION
    soup.select_one(".cover > p:nth-of-type(4)").string = date.today().strftime("%d/%m/%Y")
    replace_section(soup, "resumo", '''<p class="eyebrow">01 · VISÃO GERAL</p><h2>Resumo executivo</h2>
    <p>O Suprimentos reúne em Campinas pedidos de material do almoxarifado geral. O solicitante pede pelo Unificado ou pelo aplicativo instalado. A aprovação respeita centro de custo e nível. O almoxarife reserva o saldo, separa e entrega; quando falta material, Compras cota fornecedores homologados e emite o pedido.</p>
    <p>Já funcionam cadastro e IQF de fornecedores, comparação de propostas, PDF da OC, estoque, ficha de EPI, inventário, recebimento com NF e inspeção, e indicadores com CSV/PDF. Os dados com marca DEMO são apenas para treinamento em :18446.</p>
    <div class="card"><h3>Caminho resumido</h3><ol><li>Solicitante abre pedido e escolhe o centro de custo.</li><li>Aprovador N1 e, se necessário, N2 decidem.</li><li>Com saldo, o almoxarife reserva e entrega; sem saldo, Compras faz cotação e pedido.</li><li>Almoxarife confere NF; Qualidade inspeciona; material é guardado ou entregue diretamente.</li><li>Solicitante confirma o recebimento ou relata problema. Após 48 horas sem resposta, o sistema conclui.</li></ol></div><figure class="flow"><img src="fluxo-pedidos-simplificado.svg" alt="Fluxo simples do pedido"></figure>''')
    replace_section(soup, "fluxo", '''<p class="eyebrow">02 · CAMINHO DO PEDIDO</p><h2>Fluxograma de processamento</h2>
    <figure class="flow"><img src="fluxo-pedidos.svg" alt="Fluxograma completo por responsável"></figure>
    <p class="legend">Retângulo = ação; losango = decisão; linha pontilhada roxa = integração com o Laboratório desligada. A fila offline reenvia sem duplicar. A leitura de NF por IA depende de provedor e permanece desligada; a conferência manual funciona.</p>''')
    replace_section(soup, "futuro", '''<p class="eyebrow">08 · FUNÇÕES DESLIGADAS</p><h2>O que ainda está desligado</h2>
    <div class="card"><h3>Integração com o Laboratório (S4)</h3><p>O contrato e o simulador estão prontos, mas a flag está desligada até o estoque da usina estar migrado no Laboratório. Silos e massadas não entram no estoque do almoxarifado geral.</p><h3>E-mail e notificações push</h3><p>O envio automático de pedidos por e-mail e as notificações push estão desligados. Baixe o PDF da OC e envie pelo canal definido pela empresa.</p><h3>Leitura assistida da NF</h3><p>Sem provedor configurado, digite os dados e faça a conferência humana. O anexo da NF continua privado.</p></div>''')
    replace_section(soup, "parametros", '''<p class="eyebrow">07 · CONFIGURAÇÃO INICIAL</p><h2>Parâmetros e alçadas</h2>
    <p class="notice">Valores iniciais de homologação — <b>a confirmar</b> pela gestão de Campinas antes do uso real.</p>
    <table><thead><tr><th>Regra</th><th>Valor inicial</th></tr></thead><tbody>
    <tr><td>Aprovação N1 / N2</td><td>Até R$ 2.500 / acima de R$ 2.500, depois de N1</td></tr><tr><td>SLA normal / urgente</td><td>24 h / 4 h</td></tr><tr><td>Fechamento após entrega</td><td>48 h</td></tr><tr><td>Inventário sem aprovação adicional</td><td>Até R$ 200, exceto EPI</td></tr><tr><td>Cotação com três ofertas</td><td>Acima de R$ 1.000</td></tr><tr><td>Tolerância de preço na OC</td><td>10%</td></tr><tr><td>Pesos do IQF</td><td>Prazo 30%, quantidade 20%, qualidade 30%, documentação 10%, atendimento 10%</td></tr></tbody></table>''')
    replace_section(soup, "glossario", '''<p class="eyebrow">09 · CONSULTA RÁPIDA</p><h2>Glossário</h2><table><tbody>
    <tr><th>Alçada</th><td>Valor e nível que determinam quem pode aprovar.</td></tr>
    <tr><th>CC</th><td>Centro de custo da solicitação.</td></tr>
    <tr><th>PWA</th><td>Aplicativo web instalado no celular ou tablet.</td></tr>
    <tr><th>Reserva</th><td>Quantidade de saldo separada para uma solicitação aprovada.</td></tr>
    <tr><th>Cross-docking</th><td>Material comprado que, após conferência, segue diretamente ao pedido de origem.</td></tr>
    <tr><th>IQF</th><td>Índice de qualidade do fornecedor, calculado a partir de critérios de recebimento e atendimento.</td></tr>
    <tr><th>OC</th><td>Ordem ou pedido de compra.</td></tr>
    <tr><th>Item livre</th><td>Material descrito quando ainda não consta do catálogo.</td></tr></tbody></table>
    <p>Baseado nas telas autenticadas da homologação v1.0.89 em 26/10/2026. Todos os exemplos são DEMO.</p>''')
    for link in soup.select('a[href="#futuro"]'):
        span = link.select_one('span')
        if span:
            span.string = "Funções desligadas"
        else:
            link.string = "Funções desligadas"
    raci_body = soup.select_one("#raci .raci tbody")
    for title, roles in [
        ("Homologar fornecedor", ["I","I","I","I","C","R/A","C"]),
        ("Cotar e emitir OC", ["I","C","C","I","R/A","C","C"]),
        ("Conferir NF e receber", ["I","I","I","R/A","C","C","C"]),
        ("Inspecionar e tratar NC", ["I","I","I","C","C","R/A","I"]),
        ("Contar estoque e entregar EPI", ["I","I","I","R/A","I","C","C"]),
        ("Consultar indicadores", ["I","I","I","C","R","C","A"]),
    ]:
        row = soup.new_tag("tr")
        for value in [title, *roles, "[a definir]"]:
            cell = soup.new_tag("td")
            cell.string = value
            row.append(cell)
        raci_body.append(row)
    situation_body = soup.select_one("#situacoes table tbody")
    for name, meaning, owner in [
        ("OC enviada", "Pedido enviado ao fornecedor e ainda aberto.", "Almoxarife aguarda entrega."),
        ("OC em atraso", "Data prometida passou sem recebimento completo.", "Comprador acompanha o fornecedor."),
        ("OC recebida", "Quantidade do pedido foi conferida e aceita.", "Almoxarife e Qualidade consultam o registro."),
        ("NF pendente de Compras", "Preço, quantidade ou CNPJ divergente.", "Comprador resolve com justificativa."),
        ("NF em inspeção", "A Qualidade precisa liberar, condicionar ou reprovar.", "Qualidade registra parecer."),
    ]:
        row = soup.new_tag("tr")
        for value in (name, meaning, owner):
            cell = soup.new_tag("td")
            cell.string = value
            row.append(cell)
        situation_body.append(row)
    font_dir = Path(matplotlib.get_data_path()) / "fonts" / "ttf"
    regular = base64.b64encode((font_dir / "DejaVuSans.ttf").read_bytes()).decode()
    bold = base64.b64encode((font_dir / "DejaVuSans-Bold.ttf").read_bytes()).decode()
    style = soup.find("style")
    style.string = str(style.string) + f"""
    @font-face{{font-family:ManualDejaVu;src:url(data:font/ttf;base64,{regular}) format('truetype');font-weight:400}}
    @font-face{{font-family:ManualDejaVu;src:url(data:font/ttf;base64,{bold}) format('truetype');font-weight:700}}
    body{{font-family:ManualDejaVu,Arial,sans-serif}}
    @media print{{body{{font-family:ManualDejaVu,Arial,sans-serif}}
      .comparison figure:first-child img{{max-height:72mm}}
      .comparison img{{max-height:67mm}}
      .comparison figure:first-child{{margin-bottom:2mm}}
      .screen-section .intro{{font-size:9pt}}
      .screen-section h2{{margin-bottom:2mm}}
      .screen-section{{padding-top:3mm}}
    }}"""
    # O sumário do HTML é navegável; o PDF preenche os números de página depois.
    for image in soup.find_all("img"):
        source = image.get("src", "")
        local = BASE / source
        if local.is_file():
            mime = mimetypes.guess_type(local.name)[0] or "image/png"
            image["src"] = f"data:{mime};base64,{base64.b64encode(local.read_bytes()).decode()}"
            if image.parent.name == "a" and "zoomable" in image.parent.get("class", []):
                image.parent["href"] = image["src"]
    path.write_text(str(soup), encoding="utf-8")
    print("MANUAL_F6_HTML_OK", len(old.SECTIONS), "telas", path.stat().st_size, "bytes")


if __name__ == "__main__":
    main()

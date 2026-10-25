"""Monta o manual portátil a partir das capturas autenticadas de :18446."""
from __future__ import annotations

import html
import json
from collections import defaultdict
from datetime import date
from pathlib import Path

BASE = Path(__file__).resolve().parent
CAPTURES = json.loads((BASE / "capturas.json").read_text(encoding="utf-8"))
GROUPS = defaultdict(dict)
for row in CAPTURES:
    GROUPS[row["tela"]][row["tamanho"]] = row

SECTIONS = [
    ("painel", "Painel", "Fila da unidade e indicadores do que pede atenção.", "Todos os papéis com acesso ao Suprimentos.",
     ["Abra Suprimentos › Painel pelo menu do Unificado.", "Confira as solicitações que aguardam sua aprovação e as que estão em atendimento.", "Toque no número de um pedido para abrir o detalhe."],
     "Os contadores mostram apenas o que o papel pode ver; pedidos de compra, saldo e silos ainda não estão disponíveis.",
     "Se a fila estiver vazia, confira a lista de Solicitações. Se aparecer acesso negado, peça ao administrador a concessão de tela e de papel em Campinas."),
    ("solicitacoes-lista", "Solicitações · lista", "Consulta de pedidos com situação, urgência, origem e alçada.", "Solicitante, aprovador, almoxarife, comprador, Qualidade e administrador, dentro de suas permissões.",
     ["Escolha uma aba de situação.", "Use a busca, o centro de custo, a urgência, a origem ou ‘Só as que eu aprovo’ e clique em Aplicar filtros.", "Abra o número do pedido para ver itens, justificativa e histórico."],
     "O solicitante vê seus pedidos; o aprovador age só no CC e nível concedidos. Valor ‘sem preço’ pede conferência do comprador.",
     "‘Nenhuma solicitação encontrada’ indica que não há resultado para os filtros. Limpe os filtros antes de abrir outro chamado."),
    ("solicitacoes-lote", "Solicitações · aprovação em lote", "Seleciona pedidos da mesma fila para decidir em uma ação.", "Aprovador do nível e centro de custo correspondentes.",
     ["Marque as caixas dos pedidos habilitados na sua alçada.", "Leia a quantidade e o valor selecionados na barra de lote.", "Escolha Aprovar selecionadas ou Devolver; para devolver, informe o motivo."],
     "Cada pedido é validado separadamente. Os que estiverem fora da sua alçada são recusados no resultado do lote.",
     "Caixa desabilitada significa que o pedido não está em aprovação na sua alçada. Comentário vazio bloqueia devolução."),
    ("detalhe-solicitante", "Detalhe · solicitante", "Mostra dados, itens, fotos e a linha do tempo do pedido entregue.", "Solicitante que abriu o pedido.",
     ["Confira número, CC, urgência e quantidades entregues.", "Se tudo chegou, clique em Recebi tudo.", "Se houver falta ou divergência, clique em Recebi com problema e descreva o que ocorreu."],
     "Após a entrega, confirme em até 48 horas. Sem resposta, o sistema conclui automaticamente. Problema informado devolve o pedido ao atendimento.",
     "‘Descreva o problema’ aparece quando o texto obrigatório não foi informado. A confirmação não é oferecida antes da entrega."),
    ("detalhe-aprovador", "Detalhe · aprovador", "Reúne justificativa, valor estimado, alçada e histórico para a decisão.", "Aprovador N1 ou N2 da unidade e do CC concedidos.",
     ["Leia o motivo, a urgência, o valor e o nível atual.", "Para aprovar, clique em Aprovar.", "Para pedir ajuste ou negar, escreva um comentário e clique em Devolver para ajuste ou Reprovar."],
     "N1 vem antes de N2 quando ambos são exigidos. Administrador só aprova se também tiver o papel APROVADOR no nível correto.",
     "Sem comentário, Devolver e Reprovar são bloqueados. Pedido já decidido ou fora da alçada não aceita outra decisão."),
    ("detalhe-almoxarife", "Detalhe · almoxarife", "Permite iniciar o atendimento de um pedido aprovado, item por item.", "Almoxarife e administrador de Campinas.",
     ["Confira o item e a quantidade solicitada.", "Clique em Separar no item disponível.", "Quando ele estiver separado, use Entregar qtd para registrar a quantidade física entregue."],
     "A separação passa o pedido a Em atendimento. Nesta fase o atendimento é manual; não há reserva nem saldo automático.",
     "Um item não pode ser separado duas vezes. A quantidade entregue não pode ultrapassar a solicitada."),
    ("detalhe-entrega-parcial", "Detalhe · entrega parcial", "Mostra quanto já foi entregue e quanto ainda falta de cada item.", "Almoxarife e administrador de Campinas.",
     ["Veja a coluna Entregue e compare com a quantidade pedida.", "Use Entregar qtd para registrar o restante ou uma nova parcela.", "Após completar todos os itens, o pedido passa a Entregue e volta ao solicitante para confirmação."],
     "A entrega parcial mantém o pedido Em atendimento e conserva as quantidades anteriores.",
     "O sistema recusa zero, valor negativo ou quantidade que ultrapasse o pedido."),
    ("nova-itens", "Nova solicitação · itens", "Primeira etapa de um pedido web: escolha material e quantidade.", "Solicitante e administrador.",
     ["Busque o material pelo nome ou código e informe a quantidade e a unidade.", "Clique em Adicionar; repita para outros itens.", "Se o material não existir, escolha Item que não acho na lista, descreva e depois anexe uma foto. Clique em Continuar."],
     "Um item livre é aceito e poderá ser vinculado ao catálogo no atendimento. Não aparecem saldos nem preços para o solicitante.",
     "Não é possível avançar sem ao menos um item. Material ou quantidade inválida gera aviso antes do envio."),
    ("nova-detalhes", "Nova solicitação · detalhes", "Segunda etapa web: centro de custo, prazo, urgência, justificativa e fotos.", "Solicitante e administrador.",
     ["Escolha o centro de custo autorizado e, se souber, a data necessária.", "Indique Normal, Urgente ou Parou produção e explique a necessidade.", "Anexe até três fotos, confira os itens e clique em Enviar solicitação."],
     "Parou produção exige justificativa de pelo menos 20 caracteres. Cada foto aceita JPEG ou PNG com até 2 MB.",
     "Centro de custo vazio e justificativa curta bloqueiam o envio; foto acima do limite é recusada."),
    ("fornecedores", "Fornecedores", "Cadastro básico dos fornecedores que serão usados nas próximas fases.", "Comprador, Qualidade e administrador.",
     ["Busque pelo nome ou CNPJ.", "Clique em Novo cadastro para preencher razão social, CNPJ e categorias.", "Use Editar para corrigir; desative um registro em vez de excluí-lo."],
     "O CNPJ é validado e não pode se repetir. Cotação, pedido e avaliação de fornecedor são da fase S3.",
     "CSV com linha inválida não grava nenhuma linha; o relatório indica onde corrigir."),
    ("cadastros-materiais", "Cadastros · materiais", "Catálogo global de itens do almoxarifado, com categoria e unidade de estoque.", "Comprador ou administrador; outros papéis consultam conforme permissão.",
     ["Use Materiais e busque pelo código ou descrição.", "Clique em Novo cadastro e informe código, descrição, categoria, unidade e domínio.", "Revise o relatório antes de importar um CSV."],
     "Materiais do domínio insumo da usina servem para solicitar/comprar; saldo de silos pertence ao Laboratório.",
     "Código repetido, domínio incompatível ou CSV inválido impedem a gravação."),
    ("cadastros-centros-custo", "Cadastros · centros de custo", "Define o setor/CC da solicitação em Campinas.", "Administrador do Suprimentos.",
     ["Abra a aba Centros de custo.", "Cadastre código, nome e setor quando necessário.", "Use a tela de Usuários e papéis para restringir cada pessoa a um CC ou deixar CC vazio para todos da unidade."],
     "O CC DEMO do manual é sintético; não o escolha para pedidos reais.",
     "CC não autorizado não aparece para o solicitante e a API recusa seu uso."),
    ("cadastros-alcadas", "Cadastros · alçadas", "Configura quantos níveis de aprovação um valor requer.", "Administrador do Suprimentos.",
     ["Abra a aba Alçadas e leia nível, limite e CC.", "Ajuste a regra se a gestão confirmar novos limites.", "Garanta que haja um aprovador com papel e nível compatíveis."],
     "Configuração inicial de ensaio: N1 até R$ 2.500,00; acima disso N1 e N2. Estes valores estão marcados ‘a confirmar’.",
     "Sem papel APROVADOR correspondente, o administrador não substitui automaticamente a alçada."),
    ("cadastros-parametros", "Cadastros · parâmetros", "Prazos e limites editáveis do processo.", "Administrador do Suprimentos.",
     ["Abra a aba Parâmetros.", "Confira prazo normal, urgente e fechamento automático.", "Depois de uma decisão da gestão, edite o valor e registre a confirmação."],
     "Valores iniciais são de homologação e estão marcados ‘a confirmar’. Parâmetros de compras e inventário só terão efeito nas fases futuras.",
     "Use apenas números válidos; uma chave existente não pode ser duplicada."),
    ("cadastros-usuarios-papeis", "Cadastros · usuários e papéis", "Concede o papel operacional por unidade, CC e nível de aprovação.", "Administrador do Suprimentos.",
     ["Abra Usuários e papéis e clique em Novo cadastro.", "Informe o ID IAM existente, o papel e, se aplicável, nível/CC.", "Confira o acesso com a própria conta depois de salvar."],
     "CC vazio vale para todos os centros de custo da unidade. ADMIN não aprova sem APROVADOR N1/N2. A concessão de tela na casca também é necessária.",
     "Acesso negado pode indicar tela sem concessão, papel ausente, CC diferente ou fase desabilitada."),
    ("pwa-inicio", "PWA · início", "Atalho instalado no celular com estado de sincronização e os pedidos recentes.", "Solicitante; o aprovador também vê sua aba de decisões.",
     ["Abra o ícone Suprimentos na tela inicial do aparelho.", "Veja se o topo mostra Sincronizado ou Sem conexão.", "Toque em Nova solicitação ou em um pedido recente."],
     "O PWA usa a mesma conta do Unificado. O botão Instalar aparece no navegador compatível.",
     "Se pedir acesso, entre primeiro no Unificado; sem login anterior o PWA não abre a fila offline."),
    ("pwa-nova-itens", "PWA · nova, itens", "Busca por nome/código, QR quando o aparelho oferece leitura, e item livre.", "Solicitante e administrador.",
     ["Busque no catálogo ou toque no item frequente.", "Ajuste a quantidade pelos botões de menos e mais.", "Use Item que não acho na lista para descrever livremente; toque em Continuar."],
     "O catálogo pode ser consultado sem sinal depois da primeira carga. Não mostra saldo nem preço.",
     "Sem material selecionado, Continuar fica desabilitado. Se o QR não estiver disponível, digite o código."),
    ("pwa-nova-detalhes-offline", "PWA · detalhes sem conexão", "Guarda a solicitação no aparelho até haver rede e sessão válida.", "Solicitante e administrador.",
     ["Escolha o CC, data, urgência e escreva a justificativa.", "Anexe foto se ajudar a identificar o item.", "Toque em Enviar; a faixa Sem conexão indica que ele ficará pendente. Reabra o PWA conectado para sincronizar."],
     "O reenvio preserva a mesma identificação e não duplica o pedido. Aprovações não funcionam offline.",
     "Se a sessão expirar, entre novamente no Unificado. A fila permanece no aparelho até confirmação do servidor."),
    ("pwa-minhas", "PWA · minhas", "Lista o que foi enviado e o que ainda está na fila do aparelho.", "Solicitante.",
     ["Toque em Minhas na barra inferior.", "Leia o selo da situação de cada pedido.", "Abra um cartão para acompanhar ou confirmar uma entrega."],
     "‘No aparelho’ significa envio pendente; aguarde sincronização antes de abrir outro pedido igual.",
     "Uma lista vazia pode indicar que ainda não há pedido ou que o cache não foi carregado antes de ficar offline."),
    ("pwa-acompanhar", "PWA · acompanhar", "Linha do tempo, itens e confirmação de uma entrega.", "Solicitante dono do pedido.",
     ["Abra o pedido Entregue em Minhas.", "Confira a lista e as quantidades recebidas.", "Toque em Recebi tudo ou Recebi com problema; no segundo caso descreva a divergência."],
     "Sem resposta em 48 horas, o sistema fecha automaticamente. Problema informado reabre o atendimento.",
     "Os botões aparecem só quando o pedido está Entregue. Texto vazio bloqueia o relato do problema."),
    ("pwa-aprovar", "PWA · aprovar", "Mostra pendências do nível e CC concedidos.", "Aprovador N1 ou N2.",
     ["Toque na aba Aprovar.", "Confira urgência, solicitante, valor e prazo do cartão.", "Toque em Aprovar ou Devolver; para devolver, descreva o ajuste."],
     "Decisões exigem conexão. A aba fica oculta para quem não possui papel APROVADOR.",
     "Se estiver offline, os botões ficam desabilitados. Pedido fora da sua alçada não entra na lista."),
]

def e(value):
    return html.escape(str(value), quote=True)

def img(name, label, css=""):
    return f'<a class="zoomable {css}" href="img/{e(name)}" target="_blank" aria-label="Ampliar {e(label)}"><img src="img/{e(name)}" alt="{e(label)}" loading="lazy"></a>'

def ol(items):
    return "<ol>" + "".join(f"<li>{e(value)}</li>" for value in items) + "</ol>"

def screen_section(spec):
    key, title, what, who, steps, rules, messages = spec
    shots = GROUPS.get(key, {})
    if not shots:
        raise RuntimeError(f"Capturas ausentes: {key}")
    pc = shots.get("pc")
    annot = pc or shots.get("celular")
    marker_rows = "".join(f"<tr><td>{m['numero']}</td><td>{e(m['nome'])}</td><td>{e(marker_help(key,m['nome']))}</td></tr>"
                          for m in annot["marcadores"])
    comparisons = "".join(
        f'<figure><figcaption>{label}</figcaption>{img(shots[size]["arquivo"], title + " no " + label)}</figure>'
        for size, label in (("pc", "PC · 1440×900"), ("tablet", "Tablet · 820×1180"), ("celular", "Celular · 390×844"))
        if size in shots)
    annotated_name = annot["arquivo"].replace(".png", "-anotada.png")
    return f'''<section class="screen-section" id="{e(key)}">
      <p class="eyebrow">MANUAL DAS TELAS · {e(key.replace('-', ' ').upper())}</p><h2>{e(title)}</h2>
      <div class="intro"><p><b>O que é.</b> {e(what)}</p><p><b>Quem usa.</b> {e(who)}</p></div>
      <h3>Como aparece em cada aparelho</h3><div class="comparison">{comparisons}</div>
      <div class="reference"><h3>Item por item</h3>{img(annotated_name, title + " com marcadores", "annotated")}
      <table class="marker-table"><thead><tr><th>Marca</th><th>Elemento</th><th>O que faz e como usar</th></tr></thead><tbody>{marker_rows}</tbody></table>
      <div class="how"><div><h3>Como fazer</h3>{ol(steps)}</div><div><h3>Regras importantes</h3><p>{e(rules)}</p><h3>Mensagens e bloqueios</h3><p>{e(messages)}</p></div></div></div>
    </section>'''

def marker_help(screen, name):
    specific = {
        "Indicadores":"Resumem as pendências e a urgência; abra a fila para conferir os pedidos.",
        "Fila de trabalho":"Clique no número para ler o detalhe e o histórico.",
        "Situações":"Muda o conjunto exibido sem alterar nenhum pedido.",
        "Filtros":"Restringe a lista por busca, CC, urgência, origem ou sua alçada.",
        "Seleção":"Marca somente um pedido que você pode decidir neste nível.",
        "Ação em lote":"Aprova ou devolve os pedidos marcados; cada resultado é conferido.",
        "Recebi tudo":"Confirma que a quantidade e os itens foram recebidos.",
        "Histórico":"Mostra o que aconteceu, quem fez e quando.",
        "Separar":"Registra o início do atendimento do item.",
        "Entregar restante":"Registra uma nova quantidade entregue, até completar o pedido.",
        "Item fora do catálogo":"Permite descrever um material ainda não cadastrado.",
        "Centro de custo":"Escolha um centro para o qual você tenha papel de solicitante.",
        "Urgência":"Normal, Urgente ou Parou produção; a última requer explicação detalhada.",
        "Fotos":"Anexe até três imagens do item ou da necessidade.",
        "Novo cadastro":"Abre o formulário lateral de inclusão.",
        "Sem conexão":"O pedido será mantido no aparelho e enviado quando a rede voltar.",
        "Instalar":"Cria o atalho próprio do Suprimentos no aparelho, quando disponível.",
        "Aprovar":"Aceita o pedido dentro da alçada atribuída à sua conta.",
    }
    return specific.get(name, "Veja a informação nesta área e use os controles permitidos ao seu papel.")

def raci_table():
    cols = ["Solicitante", "Aprovador N1", "Aprovador N2", "Almoxarife", "Comprador", "Qualidade", "Admin Suprimentos"]
    rows = [
        ("Abrir pedido", ["R/A","I","I","I","I","—","C"]),
        ("Aprovar nível 1", ["I","R/A","—","I","I","—","C"]),
        ("Aprovar nível 2", ["I","C","R/A","I","I","—","C"]),
        ("Devolver ou reprovar", ["I","R/A*","R/A*","I","I","—","C"]),
        ("Separar item", ["I","—","—","R/A","I","—","C"]),
        ("Entregar item", ["I","—","—","R/A","I","—","C"]),
        ("Confirmar recebimento", ["R/A","I","I","C","—","—","I"]),
        ("Fechamento automático", ["I","I","I","I","I","—","I"]),
        ("Cadastrar materiais", ["I","—","—","C","R","—","A"]),
        ("Cadastrar fornecedores", ["—","—","—","—","R","R","A"]),
        ("Definir alçadas e papéis", ["I","C","C","I","I","I","R/A"]),
        ("Ajustar parâmetros", ["I","C","C","C","C","C","R/A"]),
    ]
    head = "".join(f"<th>{e(x)}</th>" for x in ["Etapa", *cols, "Pessoa em Campinas"])
    body = "".join("<tr>" + "".join(f"<td>{e(x)}</td>" for x in [step, *marks, "[a definir]"]) + "</tr>" for step, marks in rows)
    return f'<table class="raci"><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>'

def main():
    missing=[key for key,*_ in SECTIONS if key not in GROUPS]
    if missing: raise RuntimeError("Capturas faltando: " + ", ".join(missing))
    names=[("resumo","Resumo executivo"),("fluxo","Fluxo dos pedidos"),("raci","Responsabilidades"),
           ("telas","Telas web e PWA"), ("instalacao","Instalação do PWA"),
           ("situacoes","Situações"),("parametros","Parâmetros e alçadas"),
           ("futuro","Próximas fases"),("glossario","Glossário")]
    toc="".join(f'<a href="#{key}"><span>{e(title)}</span><span class="toc-page" data-anchor="{key}">—</span></a>' for key,title in names)
    screen_toc="".join(f'<a href="#{e(spec[0])}">{e(spec[1])}</a>' for spec in SECTIONS)
    html_body=f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Suprimentos · Manual das telas · Campinas</title><style>
@page{{size:A4 portrait;margin:18mm 13mm 19mm}}
:root{{--navy:#102541;--deep:#0B1730;--teal:#0F766E;--mint:#2DD4BF;--line:#d6e0e7;--light:#f4f8fa;--muted:#536778;--orange:#f28c38}}
*{{box-sizing:border-box}} html{{scroll-behavior:smooth}} body{{margin:0;background:#e9eef2;color:var(--deep);font:15px/1.55 system-ui,-apple-system,'Segoe UI',sans-serif}}
.toolbar{{position:fixed;top:16px;right:20px;z-index:5;display:flex;gap:8px}}button{{border:0;border-radius:9px;background:var(--teal);color:white;padding:10px 15px;font-weight:700;cursor:pointer}}.layout{{display:grid;grid-template-columns:252px minmax(0,1fr);min-height:100vh}}.sidebar{{position:sticky;top:0;align-self:start;height:100vh;overflow:auto;padding:22px 18px;background:var(--navy);color:white}}.sidebar h3{{font-size:13px;margin:20px 0 8px;color:var(--mint);text-transform:uppercase;letter-spacing:.08em}}.sidebar a{{display:flex;justify-content:space-between;gap:8px;color:#d8e8f2;text-decoration:none;padding:5px 0;font-size:12px}}.sidebar a:hover{{color:white;text-decoration:underline}}.document{{width:min(1050px,100%);margin:0 auto;padding:32px 46px 80px;background:white;box-shadow:0 10px 40px #10254118}}h1,h2,h3{{color:var(--navy);line-height:1.18}}h1{{font-size:40px}}h2{{font-size:28px;margin:0 0 15px}}h3{{font-size:17px;margin:20px 0 9px}}.eyebrow{{font-size:11px;font-weight:800;letter-spacing:.12em;color:var(--teal);text-transform:uppercase}}p{{margin:8px 0 12px}}.lead{{font-size:19px;color:#335366}}.logos{{display:flex;align-items:center;gap:24px}}.logos img{{max-width:170px;max-height:54px;object-fit:contain}}.cover{{min-height:88vh;padding:36px 0;display:flex;flex-direction:column;justify-content:center;border-top:8px solid var(--mint)}}.cover .version{{display:inline-block;background:#e1f6f2;color:#0f5f58;padding:7px 13px;border-radius:999px;font-weight:700}}section{{margin:0 0 44px}}.card{{border:1px solid var(--line);border-radius:14px;padding:18px;background:#fff}}.notice{{padding:13px 16px;background:#fff4e7;border-left:4px solid var(--orange);border-radius:5px}}.flow img{{width:100%;max-height:460px;object-fit:contain}}.legend{{font-size:13px;color:var(--muted)}}table{{border-collapse:collapse;width:100%;font-size:12px}}th,td{{border:1px solid var(--line);padding:7px;vertical-align:top}}th{{background:#e9f1f4;color:#12344c;text-align:left}}.raci{{font-size:9px}}.raci th,.raci td{{text-align:center;padding:5px 3px}}.raci th:first-child,.raci td:first-child{{text-align:left;min-width:110px}}.raci td:last-child{{white-space:nowrap}}.screen-index{{columns:2}}.screen-index a{{display:block;color:var(--teal);margin:4px 0}}.manual-toc a{{display:flex;justify-content:space-between;gap:15px;padding:10px 2px;border-bottom:1px solid var(--line);color:var(--navy);text-decoration:none}}.screen-section{{border-top:5px solid var(--mint);padding-top:24px}}.intro{{display:grid;grid-template-columns:1fr 1fr;gap:15px;background:var(--light);padding:12px 16px;border-radius:10px}}.comparison{{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;align-items:start}}figure{{margin:0;min-width:0}}figcaption{{font-size:12px;font-weight:700;color:var(--muted);padding-bottom:5px}}.zoomable{{display:block;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#f6f9fa;cursor:zoom-in}}.zoomable img{{display:block;width:100%;height:auto}}.annotated{{max-width:850px}}.how{{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:16px}}.how ol{{padding-left:18px}}.how li{{margin:0 0 7px}}.marker-table td:first-child{{width:48px;text-align:center;font-weight:800;color:var(--teal)}}.reference{{margin-top:24px}}.step-grid{{display:grid;grid-template-columns:1fr 1fr;gap:18px}}.step-grid h3{{margin-top:0}}.callout{{border-left:4px solid var(--teal);background:#eaf8f5;padding:12px 15px}}.toc-page{{font-weight:700}}.sources a{{color:var(--teal)}}
@media(max-width:900px){{.layout{{display:block}}.sidebar{{display:none}}.document{{padding:20px}}.toolbar{{position:sticky;top:0;justify-content:flex-end;background:#ffffffef;padding:8px}}.comparison{{grid-template-columns:1fr 1fr}}.comparison figure:first-child{{grid-column:span 2}}.intro,.how,.step-grid{{grid-template-columns:1fr}}}}
@media print{{html,body{{background:white}}body{{font:10pt/1.35 Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}}.layout{{display:block}}.sidebar,.toolbar{{display:none!important}}.document{{box-shadow:none;width:auto;margin:0;padding:0}}.cover{{min-height:240mm;break-after:page}}section{{margin-bottom:8mm}}#resumo,#fluxo,#raci,#telas,#instalacao,#situacoes,#parametros,#futuro,#glossario,.screen-section{{break-before:page}}h1{{font-size:30pt}}h2{{font-size:21pt}}h3{{font-size:12pt;margin:4mm 0 2mm}}.intro{{gap:3mm;padding:3mm}}.comparison{{display:block}}.comparison figure{{break-inside:avoid;display:inline-block;vertical-align:top;width:48%;margin:0 1% 4mm 0}}.comparison figure:first-child{{display:block;width:100%;margin-bottom:4mm}}.comparison img{{width:100%;max-height:105mm;object-fit:contain}}.comparison figure:first-child img{{max-height:112mm}}.reference{{break-before:page}}.annotated img{{max-height:120mm;width:100%;object-fit:contain}}.zoomable{{border-radius:2mm;break-inside:avoid}}.how{{grid-template-columns:1fr 1fr;gap:4mm}}table{{font-size:8pt}}.raci{{font-size:6.5pt}}th,td{{padding:2mm}}figure,table,tr,.card,.callout{{break-inside:avoid}}a{{color:inherit;text-decoration:none}}.flow img{{max-height:220mm}}.step-grid img{{width:100%;max-height:105mm;object-fit:contain}}.screen-index{{columns:3}}}}
</style></head><body><div class="toolbar"><button onclick="window.print()">Imprimir</button></div><div class="layout"><aside class="sidebar"><div class="logos"><img src="img/logo-concrefer.png" alt="Concrefer"></div><h3>Índice</h3>{toc}<h3>Telas</h3>{screen_toc}</aside><main class="document">
<section class="cover" id="capa"><div class="logos"><img src="img/logo-concrefer.png" alt="Concrefer"><img src="img/logo-concretrack.png" alt="ConcreTrack"></div><p class="eyebrow">UNIFICADO · CAMPINAS · MATERIAL DE TREINAMENTO</p><h1>Suprimentos<br>Manual das telas</h1><p class="lead">Solicitação, aprovação e atendimento em um fluxo que cabe no PC, tablet ou celular.</p><p><span class="version">Homologação v1.0.61</span></p><p>25 de outubro de 2026</p><p class="notice">Os pedidos e imagens marcados DEMO são sintéticos. Esta versão está em homologação em <b>:18446</b>; não é instrução para pedidos reais em produção.</p></section>
<section id="sumario"><p class="eyebrow">ÍNDICE</p><h2>Sumário</h2><div class="manual-toc">{toc}</div></section>
<section id="resumo"><p class="eyebrow">01 · VISÃO GERAL</p><h2>Resumo executivo</h2><p>O Suprimentos reúne solicitações de materiais do almoxarifado geral de Campinas. Hoje já permite abrir um pedido no web ou PWA, aprovar por nível e centro de custo, separar, entregar e confirmar o recebimento. Há cadastro básico de materiais, fornecedores, centros de custo, alçadas, parâmetros e papéis.</p><p>Usam o fluxo o solicitante, os aprovadores N1 e N2, o almoxarife, o comprador, a Qualidade e o administrador. Cada pessoa vê somente as telas e ações concedidas. As contas master Ricardo, Marcelo e Alex estão liberadas para testes na homologação, inclusive com papéis APROVADOR N1/N2.</p><div class="card"><h3>Um pedido em seis linhas</h3>{ol(['O solicitante escolhe itens, CC, urgência e envia pelo Unificado ou PWA.','O aprovador N1 confere e aprova, devolve para ajuste ou reprova.','Se o valor exigir, o aprovador N2 decide depois do N1.','O almoxarife separa os itens e registra entregas totais ou parciais.','O solicitante confirma tudo ou relata um problema.','Sem resposta após a entrega, o sistema conclui automaticamente em 48 horas.'])}</div><h3>Caminho mais comum</h3><figure class="flow">{img('fluxo-pedidos-resumo.svg','Fluxo simples do pedido')}</figure></section>
<section id="fluxo"><p class="eyebrow">02 · CAMINHO DO PEDIDO</p><h2>Fluxograma de processamento</h2><figure class="flow">{img('fluxo-pedidos.svg','Fluxograma completo por responsável')}</figure><p class="legend"><b>Legenda:</b> verde = início/fim; cinza = ação atual; amarelo = decisão; azul = ação automática do sistema. Roxo e linha pontilhada = fase futura, ainda não disponível. Setas contínuas = fluxo atual S1.</p><p>O pedido feito sem rede fica no aparelho e é enviado quando houver conexão e sessão válida. O reenvio usa a mesma identificação, sem duplicar. Devolução retorna ao solicitante; reprovação encerra a análise; cancelamento é permitido antes do atendimento.</p></section>
<section id="raci"><p class="eyebrow">03 · QUEM FAZ O QUÊ</p><h2>Matriz de responsabilidades</h2><p>R = executa; A = responde pela decisão; C = consultado; I = informado. O asterisco marca o aprovador do nível atual. O fechamento automático é feito pelo sistema; as pessoas apenas acompanham.</p>{raci_table()}<p class="notice">Preencha a coluna “Pessoa em Campinas” antes de distribuir o processo. Papéis operacionais e concessões de telas precisam estar cadastrados para cada conta.</p></section>
<section id="telas"><p class="eyebrow">04 · GUIA VISUAL</p><h2>Telas web e PWA</h2><p>Cada tela aparece abaixo em PC, tablet e celular, quando faz parte da casca. As telas do PWA mostram celular e tablet para comparação. Clique em qualquer imagem no HTML para ampliar.</p><div class="screen-index">{screen_toc}</div></section>
{''.join(screen_section(spec) for spec in SECTIONS)}
<section id="instalacao"><p class="eyebrow">05 · ACESSO NO APARELHO</p><h2>Instalar e usar o PWA</h2><p><b>Endereço da homologação:</b> <code>https://concrefer.concretrack.com.br:18446/unificado/suprimentos/pwa/</code>. Entre primeiro no Unificado com sua conta concedida; o PWA não possui senha própria.</p><div class="step-grid"><div class="card"><h3>Android · Chrome</h3>{ol(['Abra o endereço do PWA no Chrome e entre com a conta do Unificado.','Toque em Instalar dentro do PWA, se o navegador mostrar essa opção.','Se não aparecer, abra o menu ⋮ do Chrome e escolha Instalar app ou Instalar e criar atalho; confirme.','Abra o ícone Suprimentos na tela inicial e confira o estado de sincronização.'])}{img('pwa-inicio-celular.png','Tela inicial do PWA no Android')}</div><div class="card"><h3>iPhone · Safari</h3>{ol(['Abra o endereço no Safari e entre com a conta do Unificado.','Toque em Compartilhar (ou abra o menu da página e depois Compartilhar).','Escolha Adicionar à Tela de Início; se disponível, ative Abrir como App.','Toque em Adicionar e depois abra o novo ícone Suprimentos.'])}{img('pwa-inicio-celular.png','Tela inicial do PWA no iPhone')}</div></div><p class="sources">Passos do sistema operacional: <a href="https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid">Ajuda oficial do Chrome para Android</a> · <a href="https://support.apple.com/en-eg/guide/iphone/iphea86e5236/ios">Ajuda oficial da Apple para iPhone</a>. Os nomes do menu podem variar conforme a versão do aparelho.</p><div class="callout"><b>Sem sinal:</b> abra o PWA conectado ao menos uma vez para carregar a conta e o catálogo. Um pedido criado offline fica em “No aparelho”; ao voltar a rede, abra o PWA para sincronizar. Se a sessão expirar, entre novamente no Unificado. A fila local permanece no dispositivo. Aprovação precisa de conexão.</div></section>
<section id="situacoes"><p class="eyebrow">06 · ACOMPANHAMENTO</p><h2>Situações da solicitação</h2><table><thead><tr><th>Situação</th><th>Significado</th><th>Quem age depois</th></tr></thead><tbody>
<tr><td>Rascunho</td><td>Pedido criado, ainda não enviado.</td><td>Solicitante envia ou cancela.</td></tr><tr><td>Em aprovação N1</td><td>Aguardando primeira decisão.</td><td>Aprovador N1.</td></tr><tr><td>Em aprovação N2</td><td>N1 aprovou; valor exige segunda decisão.</td><td>Aprovador N2.</td></tr><tr><td>Devolvida</td><td>Ajuste pedido com comentário.</td><td>Solicitante corrige e reenvia.</td></tr><tr><td>Aprovada</td><td>Alçada concluída; falta iniciar atendimento.</td><td>Almoxarife separa.</td></tr><tr><td>Em atendimento</td><td>Item separado ou entrega parcial.</td><td>Almoxarife conclui a entrega.</td></tr><tr><td>Entregue</td><td>Todos os itens entregues; falta aceite.</td><td>Solicitante confirma ou relata problema.</td></tr><tr><td>Concluída</td><td>Aceite feito ou fechamento automático após 48 h.</td><td>Ninguém; consultar histórico.</td></tr><tr><td>Reprovada</td><td>Aprovação negada com motivo.</td><td>Solicitante consulta comentário.</td></tr><tr><td>Cancelada</td><td>Solicitante cancelou antes do atendimento.</td><td>Ninguém.</td></tr></tbody></table></section>
<section id="parametros"><p class="eyebrow">07 · CONFIGURAÇÃO INICIAL</p><h2>Parâmetros e alçadas</h2><p>Os valores abaixo são sementes da homologação e estão <b>a confirmar</b> pela gestão de Campinas na aba Cadastros e alçadas. Não copie esses limites para uma norma interna sem validação.</p><table><thead><tr><th>Regra</th><th>Valor inicial</th><th>Uso hoje</th></tr></thead><tbody><tr><td>Aprovação N1</td><td>Até R$ 2.500,00</td><td>Sim</td></tr><tr><td>Aprovação N2</td><td>Acima de R$ 2.500,00, após N1</td><td>Sim</td></tr><tr><td>SLA normal</td><td>24 horas</td><td>Sim</td></tr><tr><td>SLA urgente</td><td>4 horas</td><td>Sim</td></tr><tr><td>Fechamento após entrega</td><td>48 horas</td><td>Sim</td></tr><tr><td>Ajuste de inventário sem aprovação</td><td>R$ 200,00</td><td>Fase S2</td></tr><tr><td>Cotação mínima de três ofertas</td><td>Acima de R$ 1.000,00</td><td>Fase S3</td></tr><tr><td>Tolerância de preço no pedido</td><td>10%</td><td>Fase S3</td></tr></tbody></table></section>
<section id="futuro"><p class="eyebrow">08 · PLANEJAMENTO</p><h2>Próximas fases · ainda não disponível</h2><div class="card"><h3>S2 · Almoxarifado geral</h3><p>Saldo, reserva, endereçamento, ficha de EPI e inventário. A separação e a entrega de S1 já funcionam manualmente, sem lançar saldo.</p><h3>S3 · Compras e recebimento</h3><p>Cotação, pedido de compra, recebimento com NF, inspeção de Qualidade, não conformidade e avaliação de fornecedor. O cadastro básico de fornecedores já funciona.</p><h3>S4 · Integração com o Laboratório</h3><p>Sugestões de ressuprimento dos insumos da usina e vínculo do pedido de compra à entrada no estoque do Laboratório. Os silos e as massadas não fazem parte do estoque do Suprimentos.</p></div></section>
<section id="glossario"><p class="eyebrow">09 · CONSULTA RÁPIDA</p><h2>Glossário</h2><table><tbody><tr><th>Alçada</th><td>Limite e nível que definem quem pode aprovar.</td></tr><tr><th>CC</th><td>Centro de custo/setor ao qual o pedido pertence.</td></tr><tr><th>Flag</th><td>Chave que liga ou desliga uma fase do módulo por unidade.</td></tr><tr><th>PWA</th><td>Aplicação web que pode ser instalada como ícone no celular.</td></tr><tr><th>Reserva</th><td>Separação de saldo para um pedido; função prevista para S2.</td></tr><tr><th>Cross-docking</th><td>Material comprado para um pedido que segue direto ao atendimento; previsto para S3.</td></tr><tr><th>Item livre</th><td>Item descrito pelo solicitante quando ainda não consta do catálogo.</td></tr></tbody></table><p class="sources">Manual baseado nas telas e fluxos autenticados de homologação em 25/10/2026, no plano v2 e nas evidências E4–E7. Os pedidos DEMO foram criados exclusivamente para estas capturas.</p></section>
</main></div><script>document.querySelectorAll('.zoomable').forEach(a=>a.addEventListener('click',e=>{{e.preventDefault();const o=document.createElement('div');o.style='position:fixed;inset:0;z-index:1000;background:#071526ec;display:grid;place-items:center;padding:20px;cursor:zoom-out';const i=document.createElement('img');i.src=a.href;i.style='max-width:100%;max-height:100%;object-fit:contain';o.append(i);o.onclick=()=>o.remove();document.body.append(o)}}));</script></body></html>'''
    (BASE / "manual-suprimentos.html").write_text(html_body, encoding="utf-8")
    print("HTML_OK telas=",len(SECTIONS),"capturas=",len(CAPTURES))

if __name__ == "__main__":
    main()
